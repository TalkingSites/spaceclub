# SpaceClub site: a guide for AI agents

**SpaceClub:** https://github.com/TalkingSites/spaceclub
**Docs/Wiki:** https://spaceclubwiki.talkingsites.org
**Stack:** Eleventy (11ty) v3 · Nunjucks templates · Bootstrap 5 · Pagefind, built with the `spaceclub` package

---

## Quick start

```bash
npm install
npm start        # dev server at http://localhost:8080
npm run build    # production build → _site/
npm run list     # every page, post, event and content type entry, as JSON
```

---

## Project structure

This repo holds the site's **content and settings only**. The layouts, partials, styles, collections and filters come from the `spaceclub` package in `node_modules/spaceclub`.

```
spaceclub.json        # what the site has and how it looks (see Settings below)
eleventy.config.cjs   # module.exports = require("spaceclub");
src/
  pages/              # every page: home.md, about.md, contact.md, 404.md, and any new ones
  posts/              # posts, one .md file each
  events/             # events, one .md file each
  <type>/             # entries of each content type made in SpaceDash (e.g. src/team/)
  _data/
    site.json         # name, description, logo, favicon, timezone, date format, analytics
    navbar.json       # the menu: [{ title, href, footer }]
    contentTypes.json # content types made in SpaceDash: { "items": [...] }
  admin/              # SpaceDash, the in-browser editor (config.yml)
  assets/images/      # the site's own images
```

**Changing a layout, partial or style:** copy it from `node_modules/spaceclub/plugin/` to the same path under `src/` (e.g. `src/_includes/partials/navbar.njk` or `src/assets/css/styles.css`) and edit the copy. The site's copy is used instead of the package's.

---

## Settings: spaceclub.json

Anything left out uses the default. Turning a feature off stops it being built, but its content stays in `src/`.

| Key | Default | What it does |
|---|---|---|
| `features.events` | `true` | Events, their list page and feed |
| `features.posts` | `true` | Posts, their list page and feed |
| `features.contentTypes` | `true` | Content types made in SpaceDash |
| `features.search` | `true` | Pagefind search |
| `features.rss` | `true` | Atom feeds: `/feed.xml` (posts), `/events/feed.xml`, `/<type>/feed.xml` |
| `features.webmcp` | `true` | `/webmcp-data.json` and tools for AI agents in the browser |
| `look.modes` | `"light"` | `light`, `dark` or `both` |
| `look.colours` | `{}` | Bootstrap colours for light and dark (`primary`, `secondary`, `success`...) |

The site also gets `/llms.txt`, made from its name, description and pages (put your own in `src/llms.txt` to replace it).

---

## ⚠️ Critical: Nunjucks-in-Markdown

Every `.md` file is processed as **Nunjucks first, then Markdown** (the `spaceclub` package sets `markdownTemplateEngine: "njk"`). This means:

- `{{ variable }}` and `{% tag %}` in content are executed as Nunjucks: not rendered as text.
- Writing content that contains `{{` (e.g. code examples, template snippets) **will crash the build or produce garbled output**.
- To output a literal `{{`, use `{{ '{{' }}`.
- To protect a whole block, wrap it: `{% raw %}...{% endraw %}`.

---

## File naming conventions

- **Posts:** `src/posts/my-post-title.md` → URL `/posts/my-post-title/`
- **Events:** `src/events/my-event-title.md` → URL `/events/my-event-title/`
- **Pages:** `src/pages/page-name.md` → URL `/page-name/` (Home is `src/pages/home.md` with `permalink: "/"`)
- **Content type entries:** `src/<type>/my-entry.md` → URL `/<type>/my-entry/`
- Use **kebab-case**, no date prefix. Override the URL with `permalink` in frontmatter.

---

## Frontmatter schemas

### Posts (`src/posts/*.md`)

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | ✅ | Displayed in cards, page title, and `<title>` |
| `postDate` | `YYYY-MM-DD` | ✅ | Used for sorting (newest first) |
| `description` | string |: | Card summary and meta description |
| `author` | string |: | Displayed on the post page |
| `featured` | boolean |: | `true` → appears in Featured section |
| `image` | path string |: | Card/header image (e.g. `/assets/images/foo.jpg`) |
| `preview_image` | path or URL |: | Social sharing image |
| `gallery` | path string |: | Folder path for auto-gallery (e.g. `/assets/images/my-post`) |
| `permalink` | string |: | Override the auto-generated URL |
| `layout` | string |: | Defaults to `post.njk` via `posts/posts.json` |

### Events (`src/events/*.md`)

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | ✅ | Displayed in cards, page title |
| `eventDate` | `YYYY-MM-DD` | ✅ | Used for sorting and upcoming/past classification |
| `description` | string |: | Card summary and meta description |
| `startTime` | string |: | e.g. `9:00AM` or `14:00`: displayed and used for past cutoff |
| `endTime` | string |: | e.g. `5:00PM`: event is "past" once this passes |
| `location` | string |: | Use `\n` for line breaks |
| `featured` | boolean |: | `true` → appears in Featured section |
| `image` | path string |: | Card/header image |
| `preview_image` | path or URL |: | Social sharing image |
| `gallery` | path string |: | Folder path for auto-gallery |
| `permalink` | string |: | Override the auto-generated URL |
| `layout` | string |: | Defaults to `event.njk` via `events/events.json` |

### Pages (`src/pages/*.md`)

