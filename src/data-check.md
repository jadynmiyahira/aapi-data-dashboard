---
title: Data check
---

<!--
  WHAT THIS PAGE DOES (plain-language summary)
  ---------------------------------------------------------------------------
  An internal review page for the team, not for publication. After new data
  is loaded, use it to spot problems before a release:
    1. A summary line: which file the data came from, when it was built, and
       how many values and figures it contains.
    2. A table of data-quality warnings (placeholder titles, mixed race
       definitions, missing values, etc.), with a drop-down to filter by type.
    3. A table of every figure/table ("panel") with counts of total,
       chartable, suppressed and missing values.
  The warnings are produced by src/data/aanhpi.json.js.
-->

```js
// Load the cleaned AANHPI data built by src/data/aanhpi.json.js.
const data = await FileAttachment("data/aanhpi.json").json();
```

<!-- Summary line: source file, build time, number of values and panels. -->

Built from `${data.source_file}` at ${new Date(data.built_at).toLocaleString()}: ${data.rows.length.toLocaleString()} values in ${data.figures.length} panels. Not for publication; this page is for the team to review before a release.

```js
// Drop-down menu to filter the warnings table by warning type ("all" shows every warning).
const type = view(Inputs.select(["all", ...new Set(data.warnings.map((w) => w.type))], {label: "Warning type"}));
```

```js
// Warnings table: which panel, what kind of warning, and details. Shows 25 rows at a time.
Inputs.table(data.warnings.filter((w) => type === "all" || w.type === type), {
  columns: ["panel_key", "type", "detail"], width: {panel_key: 420}, rows: 25
})
```

## Panels

```js
// One row per figure/table. Columns:
//   basis_status        - "single" is fine; "mixed..." or "incompatible" means the
//                         panel mixes different race definitions
//   n_values            - total number of values in the panel
//   n_chartable         - values that can be shown in a chart
//   n_restricted        - values suppressed (not shown) for data-quality reasons
//   n_missing_from_pull - values the source data did not include
//   data_vintage        - the year(s) of data used
Inputs.table(data.figures, {
  columns: ["figure_id", "figure_title", "basis_status", "n_values", "n_chartable", "n_restricted", "n_missing_from_pull", "data_vintage"],
  width: {figure_title: 380}, rows: 25
})
```
