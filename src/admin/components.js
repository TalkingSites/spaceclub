// Spacedash blocks: the template's Nunjucks partials as editable blocks, so editors
// see a small form instead of {% set %} / {% include %} code. Each block reads and
// writes the same code the pages already use:
//
//   {% set text = "Register Now" %}
//   {% set link = "https://example.com" %}
//   {% include "partials/btn.njk" %}

// strings are written as "...", lists (e.g. form fields) as ["a", "b"]
const quote = (v) => (Array.isArray(v) ? JSON.stringify(v.map(String)).replace(/","/g, '", "') : JSON.stringify(String(v)));

// A partial with optional `{% set name = "value" %}` lines before its include.
// wrapDiv: the page wraps the include in <div> ... </div> (kept as is).
// vars: the {% set %} names in the code, when they differ from the form fields;
// read/write: map between the two (e.g. style "outline-primary" <-> Style + Colour).
function partialBlock({ id, label, file, fields = [], vars, read = (d) => d, write = (d) => d, wrapDiv = false, preview }) {
  const sets = vars || fields.map((f) => f.name);
  const include = `{% include "partials/${file}.njk" %}`;
  const value = `(?:"(?:[^"\\\\]|\\\\.)*"|\\[[^\\]]*\\])`;
  const setLine = `(?:{%-?\\s*set\\s+(?:${sets.join("|") || "_none_"})\\s*=\\s*${value}\\s*-?%}\\s*\\n?)`;
  const core = `${sets.length ? `${setLine}*` : ""}{%-?\\s*include\\s+"partials/${file}\\.njk"\\s*-?%}`;
  const pattern = new RegExp(wrapDiv ? `^(?:<div>\\s*\\n?)?${core}(?:\\s*\\n?</div>)?` : `^${core}`);

  CMS.registerEditorComponent({
    id,
    label,
    fields,
    pattern,
    fromBlock(match) {
      const data = {};
      const re = /{%-?\s*set\s+(\w+)\s*=\s*("(?:[^"\\]|\\.)*"|\[[^\]]*\])\s*-?%}/g;
      let m;
      while ((m = re.exec(match[0]))) data[m[1]] = JSON.parse(m[2]);
      for (const k of Object.keys(data)) if (data[k] === "yes" || data[k] === "no") data[k] = data[k] === "yes";
      return read(data);
    },
    toBlock(data) {
      data = write({ ...data });
      for (const k of Object.keys(data)) if (typeof data[k] === "boolean") data[k] = data[k] ? "yes" : "no";
      const lines = sets.filter((k) => data[k] !== undefined && data[k] !== "" && !(Array.isArray(data[k]) && !data[k].length)).map((k) => `{% set ${k} = ${quote(data[k])} %}`);
      const body = [...lines, include].join("\n");
      return wrapDiv ? `<div>\n${body}\n</div>` : body;
    },
    toPreview: (data) =>
      `<div style="border:1px dashed #6a5acd;border-radius:10px;padding:12px 16px;font-family:system-ui">` +
      `<strong>${label}</strong>${preview ? `<div style="opacity:.75">${preview(data)}</div>` : ""}</div>`,
  });
}

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// Button (partials/btn.njk). The code keeps one `style` value like "primary" or
// "outline-primary"; the form splits it into Style and Colour, both shown as real buttons.
const COLOURS = ["primary", "secondary", "success", "danger", "warning", "info", "light", "dark"];
const title = (c) => c[0].toUpperCase() + c.slice(1);
partialBlock({
  id: "button",
  label: "Button",
  file: "btn",
  vars: ["text", "link", "icon", "style", "align"],
  fields: [
    { name: "text", label: "Text", widget: "string" },
    { name: "link", label: "Link", widget: "string", hint: "e.g. /contact or https://..." },
    { name: "icon", label: "Icon", widget: "bs-icon", required: false },
    { name: "variant", label: "Style", widget: "bs-swatch", default: "solid", options: [
      { label: "Solid", value: "solid", className: "btn-primary" },
      { label: "Outline", value: "outline", className: "btn-outline-primary" },
    ] },
    { name: "colour", label: "Colour", widget: "bs-swatch", default: "primary", options: COLOURS.map((c) => ({ label: title(c), value: c, className: `btn-${c}` })) },
    { name: "align", label: "Alignment", widget: "select", default: "center", options: [{ label: "Left", value: "start" }, { label: "Centre", value: "center" }, { label: "Right", value: "end" }] },
  ],
  read: ({ style = "primary", ...d }) => ({ ...d, variant: style.startsWith("outline") ? "outline" : "solid", colour: style.replace(/^outline-?/, "") || "primary" }),
  write: ({ variant, colour, ...d }) => ({ ...d, style: `${variant === "outline" ? "outline-" : ""}${colour || "primary"}` }),
  preview: (d) => `${d.icon ? `<i class="bi bi-${esc(d.icon)}"></i> ` : ""}${esc(d.text)} → ${esc(d.link)}`,
});

