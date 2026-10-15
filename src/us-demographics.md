---
theme: air
title: U.S. demographics
toc: false
---

# U.S. racial and ethnic distribution

Resident population, July 1, 2025. Source: [U.S. Census Bureau, Vintage 2025 population estimates](https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/national/asrh/).

```js
const race = FileAttachment("data/us-race.csv").csv({typed: true});
```

```js
const total = d3.sum(race, (d) => d.population);
const fmt = d3.format(",");
const pct = d3.format(".1%");
```

<div class="grid grid-cols-4">
  <div class="card">
    <h2>Total population</h2>
    <span class="big">${(total / 1e6).toFixed(1)}M</span>
  </div>
  ${race.slice(0, 3).map((d) => html`<div class="card">
    <h2>${d.group}</h2>
    <span class="big">${pct(d.share)}</span>
    <span class="muted">${fmt(d.population)}</span>
  </div>`)}
</div>

<div class="card">
  ${resize((width) => Plot.plot({
    title: "Share of U.S. population by race and Hispanic origin",
    subtitle: "Race groups are non-Hispanic; Hispanic or Latino may be of any race",
    width,
    height: 320,
    marginLeft: 260,
    marginRight: 50,
    x: {label: "Share of population (%)", percent: true, grid: true},
    y: {label: null},
    marks: [
      Plot.barX(race, {
        x: "share",
        y: "group",
        sort: {y: "-x"},
        fill: "var(--theme-foreground-focus)",
        rx: 4,
        insetTop: 1,
        insetBottom: 1,
        tip: {format: {population: ",", share: ".1%", x: false, y: false}},
        channels: {group: "group", population: "population", share: "share"}
      }),
      Plot.text(race, {
        x: "share",
        y: "group",
        text: (d) => pct(d.share),
        textAnchor: "start",
        dx: 6,
        fill: "var(--theme-foreground)"
      }),
      Plot.ruleX([0])
    ]
  }))}
</div>

<div class="card" style="padding: 0;">
  ${Inputs.table(race, {
    columns: ["group", "hispanic", "population", "share"],
    header: {group: "Group", hispanic: "Hispanic origin", population: "Population", share: "Share"},
    format: {population: fmt, share: pct},
    rows: 8
  })}
</div>
