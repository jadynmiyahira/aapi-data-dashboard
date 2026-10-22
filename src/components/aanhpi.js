// Helpers for working with the long file in Observable Framework pages.
//
//   const data = await FileAttachment("../data/aanhpi.json").json();
//   const rows = panel(data, "1.3a");
//   const wide = toWide(rows);              // same shape as the wide CSVs
//   const plot = chartRows(rows, "1_3_share_of_asian_total_pct");

// ---- Finding a figure -------------------------------------------------------

/** All panels (tables) that share a figure_id. Most figures have one. */
export function panels(data, figureId) {
  return data.figures.filter((f) => f.figure_id === figureId);
}

/** Metadata for one panel. */
export function figureMeta(data, figureId, {title} = {}) {
  const ps = panels(data, figureId);
  if (!ps.length) throw new Error(`No figure ${figureId} in ${data.source_file}`);
  if (ps.length === 1 && !title) return ps[0];
  const hit = ps.find((p) => p.figure_title === title || (title && p.figure_title.includes(title)));
  if (!hit) {
    throw new Error(`Figure ${figureId} has ${ps.length} panels; pass {title}. Options:\n` +
      ps.map((p) => `  - ${p.figure_title}`).join("\n"));
  }
  return hit;
}

/**
 * All long rows for one panel, in source order. Throws if the figure has several
 * panels and you did not say which (5.6a, 2.1b, 2.5a, 2.5b, 5.3d, 5.6d).
 * `title` can be the full title or a distinctive fragment such as "(ii)".
 */
export function panel(data, figureId, {title} = {}) {
  const meta = figureMeta(data, figureId, {title});
  return data.rows
    .filter((d) => d.panel_key === meta.panel_key)
    .sort((a, b) => a.source_row_order - b.source_row_order);
}

// ---- Getting values to plot -------------------------------------------------

/**
 * Rows safe to chart for one or more series: estimates with a numeric value and
 * a flag other than restrict. Each row gets a `note` for tooltips/footnotes.
 */
export function chartRows(rows, series, {strata} = {}) {
  const want = new Set([series].flat());
  return rows
    .filter((d) => want.has(d.series_slug) && d.chartable)
    .filter((d) => !strata || Object.entries(strata).every(([k, v]) => d[k] === v))
    .map((d) => ({...d, note: flagNote(d), basis: basisLabel(d)}));
}

/**
 * Pivot long rows to one object per row_id with one key per series, plus
 * `<slug>__n` and `<slug>__flag` — the same layout as the wide CSVs, so code
 * written against the prototype's wide data can be pointed at this instead.
 * Restricted cells come out as null, as in the wide files.
 * If the panel has strata (universe, sex, nativity ...), pivot each stratum
 * separately or pass {by: ["stratum_1_val"]} to keep them apart.
 */
export function toWide(rows, {by = []} = {}) {
  const keyCols = ["row_id", ...by];
  const out = new Map();
  for (const d of rows) {
    const k = keyCols.map((c) => d[c]).join("\u0001");
    let r = out.get(k);
    if (!r) {
      r = {
        row_id: d.row_id, entity_type: d.entity_type, entity_label: d.entity_label,
        race_basis: d.race_basis, hispanic_basis: d.hispanic_basis,
        is_benchmark: d.is_benchmark, benchmark_scope: d.benchmark_scope,
        sort_order: d.source_row_order, row_note: d.row_note
      };
      for (const c of by) r[c] = d[c];
      out.set(k, r);
    }
    if (d.series_slug in r) {
      throw new Error(`toWide: ${d.series_slug} repeats for ${d.row_id}. ` +
        `The panel has strata; pass {by: ["stratum_1_val", ...]}.`);
    }
    r[d.series_slug] = d.value;
    r[`${d.series_slug}__n`] = d.n_unweighted;
    r[`${d.series_slug}__flag`] = d.flag;
  }
  return [...out.values()];
}

/**
 * Figures 1.4 and 1.5 store "top 5 states" as paired series: state name in
 * `<base>_state_<k>` (text, companion) and the number in `<base>_state_<k>_<suffix>`.
 * Returns one row per group x rank: {row_id, entity_label, rank, state, value, flag, n_unweighted}.
 */
