# SpaceClub! Website Template
**Version:** 1.1.0
A flexible Eleventy based static site template that’s easy to edit, easy to deploy, and easy to take anywhere.

SpaceClub! is built with Eleventy, Markdown, Bootstrap, and Pagefind, making it simple to manage content while still offering powerful layouts, components, and features as your site grows.

**Documentation, guides, and examples:**
[https://spaceclubwiki.talkingsites.org](https://spaceclubwiki.talkingsites.org)

## Spacedash (editing in the browser)

Sites launched from SpaceClub Mission Control are edited at `/admin/` with [SpaceDash](https://github.com/TalkingSites/spacedash) (Decap CMS plus our widgets and blocks, loaded from npm). `server.js` serves the built site and handles sign-in through Authentik, and passes edits to GitHub through the SpaceClub GitHub App, limited to the site's own repo. It needs these environment variables:

- `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`: the site's Authentik provider
- `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_INSTALLATION_ID`, `GITHUB_REPO` (owner/name)

Mission Control sets these, plus `url` and `matomo` in `src/_data/site.json`, when it launches a site.
