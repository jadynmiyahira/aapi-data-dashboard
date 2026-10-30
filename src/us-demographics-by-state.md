---
theme: air
title: U.S. demographics by state
toc: false
---

<!--
  WHAT THIS PAGE DOES (plain-language summary)
  ---------------------------------------------------------------------------
  Lets the reader pick a state and see how its population breaks down by race
  and Hispanic origin, compared with the U.S. as a whole (Census Bureau
  estimate for July 1, 2025). The page has:
    1. A drop-down menu to choose a state (starts on California).
    2. Four summary cards: the state's population and its three largest groups.
    3. A bar chart of each group's share of the state, with a thin line
       marking the U.S. share for comparison.
    4. A table with the exact numbers.
  Everything updates automatically when a different state is chosen.
  The data is prepared by src/data/us-race-by-state.csv.js.
-->

# U.S. demographics by state

Resident population, July 1, 2025. Source: [U.S. Census Bureau, Vintage 2025 population estimates](https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/state/asrh/).

```js
// Load the population table (one row per state and race/ethnicity group).
const raceByState = FileAttachment("data/us-race-by-state.csv").csv({typed: true});
```

```js
// Prepare lists and national figures used throughout the page: the list of
// states (A–Z) for the menu, the group order, the U.S. total, each group's
// U.S. share, and number formats ("1,234,567" and "12.3%").
const states = d3.sort(new Set(raceByState.map((d) => d.state)));
const groups = [...new Set(raceByState.map((d) => d.group))]; // fixed order, largest nationally first
const usTotal = d3.sum(raceByState, (d) => d.population);
const usShare = d3.rollup(raceByState, (D) => d3.sum(D, (d) => d.population) / usTotal, (d) => d.group);
const fmt = d3.format(",");
const pct = d3.format(".1%");
```

```js
// The drop-down menu for choosing a state.
const state = view(Inputs.select(states, {label: "State", value: "California"}));
```

```js
// Keep only the chosen state's rows and attach the U.S. share to each group.
// Also work out the state's total and its three largest groups (for the cards).
const selected = raceByState
  .filter((d) => d.state === state)
  .map((d) => ({...d, usShare: usShare.get(d.group)}));
const total = d3.sum(selected, (d) => d.population);
const largest = d3.sort(selected, (d) => -d.share).slice(0, 3);
```

<!-- Summary cards: the state's population (in millions or thousands) and its
     share of the U.S., then its three largest groups. -->

<div class="grid grid-cols-4">
  <div class="card">
    <h2>${state} population</h2>
    <span class="big">${total >= 1e6 ? `${(total / 1e6).toFixed(1)}M` : `${Math.round(total / 1e3)}K`}</span>
    <span class="muted">${pct(total / usTotal)} of U.S.</span>
  </div>
  ${largest.map((d) => html`<div class="card">
    <h2>${d.group}</h2>
    <span class="big">${pct(d.share)}</span>
    <span class="muted">${fmt(d.population)} · U.S. ${pct(d.usShare)}</span>
  </div>`)}
</div>

<!-- Bar chart: each group's share of the chosen state (bars), with a thin
     vertical line showing the U.S. share for comparison. Hovering shows the
     population and both shares. Resizes to fit the screen. -->

<div class="card">
  ${resize((width) => Plot.plot({
    title: `Share of ${state} population by race and Hispanic origin`,
    subtitle: html`Bars show ${state}; <span style="display: inline-block; width: 2px; height: 0.9em; vertical-align: -0.1em; background: var(--theme-foreground);"></span> marks the U.S. share. Race groups are non-Hispanic; Hispanic or Latino may be of any race.`,
    width,
    height: 320,
    marginLeft: 260,
    marginRight: 50,
    x: {label: "Share of population (%)", percent: true, grid: true},
    y: {label: null, domain: groups},
    marks: [
      Plot.barX(selected, {
        x: "share",
        y: "group",
        fill: "var(--theme-foreground-focus)",
        rx: 4,
        insetTop: 1,
        insetBottom: 1
      }),
      Plot.tickX(selected, {
        x: "usShare",
        y: "group",
        stroke: "var(--theme-foreground)",
        strokeWidth: 2
      }),
      Plot.text(selected, {
        x: "share",
        y: "group",
        text: (d) => pct(d.share),
        textAnchor: "start",
        dx: 6,
        fill: "var(--theme-foreground)",
        stroke: "var(--theme-background-alt)",
        strokeWidth: 4,
        paintOrder: "stroke"
      }),
      Plot.tip(selected, Plot.pointerY({
        x: "share",
        y: "group",
        channels: {Population: "population", [state]: "share", "U.S.": "usShare"},
        format: {Population: ",", [state]: ".1%", "U.S.": ".1%", x: false, y: true}
      })),
      Plot.ruleX([0])
    ]
  }))}
</div>

<!-- Data table: exact population, state share and U.S. share for every group. -->

<div class="card" style="padding: 0;">
  ${Inputs.table(selected, {
    columns: ["group", "hispanic", "population", "share", "usShare"],
    header: {group: "Group", hispanic: "Hispanic origin", population: "Population", share: `Share of ${state}`, usShare: "Share of U.S."},
    format: {population: fmt, share: pct, usShare: pct},
    rows: 8
  })}
</div>
