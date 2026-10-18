# SpaceClub! — AI Agent Reference

**Upstream:** https://github.com/TalkingSites/spaceclub-template
**Docs/Wiki:** https://spaceclubwiki.talkingsites.org
**Stack:** Eleventy (11ty) v3 · Nunjucks templates · Bootstrap 5 · Pagefind · Netlify

---

## Quick start

```bash
npm install
npm start        # dev server at http://localhost:8080
npm run build    # production build → _site/
```

---

## Project structure

```
src/
  _data/          # Global config: site.json, navbar.json, global.js
  _includes/
    layouts/      # Page shells: base.njk, index.njk, post.njk, event.njk
    partials/     # Reusable components (see Partials reference below)
  assets/         # CSS (styles.css), fonts, images, JS (search.js)
  posts/          # Blog posts — one .md file per post
  events/         # Events — one .md file per event
  *.md            # Top-level pages: index, about, contact, 404
.eleventy.js      # Build config, collections, filters
netlify.toml      # Netlify deployment config
```

---

## ⚠️ Critical: Nunjucks-in-Markdown

Every `.md` file is processed as **Nunjucks first, then Markdown** (`markdownTemplateEngine: "njk"` in `.eleventy.js`). This means:

- `{{ variable }}` and `{% tag %}` in content are executed as Nunjucks — not rendered as text.
- Writing content that contains `{{` (e.g. code examples, template snippets) **will crash the build or produce garbled output**.
- To output a literal `{{`, use `{{ '{{' }}`.
- To protect a whole block, wrap it: `{% raw %}...{% endraw %}`.

---

## File naming conventions

- **Posts:** `src/posts/my-post-title.md` → URL `/posts/my-post-title/`
- **Events:** `src/events/my-event-title.md` → URL `/events/my-event-title/`
- **Pages:** `src/page-name.md` → URL `/page-name/`
- Use **kebab-case**, no date prefix. Override the URL with `permalink` in frontmatter.

---

## Frontmatter schemas

### Posts (`src/posts/*.md`)

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | ✅ | Displayed in cards, page title, and `<title>` |
| `postDate` | `YYYY-MM-DD` | ✅ | Used for sorting (newest first) |
| `description` | string | — | Card summary and meta description |
| `author` | string | — | Displayed on the post page |
| `featured` | boolean | — | `true` → appears in Featured section |
| `image` | path string | — | Card/header image (e.g. `/assets/images/foo.jpg`) |
| `preview_image` | path or URL | — | Social sharing image |
| `gallery` | path string | — | Folder path for auto-gallery (e.g. `/assets/images/my-post`) |
| `permalink` | string | — | Override the auto-generated URL |
| `layout` | string | — | Defaults to `post.njk` via `posts/posts.json` |

### Events (`src/events/*.md`)

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | ✅ | Displayed in cards, page title |
| `eventDate` | `YYYY-MM-DD` | ✅ | Used for sorting and upcoming/past classification |
| `description` | string | — | Card summary and meta description |
| `startTime` | string | — | e.g. `9:00AM` or `14:00` — displayed and used for past cutoff |
| `endTime` | string | — | e.g. `5:00PM` — event is "past" once this passes |
| `location` | string | — | Use `\n` for line breaks |
| `featured` | boolean | — | `true` → appears in Featured section |
| `image` | path string | — | Card/header image |
| `preview_image` | path or URL | — | Social sharing image |
| `gallery` | path string | — | Folder path for auto-gallery |
| `permalink` | string | — | Override the auto-generated URL |
| `layout` | string | — | Defaults to `event.njk` via `events/events.json` |

### Pages (`src/*.md`)

| Field | Type | Notes |
|---|---|---|
| `layout` | string | `base.njk` for most pages; `index.njk` for home |
| `title` | string | Page title |
| `description` | string | Meta description |
| `permalink` | string | Override URL |
| `formTitle` | string | Contact page: form heading |
| `formDescription` | string | Contact page: form subtext |
| `formName` | string | Contact page: HTML form `name` and Netlify form name |
| `formFields` | array | Contact page: list of `name` strings or `{name, type}` objects |

---

## Partials reference

All partials live in `src/_includes/partials/`. Use them in any `.md` or `.njk` file with `{% include "partials/name.njk" %}`. Set variables with `{% set varName = value %}` before the include.

### `btn.njk` — Bootstrap button
| Variable | Default | Notes |
|---|---|---|
| `text` | `"Back to Home"` | Button label |
| `link` | `"/"` | href |
| `icon` | `"arrow-left"` | Bootstrap Icons name (omit `bi-`) |
| `style` | `"primary"` | Bootstrap button variant: `primary`, `secondary`, `outline-primary`, etc. |
| `align` | `"center"` | `start`, `center`, or `end` |

### `gallery.njk` — Image gallery with lightbox
| Variable | Default | Notes |
|---|---|---|
| `path` | `"assets/uploads"` | Path to image folder **relative to `src/`**, no leading slash |
| `filterPrefix` | `null` | Only show files starting with this string |

Images must be in the `src/` tree (Eleventy scans the filesystem at build time).

### `galleryAll.njk` — All-images gallery across posts/events
| Variable | Default | Notes |
|---|---|---|
| `galleryLimit` | `0` (all) | Set to a number to show a preview |

### `postsList.njk` — Post cards list
| Variable | Values | Notes |
|---|---|---|
| `type` | `"preview"` or omit | `preview` shows latest 3; omit shows all |
| `excludeFeatured` | boolean | When `type == "preview"`, hide featured posts |

### `eventsList.njk` — Event cards list
| Variable | Values | Notes |
|---|---|---|
| `type` | `"upcoming"`, `"past"`, `"preview"`, `"previewPast"`, `"previewUpcoming"`, or omit | Controls which events are shown |
| `excludeFeatured` | boolean | Excludes featured events (only in preview modes) |

### `featured.njk` — Featured posts + events cards
No variables needed — automatically pulls `collections.featuredEvents` and `collections.featuredPosts`.

### `form.njk` — Netlify contact form
Variables are set via page frontmatter: `formTitle`, `formDescription`, `formName`, `formFields`.

### `homeCards.njk` — Home page content block
No variables. Renders latest posts and upcoming events.

---

## Collections reference

Defined in `.eleventy.js`. Available in any template as `collections.<name>`.

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

- `src/_data/site.json` — `title`, `description`, `baseUrl`, `timezone`, `dateFormat`, social links
- `src/_data/navbar.json` — nav items: `[{ title, href, footer }]`
- `src/_data/global.js` — computed globals

---

## Content inventory

To get a structured summary of all current content:

```bash
node scripts/list-content.js
```

---

## Upstream sync

```bash
git fetch origin
git merge origin/main
```
