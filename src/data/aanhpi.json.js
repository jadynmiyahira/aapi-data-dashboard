// =============================================================================
// WHAT THIS FILE DOES (plain-language summary)
// -----------------------------------------------------------------------------
// This is the "data loader" for the 2026 State of AANHPIs dashboard. It runs
// automatically every time the site is built, before any page is shown.
//
// In short, it:
//   1. Opens the main spreadsheet of numbers (aanhpi2026_long_all.csv).
//   2. Checks that the spreadsheet is complete and correctly formatted.
//   3. Converts text like "12.5" into real numbers the charts can use.
//   4. Groups the rows into figures/tables ("panels") and counts how many
//      values each one has, how many are suppressed, etc.
//   5. Writes a list of data-quality warnings for the team to review
//      (shown on the "Data check" page).
//   6. Saves everything as one file, aanhpi.json, that every page reads.
//
// To update the dashboard when new data arrives: replace the CSV and rebuild.
// If the spreadsheet has a serious problem (missing columns, text where a
// number should be, duplicate rows), the build STOPS on purpose so a broken
// file is never published. Smaller issues are recorded as warnings instead.
//
// Technical note: the build fails with a non-zero exit on structural errors.
// Warnings (placeholders, mixed bases, missing pulls) are printed to stderr and
// also stored in the output under `warnings`, so pages can show them.
// =============================================================================

// Tools for reading files and parsing spreadsheet (CSV) text.
import {existsSync, readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {csvParse} from "d3-dsv";

// ---- Step 0: Open the spreadsheet -------------------------------------------
// The name of the main data file. When a new release arrives with a different
// file name, change it here.
const SOURCE = "aanhpi2026_long_all.csv";
// Optional. If present, its figure_note, subgroup_footnote, chart_type and
// figure_id_status are attached to each panel. Missing file = warning, not error.
const METADATA = "aanhpi2026_figure_metadata.csv";
// Read the spreadsheet and turn it into a list of rows (one per number).
const text = readFileSync(fileURLToPath(new URL(`./${SOURCE}`, import.meta.url)), "utf-8");
const raw = csvParse(text.replace(/^﻿/, ""));

// ---- Rules the spreadsheet must follow --------------------------------------
// Every column the spreadsheet must contain. If any are missing, the build stops.
const REQUIRED = [
  "chapter_num", "chapter_name", "indicator_id", "figure_id", "figure_type", "figure_title",
  "entity_type", "entity_label", "source_entity_label", "crosswalk_status", "race_basis",
  "hispanic_basis", "is_benchmark", "benchmark_scope", "stratum_1_var", "stratum_1_val",
  "stratum_2_var", "stratum_2_val", "source_row_order", "row_id", "series_slug", "series_base",
  "series_label", "series_role", "value_type", "unit", "value", "n_unweighted", "flag",
  "flag_scope", "flag_basis", "flag_note", "source_workbook", "source_tab", "source_cell",
  "source_system", "data_vintage", "row_note"
];
// Kinds of values that must be numbers (as opposed to text, like a state name).
const NUMERIC_TYPES = new Set(["count", "percent", "number", "ratio", "years", "currency_usd"]);
// The only data-quality flags allowed. "caution" = small sample, use with care;
// "restrict" = suppressed, the number must not be shown.
const KNOWN_FLAGS = new Set(["", "ok", "caution", "restrict", "not_assessed", "not_applicable"]);
// Titles that are still placeholders (e.g. "Figure X") and need a real title.
const PLACEHOLDER_TITLE = /^(Figure X|Figure \[X\]|Figure TBD|Table)\b/;

// Two running lists: "errors" stop the build; "warnings" are for review only.
const errors = [];
const warnings = [];

// ---- Step 1: Check that every required column is present --------------------
const missingCols = REQUIRED.filter((c) => !raw.columns.includes(c));
if (missingCols.length) errors.push(`Missing columns: ${missingCols.join(", ")}`);

// ---- Step 2: Clean up every row ---------------------------------------------
// For each row: turn number-text into real numbers, make sure the flag is one
// we recognize, and make sure suppressed ("restrict") cells really are blank.
// "Line N" in error messages matches the line number in the spreadsheet.
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
    // True when the source pull did not include this value.
    missing_from_pull: d.row_note.startsWith("MISSING_FROM_PULL"),
    // The only rows a chart should plot: actual estimates (not sample sizes or
    // labels) that have a number and are not suppressed.
    chartable: d.series_role === "estimate" && typeof value === "number" && d.flag !== "restrict"
  };
});

// ---- Step 3: Check for duplicate rows ---------------------------------------
// Each number should appear exactly once (one value per panel x row x series
// x strata). If the same number appears twice, the build stops.
const seen = new Map();
for (const [i, d] of rows.entries()) {
  const k = [d.panel_key, d.row_id, d.series_slug, d.stratum_1_val, d.stratum_2_val].join("\u0001");
  if (seen.has(k)) errors.push(`Duplicate key at lines ${seen.get(k) + 2} and ${i + 2}: ${d.figure_id} ${d.row_id} ${d.series_slug}`);
  else seen.set(k, i);
}

