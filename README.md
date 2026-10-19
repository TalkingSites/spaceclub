# SpaceClub

Easy-to-edit community websites on [Eleventy](https://www.11ty.dev). This package holds everything a SpaceClub site is built from: the layouts, partials, styles and generated pages, plus the server that signs editors in and saves their edits, and a starter for new sites. A site's own repo keeps only its content and its settings.

**Documentation, guides, and examples:** [spaceclubwiki.talkingsites.org](https://spaceclubwiki.talkingsites.org)

## Make a site

```bash
npx spaceclub new my-site
cd my-site
npm start
```

That's the whole site: your content in `src/` and your settings in `spaceclub.json`. Everything else comes from this package, so `npm update` brings you new features and fixes. There's no need to clone this repo, which is SpaceClub itself (see [Developing this package](#developing-this-package)).

To change a layout, partial or style, copy it into your site and edit the copy:

```bash
npx spaceclub customize                        # what you can customise
npx spaceclub customize partials/navbar.njk    # copies it to src/_includes/partials/navbar.njk
```

## A site

```
my-site/
├── spaceclub.json          what the site has and how it looks (see below)
├── eleventy.config.cjs     module.exports = require("spaceclub");
├── package.json            depends on spaceclub
└── src/
    ├── pages/  events/  posts/      the content
    ├── _data/site.json              name, description, logo, timezone, analytics
    ├── _data/navbar.json            the menu
    ├── _data/contentTypes.json      content types made in SpaceDash
    ├── admin/                       SpaceDash (the editor)
    └── assets/images/               the site's own images
```

New sites start from [`starter/`](starter/): `npx spaceclub new` copies it out, and so does Mission Control when it launches a site. A site never has a `starter/` folder of its own.

**Overriding something:** put your own copy at the same path in `src/` (`npx spaceclub customize` does it for you), for example `src/_includes/partials/navbar.njk` or `src/assets/css/styles.css`, and it's used instead of the package's. To add your own Eleventy filters, wrap the config:

```js
module.exports = (eleventyConfig) => {
  const config = require("spaceclub")(eleventyConfig);
  eleventyConfig.addFilter("shout", (s) => s.toUpperCase());
  return config;
};
```

## spaceclub.json

Anything left out uses the default, and the defaults are shown here. Turning a feature off stops it being built, but its content stays in the site.

```jsonc
{
  "preset": "community",
  "features": {
    "events": true,        // events, their list page and feed
    "posts": true,         // posts, their list page and feed
    "contentTypes": true,  // types made in SpaceDash (Team, Projects...)
    "search": true,
    "gallery": true,
    "forms": true,
    "rss": true,           // Atom feeds: /feed.xml (posts), /events/feed.xml, /<type>/feed.xml
    "webmcp": true         // /webmcp-data.json and tools for AI agents in the browser (WebMCP)
  },
  "look": {
    "modes": "light",      // light | dark | both
    "colours": { "light": {}, "dark": {} },
    "navbar": { "layout": "classic", "show": { "logo": true, "title": true, "search": true } },
    "footer": { "divider": "stars", "dividerSvg": null, "colours": {} }
  }
}
```

## The server

`node node_modules/spaceclub/server/index.cjs` serves the built site and is SpaceDash's back end: sign-in with Authentik, saving through the SpaceClub GitHub App (limited to the site's own repo) and the real preview. It needs `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_INSTALLATION_ID` and `GITHUB_REPO`, which Mission Control sets when it launches a site.

## Developing this package

```bash
npm install
pm2 start ecosystem.config.cjs   # the starter at http://localhost:8090, SpaceDash at /admin/
```

The starter is built with this package (not the published one). Every user-facing change adds a line to [CHANGELOG.md](CHANGELOG.md) under Unreleased.

## Licence

GPL-3.0
