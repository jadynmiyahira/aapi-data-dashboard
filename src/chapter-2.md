---
theme: air
title: "Chapter 2: Immigration"
toc: true
---

<!--
  WHAT THIS PAGE DOES (plain-language summary)
  ---------------------------------------------------------------------------
  Chapter 2 of the dashboard: Immigration.
  The page:
    1. Loads the cleaned AANHPI data (aanhpi.json, built by
       src/data/aanhpi.json.js).
    2. Lists which figures belong to Chapter 2 and which number to chart for
       each (the settings block below).
    3. Draws each figure as a card: a title, a dot chart and/or a table, and
       footnotes about data quality.
    4. Warns at the bottom if the data has a Chapter 2 figure this page does
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
  <h1>Immigration</h1>
</div>

```js
// Load the shared helper tools (from src/components/) that find a figure in the
// data and draw its cards, dot charts and tables. Then load the data itself.
import {panels} from "./components/aanhpi.js";
import {figureCard, barChart, dataTable, notBenchmark, tryFigure, chartStyles} from "./components/charts.js";
const data = await FileAttachment("data/aanhpi.json").json();
```

```js
// ---------------------------------------------------------------------------
// THE ONLY BLOCK TO EDIT WHEN NEW DATA ARRIVES.
// Series names in the long file contain years (for example 2_3_y2024), so they
// change each release. Check them on the Data check page and update here.
// Titles below are used only where the data file has a placeholder title.
//
// Each entry is one card. What each setting means:
//   id       - the figure ID in the data
//   panel    - for figures with more than one table in the data, how to pick
//              the right one (a pattern matched against its title, or "percent"
//              / "count" to pick by the kind of numbers it holds)
//   title    - a title to show instead of a placeholder title in the data
//   bar      - the data series (column) to chart; leave out for a table only
//   barLabel - the label under the chart
//   sortBy   - order groups by a different series
//   hide     - groups to leave out of the chart (they stay in the table)
//   columns  - the series to show in the table. Some Chapter 2 tables carry
//              stray columns from the source workbook (for example
//              "(no header) column M"), so each table lists its columns.
// ---------------------------------------------------------------------------
const CH2 = {
  "2.1a": {
    title: "Percentage of foreign born as a proportion of residents, adults, and adult citizens (CVAP) (provisional title)",
    bar: "2_1_pct_residents", barLabel: "Foreign born, % of residents",
    // The chart shows race-alone rows only, so its labels fit; the table has both definitions.
    hide: ["Asian American (alone or in combination)", "NHPI (alone or in combination)"],
    columns: ["2_1_pct_residents", "2_1_pct_adults", "2_1_pct_cvap"]
  },
  "2.1b-universe": {id: "2.1b", panel: /by universe/,
    columns: ["2_1_pct_foreign_born_all_residents", "2_1_pct_foreign_born_adults_18", "2_1_pct_foreign_born_cvap"]},
  "2.1b": {panel: /Detailed Asian/, bar: "2_1_pct_foreign_born", columns: ["2_1_pct_foreign_born"]},
  "2.1c-universe": {id: "2.1c", panel: /by universe/,
    columns: ["2_1_pct_foreign_born_all_residents", "2_1_pct_foreign_born_adults_18", "2_1_pct_foreign_born_cvap"]},
  "2.1c": {panel: /Detailed NHPI/, bar: "2_1_pct_foreign_born", columns: ["2_1_pct_foreign_born"]},
  "2.2a": {bar: "2_2_pct_recent_arrivals_2014_2024", columns: ["2_2_pct_recent_arrivals_2014_2024", "2_2_pct_of_foreign_born"]},
  "2.2b": {bar: "2_2_pct_recent_arrivals_2014_2024", columns: ["2_2_pct_recent_arrivals_2014_2024"]},
  "2.3a": {bar: "2_3_y2024", barLabel: "Persons obtaining LPR status, FY2024", hide: ["Asia share of total (%)"],
    columns: ["2_3_y2015", "2_3_y2016", "2_3_y2017", "2_3_y2018", "2_3_y2019", "2_3_y2020", "2_3_y2021", "2_3_y2022", "2_3_y2023", "2_3_y2024"]},
  "2.3b": {bar: "2_3_y2024", barLabel: "Persons obtaining LPR status, FY2024",
    columns: ["2_3_y2015", "2_3_y2016", "2_3_y2017", "2_3_y2018", "2_3_y2019", "2_3_y2020", "2_3_y2021", "2_3_y2022", "2_3_y2023", "2_3_y2024"]},
  "2.5a": {panel: "percent",
    columns: ["2_5_immediate_relatives_pct", "2_5_family_sponsored_pct", "2_5_employment_based_pct", "2_5_diversity_pct", "2_5_refugees_and_asylees_pct", "2_5_other_pct"],
    countsPanel: "count"},
  "2.5b": {panel: "percent",
    columns: ["2_5_immediate_relatives_pct", "2_5_family_sponsored_pct", "2_5_employment_based_pct", "2_5_diversity_pct", "2_5_refugees_and_asylees_pct", "2_5_other_pct"],
    countsPanel: "count"},
  "2.4": {bar: "2_4_y2024", barLabel: "Persons naturalized, FY2024",
    columns: ["2_4_y2015", "2_4_y2016", "2_4_y2017", "2_4_y2018", "2_4_y2019", "2_4_y2020", "2_4_y2021", "2_4_y2022", "2_4_y2023", "2_4_y2024"]},
  "2.4a": {bar: "2_4_y2024", barLabel: "Persons naturalized, FY2024",
    columns: ["2_4_y2015", "2_4_y2016", "2_4_y2017", "2_4_y2018", "2_4_y2019", "2_4_y2020", "2_4_y2021", "2_4_y2022", "2_4_y2023", "2_4_y2024"]},
  "2.4b": {bar: "2_4_median_years_fy2023", barLabel: "Median years to naturalization, FY2023",
    columns: ["2_4_median_years_fy2023"]},
  "2.6": {bar: "2_6_pct_of_worldwide_total", hide: ["All Others", "Worldwide Total", "Asia Total"],
    columns: ["2_6_waiting_list_total", "2_6_pct_of_worldwide_total"]},
  "2.7a": {title: "Unauthorized immigrant population by region of birth, 2024 (provisional title)",
    bar: "2_7_percent", barLabel: "% of unauthorized population", columns: ["2_7_population", "2_7_percent"]},
  "2.7b": {title: "Unauthorized immigrant population by country of birth, 2024 (provisional title)",
    bar: "2_7_pct_of_total", barLabel: "% of unauthorized population", columns: ["2_7_2024_estimate", "2_7_pct_of_total"],
    hide: ["AAPI countries subtotal (India, China, Philippines, Korea, Vietnam, Afghanistan, Pakistan, Bangladesh, Nepal)"]},
  "2.7c": {title: "Unauthorized immigrant population by race/ethnicity, 2024 (provisional title)",
    bar: "2_7_pct_of_total", barLabel: "% of unauthorized population", columns: ["2_7_2024_estimate", "2_7_pct_of_total"]},
  "2.8": {bar: "2_8_2025_n", barLabel: "Deportations, FY2025",
    columns: ["2_8_2012_n", "2_8_2013_n", "2_8_2014_n", "2_8_2015_n", "2_8_2016_n", "2_8_2017_n", "2_8_2018_n", "2_8_2019_n", "2_8_2020_n", "2_8_2021_n", "2_8_2022_n", "2_8_2023_n", "2_8_2024_n", "2_8_2025_n", "2_8_2026_n_partial_year"]}
};
```