// ---- Step 4: Build a summary of each figure/table ("panel") -----------------
// Walk through every row and tally, per panel: how many values it has, how
// many can be charted, how many are suppressed or missing, which data years
// and sources it uses, and whether its title is still a placeholder.
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

// ---- Step 5: Attach figure notes and footnotes (optional file) --------------
// If a separate metadata spreadsheet exists, add its notes and footnotes to
// each panel. Matched on figure_id + figure_title (the only shared key).
const metaPath = fileURLToPath(new URL(`./${METADATA}`, import.meta.url));
const metaByKey = new Map();
if (existsSync(metaPath)) {
  for (const m of csvParse(readFileSync(metaPath, "utf-8").replace(/^\uFEFF/, ""))) {
    const k = `${m.figure_id}|${m.figure_title}`;
    const prev = metaByKey.get(k);
    // Some titles cover two source blocks (2.3b, 4.2a, 4.2b): keep every distinct note.
    const merge = (a, b) => [...new Set([a, b].filter(Boolean))].join(" ");
    metaByKey.set(k, prev ? {
      figure_note: merge(prev.figure_note, m.figure_note),
      subgroup_footnote: merge(prev.subgroup_footnote, m.subgroup_footnote),
      chart_type: merge(prev.chart_type, m.chart_type),
      figure_id_status: merge(prev.figure_id_status, m.figure_id_status)
    } : {figure_note: m.figure_note, subgroup_footnote: m.subgroup_footnote, chart_type: m.chart_type, figure_id_status: m.figure_id_status});
  }
} else {
  warnings.push({panel_key: "", type: "metadata_file_missing", detail: `${METADATA} not found in src/data; figure notes not attached`});
}

// ---- Step 6: Finalize each panel and record data-quality warnings -----------
// Checks whether a panel mixes different ways of defining race (for example
// "race alone" vs. "alone or in combination"), then adds a warning for any
// placeholder title, mixed race definitions, missing values, or group-name
// mappings that still need sign-off. Panels are then sorted by chapter and
// figure number.
const figures = [...panels.values()].map((p) => {
  const bases = [...p.race_bases].sort();
  // README: source_defined rows must not share a chart with ACS rows.
  const basis_status = bases.length <= 1 ? "single"
    : bases.includes("source_defined") ? "incompatible"
    : "mixed_label_required";
  const md = metaByKey.get(p.panel_key);
  const out = {
    ...p, data_vintage: [...p.data_vintage], source_system: [...p.source_system], race_bases: bases, basis_status,
    figure_note: md?.figure_note ?? "", subgroup_footnote: md?.subgroup_footnote ?? "",
    chart_type: md?.chart_type ?? "", figure_id_status: md?.figure_id_status ?? ""
  };
  if (metaByKey.size && !md) warnings.push({panel_key: p.panel_key, type: "no_metadata_row", detail: "No matching row in figure metadata"});
  if (out.placeholder_title) warnings.push({panel_key: out.panel_key, type: "placeholder_title", detail: out.figure_title});
  if (basis_status !== "single") warnings.push({panel_key: out.panel_key, type: `basis_${basis_status}`, detail: bases.join(" + ")});
  if (out.n_missing_from_pull) warnings.push({panel_key: out.panel_key, type: "missing_from_pull", detail: `${out.n_missing_from_pull} cells`});
  if (out.n_needs_signoff) warnings.push({panel_key: out.panel_key, type: "crosswalk_needs_signoff", detail: `${out.n_needs_signoff} cells`});
  return out;
}).sort((a, b) => a.chapter_num - b.chapter_num || a.figure_id.localeCompare(b.figure_id, "en", {numeric: true}) || a.first_order - b.first_order);

// ---- Step 7: Stop if there were serious errors -------------------------------
// Prints up to 50 errors so whoever is updating the data can fix them.
if (errors.length) {
  process.stderr.write(`\n${SOURCE}: ${errors.length} error(s), build stopped.\n${errors.slice(0, 50).join("\n")}\n`);
  process.exit(1);
}

// Print a one-line summary during the build (row count, panel count, warnings).
const counts = warnings.reduce((m, w) => ((m[w.type] = (m[w.type] ?? 0) + 1), m), {});
process.stderr.write(`${SOURCE}: ${rows.length} values, ${figures.length} panels. Warnings: ${JSON.stringify(counts)}\n`);

// ---- Step 8: Save the result -------------------------------------------------
// To keep the file small (so pages load faster), details shared by a whole
// panel, like its title, are stored once per panel rather than on every row.
// Panel-level fields live once in `figures`; dropping them from each row roughly
// halves the file. Look them up with figureMeta() in components/aanhpi.js.
const PANEL_FIELDS = ["chapter_name", "figure_type", "figure_title", "indicator_id",
  "source_system", "data_vintage", "source_workbook"];
const slimRows = rows.map((d) => {
  const r = {...d};
  for (const k of PANEL_FIELDS) delete r[k];
  return r;
});

// Write the final aanhpi.json: the source file name, when it was built, the
// panel summaries, the warnings list, and all the individual values.
process.stdout.write(JSON.stringify({
  source_file: SOURCE,
  built_at: new Date().toISOString(),
  figures,
  warnings,
  rows: slimRows
}));
