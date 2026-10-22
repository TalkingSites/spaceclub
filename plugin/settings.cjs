// spaceclub.json: what a site has and how it looks. Anything left out uses the default, so
// a site's file can be nearly empty. The defaults are SpaceClub as it is today.
const fs = require("node:fs");
const path = require("node:path");

const DEFAULTS = {
  preset: "community",
  features: {
    events: true,
    posts: true,
    contentTypes: true,
    search: true,
    gallery: true,
    forms: true,
    rss: true,
    webmcp: true,
  },
  look: {
    // "light" | "dark" | "both" (visitors can switch)
    modes: "light",
    // every Bootstrap colour, plus body, text, link and border; null uses Bootstrap's own
    colours: { light: {}, dark: {} },
    navbar: { layout: "classic", show: { logo: true, title: true, search: true } },
    footer: { divider: "/assets/stars.svg", colours: {} },
  },
};

// plain objects are merged key by key; anything else (including arrays) replaces
function merge(base, over) {
  if (over === undefined) return base;
  if (!base || typeof base !== "object" || Array.isArray(base) || !over || typeof over !== "object" || Array.isArray(over)) return over;
  const out = { ...base };
  for (const [k, v] of Object.entries(over)) out[k] = merge(base[k], v);
  return out;
}

function readSettings(root) {
  const file = path.join(root, "spaceclub.json");
  let own = {};
  if (fs.existsSync(file)) {
    try {
      own = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (err) {
      throw new Error(`spaceclub.json isn't valid JSON: ${err.message}`);
    }
  }
  return merge(DEFAULTS, own);
}

module.exports = { DEFAULTS, readSettings, merge };
