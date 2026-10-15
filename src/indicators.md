---
title: AANHPI indicators (example)
---

# AANHPI indicators (example data)

Every chart on this page is drawn from two files in `src/data/`:
`indicators_long.csv` (the numbers) and `indicator_metadata.csv` (titles, chart type, sort order).
The example numbers are made up.

```js
// 1. Load both files. typed: true turns number-looking text into real numbers.
const data = FileAttachment("data/indicators_long.csv").csv({typed: true});
const meta = FileAttachment("data/indicator_metadata.csv").csv({typed: true});
```

```js
// 2. Small helpers and lookups.

// The pipeline writes TRUE/FALSE in capitals. typed: true only converts
// lowercase true/false, so compare the text ourselves.
const isSuppressed = (d) => String(d.suppressed).toUpperCase() === "TRUE";

// Look up an indicator's metadata by its ID.
const metaById = new Map(meta.map((d) => [d.indicator_id, d]));

// Footnote wording lives here once and is reused wherever a note_code appears.
const noteText = {
  small_sample: "Small sample size: interpret with caution.",
  high_cv: "Some estimates are suppressed because they are statistically unreliable."
};
```

```js
// 3. Check that every indicator in the data has a metadata row.
const missingMeta = [...new Set(data.map((d) => d.indicator_id))].filter(
  (id) => !metaById.has(id)
);
if (missingMeta.length > 0) {
  display(html`<div class="warning"><strong>Missing metadata</strong> for: ${missingMeta.join(", ")}</div>`);
}
```

```js
// 4. One function that draws the chart for one indicator.
function indicatorChart(id, width) {
  const m = metaById.get(id);
  const fmt = d3.format(m.value_format); // for example ".1f" or "$,.0f"
  const rows = data.filter((d) => d.indicator_id === id);
  const shown = rows.filter((d) => !isSuppressed(d));
  const hidden = rows.filter(isSuppressed);

  // Sort order comes from the metadata. Suppressed rows always go last.
  const order =
    m.sort === "alpha"
      ? d3.sort(rows, (d) => d.group_label)
      : m.sort === "asc"
        ? d3.sort(rows, (d) => (isSuppressed(d) ? Infinity : d.estimate))
        : d3.sort(rows, (d) => (isSuppressed(d) ? Infinity : -d.estimate));

  const tooltip = (d) =>
    `${d.group_label}\n${fmt(d.estimate)} (margin of error ±${fmt(d.moe90)})\nSample size: ${d.n_unweighted.toLocaleString()}`;

  // Chart type also comes from the metadata: "dot" or (default) "bar".
  const mainMark =
    m.chart_type === "dot"
      ? Plot.dot(shown, {y: "group_label", x: "estimate", fill: "table", r: 6, title: tooltip})
      : Plot.barX(shown, {y: "group_label", x: "estimate", fill: "table", title: tooltip});

  return Plot.plot({
    width,
    marginLeft: 110,
    marginRight: 60,
    x: {
      grid: true,
      label: m.unit === "dollars" ? "Dollars" : "Percent",
      domain: [0, d3.max(shown, (d) => d.estimate + d.moe90) * 1.1]
    },
    y: {label: null, domain: order.map((d) => d.group_label)},
    color: {domain: ["Asian", "NHPI"], legend: true},
    marks: [
      mainMark,
      // Margin-of-error whiskers
      Plot.ruleY(shown, {
        y: "group_label",
        x1: (d) => d.estimate - d.moe90,
        x2: (d) => d.estimate + d.moe90,
        strokeWidth: 1.5
      }),
      // Value labels at the end of each whisker
      Plot.text(shown, {
        y: "group_label",
        x: (d) => d.estimate + d.moe90,
        text: (d) => fmt(d.estimate),
        dx: 6,
        textAnchor: "start"
      }),
      // Suppressed groups show a label instead of a value
      Plot.text(hidden, {
        y: "group_label",
        x: 0,
        text: () => "Suppressed",
        dx: 6,
        textAnchor: "start",
        fill: "currentColor",
        fillOpacity: 0.6
      }),
      Plot.ruleX([0])
    ]
  });
}
```

```js
// 5. Build one card per indicator, in the order set by display_order,
//    and lay the cards out in a two-column grid.
const cards = d3.sort(meta, (d) => d.display_order).map((m) => {
  const codes = [
    ...new Set(
      data
        .filter((d) => d.indicator_id === m.indicator_id)
        .map((d) => d.note_code)
        .filter(Boolean)
    )
  ];
  return html`<div class="card">
    <h2>${m.title}</h2>
    <h3>${m.subtitle}</h3>
    ${resize((width) => indicatorChart(m.indicator_id, width))}
    ${codes.map((c) => html`<p><small>${noteText[c] ?? c}</small></p>`)}
  </div>`;
});

display(html`<div class="grid grid-cols-2">${cards}</div>`);
```

## The data behind the charts

```js
Inputs.table(data, {
  columns: ["indicator_id", "group_label", "estimate", "moe90", "cv", "n_unweighted", "suppressed", "note_code"]
})
```
