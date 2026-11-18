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
  const card = html`<section class="card aanhpi-figure" id=${`fig-${meta.figure_id}`}>
    <h2>${shown}</h2>
    ${provisional ? html`<p class="aanhpi-warn">Provisional title. The data file title is “${meta.figure_title || "(blank)"}”.</p>` : ""}
    ${meta.figure_note ? html`<p class="aanhpi-warn">Data note: ${meta.figure_note}</p>` : ""}
    ${body}
    <div class="aanhpi-notes">
      ${meta.subgroup_footnote ? html`<div>${meta.subgroup_footnote}</div>` : ""}
      ${notes.map((l) => html`<div>${l}</div>`)}
    </div>
  </section>`;
  // If the card holds a chart, add a "Download PNG" button under its title.
  const svg = card.querySelector(PLOT_SVG);
  if (svg) {
    const button = html`<button type="button" class="aanhpi-download">Download PNG</button>`;
    button.onclick = () => downloadPng(card.querySelector(PLOT_SVG), {
      title: shown,
      filename: `figure-${meta.figure_id}.png`
    });
    card.querySelector("h2").after(button);
  }
  return card;
}

/** Charts drawn by Plot are <svg> elements whose class starts with "plot". */
const PLOT_SVG = "svg[class^='plot']";

/** Style properties copied from the page onto the downloaded chart, so CSS colors and fonts survive. */
const INLINE_STYLES = ["fill", "fill-opacity", "stroke", "stroke-opacity", "stroke-width", "stroke-dasharray",
  "opacity", "font-family", "font-size", "font-weight", "font-variant", "text-anchor", "dominant-baseline"];

/**
 * Save a Plot chart as a PNG file, with the figure title above it.
 * Works by copying the chart, writing its on-screen colors and fonts directly
 * onto each shape (CSS variables don't carry into an image), drawing it onto a
 * canvas at 2x resolution, and downloading the result.
 */
export async function downloadPng(svg, {title = "", filename = "chart.png", scale = 2} = {}) {
  const {width, height} = svg.getBoundingClientRect();
  const clone = svg.cloneNode(true);
  const src = [svg, ...svg.querySelectorAll("*")];
  const dst = [clone, ...clone.querySelectorAll("*")];
  src.forEach((el, i) => {
    const cs = getComputedStyle(el);
    for (const p of INLINE_STYLES) dst[i].style.setProperty(p, cs.getPropertyValue(p));
    if (dst[i].getAttribute("fill") === "currentColor") dst[i].setAttribute("fill", cs.color);
    if (dst[i].getAttribute("stroke") === "currentColor") dst[i].setAttribute("stroke", cs.color);
  });
  // Leave out the hover tooltip and Plot's own stylesheet (styles are now inline).
  clone.querySelectorAll("[aria-label='tip'], style").forEach((el) => el.remove());
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", width);
  clone.setAttribute("height", height);

  const pageStyle = getComputedStyle(svg);
  const font = pageStyle.fontFamily;
  const color = pageStyle.color;
  const background = getComputedStyle(document.body).backgroundColor || "#ffffff";

  // Wrap the title to the chart width.
  const pad = 16, titleSize = 16, lineHeight = 22;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx.font = `600 ${titleSize}px ${font}`;
  const lines = [];
  for (const word of String(title).split(/\s+/).filter(Boolean)) {
    const last = lines[lines.length - 1];
    if (last && ctx.measureText(`${last} ${word}`).width <= width - 2 * pad + 0.5) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  const titleHeight = lines.length ? pad + lines.length * lineHeight : 0;

  canvas.width = Math.ceil((width + 2 * pad) * scale);
  canvas.height = Math.ceil((height + titleHeight + 2 * pad) * scale);
  ctx.scale(scale, scale);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width + 2 * pad, height + titleHeight + 2 * pad);
  ctx.fillStyle = color;
  ctx.font = `600 ${titleSize}px ${font}`;
  ctx.textBaseline = "top";
  lines.forEach((l, i) => ctx.fillText(l, pad, pad + i * lineHeight));

  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], {type: "image/svg+xml;charset=utf-8"}));
  try {
    const img = new Image();
    await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = url; });
    ctx.drawImage(img, pad, pad + titleHeight, width, height);
  } finally {
    URL.revokeObjectURL(url);
  }
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
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
export function dataTable(rows, {series, include = () => true, rowsShown = 30, filename = "table.csv"} = {}) {
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
  const table = Inputs.table(data, {columns, header, format, align, rows: rowsShown, select: false, layout: "auto"});
  // For download/copy: raw numbers (not rounded), with the unit in the column name.
  const units = new Map(list.map((s) => [s.slug, s.unit]));
  const matrix = [
    columns.map((c) => withUnit(header[c], units.get(c))),
    ...data.map((r) => columns.map((c) => r[c]))
  ];
  return html`<div>${tableTools(matrix, {filename})}${table}</div>`;
}

