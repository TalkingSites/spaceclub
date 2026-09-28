---
layout: base.njk
title: Leave a comment
description: Say something, correct something, or leave a way for me to reach you.
formDescription: Corrections especially welcome, particularly if I have got the botany wrong.
formName: comments
formButton: Send it
formFields:
  - name: name
    label: Your name
    required: false
  - name: contact
    label: Email or a handle I can find you at
    required: false
  - name: message
    label: Comment
    rows: 6
---

<div class="prose mb-5">

# Leave a comment

Say whatever you like. A correction, a question, an argument about whether a coconut counts.

If you want a reply, leave an email address or a handle somewhere in there. Without one this goes into the void, which is a perfectly good place to send things, but I will not be able to write back.

</div>

{% include "partials/form.njk" %}
