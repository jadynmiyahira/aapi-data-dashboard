// =============================================================================
// WHAT THIS FILE DOES (plain-language summary)
// -----------------------------------------------------------------------------
// Data loader for the "U.S. demographics by state" page. Each time the site is
// built it:
//   1. Downloads the latest state population estimates from the U.S. Census
//      Bureau website.
//   2. Adds up each state's population across all ages and both sexes.
//   3. Splits each state's population into seven race/ethnicity groups and
//      works out each group's share of that state's total.
//   4. Double-checks that, for every state, the groups add up exactly to the
//      state's total.
//   5. Saves the result as a table (us-race-by-state.csv) for the page to use.
// =============================================================================

// Tools for reading and writing spreadsheet (CSV) text.
import {csvParse, csvFormat} from "d3-dsv";

// ---- Where the data comes from ----------------------------------------------
// U.S. Census Bureau, Vintage 2025 state population estimates by age, sex,
// race, and Hispanic origin (alldata6: six race groups). We use the July 1,
// 2025 estimate, both sexes (SEX = 0), summed across single years of age.
// See https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/state/asrh/
const url =
  "https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/state/asrh/sc-est2025-alldata6.csv";

// ---- The seven groups shown on the page --------------------------------------
// Mutually exclusive groups: Hispanic of any race (ORIGIN = 2), plus
// non-Hispanic (ORIGIN = 1) race-alone groups and two or more races.
// "origin" and "race" are the Census Bureau's codes for each group.
const groups = [
  {group: "White", origin: "1", race: "1"},
  {group: "Hispanic or Latino", origin: "2"},
  {group: "Black", origin: "1", race: "2"},
  {group: "Asian", origin: "1", race: "4"},
  {group: "Two or more races", origin: "1", race: "6"},
  {group: "American Indian and Alaska Native", origin: "1", race: "3"},
  {group: "Native Hawaiian and Other Pacific Islander", origin: "1", race: "5"}
];

// ---- Step 1: Download the Census file ----------------------------------------
// Keep only the "both sexes" rows. If the download fails, the build stops.
const response = await fetch(url);
if (!response.ok) throw new Error(`fetch failed: ${response.status} ${url}`);
const rows = csvParse(await response.text()).filter((d) => d.SEX === "0");

// ---- Step 2: Add up totals per state and per state + group --------------------
// The file has one row per age, so we keep running totals as we go.
const totals = new Map();
const counts = new Map();
for (const d of rows) {
  const population = +d.POPESTIMATE2025;
  if (d.ORIGIN === "0") totals.set(d.NAME, (totals.get(d.NAME) ?? 0) + population);
  for (const g of groups) {
    if (d.ORIGIN === g.origin && (!g.race || d.RACE === g.race)) {
      const key = `${d.NAME}\t${g.group}`;
      counts.set(key, (counts.get(key) ?? 0) + population);
    }
  }
}

// ---- Step 3: Build one row per state and group, with its share ---------------
// Safety check: each state's groups must add up exactly to that state's total;
// if not, the build stops.
const data = [];
for (const [state, total] of totals) {
  let sum = 0;
  for (const {group, origin} of groups) {
    const population = counts.get(`${state}\t${group}`) ?? 0;
    sum += population;
    data.push({state, group, hispanic: origin === "2" ? "Any race" : "Not Hispanic", population, share: population / total});
  }
  if (sum !== total) throw new Error(`${state}: groups sum to ${sum}, expected ${total}`);
}

// ---- Step 4: Save the table for the page ---------------------------------------
process.stdout.write(csvFormat(data));
