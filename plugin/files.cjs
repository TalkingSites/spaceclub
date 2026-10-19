// The package's own files, used wherever the site doesn't have its own copy:
//   layouts   (_includes/layouts/*)  as Eleventy virtual templates
//   partials  (_includes/partials/*) on Nunjucks' search path, after the site's _includes
//   assets    (assets/*)             copied to /assets/, file by file
//   pages     (pages/*)              generated pages, each tied to a feature
const fs = require("node:fs");
const path = require("node:path");

// the generated pages, and the feature each one needs (null: always), each skipped if the
// site has its own file of that name (or, for llms.njk, its own src/llms.txt)
const PAGES = {
  "llms.njk": null,
  "events.njk": "events",
  "posts.njk": "posts",
  "content-types.njk": "contentTypes",
  "content-types-json.njk": "contentTypes",
};

function filesIn(dir, rel = "") {
  if (!fs.existsSync(path.join(dir, rel))) return [];
  return fs.readdirSync(path.join(dir, rel), { withFileTypes: true }).flatMap((e) => {
    const sub = path.join(rel, e.name);
    if (e.name.startsWith(".")) return [];
    return e.isDirectory() ? filesIn(dir, sub) : [sub];
  });
}

function usePackageFiles(eleventyConfig, { root, pkg, settings }) {
  const site = (...p) => path.join(root, "src", ...p);
  const own = (...p) => path.join(pkg, ...p);

  // layouts: a virtual template each, unless the site has its own layout of that name
  for (const f of filesIn(own("_includes/layouts"))) {
    if (fs.existsSync(site("_includes/layouts", f))) continue;
    eleventyConfig.addTemplate(`_includes/layouts/${f}`, fs.readFileSync(own("_includes/layouts", f), "utf8"));
  }

  // partials (and anything else in _includes): the site's own first, then the package's
  eleventyConfig.amendLibrary("njk", (env) => {
    for (const loader of env.loaders) if (loader.searchPaths && !loader.searchPaths.includes(own("_includes"))) loader.searchPaths.push(own("_includes"));
  });

  // assets: each package file the site doesn't have at the same path
  for (const f of filesIn(own("assets"))) {
    if (fs.existsSync(site("assets", f))) continue;
    eleventyConfig.addPassthroughCopy({ [own("assets", f)]: path.join("assets", f) });
  }

  // generated pages: only those whose feature is on, and not if the site has its own file
  for (const [f, feature] of Object.entries(PAGES)) {
    if (feature && !settings.features[feature]) continue;
    if (fs.existsSync(site(f)) || (f === "llms.njk" && fs.existsSync(site("llms.txt")))) continue;
    eleventyConfig.addTemplate(f, fs.readFileSync(own("pages", f), "utf8"));
  }
}

module.exports = { usePackageFiles };