```js
// Find one table ("panel") in the data and return its details and rows.
// `which` picks between several tables that share a figure ID: a pattern
// matched against the title, or "percent" / "count" for the kind of numbers.
function getPanel(id, which) {
  const rowsOf = (p) => data.rows
    .filter((d) => d.panel_key === p.panel_key)
    .sort((a, b) => a.source_row_order - b.source_row_order);
  const ps = panels(data, id);
  if (!ps.length) throw new Error(`No figure ${id} in the data file`);
  let p = ps[0];
  if (which instanceof RegExp) p = ps.find((x) => which.test(x.figure_title));
  else if (which) p = ps.find((x) => rowsOf(x).some((d) => d.series_role === "estimate" && d.unit === which));
  if (!p) throw new Error(`Figure ${id}: no table matches ${which}`);
  // Some source titles carry a chart instruction after a "|"; show only the title.
  return {meta: {...p, figure_title: p.figure_title.replace(/\s*\|.*$/, "")}, rows: rowsOf(p)};
}

// Draw one card from the settings block: a dot chart (if `bar` is set) and the
// data table underneath. tryFigure means that if one figure has a problem (for
// example a renamed series), the page shows a short message for that figure
// instead of breaking.
function ch2Card(key) {
  const c = CH2[key], id = c.id ?? key;
  return tryFigure(id, () => {
    const {meta, rows} = getPanel(id, c.panel);
    const keep = (d) => c.columns.includes(d.series_slug);
    const hide = new Set(c.hide ?? []);
    const body = [];
    if (c.bar) body.push(barChart(rows, {
      series: c.bar, sortBy: c.sortBy, label: c.barLabel, width,
      include: (d) => notBenchmark(d) && !hide.has(d.entity_label)
    }));
    body.push(dataTable(rows.filter(keep), {series: c.columns, filename: `figure-${id}.csv`}));
    // Figures 2.5a and 2.5b also have a table of raw counts; show it below the percentages.
    if (c.countsPanel) {
      const counts = getPanel(id, c.countsPanel).rows;
      body.push(html`<h3 class="aanhpi-subhead">Number of persons</h3>`,
        dataTable(counts, {filename: `figure-${id}-counts.csv`}));
    }
    return figureCard(meta, rows.filter(keep), {title: c.title, body});
  });
}
```