export function rankedStates(rows, {suffix}) {
  const names = new Map();
  for (const d of rows) {
    const m = d.series_slug.match(/_state_(\d+)$/);
    if (m) names.set(`${d.row_id}|${m[1]}`, d.value);
  }
  const re = new RegExp(`_state_(\\d+)_${suffix}$`);
  return rows.flatMap((d) => {
    const m = d.series_slug.match(re);
    if (!m) return [];
    return [{
      row_id: d.row_id, entity_label: d.entity_label, race_basis: d.race_basis,
      rank: Number(m[1]), state: names.get(`${d.row_id}|${m[1]}`) ?? null,
      value: d.chartable ? d.value : null, flag: d.flag, n_unweighted: d.n_unweighted,
      note: flagNote(d)
    }];
  });
}

// ---- Labels and cautions (wording follows the README) ----------------------

export function flagNote(d) {
  switch (d.flag) {
    case "caution": return `Small sample (unweighted N ${d.n_unweighted ?? "25–99"}); interpret with caution.`;
    case "restrict": return "Suppressed: unweighted N under 25.";
    case "not_assessed": return "Sample size not assessed (no unweighted N in the source).";
    default: return "";
  }
}

const RACE = {alone: "race alone", alone_or_in_combination: "alone or in combination", source_defined: "as defined by source"};
const HISP = {non_hispanic: "non-Hispanic", any_hispanic_origin: "any Hispanic origin", hispanic_any_race: "Hispanic, any race"};

export function basisLabel(d) {
  return [RACE[d.race_basis], HISP[d.hispanic_basis]].filter(Boolean).join(", ");
}

/**
 * Check a set of rows before charting them together.
 *  single               one basis, chart normally
 *  mixed_label_required alone + alone-or-in-combination: label each mark with basisLabel()
 *  incompatible         includes source_defined: README says do not chart with ACS rows
 */
export function basisCheck(rows) {
  const bases = [...new Set(rows.map((d) => d.race_basis).filter((b) => b !== "not_applicable"))].sort();
  const status = bases.length <= 1 ? "single" : bases.includes("source_defined") ? "incompatible" : "mixed_label_required";
  return {status, bases};
}

/** Footnote lines for a chart: caution counts, suppressed counts, basis, vintage, source. */
export function footnotes(meta, rows) {
  const lines = [];
  const caution = rows.filter((d) => d.flag === "caution").length;
  const restricted = rows.filter((d) => d.flag === "restrict").length;
  const notAssessed = rows.filter((d) => d.flag === "not_assessed").length;
  const missing = rows.filter((d) => d.missing_from_pull).length;
  if (caution) lines.push(`${caution} value(s) rest on 25–99 unweighted cases; interpret with caution.`);
  if (restricted) lines.push(`${restricted} value(s) suppressed (unweighted N under 25).`);
  if (notAssessed) lines.push("Sample size not assessed for some values (no unweighted N in the source).");
  if (missing) lines.push("Some alone-or-in-combination rows are not yet in the data pull.");
  const {status} = basisCheck(rows);
  if (status !== "single") lines.push("Rows use different race definitions; see labels.");
  // Cautions written in the source workbook. They do not set the flag, but they
  // are the analyst's warning about a specific estimate, so show them.
  const legacy = new Map();
  for (const d of rows) if (d.legacy_flag) legacy.set(`${d.entity_label}: ${d.legacy_flag}`, true);
  for (const l of legacy.keys()) lines.push(`Source note — ${l}`);
  lines.push(`Source: ${meta.source_system.join("; ")}. ${meta.data_vintage.join("; ")}.`);
  return lines;
}

/** Estimate series in a panel, in source column order, with their labels and units. */
export function seriesList(rows, {role = "estimate"} = {}) {
  const out = new Map();
  for (const d of rows) {
    if (role && d.series_role !== role) continue;
    if (!out.has(d.series_slug)) out.set(d.series_slug, {slug: d.series_slug, label: d.series_label, unit: d.unit, value_type: d.value_type});
  }
  return [...out.values()];
}

/** Format a number for display according to its unit. */
export function formatValue(v, unit) {
  if (v == null || v === "") return "";
  if (typeof v !== "number") return String(v);
  if (unit === "percent") return `${v.toLocaleString("en-US", {maximumFractionDigits: 1, minimumFractionDigits: 1})}%`;
  if (unit === "usd") return v.toLocaleString("en-US", {style: "currency", currency: "USD", maximumFractionDigits: 0});
  if (unit === "count") return Math.round(v).toLocaleString("en-US");
  return v.toLocaleString("en-US", {maximumFractionDigits: 2});
}
