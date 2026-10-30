// Reusable chart and table builders for chapter pages.
// Every function takes the rows of one panel (from panel() in aanhpi.js) so the
// same code works for any chapter.

import * as Plot from "npm:@observablehq/plot";
import * as Inputs from "npm:@observablehq/inputs";
import {html} from "npm:htl";
import {chartRows, toWide, rankedStates, seriesList, formatValue, basisCheck, basisLabel, footnotes} from "./aanhpi.js";

const PLACEHOLDER = /^(Figure X|Figure \[X\]|Figure TBD|Table)\b/;

/** Groups to leave out of charts by default: averages and totals. */
export const notBenchmark = (d) => !d.is_benchmark && d.entity_type !== "total";

/**
 * A titled card: title, cautions from the figure metadata, the body, footnotes.
 * `title` overrides a placeholder title in the data.
 */
export function figureCard(meta, rows, {title, body = []} = {}) {
  const shown = PLACEHOLDER.test(meta.figure_title) || !meta.figure_title ? (title ?? meta.figure_title) : meta.figure_title;
  const provisional = shown !== meta.figure_title;
  const notes = footnotes(meta, rows);
  return html`<section class="card aanhpi-figure" id=${`fig-${meta.figure_id}`}>
    <h2>${shown}</h2>
    ${provisional ? html`<p class="aanhpi-warn">Provisional title. The data file title is “${meta.figure_title || "(blank)"}”.</p>` : ""}
    ${meta.figure_note ? html`<p class="aanhpi-warn">Data note: ${meta.figure_note}</p>` : ""}
    ${body}
    <div class="aanhpi-notes">
      ${meta.subgroup_footnote ? html`<div>${meta.subgroup_footnote}</div>` : ""}
      ${notes.map((l) => html`<div>${l}</div>`)}
    </div>
  </section>`;
}

/**
 * Horizontal bar chart of one series.
 *  sortBy: another series slug to order bars by (descending); default is the value itself.
 *  include: row filter; default drops benchmarks and totals.
 *  mark: "bar" (default) or "dot" for a dot plot (one dot per group at its value).
 */
