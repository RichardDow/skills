---
name: show-me
description: Help the user understand the current topic visually with concise diagrams, code-shape sketches, and focused HTML artifacts.
---

Help the user understand the current topic of conversation visually. Skip the
preamble and keep prose brief. Pick the smallest view that makes the key point
clear.

[FORMS.md](FORMS.md) is the vocabulary — which form fits which kind of change,
what each one looks like, how the delta is drawn, and which notation belongs on
which surface. Draw from it rather than inventing a shape.

Place each visual next to the short text it supports.

For a visual UI, layout, state comparison, or concept too dense for a fenced
diagram, write one focused HTML file — a diagram, an infographic, or a short
slide deck, whichever fits the point. Match the product's colors, type, spacing
and components; use real labels and data; support desktop and mobile. Then open
it for the user:

```
Bash(open path/to/show-me-{description}.html)
```

You may draw one form, you may draw several, it is unlikely you will draw all of
them. Use your judgement and don't overwhelm the user.
