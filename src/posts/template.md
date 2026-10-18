---
# REQUIRED
title: My Post Title
postDate: 2026-01-01

# OPTIONAL
description: A short summary shown in post cards and meta tags.
author: Your Name

# Set to true to show in the Featured section on the home page
featured: false

# Card/header image (path relative to site root)
# image: /assets/images/my-image.jpg

# Preview image for social sharing (can be an absolute URL)
# preview_image: /assets/images/my-image.jpg

# Path to a folder of images to auto-generate a gallery at the bottom of the post.
# Images must be in src/ e.g. src/assets/images/my-post/
# gallery: /assets/images/my-post

# Override the auto-generated URL (default: /posts/my-post-title/)
# permalink: /posts/my-custom-url/
---

<!-- ============================================================
     NUNJUCKS WARNING
     This file is processed as Nunjucks BEFORE Markdown.
     Do NOT write curly-brace expressions or block tags in content
     unless you intend Nunjucks syntax.
     To print a literal double-brace, use: {{ '{{' }}
     To protect a whole block: wrap it in raw/endraw block tags.
     ============================================================ -->

Write your post content here using Markdown.

<!-- PARTIAL EXAMPLES — delete what you don't need -->

<!-- Button -->
<!-- {% set text = "Learn More" %}
{% set link = "/about/" %}
{% set icon = "arrow-right" %}
{% set style = "primary" %}
{% include "partials/btn.njk" %} -->

<!-- Gallery (uses the `gallery` frontmatter path by default, or specify any path) -->
<!-- {% set path = "assets/images/my-post" %}
{% include "partials/gallery.njk" %} -->
