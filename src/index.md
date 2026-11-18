---
theme: air
toc: false
---

<!--
  WHAT THIS PAGE DOES (plain-language summary)
  ---------------------------------------------------------------------------
  The dashboard's home page. It is still mostly the Observable Framework
  starter page, with the dashboard's title and color scheme added:
    1. A large title banner ("hero").
    2. Two sample charts using built-in demo data (stock prices and penguin
       measurements), not AANHPI data.
    3. "Next steps" cards linking to Observable Framework documentation.
    4. Page styling (colors, borders, title size) at the bottom.
-->

<!-- AAPI Data logo, top right of the page. -->

<div class="top-logo">
  <img src="./assets/AAPI-Data-Horizontal-Logo+Tag-Full-Color.png" alt="AAPI Data logo">
</div>

<!-- Title banner at the top of the page. -->

<div class="hero">
  <h1>2026 State of AANHPIs Dashboard</h1>
  <h2>A partner data dashboard for AAPI Data's comprehensive report on the State of Asian Americans, Native Hawaiians, and Pacific Islanders in the U.S.</h2>
  <a href="https://aapidata.com/data/state-of-aanhpis-report-2026/">View report<span style="display: inline-block; margin-left: 0.25rem;">↗︎</span></a>
</div>

<!-- Two sample charts side by side, using demo data that comes with Observable:
     a line chart of Apple stock prices and a scatter plot of penguin sizes. -->


<!--
<div class="grid grid-cols-2" style="grid-auto-rows: 504px;">
  <div class="card">${
    resize((width) => Plot.plot({
      title: "Your awesomeness over time 🚀",
      subtitle: "Up and to the right!",
      width,
      y: {grid: true, label: "Awesomeness"},
      marks: [
        Plot.ruleY([0]),
        Plot.lineY(aapl, {x: "Date", y: "Close", stroke: "#103f48", tip: true})
      ]
    }))
  }</div>
  <div class="card">${
    resize((width) => Plot.plot({
      title: "How big are penguins, anyway? 🐧",
      width,
      grid: true,
      x: {label: "Body mass (g)"},
      y: {label: "Flipper length (mm)"},
      color: {legend: true, range: ["#103f48", "#7fb6a4", "#ff4f00"]},
      marks: [
        Plot.linearRegressionY(penguins, {x: "body_mass_g", y: "flipper_length_mm", stroke: "species"}),
        Plot.dot(penguins, {x: "body_mass_g", y: "flipper_length_mm", stroke: "species", tip: true})
      ]
    }))
  }</div>
</div>
-->

---

<!--
## Next steps
-->

<!-- Starter-template cards with links to Observable Framework help pages. -->

<!--
Here are some ideas of things you could try…

<div class="grid grid-cols-4">
  <div class="card">
    Chart your own data using <a href="https://observablehq.com/framework/lib/plot"><code>Plot</code></a> and <a href="https://observablehq.com/framework/files"><code>FileAttachment</code></a>. Make it responsive using <a href="https://observablehq.com/framework/javascript#resize(render)"><code>resize</code></a>.
  </div>
  <div class="card">
    Create a <a href="https://observablehq.com/framework/project-structure">new page</a> by adding a Markdown file (<code>whatever.md</code>) to the <code>src</code> folder.
  </div>
  <div class="card">
    Add a drop-down menu using <a href="https://observablehq.com/framework/inputs/select"><code>Inputs.select</code></a> and use it to filter the data shown in a chart.
  </div>
  <div class="card">
    Write a <a href="https://observablehq.com/framework/loaders">data loader</a> that queries a local database or API, generating a data snapshot on build.
  </div>
  <div class="card">
    Import a <a href="https://observablehq.com/framework/imports">recommended library</a> from npm, such as <a href="https://observablehq.com/framework/lib/leaflet">Leaflet</a>, <a href="https://observablehq.com/framework/lib/dot">GraphViz</a>, <a href="https://observablehq.com/framework/lib/tex">TeX</a>, or <a href="https://observablehq.com/framework/lib/duckdb">DuckDB</a>.
  </div>
  <div class="card">
    Ask for help, or share your work or ideas, on our <a href="https://github.com/observablehq/framework/discussions">GitHub discussions</a>.
  </div>
  <div class="card">
    Visit <a href="https://github.com/observablehq/framework">Framework on GitHub</a> and give us a star. Or file an issue if you’ve found a bug!
  </div>
</div>

-->

<!-- Page styling. Colors used: #103f48 (dark teal, text), #ff4f00 (orange,
     links and highlights), #7fb6a4 (light green, borders), #ffffff (white). -->

<style>

/* Theme colors for this page: background, text, highlight and muted text. */
:root {
  --theme-background: #ffffff;
  --theme-background-alt: #ffffff;
  --theme-foreground: #103f48;
  --theme-foreground-focus: #ff4f00;
  --theme-foreground-muted: #103f48;
}

/* Page background, text color, link color and divider-line color. */
body {
  background: #ffffff;
  color: #103f48;
}

a, a:visited {
  color: #ff4f00;
}

hr {
  border-color: #7fb6a4;
}

/* Cards: white boxes with a light green border and a thicker top edge. */
.card {
  background: #ffffff;
  border: 1px solid #7fb6a4;
  border-top: 4px solid #7fb6a4;
}

/* AAPI Data logo: top right, 60px tall. */
.top-logo {
  display: flex;
  justify-content: flex-end;
}

.top-logo img {
  height: 60px;
  width: auto;
  max-width: 100%;
}

/* Title banner: centered, with a very large title and smaller subtitle. */
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: var(--sans-serif);
  margin: 4rem 0 8rem;
  text-wrap: balance;
  text-align: center;
}

.hero h1 {
  margin: 1rem 0;
  padding: 1rem 0;
  max-width: none;
  font-size: 14vw;
  font-weight: 900;
  line-height: 1;
  color: #103f48;
}

.hero h2 {
  margin: 0;
  max-width: 34em;
  font-size: 20px;
  font-style: initial;
  font-weight: 500;
  line-height: 1.5;
  color: var(--theme-foreground-muted);
}

/* On wider screens, cap the title size at 90px. */
@media (min-width: 640px) {
  .hero h1 {
    font-size: 90px;
  }
}

</style>
