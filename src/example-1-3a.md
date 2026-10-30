---
title: Example — Figure 1.3a from the long file
---

<!--
  WHAT THIS PAGE DOES (plain-language summary)
  ---------------------------------------------------------------------------
  A worked example showing how to build one chart (Figure 1.3a: each detailed
  Asian American group's share of the Asian American population) straight
  from the AANHPI data. It:
    1. Loads the cleaned data and pulls out the rows for Figure 1.3a.
    2. Removes averages/totals so only individual groups are charted.
    3. Shows a warning if the rows mix race definitions that should not be
       charted together.
    4. Draws a horizontal bar chart (small-sample "caution" values are lighter).
    5. Adds footnotes about data quality, sources and data year.
-->

```js
// Load the helper tools for finding and labeling figures, then the data itself.
import {panel, figureMeta, chartRows, basisCheck, footnotes} from "./components/aanhpi.js";
const data = await FileAttachment("data/aanhpi.json").json();
```

```js
// Look up Figure 1.3a's details (title, notes) and its rows of data, and check
// whether its rows all use the same race definition.
const meta = figureMeta(data, "1.3a");
const rows = panel(data, "1.3a");
const check = basisCheck(rows);
// The panel includes an "Asian American Average" row (share = 100); drop totals
// and benchmarks from a share-of-total bar chart.
const bars = chartRows(rows, "1_3_share_of_asian_total_pct")
  .filter((d) => !d.is_benchmark && d.entity_type !== "total" && d.value < 100);
```

<!-- Page heading uses the figure's title from the data. Below it, a warning
     appears only if the rows mix incompatible race definitions. -->

## ${meta.figure_title}

${check.status === "incompatible" ? html`<p class="warning">These rows mix source-defined and ACS bases and should not share a chart.</p>` : ""}

```js
// The bar chart: one bar per group, longest at the top. Bars for "caution"
// (small-sample) values are drawn lighter. Hovering a bar shows its value,
// race definition, and any note.
Plot.plot({
  marginLeft: 140,
  x: {label: "Share of Asian American population (%)", grid: true},
  y: {label: null},
  marks: [
    Plot.barX(bars, {
      x: "value", y: "entity_label", sort: {y: "-x"},
      fillOpacity: (d) => (d.flag === "caution" ? 0.45 : 1),
      tip: {format: {x: (v) => `${v}%`}},
      title: (d) => `${d.entity_label}: ${d.value}%\n${d.basis}${d.note ? `\n${d.note}` : ""}`
    }),
    Plot.ruleX([0])
  ]
})
```

<!-- Footnotes under the chart: cautions, suppressed values, race definition, data year, source. -->

<div class="small muted">${footnotes(meta, rows).map((l) => html`<div>${l}</div>`)}</div>