<!-- Apply the shared look (fonts, spacing, colors) for the figure cards. -->

${chartStyles}

<!-- Intro text for the chapter. It sits inside the "chapter-intro" box so it can
     stretch across the full page width (see the styles at the bottom). -->

<div class="chapter-intro">


</div>

## Foreign-born population

```js
// Figures 2.1a–c: share of each group that was born outside the U.S.
for (const key of ["2.1a", "2.1b-universe", "2.1b", "2.1c-universe", "2.1c"]) display(ch2Card(key));
```

## Recent arrivals

```js
// Figures 2.2a (Asian) and 2.2b (NHPI): share of residents who arrived in the past 10 years.
for (const key of ["2.2a", "2.2b"]) display(ch2Card(key));
```

## Lawful permanent residents

```js
// Figures 2.3a–b: green cards by region and by Asian country of birth (chart
// shows the latest year; the table has every year). Figures 2.5a–b: green
// cards by class of admission (tables only).
for (const key of ["2.3a", "2.3b", "2.5a", "2.5b"]) display(ch2Card(key));
```

## Naturalization

```js
// Figures 2.4, 2.4a and 2.4b: people naturalized by region and by Asian
// country (latest year charted), and median years to naturalization.
for (const key of ["2.4", "2.4a", "2.4b"]) display(ch2Card(key));
```

## Family visa backlog

```js
// Figure 2.6: countries with the longest family visa waiting lists. Totals
// ("All Others", "Asia Total", "Worldwide Total") are in the table, not the chart.
display(ch2Card("2.6"));
```

## Unauthorized immigrants

```js
// Figures 2.7a–c: unauthorized immigrant population by region, country and race.
for (const key of ["2.7a", "2.7b", "2.7c"]) display(ch2Card(key));
```

## Deportations

```js
// Figure 2.8: top 10 Asian countries by deportations (FY2025 charted; the table has every year).
display(ch2Card("2.8"));
```

```js
// Safety net: any chapter 2 table in a future data file that this page does not show.
// If the data has a Chapter 2 figure that is not in the settings block at the
// top, show a warning listing it. If everything is shown, display nothing.
const shown = new Set(Object.entries(CH2).map(([k, c]) => c.id ?? k));
const unshown = [...new Set(data.figures.filter((f) => f.chapter_num === 2 && !shown.has(f.figure_id)).map((f) => f.figure_id))];
if (unshown.length) display(html`<p class="aanhpi-warn">Not shown on this page: ${unshown.join(", ")}. Add them to the block above.</p>`);
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

/* Figure 2.7b has one very long group name ("AAPI countries subtotal (India,
   China, ...)"). Let names wrap onto two lines in that table so the numbers
   stay in view. */
[id="fig-2.7b"] td {
  white-space: normal;
}

/* Small heading inside a card, above a second table (figures 2.5a and 2.5b). */
.aanhpi-subhead {
  font-size: 0.95rem;
  margin: 1.25rem 0 0;
}

</style>