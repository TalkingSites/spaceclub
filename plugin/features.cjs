// Optional features, each switched on or off in spaceclub.json:
//   rss     Atom feeds for posts (/feed.xml), events (/events/feed.xml) and each content
//           type (/<type>/feed.xml), linked from every page's <head>
//   webmcp  /webmcp-data.json, the site's pages, events, posts and content types, and a script
//           (/assets/js/webmcp.js) that offers them to AI agents in the browser as tools
//           (WebMCP). Built from the content, so they update themselves as pages and types are added.
const fs = require("node:fs");
const path = require("node:path");
const rss = require("@11ty/eleventy-plugin-rss");

function contentTypes(root) {
  const file = path.join(root, "src/_data/contentTypes.json");
  if (!fs.existsSync(file)) return [];
  try {
    return (JSON.parse(fs.readFileSync(file, "utf8")).items || []).filter((t) => t && t.name);
  } catch {
    return [];
  }
}

// an entry's own date: posts and events carry theirs in their data; anything else, the page date
function entryDate(item) {
  return new Date(item.data.postDate || item.data.eventDate || item.date);
}

function useFeatures(eleventyConfig, { root, pkg, settings }) {
  const on = settings.features;
  // read on every build (not once at start), so types made while the site is running show up
  const types = () => (on.contentTypes ? contentTypes(root) : []);

  if (on.rss) {
    eleventyConfig.addPlugin(rss);
    eleventyConfig.addGlobalData("spaceclubFeeds", () => {
      const feeds = [];
      if (on.posts) feeds.push({ url: "/feed.xml", title: "Posts", collection: "posts" });
      if (on.events) feeds.push({ url: "/events/feed.xml", title: "Events", collection: "events" });
      for (const t of types()) feeds.push({ url: `/${t.name}/feed.xml`, title: t.label || t.name, collection: t.name });
      return feeds;
    });
    // newest first, by each entry's own date
    eleventyConfig.addFilter("feedEntries", (items, limit = 30) =>
      [...(items || [])].sort((a, b) => entryDate(b) - entryDate(a)).slice(0, limit));
    eleventyConfig.addFilter("entryDate", (item) => entryDate(item));
    eleventyConfig.addTemplate("spaceclub-feed.njk", fs.readFileSync(path.join(pkg, "pages/feed.njk"), "utf8"));
  }

  if (on.webmcp) {
    // what the site holds, for the WebMCP tools (/assets/js/webmcp.js): kept small (titles,
    // links, dates and short fields)
    eleventyConfig.addFilter("webmcpData", (collections, site) => {
      const day = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);
      const short = (v) => (typeof v === "string" ? v.replace(/\n/g, ", ").slice(0, 300) : v);
      const fields = (item, keys) => Object.fromEntries(keys.filter((k) => item.data[k] != null && item.data[k] !== "").map((k) => [k, short(item.data[k])]));
      const byDate = (list) => [...(list || [])].sort((a, b) => entryDate(a) - entryDate(b));
      const typeList = types();
      const sections = [];
      if (on.events) sections.push({ title: "Events", url: "/events/" });
      if (on.posts) sections.push({ title: "Posts", url: "/posts/" });
      for (const t of typeList) sections.push({ title: t.label || t.name, url: `/${t.name}/` });
      return {
        site: { title: site.title, description: site.description, url: site.url || "" },
        pages: (collections.all || []).filter((p) => p.inputPath.includes("/src/pages/") && !p.url.endsWith(".html")).map((p) => ({ title: p.data.title, url: p.url, ...fields(p, ["description"]) })),
        sections,
        events: on.events ? byDate(collections.events).map((e) => ({ slug: e.fileSlug, title: e.data.title, date: day(e.data.eventDate), url: e.url, ...fields(e, ["description", "startTime", "endTime", "location"]) })) : [],
        posts: on.posts ? byDate(collections.posts).reverse().map((p) => ({ slug: p.fileSlug, title: p.data.title, date: day(p.data.postDate), url: p.url, ...fields(p, ["description", "author"]) })) : [],
        types: typeList.map((t) => ({
          name: t.name,
          label: t.label || t.name,
          description: t.description || "",
          entries: (collections[t.name] || []).map((e) => ({ slug: e.fileSlug, title: e.data.title, url: e.url, ...fields(e, (t.fields || []).filter((f) => ["text", "longtext", "number", "date", "yesno", "link", "choice", "list"].includes(f.type)).map((f) => f.name)) })),
        })),
      };
    });
    eleventyConfig.addTemplate("spaceclub-webmcp.njk", fs.readFileSync(path.join(pkg, "pages/webmcp.njk"), "utf8"));
  }
}

module.exports = { useFeatures };
