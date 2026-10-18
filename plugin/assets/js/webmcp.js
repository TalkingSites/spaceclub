// /assets/js/webmcp.js: offers this site to AI agents in the browser as tools (WebMCP). Tools
// that make sense everywhere are on every page; the rest only on the pages they're about
// (events tools on event pages, and so on). Site data comes from /webmcp-data.json, which
// the site builds from its content, so new pages and content types show up by themselves.
// Only runs in browsers with WebMCP (document.modelContext).
(function () {
  const mc = document.modelContext;
  if (!mc) return;

  const path = location.pathname;

  // every tool replies in the MCP format: a list of text pieces
  const reply = (value) => ({ content: [{ type: "text", text: JSON.stringify(value) }] });
  const fail = (message) => ({ content: [{ type: "text", text: message }], isError: true });

  // the site's data (built by the spaceclub package), fetched once and shared by every tool
  let dataPromise;
  const getData = () => (dataPromise ||= fetch("/webmcp-data.json").then((r) => r.json()));

  const today = () => new Date().toISOString().slice(0, 10);
  const isUpcoming = (event) => !event.date || event.date >= today();
  const slugFrom = (prefix) => (path.match(new RegExp(`^/${prefix}/([^/]+)/?$`)) || [])[1];

  // ---------- Every page ----------

  mc.registerTool({
    name: "get-site-info",
    description: "Get an overview of this website: what it is, and links to its main pages and sections.",
    inputSchema: { type: "object", properties: {} },
    async execute() {
      const { site, pages, sections } = await getData();
      return reply({ name: site.title, about: site.description, pages, sections });
    },
  });

  mc.registerTool({
    name: "search-site",
    description: "Search this website (pages, events, posts and everything else) and return the best matching pages.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string", description: "What to search for, e.g. \"meetup\" or \"contact\"." } },
      required: ["query"],
    },
    async execute({ query }) {
      // the site's own search index (Pagefind), built with the site
      try {
        const pagefind = await import("/pagefind/pagefind.js");
        const search = await pagefind.search(query);
        const results = await Promise.all(search.results.slice(0, 5).map((r) => r.data()));
        return reply(results.map((r) => ({ title: r.meta.title, url: r.url, excerpt: r.excerpt.replace(/<[^>]+>/g, "") })));
      } catch {
        // no search index (it's built in production): look through the site's data instead
        const data = await getData();
        const q = String(query).toLowerCase();
        const all = [...data.pages, ...data.events, ...data.posts, ...data.types.flatMap((t) => t.entries)];
        const found = all.filter((x) => JSON.stringify(x).toLowerCase().includes(q)).slice(0, 5);
        return found.length ? reply(found) : fail(`Nothing on this site matches "${query}".`);
      }
    },
  });

  mc.registerTool({
    name: "go-to-page",
    description: "Open a page on this website, e.g. /about/ or a link from another tool. The page reloads, so this page's tools are replaced by the new page's tools.",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string", description: "Site path starting with /, e.g. \"/events/\" or \"/about/\"." } },
      required: ["path"],
    },
    async execute({ path: to }) {
      if (!to.startsWith("/") || to.startsWith("//")) return fail("Only pages on this site are allowed. Use a path starting with /.");
      // reply first, then navigate; navigating straight away would unload the page before the reply is sent
      setTimeout(() => { location.href = to; }, 100);
      return reply({ navigating: to });
    },
  });

  mc.registerTool({
    name: "list-pages",
    description: "List this website's pages with their links and descriptions.",
    inputSchema: { type: "object", properties: {} },
    async execute() {
      return reply({ pages: (await getData()).pages });
    },
  });

  // ---------- Pages showing cards (home, events, posts, lists) ----------

  const cardFor = (url) => {
    const link = document.querySelector(`a[href="${url}"]`);
    return link && (link.closest(".card") || link);
  };

  if (document.querySelector(".card a[href], a.card[href]")) {
    mc.registerTool({
      name: "show-item",
      description: "Scroll to an event, post or other item's card on this page and highlight it so the visitor can see it.",
      inputSchema: {
        type: "object",
        properties: { url: { type: "string", description: "The item's link, e.g. \"/events/my-event/\"." } },
        required: ["url"],
      },
      async execute({ url }) {
        const card = cardFor(url);
        if (!card) return fail(`"${url}" isn't on this page. Use go-to-page with "${url}" to open it instead.`);
        document.querySelectorAll(".webmcp-highlight").forEach((el) => el.classList.remove("webmcp-highlight"));
        card.scrollIntoView({ behavior: "smooth", block: "center" });
        card.classList.add("webmcp-highlight");
        return reply({ shown: url });
      },
    });
  }

  // ---------- Events pages ----------

  if (path.startsWith("/events/")) {
    const current = slugFrom("events");
    mc.registerTool({
      name: "list-events",
      description: "List this website's events with their date, time and location.",
      inputSchema: {
        type: "object",
        properties: { when: { type: "string", enum: ["upcoming", "past", "all"], description: "Which events to list. Defaults to upcoming." } },
      },
      async execute({ when = "upcoming" } = {}) {
        const { events } = await getData();
        const picked = when === "all" ? events : events.filter((e) => isUpcoming(e) === (when === "upcoming"));
        if (!picked.length) return reply({ events: [], note: `No ${when} events right now. Check /events/ for news.` });
        return reply({ events: picked });
      },
    });
    mc.registerTool({
      name: "get-event",
      description: "Get full details for one event. Use the slug from list-events, or leave it out on an event's own page.",
      inputSchema: {
        type: "object",
        properties: { slug: { type: "string", description: "The event's slug, from list-events." } },
      },
      async execute({ slug = current } = {}) {
        if (!slug) return fail("Which event? Pass a slug from list-events.");
        const event = (await getData()).events.find((e) => e.slug === slug);
        if (!event) return fail(`No event found with slug "${slug}". Call list-events with when "all" to see valid slugs.`);
        return reply({ ...event, status: isUpcoming(event) ? "upcoming" : "past" });
      },
    });
  }

  // ---------- Posts pages ----------

  if (path.startsWith("/posts/")) {
    mc.registerTool({
      name: "list-posts",
      description: "List this website's posts, newest first.",
      inputSchema: {
        type: "object",
        properties: { limit: { type: "integer", minimum: 1, maximum: 50, description: "How many posts to return. Defaults to 10." } },
      },
      async execute({ limit = 10 } = {}) {
        return reply({ posts: (await getData()).posts.slice(0, limit) });
      },
    });
  }

  // ---------- Content types made in SpaceDash (Team, Projects...), on their own pages ----------

  getData().then(({ types }) => {
    for (const t of types) {
      if (!path.startsWith(`/${t.name}/`)) continue;
      const current = slugFrom(t.name);
      mc.registerTool({
        name: `list-${t.name}`,
        description: `List this website's ${t.label}${t.description ? `: ${t.description}` : ""}.`,
        inputSchema: { type: "object", properties: {} },
        async execute() {
          return reply({ [t.name]: t.entries });
        },
      });
      mc.registerTool({
        name: `get-${t.name}`,
        description: `Get full details for one of this website's ${t.label}. Use the slug from list-${t.name}, or leave it out on its own page.`,
        inputSchema: { type: "object", properties: { slug: { type: "string", description: `The slug, from list-${t.name}.` } } },
        async execute({ slug = current } = {}) {
          if (!slug) return fail(`Which one? Pass a slug from list-${t.name}.`);
          const entry = t.entries.find((e) => e.slug === slug);
          return entry ? reply(entry) : fail(`No "${slug}" in ${t.label}. Call list-${t.name} to see valid slugs.`);
        },
      });
    }
  }).catch(() => {});
})();