export function barChart(rows, {series, sortBy, include = notBenchmark, width = 640, label, mark = "bar"} = {}) {
  const meta = seriesList(rows).find((s) => s.slug === series);
  if (!meta) throw new Error(`barChart: series ${series} is not in this panel`);
  const bars = chartRows(rows, series).filter(include);
  let order;
  if (sortBy) {
    const key = new Map(chartRows(rows, sortBy).map((d) => [d.row_id, d.value]));
    order = [...new Set(rows.filter(include).map((d) => d.row_id))]
      .sort((a, b) => (key.get(b) ?? -Infinity) - (key.get(a) ?? -Infinity));
  } else {
    order = bars.slice().sort((a, b) => b.value - a.value).map((d) => d.row_id);
  }
  const labelOf = new Map(rows.map((d) => [d.row_id, d.entity_label]));
  const mixed = basisCheck(bars).status !== "single";
  const yLabel = (id) => {
    const d = bars.find((b) => b.row_id === id) ?? rows.find((r) => r.row_id === id);
    return mixed && d ? `${labelOf.get(id)} (${basisLabel(d)})` : labelOf.get(id);
  };
  const shown = new Set(bars.map((d) => d.row_id));
  const noValue = order.filter((id) => !shown.has(id)).map((id) => labelOf.get(id));
  const longest = Math.max(...order.map((id) => yLabel(id).length));
  const fmt = (v) => formatValue(v, meta.unit);
  const valueLabel = (d) => `${fmt(d.value)}${d.flag === "caution" ? "*" : ""}`;
  // Widen the x axis past the longest bars so each value label fits beside its bar
  // (right of positive bars, left of negative ones) instead of being clipped.
  const marginLeft = Math.min(320, 12 + longest * 6.2), marginRight = 20;
  const inner = Math.max(100, width - marginLeft - marginRight);
  // Gap between the end of a bar (or the edge of a dot) and its label.
  const dotR = 5, gap = mark === "dot" ? dotR + 4 : 5;
  const labelPx = (D) => (D.length ? 5 + gap + 6.5 * Math.max(...D.map((d) => valueLabel(d).length)) : 0);
  const lo = Math.min(0, ...bars.map((d) => d.value)), hi = Math.max(0, ...bars.map((d) => d.value));
  const padL = lo < 0 ? labelPx(bars.filter((d) => d.value < 0)) / inner : 0;
  const padR = hi > 0 ? labelPx(bars.filter((d) => d.value >= 0)) / inner : 0;
  const span = (hi - lo) / Math.max(0.4, 1 - padL - padR);
  const chart = Plot.plot({
    width,
    height: 30 + 22 * order.length,
    marginLeft,
    marginRight,
    x: {label: label ?? meta.label, grid: true, domain: [lo - padL * span, hi + padR * span], tickFormat: meta.unit === "percent" ? (v) => `${v}%` : "~s"},
    y: {label: null, domain: order, tickFormat: yLabel},
    marks: [
      // Dot plots get a thin line from 0 to each dot (a "lollipop"), drawn under the dot.
      mark === "dot" ? Plot.ruleY(bars, {
        y: "row_id", x1: 0, x2: "value", strokeWidth: 2,
        stroke: (d) => (d.value < 0 ? "var(--aanhpi-bar-negative, var(--theme-red, #c0392b))" : "var(--aanhpi-bar, var(--theme-foreground-focus, #3b5fc0))"),
        strokeOpacity: (d) => (d.flag === "caution" ? 0.45 : 1)
      }) : null,
      (mark === "dot" ? Plot.dot : Plot.barX)(bars, {
        x: "value", y: "row_id",
        ...(mark === "dot" ? {r: dotR} : {}),
        // A page can set --aanhpi-bar / --aanhpi-bar-negative in its styles to recolor the bars.
        fill: (d) => (d.value < 0 ? "var(--aanhpi-bar-negative, var(--theme-red, #c0392b))" : "var(--aanhpi-bar, var(--theme-foreground-focus, #3b5fc0))"),
        fillOpacity: (d) => (d.flag === "caution" ? 0.45 : 1)
      }),
      // Value labels: dx and textAnchor must be constants, so positive and negative
      // bars get separate marks (label right of the bar end vs. left of it).
      Plot.text(bars.filter((d) => d.value >= 0), {
        x: "value", y: "row_id", dx: gap, textAnchor: "start", text: valueLabel
      }),
      Plot.text(bars.filter((d) => d.value < 0), {
        x: "value", y: "row_id", dx: -gap, textAnchor: "end", text: valueLabel
      }),
      Plot.tip(bars, Plot.pointerY({
        x: "value", y: "row_id",
        title: (d) => [`${d.entity_label}: ${fmt(d.value)}`, d.basis, d.note].filter(Boolean).join("\n")
      })),
      Plot.ruleX([0])
    ]
  });
  return html`<div>${chart}${noValue.length ? html`<div class="aanhpi-notes">No value: ${noValue.join(", ")}.</div>` : ""}</div>`;
}

/**
 * Sortable table of a panel: one row per group, one column per estimate series.
 * Shows a race-definition column when the panel mixes definitions, and a notes column.
 */
export function dataTable(rows, {series, include = () => true, rowsShown = 30} = {}) {
  const list = seriesList(rows).filter((s) => !series || series.includes(s.slug));
  const wide = toWide(rows.filter(include));
  const mixed = basisCheck(rows).status !== "single";
  const byRow = new Map();
  for (const d of rows) (byRow.get(d.row_id) ?? byRow.set(d.row_id, []).get(d.row_id)).push(d);
  const data = wide.map((r) => {
    const own = byRow.get(r.row_id) ?? [];
    const notes = [];
    if (own.some((d) => d.missing_from_pull)) notes.push("Not yet in data pull");
    if (own.some((d) => d.flag === "caution")) notes.push("* small sample");
    if (own.some((d) => d.flag === "restrict")) notes.push("Some values suppressed");
    for (const l of new Set(own.map((d) => d.legacy_flag).filter(Boolean))) notes.push(l);
    return {...r, basis: basisLabel(own[0] ?? {}), notes: notes.join("; ")};
  });
  const columns = ["entity_label", ...(mixed ? ["basis"] : []), ...list.map((s) => s.slug), "notes"];
  const header = {entity_label: "Group", basis: "Race definition", notes: "Notes"};
  const format = {};
  const align = {};
  for (const s of list) {
    header[s.slug] = s.label;
    format[s.slug] = (v) => formatValue(v, s.unit);
    align[s.slug] = "right";
  }
  return Inputs.table(data, {columns, header, format, align, rows: rowsShown, select: false, layout: "auto"});
}