/** Add the unit to a column name for exported files, e.g. "Growth (%)". */
function withUnit(label, unit) {
  if (unit === "percent" && !/%/.test(label)) return `${label} (%)`;
  if (unit === "usd" && !/\$|usd|dollar/i.test(label)) return `${label} ($)`;
  return label;
}

/**
 * "Top 5 states" table for figures 1.4 and 1.5.
 *  suffix: the measure part of the paired series ("pct_of_group" or "growth_pct").
 *  totalPattern: regex for the group-size series, if the panel has one.
 */
export function rankTable(rows, {suffix, totalPattern, include = () => true, filename = "table.csv"} = {}) {
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
  // For download/copy: one state column and one value column per rank.
  const totalLabel = total ? total.label.replace(/^state_\d+\s*/, "") : null;
  const matrix = [
    ["Group", ...(mixed ? ["Race definition"] : []),
      ...ranks.flatMap((k) => [`#${k} state`, withUnit(`#${k} value`, unit)]),
      ...(total ? [withUnit(totalLabel, total.unit)] : [])],
    ...groups.map((g) => [
      g.entity_label, ...(mixed ? [basisLabel(g)] : []),
      ...ranks.flatMap((k) => {
        const d = ranked.find((r) => r.row_id === g.row_id && r.rank === k);
        return [d?.state ?? "", d?.value == null ? "" : `${d.value}${d.flag === "caution" ? "*" : ""}`];
      }),
      ...(total ? [rows.find((r) => r.row_id === g.row_id && r.series_slug === total.slug && r.chartable)?.value ?? ""] : [])
    ])
  ];
  return html`<div>${tableTools(matrix, {filename})}<div class="aanhpi-scroll"><table class="aanhpi-rank">
    <thead><tr><th>Group</th>${mixed ? html`<th>Race definition</th>` : ""}${ranks.map((k) => html`<th>#${k}</th>`)}${total ? html`<th>${totalLabel}</th>` : ""}</tr></thead>
    <tbody>${groups.map((g) => html`<tr>
      <th scope="row">${g.entity_label}</th>
      ${mixed ? html`<td>${basisLabel(g)}</td>` : ""}
      ${ranks.map((k) => cell(g, k))}
      ${total ? html`<td class="aanhpi-num">${totalOf(g)}</td>` : ""}
    </tr>`)}</tbody>
  </table></div></div>`;
}

/**
 * Buttons above a table: "Download CSV" saves the table as a .csv file, and
 * "Copy table" puts it on the clipboard as tab-separated text, which pastes
 * into Excel or Google Sheets as cells. `matrix` is the header row followed by
 * the data rows.
 */
export function tableTools(matrix, {filename = "table.csv"} = {}) {
  const text = (v) => (v == null ? "" : String(v));
  const csv = matrix.map((r) => r.map((v) => {
    const t = text(v);
    return /[",\r\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  }).join(",")).join("\r\n");
  const tsv = matrix.map((r) => r.map((v) => text(v).replace(/[\t\r\n]+/g, " ")).join("\t")).join("\n");

  const download = html`<button type="button" class="aanhpi-download">Download CSV</button>`;
  download.onclick = () => {
    // The leading \uFEFF tells Excel the file is UTF-8, so characters like "–" display correctly.
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\uFEFF" + csv], {type: "text/csv;charset=utf-8"}));
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const copy = html`<button type="button" class="aanhpi-download">Copy table</button>`;
  copy.onclick = async () => {
    try {
      await navigator.clipboard.writeText(tsv);
      copy.textContent = "Copied!";
    } catch {
      copy.textContent = "Copy not available in this browser";
    }
    setTimeout(() => (copy.textContent = "Copy table"), 2000);
  };

  return html`<div class="aanhpi-tools">${download}${copy}</div>`;
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
  .aanhpi-download { font: inherit; font-size: 0.8rem; color: var(--theme-foreground-focus); background: none; border: 1px solid currentColor; border-radius: 4px; padding: 0.2rem 0.6rem; margin: 0 0 0.75rem; cursor: pointer; }
  .aanhpi-tools { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0.75rem 0 0.5rem; }
  .aanhpi-tools .aanhpi-download { margin: 0; }
  .aanhpi-download:hover { background: var(--theme-foreground-focus); color: var(--theme-background); }
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
