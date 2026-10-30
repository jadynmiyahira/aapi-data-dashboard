---
theme: air
toc: false
---

<!--
  WHAT THIS PAGE DOES (plain-language summary)
  ---------------------------------------------------------------------------
  An example page from the Observable Framework starter template (not AANHPI
  data). It shows a line chart of the hourly temperature forecast for
  Washington, D.C. The data is prepared by src/data/forecast.json.js.
-->

# Weather report

```js
// Load the hourly forecast downloaded from the National Weather Service.
const forecast = FileAttachment("./data/forecast.json").json();
```

```js
// Draws the temperature line chart: time along the bottom, degrees (F) up the
// side, with the line colored by temperature (warmer = different color).
function temperaturePlot(data, {width} = {}) {
  return Plot.plot({
    title: "Hourly temperature forecast",
    width,
    x: {type: "utc", ticks: "day", label: null},
    y: {grid: true, inset: 10, label: "Degrees (F)"},
    marks: [
      Plot.lineY(data.properties.periods, {
        x: "startTime",
        y: "temperature",
        z: null, // varying color, not series
        stroke: "temperature",
        curve: "step-after"
      })
    ]
  });
}

//display(temperaturePlot(forecast));
```

<!-- Show the chart in a card that resizes to fit the screen. -->

<div class="grid grid-cols-1">
  <div class="card">${resize((width) => temperaturePlot(forecast, {width}))}</div>
</div>