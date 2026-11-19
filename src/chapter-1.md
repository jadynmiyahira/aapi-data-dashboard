---
theme: air
title: "Chapter 1: Demographics and Population"
toc: true
---

<!--
  WHAT THIS PAGE DOES (plain-language summary)
  ---------------------------------------------------------------------------
  Chapter 1 of the dashboard: Demographics and Population.
  The page:
    1. Loads the cleaned AANHPI data (aanhpi.json, built by
       src/data/aanhpi.json.js).
    2. Lists which figures belong to Chapter 1 and which number to chart for
       each (the settings block below).
    3. Draws each figure as a card: a title, a dot chart and/or a table, and
       footnotes about data quality.
    4. Warns at the bottom if the data has a Chapter 1 figure this page does
       not show yet.
  Notes like this one, and lines starting with //, are for people reading the
  code. They do not appear on the website.
-->

<!-- AAPI Data logo, top right of the page (same as the home page). -->

<div class="top-logo">
  <img src="./assets/AAPI-Data-Horizontal-Logo+Tag-Full-Color.png" alt="AAPI Data logo">
</div>

<!-- Title banner at the top of the page. -->

<div class="hero">
  <h1>Demographics and Population</h1>
</div>

```js
// Load the shared helper tools (from src/components/) that find a figure in the
// data and draw its cards, dot charts and tables. Then load the data itself.
import {panel, figureMeta} from "./components/aanhpi.js";
import {figureCard, barChart, dataTable, rankTable, tryFigure, chartStyles} from "./components/charts.js";
const data = await FileAttachment("data/aanhpi.json").json();
```

```js
// ---------------------------------------------------------------------------
// THE ONLY BLOCK TO EDIT WHEN NEW DATA ARRIVES.
// Series names in the long file contain years (for example 1_1_change_2020_2024),
// so they change each release. Check them on the Data check page and update here.
// Titles below are used only where the data file has a placeholder title.
//
// What each setting means:
//   title    - a title to show instead of a placeholder title in the data
//   bar      - the data series (column) to chart
//   barLabel - the label under the chart
//   mark     - "bar" to draw bars instead of dots (leave out for dots)
//   sortBy   - order groups by a different series (here, 2024 population)
//   suffix   - for "top 5 states" tables: which measure to show
//   total    - for "top 5 states" tables: pattern for the group-size column
// ---------------------------------------------------------------------------
const CH1 = {
  "1.1": {
    title: "Population by race/ethnicity, alone or in combination, 2010, 2020 and 2024 (provisional title)",
    bar: "1_1_change_2020_2024", barLabel: "Change, 2020–2024 (%)"
  },
  "1.2": {
    title: "Population by race/ethnicity, race alone, 2010, 2020 and 2024 (provisional title)",
    bar: "1_2_growth_2020_2024", barLabel: "Growth, 2020–2024 (%)"
  },
  "1.3a": {bar: "1_3_share_of_asian_total_pct"},
  "1.3b": {bar: "1_3_pct_change", sortBy: "1_3_2024_n_acs_1_yr_alone_or_in_combination", barLabel: "% change, 2020–2024 (sorted by 2024 population)"},
  "1.3c": {bar: "1_3_share_of_nhpi_total_pct"},
  "1.3d": {bar: "1_3_pct_change", sortBy: "1_3_2024_n_acs_1_yr_alone_or_in_combination", barLabel: "% change, 2020–2024 (sorted by 2024 population)"},
  "1.4a": {suffix: "pct_of_group", total: /_group_total_n$/},
  "1.4b": {suffix: "pct_of_group", total: /_group_n_/},
  "1.4c": {suffix: "pct_of_group", total: /_group_n_/},
  "1.5": {suffix: "growth_pct"}
};
```

<!-- Apply the shared look (fonts, spacing, colors) for the figure cards. -->

${chartStyles}

<!-- Intro text for the chapter. It sits inside the "chapter-intro" box so it can
     stretch across the full page width (see the styles at the bottom). -->

<div class="chapter-intro">


</div>

## Population by race and ethnicity

```js
// Figures 1.1 and 1.2: for each one, look up its details and rows in the data,
// then draw a card with a dot chart and the full data table underneath.
// tryFigure means that if one figure has a problem (for example a renamed
// series), the page shows a short message for that figure instead of breaking.
// The first card (figure 1.1) gets the triangle AAPI Data logo in the top
// right corner of its downloaded PNG. The logo is not shown on the page.
const triangleLogo = await FileAttachment("assets/Triangle-Only-AAPI-Data-Logo-Mark-Full-Color.png").url();
for (const id of ["1.1", "1.2"]) {
  const c = CH1[id];
  display(tryFigure(id, () => {
    const meta = figureMeta(data, id), rows = panel(data, id);
    return figureCard(meta, rows, {title: c.title, logo: id === "1.1" ? triangleLogo : null, body: [
    barChart(rows, {series: c.bar, label: c.barLabel, mark: c.mark, width}),
    dataTable(rows, {filename: `figure-${id}.csv`})
  ]});
  }));
}
```

## Detailed Asian and NHPI national origin

```js
// Figures 1.3a (Asian) and 1.3c (NHPI): each detailed group's share of the
// total, as a dot chart plus the data table.
for (const id of ["1.3a", "1.3c"]) {
  const c = CH1[id];
  display(tryFigure(id, () => {
    const meta = figureMeta(data, id), rows = panel(data, id);
    return figureCard(meta, rows, {body: [
    barChart(rows, {series: c.bar, width}),
    dataTable(rows, {filename: `figure-${id}.csv`})
  ]});
  }));
}
```

```js
// Figures 1.3b (Asian) and 1.3d (NHPI): percent change 2020–2024 for each
// detailed group, with groups ordered by 2024 population size, plus the table.
for (const id of ["1.3b", "1.3d"]) {
  const c = CH1[id];
  display(tryFigure(id, () => {
    const meta = figureMeta(data, id), rows = panel(data, id);
    return figureCard(meta, rows, {body: [
    barChart(rows, {series: c.bar, sortBy: c.sortBy, label: c.barLabel, width}),
    dataTable(rows, {filename: `figure-${id}.csv`})
  ]});
  }));
}
```

## Where groups live

```js
// Figures 1.4a–c and 1.5: "top 5 states" tables showing where each group
// lives (share of the group in each state) or is growing fastest.
for (const id of ["1.4a", "1.4b", "1.4c", "1.5"]) {
  const c = CH1[id];
  display(tryFigure(id, () => {
    const meta = figureMeta(data, id), rows = panel(data, id);
    return figureCard(meta, rows, {body: [
    rankTable(rows, {suffix: c.suffix, totalPattern: c.total, filename: `figure-${id}.csv`})
  ]});
  }));
}
```

```js
// Safety net: any chapter 1 table in a future data file that this page does not show.
// If the data has a Chapter 1 figure that is not in the settings block at the
// top, show a warning listing it. If everything is shown, display nothing.
const shown = new Set(Object.keys(CH1));
const unshown = data.figures.filter((f) => f.chapter_num === 1 && !shown.has(f.figure_id));
display(unshown.length
  ? html`<p class="aanhpi-warn">Not shown on this page: ${unshown.map((f) => f.figure_id).join(", ")}. Add them to the block above.</p>`
  : "");
```

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
