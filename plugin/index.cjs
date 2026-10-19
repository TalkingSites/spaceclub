const dayjs = require('dayjs');
const advancedFormat = require('dayjs/plugin/advancedFormat');
const isSameOrAfter = require('dayjs/plugin/isSameOrAfter');
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const fs = require('fs');
const path = require('path');
const markdownIt = require('markdown-it');
const md = markdownIt({ html: true, linkify: true });

dayjs.extend(advancedFormat);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

// SpaceClub's Eleventy config. A site's eleventy.config.cjs is one line:
//   module.exports = require("spaceclub");
// (or, to add its own filters on top: module.exports = (c) => { const r = require("spaceclub")(c); c.addFilter(...); return r; })
// The site keeps its content (src/pages, src/events, src/posts, src/_data, its images) and
// spaceclub.json; the layouts, partials, styles and pages come from here. A site can override
// any layout, partial or asset by putting its own copy at the same path in src/.
const PKG = __dirname;
const { readSettings } = require("./settings.cjs");
const { usePackageFiles } = require("./files.cjs");
const { useFeatures } = require("./features.cjs");

module.exports = function spaceclub(eleventyConfig) {
  // (a config function rather than a plugin: Eleventy only lets the config set the folders)
  // the site being built (its folder holds spaceclub.json, src/ and node_modules)
  const ROOT = process.cwd();
  const settings = readSettings(ROOT);
  const on = settings.features;

  // spaceclub.json (with the defaults filled in), for templates: spaceclub.features.events…
  eleventyConfig.addGlobalData("spaceclub", settings);
  eleventyConfig.addGlobalData("global", require("./global.cjs"));
  // the package's layouts, partials, assets and pages, unless the site has its own
  usePackageFiles(eleventyConfig, { root: ROOT, pkg: PKG, settings });
  // the optional features (RSS, WebMCP)
  useFeatures(eleventyConfig, { root: ROOT, pkg: PKG, settings });
  // a feature that's off isn't built, but its content stays in the site
  if (!on.events) eleventyConfig.ignores.add("src/events/**");
  if (!on.posts) eleventyConfig.ignores.add("src/posts/**");

  // Load site data for timezone and date format
  const siteData = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/_data/site.json'), 'utf8'));
  const SITE_TIMEZONE = siteData.timezone || 'Australia/Sydney';
  const DEFAULT_DATE_FORMAT = siteData.dateFormat || 'dddd, Do MMMM YYYY';

  // Helper function to get event end date/time
  function getEventEndDateTime(event) {
    if (!event.data.eventDate) return null;
    
    try {
      // Try to parse the event date without timezone first
      let eventDate = dayjs(event.data.eventDate);
      
      // If invalid date, return null
      if (!eventDate.isValid()) {
        console.warn(`Invalid eventDate for event: ${event.data.title || 'Unknown'} - ${event.data.eventDate}`);
        return null;
      }
      
      // If endTime is specified, use it
      if (event.data.endTime) {
        try {
          const timeStr = event.data.endTime.toString().trim();
          let endTime;
          
          // Try parsing different formats
          if (timeStr.includes(':')) {
            // Format like "4:00PM", "16:00", "4:00 PM"
            endTime = dayjs(`${eventDate.format('YYYY-MM-DD')} ${timeStr}`);
          } else if (timeStr.length === 3 || timeStr.length === 4) {
            // Format like "1400" or "400" (24-hour without colon)
            const paddedTime = timeStr.padStart(4, '0');
            const hours = paddedTime.slice(0, 2);
            const minutes = paddedTime.slice(2);
            endTime = dayjs(`${eventDate.format('YYYY-MM-DD')} ${hours}:${minutes}`);
          } else {
            // Fallback: try parsing as-is
            endTime = dayjs(`${eventDate.format('YYYY-MM-DD')} ${timeStr}`);
          }
          
          if (endTime.isValid()) {
            return endTime;
          } else {
            console.warn(`Invalid endTime for event: ${event.data.title || 'Unknown'} - ${event.data.endTime}`);
            return eventDate.endOf('day');
          }
        } catch (err) {
          console.warn(`Error parsing endTime for event: ${event.data.title || 'Unknown'} - ${err.message}`);
          return eventDate.endOf('day');
        }
      }
      
      // Default: event ends at midnight (end of day)
      return eventDate.endOf('day');
    } catch (err) {
      console.warn(`Error parsing date for event: ${event.data.title || 'Unknown'} - ${err.message}`);
      return null;
    }
  }

  //admin is left unprocessed and copied to site
  eleventyConfig.ignores.add("src/admin/index.html");
  eleventyConfig.ignores.add("src/admin/**/*.html");
  eleventyConfig.addPassthroughCopy("src/admin");

  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  // While developing, the dev server serves assets straight from src/, so images SpaceDash
  // uploads show at once. SpaceDash (/admin/) is served without the dev server's live reload:
  // it's an app rather than a page, and reloading it on every save or upload would throw
  // away what the editor has open (such as the media library mid-upload).
  eleventyConfig.setServerPassthroughCopyBehavior("passthrough");
  eleventyConfig.setServerOptions({
    middleware: [
      (req, res, next) => {
        const url = (req.url || "").split("?")[0];
        const file = path.join(ROOT, "src", "admin", "index.html");
        if ((url !== "/admin/" && url !== "/admin/index.html") || !fs.existsSync(file)) return next();
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(fs.readFileSync(file));
      },
    ],
  });
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });
  eleventyConfig.addPassthroughCopy({ "src/llms.txt": "llms.txt" });

  // Gallery images reader
  eleventyConfig.addGlobalData('galleries', function() {
    const galleries = {};
    
    function scanGalleryDirectory(dirPath, filterPrefix = null) {
      const fullPath = path.join(ROOT, 'src', dirPath);
      
      try {
        if (!fs.existsSync(fullPath)) {
          console.warn(`Gallery directory not found: ${dirPath}`);
          return [];
        }
        
        const files = fs.readdirSync(fullPath);
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
        
        let images = files.filter(file => {
          const ext = path.extname(file).toLowerCase();
          return imageExtensions.includes(ext);
        });
        
        // Filter by prefix if provided (e.g., 'gallery-')
        if (filterPrefix) {
          images = images.filter(file => file.startsWith(filterPrefix));
        }
        
        images.sort();
        
        // warnings go to stderr: SpaceDash's preview reads the build's stdout as JSON
        if (images.length === 0) {
          console.warn(`No images found in ${dirPath}${filterPrefix ? ' with prefix "' + filterPrefix + '"' : ''}`);
        }
        
        return images;
      } catch (error) {
        console.error(`Error reading gallery directory ${dirPath}:`, error.message);
        return [];
      }
    }
    
    // Register a gallery path scanner
    galleries.scan = function(dirPath, filterPrefix = null) {
      const key = dirPath + (filterPrefix || '');
      if (!galleries[key]) {
        galleries[key] = scanGalleryDirectory(dirPath, filterPrefix);
      }
      return galleries[key];
    };
    
    return galleries;
  });

  // All events (sorted by date ascending)
  eleventyConfig.addCollection("events", function (collectionApi) {
    return collectionApi.getFilteredByGlob("src/events/*.md")
      .sort((a, b) => new Date(a.data.eventDate) - new Date(b.data.eventDate));
  });

  eleventyConfig.addCollection("posts", function (collectionApi) {
    return collectionApi.getFilteredByGlob("src/posts/*.md")
      .sort((a, b) => new Date(b.data.postDate) - new Date(a.data.postDate));
  });

  // Upcoming events (event hasn't ended yet)
  eleventyConfig.addCollection("upcomingEvents", function (collectionApi) {
    const now = dayjs().tz(SITE_TIMEZONE);
    return collectionApi.getFilteredByGlob("src/events/*.md")
      .filter(e => {
        const endDateTime = getEventEndDateTime(e);
        return endDateTime && endDateTime.isAfter(now);
      })
      .sort((a, b) => new Date(a.data.eventDate) - new Date(b.data.eventDate));
  });

  // Past events (event has ended)
  eleventyConfig.addCollection("pastEvents", function (collectionApi) {
    const now = dayjs().tz(SITE_TIMEZONE);
    return collectionApi.getFilteredByGlob("src/events/*.md")
      .filter(e => {
        const endDateTime = getEventEndDateTime(e);
        return endDateTime && endDateTime.isSameOrBefore(now);
      })
      .sort((a, b) => new Date(b.data.eventDate) - new Date(a.data.eventDate));
  });

  // Featured events
  eleventyConfig.addCollection("featuredEvents", function (collectionApi) {
    return collectionApi.getFilteredByGlob("src/events/*.md")
      .filter(e => e.data.featured === true)
      .sort((a, b) => new Date(a.data.eventDate) - new Date(b.data.eventDate));
  });

  // Featured posts
  eleventyConfig.addCollection("featuredPosts", function (collectionApi) {
    return collectionApi.getFilteredByGlob("src/posts/*.md")
      .filter(p => p.data.featured === true)
      .sort((a, b) => new Date(b.data.postDate) - new Date(a.data.postDate));
  });

  // Preview events - upcoming only (excluding featured)
  eleventyConfig.addCollection("previewEvents", function (collectionApi) {
    const now = dayjs().tz(SITE_TIMEZONE);
    return collectionApi.getFilteredByGlob("src/events/*.md")
      .filter(e => {
        const endDateTime = getEventEndDateTime(e);
        return endDateTime && 
               endDateTime.isAfter(now) &&
               e.data.featured !== true;
      })
      .sort((a, b) => new Date(a.data.eventDate) - new Date(b.data.eventDate))
      .slice(0, 3);
  });

  // Preview events - upcoming only (including featured)
  eleventyConfig.addCollection("previewEventsAll", function (collectionApi) {
    const now = dayjs().tz(SITE_TIMEZONE);
    return collectionApi.getFilteredByGlob("src/events/*.md")
      .filter(e => {
        const endDateTime = getEventEndDateTime(e);
        return endDateTime && endDateTime.isAfter(now);
      })
      .sort((a, b) => new Date(a.data.eventDate) - new Date(b.data.eventDate))
      .slice(0, 3);
  });

  // Preview events - combined past and upcoming (excluding featured)
  eleventyConfig.addCollection("previewEventsCombined", function (collectionApi) {
    const now = dayjs().tz(SITE_TIMEZONE);
    const allEvents = collectionApi.getFilteredByGlob("src/events/*.md")
      .filter(e => e.data.eventDate && e.data.featured !== true);
    
    const upcoming = allEvents
      .filter(e => {
        const endDateTime = getEventEndDateTime(e);
        return endDateTime && endDateTime.isAfter(now);
      })
      .sort((a, b) => new Date(a.data.eventDate) - new Date(b.data.eventDate))
      .slice(0, 2);
    
    const past = allEvents
      .filter(e => {
        const endDateTime = getEventEndDateTime(e);
        return endDateTime && endDateTime.isSameOrBefore(now);
      })
      .sort((a, b) => new Date(b.data.eventDate) - new Date(a.data.eventDate))
      .slice(0, 1);
    
    return [...upcoming, ...past];
  });

  // Preview events - combined past and upcoming (including featured)
  eleventyConfig.addCollection("previewEventsCombinedAll", function (collectionApi) {
    const now = dayjs().tz(SITE_TIMEZONE);
    const allEvents = collectionApi.getFilteredByGlob("src/events/*.md")
      .filter(e => e.data.eventDate);
    
    const upcoming = allEvents
      .filter(e => {
        const endDateTime = getEventEndDateTime(e);
        return endDateTime && endDateTime.isAfter(now);
      })
      .sort((a, b) => new Date(a.data.eventDate) - new Date(b.data.eventDate))
      .slice(0, 2);
    
    const past = allEvents
      .filter(e => {
        const endDateTime = getEventEndDateTime(e);
        return endDateTime && endDateTime.isSameOrBefore(now);
      })
      .sort((a, b) => new Date(b.data.eventDate) - new Date(a.data.eventDate))
      .slice(0, 1);
    
    return [...upcoming, ...past];
  });

  // Preview events - past only (excluding featured)
  eleventyConfig.addCollection("previewPastEvents", function (collectionApi) {
    const now = dayjs().tz(SITE_TIMEZONE);
    return collectionApi.getFilteredByGlob("src/events/*.md")
      .filter(e => {
        const endDateTime = getEventEndDateTime(e);
        return endDateTime && 
               endDateTime.isSameOrBefore(now) &&
               e.data.featured !== true;
      })
      .sort((a, b) => new Date(b.data.eventDate) - new Date(a.data.eventDate))
      .slice(0, 3);
  });

  // Preview events - past only (including featured)
  eleventyConfig.addCollection("previewPastEventsAll", function (collectionApi) {
    const now = dayjs().tz(SITE_TIMEZONE);
    return collectionApi.getFilteredByGlob("src/events/*.md")
      .filter(e => {
        const endDateTime = getEventEndDateTime(e);
        return endDateTime && endDateTime.isSameOrBefore(now);
      })
      .sort((a, b) => new Date(b.data.eventDate) - new Date(a.data.eventDate))
      .slice(0, 3);
  });

  // Preview events - upcoming only (excluding featured) - duplicate for consistency
  eleventyConfig.addCollection("previewUpcomingEvents", function (collectionApi) {
    const now = dayjs().tz(SITE_TIMEZONE);
    return collectionApi.getFilteredByGlob("src/events/*.md")
      .filter(e => {
        const endDateTime = getEventEndDateTime(e);
        return endDateTime && 
               endDateTime.isAfter(now) &&
               e.data.featured !== true;
      })
      .sort((a, b) => new Date(a.data.eventDate) - new Date(b.data.eventDate))
      .slice(0, 3);
  });

  // Preview events - upcoming only (including featured) - duplicate for consistency
  eleventyConfig.addCollection("previewUpcomingEventsAll", function (collectionApi) {
    const now = dayjs().tz(SITE_TIMEZONE);
    return collectionApi.getFilteredByGlob("src/events/*.md")
      .filter(e => {
        const endDateTime = getEventEndDateTime(e);
        return endDateTime && endDateTime.isAfter(now);
      })
      .sort((a, b) => new Date(a.data.eventDate) - new Date(b.data.eventDate))
      .slice(0, 3);
  });

  // Preview posts (excluding featured by default)
  eleventyConfig.addCollection("previewPosts", function (collectionApi) {
    return collectionApi.getFilteredByGlob("src/posts/*.md")
      .filter(p => p.data.featured !== true) // hide featured
      .sort((a, b) => new Date(b.data.postDate) - new Date(a.data.postDate))
      .slice(0, 3);
  });

  // Preview posts (including featured)
  eleventyConfig.addCollection("previewPostsAll", function (collectionApi) {
    return collectionApi.getFilteredByGlob("src/posts/*.md")
      .sort((a, b) => new Date(b.data.postDate) - new Date(a.data.postDate))
      .slice(0, 3);
  });

  // Consolidated galleries - all events and posts with gallery property, sorted by date (most recent first)
  // Each entry includes scanned image filenames for use in the all-images gallery
  eleventyConfig.addCollection("consolidatedGalleries", function (collectionApi) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

    function scanDir(dirPath) {
      const cleanPath = dirPath.replace(/^\//, '');
      const fullPath = path.join(ROOT, 'src', cleanPath);
      try {
        if (!fs.existsSync(fullPath)) return [];
        return fs.readdirSync(fullPath)
          .filter(f => imageExtensions.includes(path.extname(f).toLowerCase()))
          .sort();
      } catch { return []; }
    }

    const events = collectionApi.getFilteredByGlob("src/events/*.md")
      .filter(e => e.data.gallery)
      .map(e => {
        const galleryPath = e.data.gallery.replace(/^\//, '');
        return {
          date: new Date(e.data.eventDate),
          type: 'event',
          pageTitle: e.data.title,
          gallery: galleryPath,
          url: e.url,
          images: scanDir(galleryPath)
        };
      });
    
    const posts = collectionApi.getFilteredByGlob("src/posts/*.md")
      .filter(p => p.data.gallery)
      .map(p => {
        const galleryPath = p.data.gallery.replace(/^\//, '');
        return {
          date: new Date(p.data.postDate),
          type: 'post',
          pageTitle: p.data.title,
          gallery: galleryPath,
          url: p.url,
          images: scanDir(galleryPath)
        };
      });
    
    return [...events, ...posts]
      .sort((a, b) => b.date - a.date);
  });

  // Date formatting filter - uses site.json dateFormat as default
  // The Feed block: events and/or posts in one list, newest first.
  //   {{ collections | feed({ events: true, posts: true, when: "upcoming", limit: 6 }) }}
  // when: "upcoming" | "past" | "all" (events only); limit: a number or "all".
  // Upcoming events on their own read soonest first; anything mixed reads newest first.
  eleventyConfig.addFilter("feed", function (collections, opts = {}) {
    const when = opts.when || "all";
    const entries = [];
    if (opts.events) {
      const events = when === "upcoming" ? collections.upcomingEvents : when === "past" ? collections.pastEvents : collections.events;
      for (const item of events || []) entries.push({ type: "event", upcoming: (collections.upcomingEvents || []).includes(item), date: new Date(item.data.eventDate), item });
    }
    if (opts.posts) {
      for (const item of collections.posts || []) entries.push({ type: "post", date: new Date(item.data.postDate || item.date), item });
    }
    if (opts.featured) entries.splice(0, entries.length, ...entries.filter((e) => e.item.data.featured));
    const soonestFirst = opts.events && !opts.posts && when === "upcoming";
    entries.sort((a, b) => (soonestFirst ? a.date - b.date : b.date - a.date));
    const limit = parseInt(opts.limit, 10);
    return Number.isFinite(limit) && limit > 0 ? entries.slice(0, limit) : entries;
  });

  eleventyConfig.addFilter("formatDate", function (dateInput, format) {
    if (!dateInput) return '';
    try {
      // Use provided format, or fall back to site default
      const dateFormat = format || DEFAULT_DATE_FORMAT;
      const parsed = dayjs(dateInput);
      return parsed.isValid() ? parsed.format(dateFormat) : String(dateInput);
    } catch (err) {
      console.warn(`Error formatting date: ${dateInput} - ${err.message}`);
      return String(dateInput);
    }
  });

  // Concat filter for Nunjucks
  eleventyConfig.addFilter("concat", function (arr1, arr2) {
    if (!Array.isArray(arr1)) arr1 = [];
    if (!Array.isArray(arr2)) arr2 = [];
    return arr1.concat(arr2);
  });

  // Check if rendered content already contains a manually placed gallery
  eleventyConfig.addFilter("hasGallery", function(content) {
    return content && content.includes('<div class="gallery">');
  });

  // Strip leading slash from a path
  eleventyConfig.addFilter("stripLeadingSlash", function(str) {
    return str ? str.replace(/^\//, '') : str;
  });

  // JSON stringify filter
  eleventyConfig.addFilter("jsonify", function(value) {
    return JSON.stringify(value);
  });

  // Markdown filter for rendering README content
  // --- content types made in SpaceDash (src/_data/contentTypes.json) ---
  // the type an entry belongs to, from its tags
  eleventyConfig.addFilter("contentTypeOf", function (tags, schema) {
    const names = [].concat(tags || []);
    return (schema?.items || []).find((t) => names.includes(t.name)) || null;
  });
  // one of the current page's own fields, by key (Nunjucks has no other way to look one up)
  eleventyConfig.addFilter("fieldValue", function (key) {
    return this.ctx?.[key];
  });
  // Each content type's list page: the page in src/pages at /<type>/ (by its file name or
  // its permalink), or null if there isn't one yet (content-types.njk then makes a plain one)
  const typePages = () => {
    const schema = path.join(ROOT, "src/_data/contentTypes.json");
    const items = fs.existsSync(schema) ? JSON.parse(fs.readFileSync(schema, "utf8")).items || [] : [];
    const dir = path.join(ROOT, "src/pages");
    const pages = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => {
      const slug = f.replace(/\.md$/, "");
      const permalink = require("gray-matter")(fs.readFileSync(path.join(dir, f), "utf8")).data.permalink;
      return { slug, url: permalink || `/${slug}/` };
    }) : [];
    return items.filter((t) => t && t.name).map((t) => ({ ...t, page: pages.find((p) => p.url === `/${t.name}/`)?.slug || null }));
  };
  eleventyConfig.addGlobalData("contentTypePages", typePages);
  eleventyConfig.addGlobalData("contentTypeListPages", () => typePages().filter((t) => !t.page));
  // { type: page file name or null } for SpaceDash
  eleventyConfig.addFilter("listPagesBySlug", function (types) {
    return Object.fromEntries((types || []).map((t) => [t.name, t.page]));
  });
  // pages ticked "Show in the menu", for the navbar's Pages dropdown
  eleventyConfig.addCollection("menuPages", function (collectionApi) {
    return collectionApi.getFilteredByGlob("src/pages/*.md").filter((p) => p.data.menu)
      .sort((a, b) => String(a.data.title).localeCompare(String(b.data.title)));
  });
  // the first few items of a list
  eleventyConfig.addFilter("head", function (arr, n) {
    return (arr || []).slice(0, n);
  });
  // the first image field an entry has filled in, for its card
  eleventyConfig.addFilter("contentImage", function (data, type) {
    const field = (type?.fields || []).find((f) => f.type === "image" && data[f.name]);
    return field ? data[field.name] : null;
  });
  // the entry a "link to another type" field points at
  eleventyConfig.addFilter("entryBySlug", function (entries, slug) {
    return (entries || []).find((e) => e.fileSlug === slug) || null;
  });

  eleventyConfig.addFilter("markdown", function(content) {
    return md.render(content);
  });

  // Build-time frontmatter validation: warns on missing required fields
  eleventyConfig.on('eleventy.before', async () => {
    const POSTS_DIR = path.join(ROOT, 'src', 'posts');
    const EVENTS_DIR = path.join(ROOT, 'src', 'events');

    const POST_REQUIRED = ['title', 'postDate'];
    const EVENT_REQUIRED = ['title', 'eventDate'];

    function validateDir(dirPath, required, label) {
      if (!fs.existsSync(dirPath)) return;
      const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md') && f !== 'template.md' && f !== 'posts.njk' && f !== 'events.njk');
      for (const file of files) {
        const content = fs.readFileSync(path.join(dirPath, file), 'utf8');
        const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (!fmMatch) {
          console.warn(`[SpaceClub] WARNING: ${label} "${file}" has no frontmatter`);
          continue;
        }
        const fm = fmMatch[1];
        for (const field of required) {
          if (!new RegExp(`^${field}:`, 'm').test(fm)) {
            console.warn(`[SpaceClub] WARNING: ${label} "${file}" is missing required field: ${field}`);
          }
        }
      }
    }

    validateDir(POSTS_DIR, POST_REQUIRED, 'post');
    validateDir(EVENTS_DIR, EVENT_REQUIRED, 'event');
  });

  return {
    dir: { input: "src", includes: "_includes", layouts: "_includes/layouts", data: "_data", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
};
