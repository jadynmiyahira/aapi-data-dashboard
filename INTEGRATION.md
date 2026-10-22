# Powering the dashboard from the long file

## Where the files go

```
src/data/aanhpi2026_long_all.csv   <- the long file (rename: drop any upload prefix)
src/data/aanhpi.json.js            <- data loader: validates, types, indexes
src/components/aanhpi.js           <- helpers used by pages
src/data-check.md                  <- internal QA page (warnings, panel inventory)
src/example-1-3a.md                <- one worked chart; delete once your pages are ported
```

The loader needs `d3-dsv` (`npm install d3-dsv` if your package.json lacks it).

## Updating with new data

Replace `src/data/aanhpi2026_long_all.csv` with the new file (same name) and run
`npm run build`. The build stops with a message if the file has missing columns,
non-numeric values in numeric series, unknown flags, a restricted cell holding a
value, or duplicate keys. Softer problems are listed on the Data check page.

If the file name changes each release, change `SOURCE` at the top of the loader.

## Porting a prototype page

In each page:

```js
import {panel, figureMeta, toWide, chartRows, rankedStates, basisCheck, footnotes} from "./components/aanhpi.js";
const data = await FileAttachment("data/aanhpi.json").json();
```

- Page was built on the wide CSVs: `toWide(panel(data, "1.1"))` returns the same
  columns (`1_1_y2024`, `1_1_y2024__n`, `1_1_y2024__flag`, ...) so most chart code
  can stay as it is.
- Page was built on fake data in some other shape: use `chartRows(panel(data, id), slug)`,
  which returns one row per plotted value with `value`, `entity_label`, `flag`,
  `note` (tooltip text) and `basis` (label).

Rules the helpers enforce or support:

1. Select by figure, not by series prefix. Series slugs are prefixed by indicator
   (`1_4_...`), shared by 1.4a, 1.4b and 1.4c.
2. Seven figure_ids hold more than one table (2.1b, 2.5a, 2.5b, 5.3d, 5.6a, 5.6d,
   and 5.6a has three). `panel()` throws on these until you pass `{title: "(ii)"}`
   or another fragment of the title.
3. Only `chartable` rows are plotted: estimates, numeric, not restricted.
   Companion series (state names in 1.4 and 1.5, text cells) are excluded;
   use `rankedStates(rows, {suffix: "pct_of_group"})` for 1.4 and
   `{suffix: "growth_pct"}` for 1.5.
4. Run `basisCheck(rows)` before charting. `mixed_label_required` means label
   each mark with `basis`; `incompatible` (currently 5.7a) means split the chart.
5. Put `footnotes(meta, rows)` under every chart.
6. Panels often include total or benchmark rows (for example "Asian American
   Average" = 100 in 1.3a). Filter on `is_benchmark` and `entity_type` per chart.
