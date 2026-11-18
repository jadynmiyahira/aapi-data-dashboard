---
theme: air
title: "Chapter 2: Immigration"
toc: true
---

<!-- AAPI Data logo, top right of the page (same as the home page). -->

<div class="top-logo">
  <img src="./assets/AAPI-Data-Horizontal-Logo+Tag-Full-Color.png" alt="AAPI Data logo">
</div>

<!-- Title banner at the top of the page. -->

<div class="hero">
  <h1>Immigration</h1>
</div>


<!-- Page styling, matching the home page (index.md). Colors used: #103f48 (dark
     teal, text), #ff4f00 (orange, links and highlights), #7fb6a4 (light green,
     borders), #ffffff (white). -->

<style>

/* Theme colors for this page: background, text, highlight and muted text. */
:root {
  --theme-background: #ffffff;
  --theme-background-alt: #ffffff;
  --theme-foreground: #103f48;
  --theme-foreground-focus: #ff4f00;
  --theme-foreground-muted: #103f48;
  /* Chart colors: all dots and lines (including negative values) are dark teal. */
  --aanhpi-bar: #103f48;
  --aanhpi-bar-negative: #103f48;
}

/* Page background, text color, link color and divider-line color. */
body {
  background: #ffffff;
  color: #103f48;
}

a, a:visited {
  color: #ff4f00;
}

hr {
  border-color: #7fb6a4;
}

/* Cards (each figure is a card): white boxes with a light green border and a
   thicker top edge. */
.card {
  background: #ffffff;
  border: 1px solid #7fb6a4;
  border-top: 4px solid #7fb6a4;
}

/* AAPI Data logo: top right, 60px tall (same as the home page). */
.top-logo {
  display: flex;
  justify-content: flex-end;
}

.top-logo img {
  height: 60px;
  width: auto;
  max-width: 100%;
}

/* Intro text: let the paragraphs run the full width of the page instead of
   the theme's default reading width (about 640px). */
.chapter-intro p {
  max-width: none;
}

/* Title banner: centered, large title. Same look as the home page, but with
   less space around it so the figures start sooner. */
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: var(--sans-serif);
  margin: 1rem 0 3rem;
  text-wrap: balance;
  text-align: center;
}

.hero h1 {
  margin: 1rem 0;
  padding: 1rem 0;
  max-width: none;
  font-size: 10vw;
  font-weight: 900;
  line-height: 1;
  color: #103f48;
}

/* On wider screens, cap the title size at 64px. */
@media (min-width: 640px) {
  .hero h1 {
    font-size: 64px;
  }
}

</style>