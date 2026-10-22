---
title: Data check
---

```js
const data = await FileAttachment("data/aanhpi.json").json();
```

Built from `${data.source_file}` at ${new Date(data.built_at).toLocaleString()}: ${data.rows.length.toLocaleString()} values in ${data.figures.length} panels. Not for publication; this page is for the team to review before a release.

```js
const type = view(Inputs.select(["all", ...new Set(data.warnings.map((w) => w.type))], {label: "Warning type"}));
```

```js
Inputs.table(data.warnings.filter((w) => type === "all" || w.type === type), {
  columns: ["panel_key", "type", "detail"], width: {panel_key: 420}, rows: 25
})
```

## Panels

```js
Inputs.table(data.figures, {
  columns: ["figure_id", "figure_title", "basis_status", "n_values", "n_chartable", "n_restricted", "n_missing_from_pull", "data_vintage"],
  width: {figure_title: 380}, rows: 25
})
```
