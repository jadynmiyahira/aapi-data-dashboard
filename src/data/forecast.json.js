// =============================================================================
// WHAT THIS FILE DOES (plain-language summary)
// -----------------------------------------------------------------------------
// Data loader for the "Weather report" example page (part of the Observable
// Framework starter template, not AANHPI data). Each time the site is built it
// downloads the hourly weather forecast for Washington, D.C. from the U.S.
// National Weather Service and saves it as forecast.json.
// =============================================================================

// Location to get the forecast for (Washington, D.C.).
const longitude = -77.04;
const latitude = 38.90;

// Helper: download a web address and read it as JSON. Stops the build if the
// download fails.
async function json(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
  return await response.json();
}

// First ask the Weather Service which forecast covers this location, then
// download that hourly forecast.
const station = await json(`https://api.weather.gov/points/${latitude},${longitude}`);
const forecast = await json(station.properties.forecastHourly);

// Save the forecast for the page to use.
process.stdout.write(JSON.stringify(forecast));