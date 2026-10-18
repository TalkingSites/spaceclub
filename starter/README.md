# A SpaceClub site

This site is built with [SpaceClub](https://github.com/TalkingSites/spaceclub). Its content lives in `src/` and its settings in `spaceclub.json`; the layouts, styles and pages come from the `spaceclub` package.

**Editing:** open `/admin/` (SpaceDash) and log in. Every change becomes a pull request with a preview, and goes live when it's published.

**Working on it locally:**

```bash
npm install
pm2 start ecosystem.config.cjs   # http://localhost:8090, SpaceDash at http://localhost:8090/admin/
```

**Guides:** [spaceclubwiki.talkingsites.org](https://spaceclubwiki.talkingsites.org)
