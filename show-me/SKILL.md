---
name: show-me
description: Help the user understand the current topic visually with concise diagrams, code-shape sketches, and focused HTML artifacts.
group: planning-design
---

Help the user understand the current topic of conversation visually. Skip the
preamble and keep prose brief. Pick the smallest view that makes the key point
clear.

[FORMS.md](FORMS.md) is the vocabulary — which form fits which kind of change,
what each one looks like, how the delta is drawn, and which notation belongs on
which surface. Draw from it rather than inventing a shape.

Place each visual next to the short text it supports.

For a visual UI, layout, state comparison, or concept too dense for a fenced
diagram: on a host with a GUI, write one focused HTML file — a diagram, an
infographic, or a short slide deck, whichever fits the point. Match the
product's colors, type, spacing and components; use real labels and data;
support desktop and mobile. Then open it for the user with the platform's
normal opener. On a headless host, render an image or a terminal-native visual
instead — never shell out to `open`/`xdg-open` there, since nothing displays
it. Either way, only publish through the Artifact tool when the user
explicitly asks for a shareable page.

You may draw one form, or several — drawing all of them is unlikely. Use your
judgement and don't overwhelm the user.