| Field | Type | Notes |
|---|---|---|
| `layout` | string | `base.njk` by default (from `pages/pages.json`); `index.njk` for home |
| `menu` | boolean | `true` → listed under Pages in the navbar |
| `title` | string | Page title |
| `description` | string | Meta description |
| `permalink` | string | Override URL |
| `formTitle` | string | Contact page: form heading |
| `formDescription` | string | Contact page: form subtext |
| `formName` | string | Contact page: HTML form `name` and Netlify form name |
| `formFields` | array | Contact page: list of `name` strings or `{name, type}` objects |

---

## Partials reference

All partials come from the `spaceclub` package (`node_modules/spaceclub/plugin/_includes/partials/`); a copy in `src/_includes/partials/` overrides one. Use them in any `.md` or `.njk` file with `{% include "partials/name.njk" %}`. Set variables with `{% set varName = value %}` before the include.

### `btn.njk`: Bootstrap button
| Variable | Default | Notes |
|---|---|---|
| `text` | `"Back to Home"` | Button label |
| `link` | `"/"` | href |
| `icon` | `"arrow-left"` | Bootstrap Icons name (omit `bi-`) |
| `style` | `"primary"` | Bootstrap button variant: `primary`, `secondary`, `outline-primary`, etc. |
| `align` | `"center"` | `start`, `center`, or `end` |

### `gallery.njk`: Image gallery with lightbox
| Variable | Default | Notes |
|---|---|---|
| `path` | `"assets/uploads"` | Path to image folder **relative to `src/`**, no leading slash |
| `filterPrefix` | `null` | Only show files starting with this string |

Images must be in the `src/` tree (Eleventy scans the filesystem at build time).

### `galleryAll.njk`: All-images gallery across posts/events
| Variable | Default | Notes |
|---|---|---|
| `galleryLimit` | `0` (all) | Set to a number to show a preview |

### `postsList.njk`: Post cards list
| Variable | Values | Notes |
|---|---|---|
| `type` | `"preview"` or omit | `preview` shows latest 3; omit shows all |
| `excludeFeatured` | boolean | When `type == "preview"`, hide featured posts |

### `eventsList.njk`: Event cards list
| Variable | Values | Notes |
|---|---|---|
| `type` | `"upcoming"`, `"past"`, `"preview"`, `"previewPast"`, `"previewUpcoming"`, or omit | Controls which events are shown |
| `excludeFeatured` | boolean | Excludes featured events (only in preview modes) |

### `feed.njk`: events and/or posts as one grid
| Variable | Values | Notes |
|---|---|---|
| `feedTitle` | string | Heading above the grid |
| `feedEvents`, `feedPosts` | `"yes"` / `"no"` | Which to include (default both) |
| `feedWhen` | `"upcoming"`, `"past"`, `"all"` | Events only |
| `feedLimit` | number or `"all"` | Default 6 |
| `feedColumns` | 1–12 | Cards per row on wider screens |

### `typeList.njk`: a content type's entries as cards
| Variable | Values | Notes |
|---|---|---|
| `listType` | string | The type's address, e.g. `"team"` (required) |
| `listTitle` | string | Heading above the grid |
| `listLimit` | number or `"all"` | Default all |
| `listColumns` | 1–6 | Default 3 |

### `featured.njk`: Featured posts + events cards
No variables needed: automatically pulls `collections.featuredEvents` and `collections.featuredPosts`.

### `form.njk`: Netlify contact form
Variables are set via page frontmatter: `formTitle`, `formDescription`, `formName`, `formFields`.

### `homeCards.njk`: Home page content block
No variables. Renders latest posts and upcoming events.

---

## Collections reference

Defined by the `spaceclub` package. Available in any template as `collections.<name>`. Each content type is also a collection, by its address (e.g. `collections.team`).

| Collection | Contents |
|---|---|
| `posts` | All posts, newest first |
| `events` | All events, by date ascending |
| `upcomingEvents` | Events that haven't ended yet |
| `pastEvents` | Events that have ended |
| `featuredEvents` | Events with `featured: true` |
| `featuredPosts` | Posts with `featured: true` |
| `previewPosts` | Latest 3 non-featured posts |
| `previewPostsAll` | Latest 3 posts (including featured) |
| `previewEvents` | Up to 3 upcoming non-featured events |
| `previewEventsAll` | Up to 3 upcoming events (including featured) |
| `previewPastEvents` | Up to 3 most recent past non-featured events |
| `previewPastEventsAll` | Up to 3 most recent past events |
| `previewUpcomingEvents` | Up to 3 upcoming non-featured events |
| `previewUpcomingEventsAll` | Up to 3 upcoming events |
| `previewEventsCombined` | 2 upcoming + 1 past, non-featured |
| `previewEventsCombinedAll` | 2 upcoming + 1 past, all |
| `consolidatedGalleries` | All posts/events with a `gallery` field, newest first |

---

## Key config files

- `spaceclub.json`: features and look (see Settings above)
- `src/_data/site.json`: `title`, `description`, `logo`, `favicon`, `baseUrl`, `timezone`, `dateFormat`, `url`, `matomo`
- `src/_data/navbar.json`: nav items: `[{ title, href, footer }]`
- `src/_data/contentTypes.json`: content types made in SpaceDash

---

## Content inventory

To get a structured summary of all current content (pages, posts, events and content type entries):

```bash
npm run list
```

---

## Updating SpaceClub

The layouts, styles and features come from the `spaceclub` package, so updating is:

```bash
npm update spaceclub
```

Its changelog is at `node_modules/spaceclub/CHANGELOG.md`.
