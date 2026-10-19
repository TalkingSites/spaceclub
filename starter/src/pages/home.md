---
layout: index.njk
title: Welcome to Space Club!
description: Check out this home page
permalink: "/"
---

# Hello World!

Located on Dione, one of the largest moon's of Saturn, our club hosts regular get togethers.   
Join us as we share our passion for our space home, whether gathering for meetings, contributing to the wiki and docs, reaching out to other moons, the possibilites are endless!


{% set feedTitle = "Latest" %}
{% set feedWhen = "all" %}
{% include "partials/feed.njk" %}


{% set text = "Register Now" %}
{% set link = "https://example.com/register" %}
{% set icon = "ticket-perforated" %}
{% set style = "primary" %}
{% include "partials/btn.njk" %}