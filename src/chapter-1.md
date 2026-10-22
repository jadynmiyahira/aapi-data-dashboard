---
title: "Chapter 1: Demographics and Population"
toc: true
---

```js
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

${chartStyles}

Figures in this chapter come from `${data.source_file}`. Values flagged * rest on 25–99 unweighted cases.

## Population by race and ethnicity

```js
for (const id of ["1.1", "1.2"]) {
  const c = CH1[id];
  display(tryFigure(id, () => {
    const meta = figureMeta(data, id), rows = panel(data, id);
    return figureCard(meta, rows, {title: c.title, body: [
    barChart(rows, {series: c.bar, label: c.barLabel, width}),
    dataTable(rows)
  ]});
  }));
}
```

## Detailed Asian and NHPI national origin

```js
for (const id of ["1.3a", "1.3c"]) {
  const c = CH1[id];
  display(tryFigure(id, () => {
    const meta = figureMeta(data, id), rows = panel(data, id);
    return figureCard(meta, rows, {body: [
    barChart(rows, {series: c.bar, width}),
    dataTable(rows)
  ]});
  }));
}
```

```js
for (const id of ["1.3b", "1.3d"]) {
  const c = CH1[id];
  display(tryFigure(id, () => {
    const meta = figureMeta(data, id), rows = panel(data, id);
    return figureCard(meta, rows, {body: [
    barChart(rows, {series: c.bar, sortBy: c.sortBy, label: c.barLabel, width}),
    dataTable(rows)
  ]});
  }));
}
```

## Where groups live

```js
for (const id of ["1.4a", "1.4b", "1.4c", "1.5"]) {
  const c = CH1[id];
  display(tryFigure(id, () => {
    const meta = figureMeta(data, id), rows = panel(data, id);
    return figureCard(meta, rows, {body: [
    rankTable(rows, {suffix: c.suffix, totalPattern: c.total})
  ]});
  }));
}
```

```js
// Safety net: any chapter 1 table in a future data file that this page does not show.
const shown = new Set(Object.keys(CH1));
const unshown = data.figures.filter((f) => f.chapter_num === 1 && !shown.has(f.figure_id));
display(unshown.length
  ? html`<p class="aanhpi-warn">Not shown on this page: ${unshown.map((f) => f.figure_id).join(", ")}. Add them to the block above.</p>`
  : "");
```