// Events and/or posts in one grid (partials/feed.njk)
partialBlock({
  id: "feed",
  label: "Feed",
  file: "feed",
  vars: ["feedTitle", "feedEvents", "feedPosts", "feedFeatured", "feedWhen", "feedLimit", "feedColumns"],
  // the code keeps feedEvents (yes/no) and feedWhen; the form shows one Events dropdown
  read: ({ feedEvents, feedWhen, ...d }) => ({ ...d, events: feedEvents === false ? "none" : feedWhen || "all" }),
  write: ({ events, ...d }) => ({ ...d, feedEvents: events === "none" ? "no" : undefined, feedWhen: events === "none" ? undefined : events }),
  fields: [
    { name: "feedTitle", label: "Heading", widget: "string", required: false },
    { name: "events", label: "Events", widget: "select", default: "upcoming", options: [
      { label: "No events", value: "none" }, { label: "Upcoming events", value: "upcoming" },
      { label: "Past events", value: "past" }, { label: "All events", value: "all" },
    ] },
    { name: "feedPosts", label: "Posts", widget: "boolean", default: true },
    { name: "feedFeatured", label: "Only featured", widget: "boolean", default: false, hint: "Only events and posts ticked as Featured" },
    { name: "feedLimit", label: "How many", widget: "string", default: "6", pattern: ["^(all|[1-9][0-9]*)$", "A number, or all"], hint: "A number, or all" },
    { name: "feedColumns", label: "Per row", widget: "select", default: "3", options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"], hint: "On wider screens; phones always show one per row" },
  ],
  preview: (d) => {
    const what = [d.events !== "none" && `${d.events || "upcoming"} events`, d.feedPosts !== false && "posts"].filter(Boolean).join(" + ");
    return `${esc(d.feedTitle || "")} ${esc(what)} · ${esc(d.feedLimit || "6")} · ${esc(d.feedColumns || "3")} per row`;
  },
});

partialBlock({
  id: "gallery",
  label: "Gallery",
  file: "gallery",
  fields: [
    { name: "path", label: "Image folder", widget: "string", hint: "e.g. assets/uploads" },
    { name: "filterPrefix", label: "Only files starting with", widget: "string", required: false },
  ],
  preview: (d) => esc(d.path),
});

partialBlock({
  id: "galleryAll",
  label: "Gallery (all event and post galleries)",
  file: "galleryAll",
});

// A form. Left empty, it uses the page's own form settings (like the Contact page);
// filled in, this block brings its own heading, intro and fields.
partialBlock({
  id: "form",
  label: "Form",
  file: "form",
  fields: [
    { name: "formTitle", label: "Heading", widget: "string", required: false },
    { name: "formDescription", label: "Intro", widget: "text", required: false },
    { name: "formName", label: "Form name", widget: "string", required: false, hint: "Used to tell submissions apart, e.g. volunteer" },
    { name: "formFields", label: "Fields", widget: "list", required: false, hint: "e.g. name, email, message" },
  ],
  preview: (d) => esc(d.formTitle || "Uses this page's form settings"),
});