/**
 * "Top 5 states" table for figures 1.4 and 1.5.
 *  suffix: the measure part of the paired series ("pct_of_group" or "growth_pct").
 *  totalPattern: regex for the group-size series, if the panel has one.
 */
export function rankTable(rows, {suffix, totalPattern, include = () => true} = {}) {
  const ranked = rankedStates(rows, {suffix});
  const ranks = [...new Set(ranked.map((d) => d.rank))].sort((a, b) => a - b);
  const total = totalPattern ? seriesList(rows).find((s) => totalPattern.test(s.slug)) : null;
  const unit = seriesList(rows).find((s) => s.slug.endsWith(`_${suffix}`))?.unit ?? "percent";
  const groups = [...new Map(rows.filter(include).map((d) => [d.row_id, d])).values()];
  const mixed = basisCheck(rows).status !== "single";
  const cell = (g, k) => {
    const d = ranked.find((r) => r.row_id === g.row_id && r.rank === k);
    if (!d || (d.state == null && d.value == null)) return html`<td class="aanhpi-muted">${g.missing_from_pull ? "Not yet in data pull" : "—"}</td>`;
    return html`<td><strong>${d.state ?? "—"}</strong><br><span>${formatValue(d.value, unit)}${d.flag === "caution" ? "*" : ""}</span></td>`;
  };
  const totalOf = (g) => {
    if (!total) return "";
    const d = rows.find((r) => r.row_id === g.row_id && r.series_slug === total.slug);
    return d?.chartable ? formatValue(d.value, total.unit) : "";
  };
  return html`<div class="aanhpi-scroll"><table class="aanhpi-rank">
    <thead><tr><th>Group</th>${mixed ? html`<th>Race definition</th>` : ""}${ranks.map((k) => html`<th>#${k}</th>`)}${total ? html`<th>${total.label.replace(/^state_\d+\s*/, "")}</th>` : ""}</tr></thead>
    <tbody>${groups.map((g) => html`<tr>
      <th scope="row">${g.entity_label}</th>
      ${mixed ? html`<td>${basisLabel(g)}</td>` : ""}
      ${ranks.map((k) => cell(g, k))}
      ${total ? html`<td class="aanhpi-num">${totalOf(g)}</td>` : ""}
    </tr>`)}</tbody>
  </table></div>`;
}

/** Styles used by the builders above. Include once per page with ${chartStyles}. */
export const chartStyles = html`<style>
  .aanhpi-figure { margin: 1.5rem 0; }
  .aanhpi-figure h2 { font-size: 1.15rem; margin-top: 0; max-width: none; }
  .aanhpi-warn { font-size: 0.85rem; color: var(--theme-foreground-muted); border-left: 3px solid #d4a017; padding-left: 0.5rem; max-width: none; }
  .aanhpi-notes { font-size: 0.8rem; color: var(--theme-foreground-muted); margin-top: 0.75rem; }
  .aanhpi-muted { color: var(--theme-foreground-muted); font-style: italic; }
  .aanhpi-scroll { overflow-x: auto; }
  .aanhpi-rank { border-collapse: collapse; font-size: 0.85rem; width: 100%; }
  .aanhpi-rank th, .aanhpi-rank td { padding: 0.35rem 0.5rem; border-bottom: 1px solid var(--theme-foreground-faintest); text-align: left; vertical-align: top; }
  .aanhpi-rank thead th { font-weight: 600; }
  .aanhpi-num { text-align: right; font-variant-numeric: tabular-nums; }
</style>`;

/** Build one figure; if it fails (for example a renamed series), show why instead of breaking the page. */
export function tryFigure(id, build) {
  try {
    return build();
  } catch (e) {
    return html`<section class="card aanhpi-figure"><h2>Figure ${id}</h2>
      <p class="aanhpi-warn">This figure could not be drawn: ${e.message}</p></section>`;
  }
}
