# What's new in SpaceClub

Each release lists what changed for people running a SpaceClub site, newest first.

## Unreleased

## 2.0.0 (2026-10-18)

- SpaceClub is now a package your site installs, instead of a copy of the template. Fixes and new features reach your site when it updates, and your repo keeps only your content and settings.
- Make a new site with `npx spaceclub new my-site`, and copy any layout, partial or style into your site to change it with `npx spaceclub customize`.
- Choose what your site has, and how it looks, in one settings file (`spaceclub.json`). Anything you turn off stays in your site, ready to turn back on.
- Your site now has news feeds: posts, events and each content type you make have their own feed that people can follow.
- AI assistants in the browser can now find their way around your site: search it, list your events and posts, and read your pages (WebMCP). It updates itself as you add pages and content types.
- Make your own content types (Team, Projects...) in SpaceDash, each with its own list page and a block for any page.
- Every page lives in one Pages list, with its own address and a "Show in the menu" switch.
- See your changes as you type with SpaceDash's real preview.
- SpaceDash's Media shows every image on your site, and galleries are chosen by their photos. Editing on your own computer no longer reloads SpaceDash every time you save or upload.
- Each event can hide the date, time and place under its title, and show them anywhere in its text with SpaceDash's Event details block instead.
- Give an event's place a map link and it becomes clickable.
- Link an event to its recap post, and a post to its event, by picking them in SpaceDash. Posts can be featured on the home page too.
- Every site comes with a guide for AI coding assistants (`AGENTS.md`) and an `llms.txt` describing the site, so tools like Claude Code edit it the right way. (Thanks pendashteh.)
- The site warns you when a post or event is missing its title or date, and `npm run list` shows all your content at once. (Thanks pendashteh.)
