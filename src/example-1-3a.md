---
title: Example — Figure 1.3a from the long file
---

```js
import {panel, figureMeta, chartRows, basisCheck, footnotes} from "./components/aanhpi.js";
const data = await FileAttachment("data/aanhpi.json").json();
```

```js
const meta = figureMeta(data, "1.3a");
const rows = panel(data, "1.3a");
const check = basisCheck(rows);
// The panel includes an "Asian American Average" row (share = 100); drop totals
// and benchmarks from a share-of-total bar chart.
const bars = chartRows(rows, "1_3_share_of_asian_total_pct")
  .filter((d) => !d.is_benchmark && d.entity_type !== "total" && d.value < 100);
```

## ${meta.figure_title}

${check.status === "incompatible" ? html`<p class="warning">These rows mix source-defined and ACS bases and should not share a chart.</p>` : ""}

```js
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

<div class="small muted">${footnotes(meta, rows).map((l) => html`<div>${l}</div>`)}</div>
