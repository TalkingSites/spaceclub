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

module.exports = function (eleventyConfig) {
  // Load site data for timezone and date format
  const siteData = JSON.parse(fs.readFileSync('./src/_data/site.json', 'utf8'));
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

  // Standalone one off pages (the interactive things) are copied verbatim to
  // /misc/. They are never run through Nunjucks, so they cannot break on braces.
  eleventyConfig.ignores.add("src/misc/**");
  eleventyConfig.addPassthroughCopy({ "src/misc": "misc" });

  // Events are switched off for this site. The source files stay in src/events
  // so they can be turned back on by deleting these two lines.
  eleventyConfig.ignores.add("src/events/**");

  // src/home is the standalone landing page served at "/".
  // It is copied byte-for-byte and never run through Nunjucks, so it cannot drift.
  eleventyConfig.ignores.add("src/home/**");
  eleventyConfig.addPassthroughCopy({ "src/home": "/" });

  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });

  // Gallery images reader
  eleventyConfig.addGlobalData('galleries', function() {
    const galleries = {};
    
    function scanGalleryDirectory(dirPath, filterPrefix = null) {
      const fullPath = path.join(__dirname, 'src', dirPath);
      
      try {
        if (!fs.existsSync(fullPath)) {
          console.log(`Gallery directory not found: ${dirPath}`);
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
        
        if (images.length === 0) {
          console.log(`No images found in ${dirPath}${filterPrefix ? ' with prefix "' + filterPrefix + '"' : ''}`);
        } else {
          console.log(`Found ${images.length} images in ${dirPath}${filterPrefix ? ' with prefix "' + filterPrefix + '"' : ''}`);
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
    return collectionApi.getFilteredByGlob("src/posts/**/*.md")
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
    return collectionApi.getFilteredByGlob("src/posts/**/*.md")
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
    return collectionApi.getFilteredByGlob("src/posts/**/*.md")
      .filter(p => p.data.featured !== true) // hide featured
      .sort((a, b) => new Date(b.data.postDate) - new Date(a.data.postDate))
      .slice(0, 3);
  });

  // Preview posts (including featured)
  eleventyConfig.addCollection("previewPostsAll", function (collectionApi) {
    return collectionApi.getFilteredByGlob("src/posts/**/*.md")
      .sort((a, b) => new Date(b.data.postDate) - new Date(a.data.postDate))
      .slice(0, 3);
  });

  // Consolidated galleries - all events and posts with gallery property, sorted by date (most recent first)
  // Each entry includes scanned image filenames for use in the all-images gallery
  eleventyConfig.addCollection("consolidatedGalleries", function (collectionApi) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

    function scanDir(dirPath) {
      const cleanPath = dirPath.replace(/^\//, '');
      const fullPath = path.join(__dirname, 'src', cleanPath);
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
    
    const posts = collectionApi.getFilteredByGlob("src/posts/**/*.md")
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

  // --- Obsidian style wiki links and the post graph ---
  // Posts are plain markdown so they can live in an Obsidian vault. [[Double
  // brackets]] become real links when a post of that name exists, and stay as
  // ghost nodes in the graph when it does not, which is how the graph grows.

  let GRAPH_CACHE = null;
  eleventyConfig.on('eleventy.before', () => { GRAPH_CACHE = null; });

  const slugify = str => String(str).toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  function walkPosts(dir, found = []) {
    if (!fs.existsSync(dir)) return found;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walkPosts(full, found);
      else if (entry.name.endsWith('.md') && !entry.name.startsWith('_')) found.push(full);
    }
    return found;
  }

  function buildGraph() {
    if (GRAPH_CACHE) return GRAPH_CACHE;

    const root = path.join(__dirname, 'src', 'posts');
    const byKey = new Map();   // slug -> node
    const raw = [];

    for (const file of walkPosts(root)) {
      const text = fs.readFileSync(file, 'utf8');
      const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      const front = fm ? fm[1] : '';
      const body = fm ? text.slice(fm[0].length) : text;

      const titleMatch = front.match(/^title:\s*(.+)$/m);
      const dateMatch = front.match(/^postDate:\s*(.+)$/m);
      const permaMatch = front.match(/^permalink:\s*["']?([^"'\n]+)["']?\s*$/m);
      if (front.match(/^permalink:\s*false\s*$/m)) continue;

      const rel = path.relative(root, file).replace(/\.md$/, '');
      const title = (titleMatch ? titleMatch[1] : path.basename(file, '.md'))
        .trim().replace(/^["']|["']$/g, '');
      const url = permaMatch ? permaMatch[1].trim() : '/posts/' + rel.split(path.sep).join('/') + '/';

      const links = [...body.matchAll(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g)].map(m => m[1].trim());

      const node = {
        id: slugify(title),
        title,
        url,
        date: dateMatch ? dateMatch[1].trim() : null,
        resolved: true,
        section: rel.includes(path.sep) ? rel.split(path.sep)[0] : 'posts'
      };
      byKey.set(node.id, node);
      byKey.set(slugify(path.basename(file, '.md')), node);
      raw.push({ node, links });
    }

    const nodes = [...new Set([...byKey.values()])];
    const edges = [];

    for (const { node, links } of raw) {
      for (const target of links) {
        const key = slugify(target);
        let hit = byKey.get(key);
        if (!hit) {
          hit = { id: key, title: target, url: null, resolved: false, section: 'idea' };
          byKey.set(key, hit);
          nodes.push(hit);
        }
        if (hit.id !== node.id && !edges.some(e => e.source === node.id && e.target === hit.id)) {
          edges.push({ source: node.id, target: hit.id });
        }
      }
    }

    GRAPH_CACHE = { nodes, edges, lookup: byKey };
    return GRAPH_CACHE;
  }

  eleventyConfig.addGlobalData('postGraph', () => {
    const g = buildGraph();
    return { nodes: g.nodes, edges: g.edges };
  });

  // Turn [[wiki links]] in the rendered HTML into anchors, leaving code alone.
  eleventyConfig.addTransform('wikilinks', function (content) {
    if (!(this.page.outputPath || '').endsWith('.html')) return content;
    if (!content.includes('[[')) return content;

    const lookup = buildGraph().lookup;
    // split on code and pre blocks so examples are never rewritten
    return content.split(/(<pre[\s\S]*?<\/pre>|<code[\s\S]*?<\/code>)/g).map(chunk => {
      if (chunk.startsWith('<pre') || chunk.startsWith('<code')) return chunk;
      return chunk.replace(/\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/g, (whole, target, label) => {
        const text = (label || target).trim();
        const hit = lookup.get(slugify(target.trim()));
        return hit && hit.url
          ? `<a class="wikilink" href="${hit.url}">${text}</a>`
          : `<span class="wikilink unresolved" title="Not written yet">${text}</span>`;
      });
    }).join('');
  });

  // --- RSS feed helpers ---
  const SITE_URL = (siteData.url || '').replace(/\/$/, '');

  // Absolute URL for feed entries (RSS requires fully qualified links)
  eleventyConfig.addFilter("absoluteUrl", function (url, base) {
    try {
      return new URL(url, (base || SITE_URL) + '/').href;
    } catch (err) {
      return url;
    }
  });

  // RFC-822 date, as required by the RSS 2.0 spec
  eleventyConfig.addFilter("dateToRfc822", function (dateInput) {
    const parsed = dayjs(dateInput || new Date()).tz(SITE_TIMEZONE);
    return parsed.isValid()
      ? parsed.format('ddd, DD MMM YYYY HH:mm:ss ZZ')
      : dayjs().tz(SITE_TIMEZONE).format('ddd, DD MMM YYYY HH:mm:ss ZZ');
  });

  // Feed items only: drop posts dated in the future (scheduled drafts and the
  // shipped template.md, which is dated 3099 so it sorts to the top of the site)
  eleventyConfig.addFilter("publishedOnly", function (posts) {
    if (!posts) return [];
    const now = dayjs().tz(SITE_TIMEZONE);
    return posts.filter(p => {
      const d = dayjs(p.data.postDate || p.date);
      return d.isValid() && d.isSameOrBefore(now);
    });
  });

  // Newest post date in a collection, for the channel's lastBuildDate
  eleventyConfig.addFilter("newestDate", function (posts) {
    if (!posts || !posts.length) return new Date();
    return posts.map(p => new Date(p.data.postDate || p.date))
      .sort((a, b) => b - a)[0];
  });

  // Date formatting filter - uses site.json dateFormat as default
  eleventyConfig.addFilter("formatDate", function (dateInput, format) {
    if (!dateInput) return '';
    try {
      // Use provided format, or fall back to site default
      const dateFormat = format || DEFAULT_DATE_FORMAT;
      const parsed = dayjs(dateInput);
      if (!parsed.isValid()) return String(dateInput);
      // A date-only front matter value (postDate: 2026-09-05) is parsed as UTC
      // midnight. Formatting that in the server's local zone can slide it to the
      // day before, so plain dates are formatted in UTC and only real
      // timestamps get converted into the site timezone.
      const utc0 = dayjs.utc(dateInput);
      const dateOnly = utc0.isValid() &&
        utc0.hour() === 0 && utc0.minute() === 0 && utc0.second() === 0;
      return dateOnly ? utc0.format(dateFormat) : parsed.tz(SITE_TIMEZONE).format(dateFormat);
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
  eleventyConfig.addFilter("markdown", function(content) {
    return md.render(content);
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      layouts: "_includes/layouts",
      data: "_data",
      output: "_site"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};