---
# REQUIRED
title: My Event Title
eventDate: 2026-01-01

# OPTIONAL
description: A short summary shown in event cards and meta tags.

# Time format: 09:00 / 14:30 (24-hour) — used for "upcoming" vs "past" cutoff
startTime: 09:00
endTime: 17:00

# Multi-line location: use \n for line breaks
location: "Venue Name \n 123 Street, City"

# Set to true to show in the Featured section on the home page
featured: false

# Card/header image (path relative to site root)
# image: /assets/images/my-event.jpg

# Preview image for social sharing (can be an absolute URL)
# preview_image: /assets/images/my-event.jpg

# Path to a folder of images to auto-generate a gallery at the bottom of the event page.
# Images must be in src/ e.g. src/assets/images/my-event/
# gallery: /assets/images/my-event

# Override the auto-generated URL (default: /events/my-event-title/)
# permalink: /events/my-custom-url/
---

<!-- ============================================================
     NUNJUCKS WARNING
     This file is processed as Nunjucks BEFORE Markdown.
     Do NOT write curly-brace expressions or block tags in content
     unless you intend Nunjucks syntax.
     To print a literal double-brace, use: {{ '{{' }}
     To protect a whole block: wrap it in raw/endraw block tags.
     ============================================================ -->

### {{ title }}
{{ description }}

<!-- Add full event details below -->

<!-- PARTIAL EXAMPLES — delete what you don't need -->

<!-- Button (e.g. registration link) -->
<!-- {% set text = "Register Now" %}
{% set link = "https://example.com/register" %}
{% set icon = "ticket-perforated" %}
{% set style = "primary" %}
{% include "partials/btn.njk" %} -->

<!-- Gallery (uses the `gallery` frontmatter path by default, or specify any path) -->
<!-- {% set path = "assets/images/my-event" %}
{% include "partials/gallery.njk" %} -->
