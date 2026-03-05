# Nokturne — Website

Private marketing site for the Nokturne Rocket League bot framework.

## Project Structure

```
nokturne/
├── index.html                    ← Entry point
├── README.md
└── assets/
    ├── css/
    │   ├── main.css              ← Import map (entry)
    │   ├── base/
    │   │   ├── variables.css     ← Design tokens & CSS custom properties
    │   │   ├── reset.css         ← Normalize & base styles
    │   │   └── typography.css    ← Type scale & text utilities
    │   ├── layout/
    │   │   └── utilities.css     ← Grid, flex, clip-paths, buttons, animations
    │   └── components/
    │       ├── navbar.css        ← Navigation bar + mobile menu
    │       ├── hero.css          ← Hero section + ticker bars
    │       └── sections.css      ← Features, Modules, Pricing, FAQ, Contact, Footer
    └── js/
        ├── main.js               ← ES module entry — bootstraps all modules
        └── modules/
            ├── navbar.js         ← Scroll state, active links, mobile toggle
            ├── canvas.js         ← Animated grid + particle network on <canvas>
            ├── faq.js            ← Accordion behavior
            ├── reveal.js         ← Intersection-observer scroll reveal + perf bars
            └── ticker.js         ← Clipboard copy + ticker duplication
```

## How to run

Open `index.html` directly in a browser **or** serve via a local HTTP server
(required for ES module `import` statements):

```bash
# Python
python -m http.server 8080

# Node (npx)
npx serve .

# VS Code
# Use the "Live Server" extension
```

Then visit `http://localhost:8080`.

## Tech stack

- **Vanilla HTML5 / CSS3 / ES2020** — zero runtime dependencies
- **CSS custom properties** for theming (edit `base/variables.css`)
- **ES modules** for clean JS separation (`type="module"` in HTML)
- **IntersectionObserver** for scroll reveal & performance bar animations
- **Canvas 2D API** for the hero particle-grid background
- **Google Fonts** — Bebas Neue, Barlow, Fira Code

## Customisation

| What to change | File |
|---|---|
| Colors, spacing, fonts | `assets/css/base/variables.css` |
| Type scale | `assets/css/base/typography.css` |
| Nav links / brand | `index.html` → `<header class="navbar">` |
| Hero text | `index.html` → `<section id="home">` |
| Module cards | `index.html` → `<section id="modules">` |
| Discord handle | `assets/js/modules/ticker.js` → `copyPairs` array |
| Particle density | `assets/js/modules/canvas.js` → `COUNT` constant |
