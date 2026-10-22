// Observable Framework data loader.
// Reads the long file (src/data/aanhpi2026_long_all.csv), validates it, types the
// values, and writes one JSON file the pages load with FileAttachment("data/aanhpi.json").
//
// To update the dashboard when new data arrives: replace the CSV and rebuild.
// The build FAILS (non-zero exit) on structural errors so a broken file never ships.
// Data-quality warnings (placeholders, mixed bases, missing pulls) are printed to
// stderr and also stored in the output under `warnings`, so pages can show them.

import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {csvParse} from "d3-dsv";

const SOURCE = "aanhpi2026_long_all.csv";
const text = readFileSync(fileURLToPath(new URL(`./${SOURCE}`, import.meta.url)), "utf-8");
const raw = csvParse(text.replace(/^﻿/, ""));

const REQUIRED = [
  "chapter_num", "chapter_name", "indicator_id", "figure_id", "figure_type", "figure_title",
  "entity_type", "entity_label", "source_entity_label", "crosswalk_status", "race_basis",
  "hispanic_basis", "is_benchmark", "benchmark_scope", "stratum_1_var", "stratum_1_val",
  "stratum_2_var", "stratum_2_val", "source_row_order", "row_id", "series_slug", "series_base",
  "series_label", "series_role", "value_type", "unit", "value", "n_unweighted", "flag",
  "flag_scope", "flag_basis", "flag_note", "source_workbook", "source_tab", "source_cell",
  "source_system", "data_vintage", "row_note"
];
const NUMERIC_TYPES = new Set(["count", "percent", "number", "ratio", "years", "currency_usd"]);
const KNOWN_FLAGS = new Set(["", "ok", "caution", "restrict", "not_assessed", "not_applicable"]);
const PLACEHOLDER_TITLE = /^(Figure X|Figure \[X\]|Figure TBD|Table)\b/;

const errors = [];
const warnings = [];

// 1. Columns
const missingCols = REQUIRED.filter((c) => !raw.columns.includes(c));
if (missingCols.length) errors.push(`Missing columns: ${missingCols.join(", ")}`);

// 2. Type every row
const rows = raw.map((d, i) => {
  const numeric = NUMERIC_TYPES.has(d.value_type);
  let value = d.value === "" ? null : d.value;
  if (value !== null && numeric) {
    const v = Number(value);
    if (!Number.isFinite(v)) errors.push(`Line ${i + 2}: value "${d.value}" is not numeric (value_type ${d.value_type})`);
    value = v;
  }
  if (!KNOWN_FLAGS.has(d.flag)) errors.push(`Line ${i + 2}: unknown flag "${d.flag}"`);
  if (d.flag === "restrict" && d.value !== "") errors.push(`Line ${i + 2}: restricted cell has a value (${d.figure_id} ${d.series_slug})`);
  const n = d.n_unweighted === "" ? null : Number(d.n_unweighted);
  return {
    ...d,
    chapter_num: Number(d.chapter_num),
    source_row_order: Number(d.source_row_order),
    is_benchmark: d.is_benchmark === "TRUE",
    value,
    n_unweighted: n,
    // A panel is one table inside a figure. Some figure_ids hold several
    // (5.6a(i)-(iii), 2.1b, 2.5a, 2.5b, 5.3d, 5.6d), so the title is part of the key.
    panel_key: `${d.figure_id}|${d.figure_title}`,
    missing_from_pull: d.row_note.startsWith("MISSING_FROM_PULL"),
    // The only rows a chart should plot.
    chartable: d.series_role === "estimate" && typeof value === "number" && d.flag !== "restrict"
  };
});

// 3. Key uniqueness: one value per panel x row x series x strata
const seen = new Map();
for (const [i, d] of rows.entries()) {
  const k = [d.panel_key, d.row_id, d.series_slug, d.stratum_1_val, d.stratum_2_val].join("\u0001");
  if (seen.has(k)) errors.push(`Duplicate key at lines ${seen.get(k) + 2} and ${i + 2}: ${d.figure_id} ${d.row_id} ${d.series_slug}`);
  else seen.set(k, i);
}

// 4. Panel index + data-quality warnings
const panels = new Map();
for (const d of rows) {
  let p = panels.get(d.panel_key);
  if (!p) {
    p = {
      panel_key: d.panel_key, figure_id: d.figure_id, figure_title: d.figure_title,
      figure_type: d.figure_type, chapter_num: d.chapter_num, chapter_name: d.chapter_name,
      indicator_id: d.indicator_id, data_vintage: new Set(), source_system: new Set(),
      race_bases: new Set(), n_values: 0, n_chartable: 0, n_restricted: 0,
      n_missing_from_pull: 0, n_needs_signoff: 0, first_order: d.source_row_order,
      placeholder_title: PLACEHOLDER_TITLE.test(d.figure_title)
    };
    panels.set(d.panel_key, p);
  }
  p.data_vintage.add(d.data_vintage);
  p.source_system.add(d.source_system);
  if (d.race_basis !== "not_applicable") p.race_bases.add(d.race_basis);
  p.n_values++;
  if (d.chartable) p.n_chartable++;
  if (d.flag === "restrict") p.n_restricted++;
  if (d.missing_from_pull) p.n_missing_from_pull++;
  if (d.crosswalk_status === "mapped_needs_signoff") p.n_needs_signoff++;
  p.first_order = Math.min(p.first_order, d.source_row_order);
}

const figures = [...panels.values()].map((p) => {
  const bases = [...p.race_bases].sort();
  // README: source_defined rows must not share a chart with ACS rows.
  const basis_status = bases.length <= 1 ? "single"
    : bases.includes("source_defined") ? "incompatible"
    : "mixed_label_required";
  const out = {...p, data_vintage: [...p.data_vintage], source_system: [...p.source_system], race_bases: bases, basis_status};
  if (out.placeholder_title) warnings.push({panel_key: out.panel_key, type: "placeholder_title", detail: out.figure_title});
  if (basis_status !== "single") warnings.push({panel_key: out.panel_key, type: `basis_${basis_status}`, detail: bases.join(" + ")});
  if (out.n_missing_from_pull) warnings.push({panel_key: out.panel_key, type: "missing_from_pull", detail: `${out.n_missing_from_pull} cells`});
  if (out.n_needs_signoff) warnings.push({panel_key: out.panel_key, type: "crosswalk_needs_signoff", detail: `${out.n_needs_signoff} cells`});
  return out;
}).sort((a, b) => a.chapter_num - b.chapter_num || a.figure_id.localeCompare(b.figure_id, "en", {numeric: true}) || a.first_order - b.first_order);

if (errors.length) {
  process.stderr.write(`\n${SOURCE}: ${errors.length} error(s), build stopped.\n${errors.slice(0, 50).join("\n")}\n`);
  process.exit(1);
}

const counts = warnings.reduce((m, w) => ((m[w.type] = (m[w.type] ?? 0) + 1), m), {});
process.stderr.write(`${SOURCE}: ${rows.length} values, ${figures.length} panels. Warnings: ${JSON.stringify(counts)}\n`);

// Panel-level fields live once in `figures`; dropping them from each row roughly
// halves the file. Look them up with figureMeta() in components/aanhpi.js.
const PANEL_FIELDS = ["chapter_name", "figure_type", "figure_title", "indicator_id",
  "source_system", "data_vintage", "source_workbook"];
const slimRows = rows.map((d) => {
  const r = {...d};
  for (const k of PANEL_FIELDS) delete r[k];
  return r;
});

process.stdout.write(JSON.stringify({
  source_file: SOURCE,
  built_at: new Date().toISOString(),
  figures,
  warnings,
  rows: slimRows
}));
