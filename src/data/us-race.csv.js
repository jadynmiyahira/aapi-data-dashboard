// =============================================================================
// WHAT THIS FILE DOES (plain-language summary)
// -----------------------------------------------------------------------------
// Data loader for the "U.S. demographics" page. Each time the site is built it:
//   1. Downloads the latest national population estimates from the U.S.
//      Census Bureau website.
//   2. Picks out the July 1, 2025 estimate for all ages.
//   3. Splits the U.S. population into seven race/ethnicity groups and works
//      out each group's share of the total.
//   4. Double-checks that the groups add up exactly to the U.S. total.
//   5. Saves the result as a small table (us-race.csv) for the page to use.
// =============================================================================

// Tools for reading and writing spreadsheet (CSV) text.
import {csvParse, csvFormat} from "d3-dsv";

// ---- Where the data comes from ----------------------------------------------
// U.S. Census Bureau, Vintage 2025 national population estimates by age, sex,
// race, and Hispanic origin (resident population). file12 covers July–December
// 2025; we use the official July 1, 2025 estimate, all ages (AGE = 999).
// See https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/national/asrh/
const url =
  "https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/national/asrh/nc-est2025-alldata-r-file12.csv";

// ---- The seven groups shown on the page --------------------------------------
// Mutually exclusive groups: Hispanic of any race, plus non-Hispanic race-alone
// groups and non-Hispanic two or more races. These sum to the total population.
// Each "prefix" is the Census Bureau's column code for that group.
const groups = [
  {group: "White", prefix: "NHWA"},
  {group: "Hispanic or Latino", prefix: "H"},
  {group: "Black", prefix: "NHBA"},
  {group: "Asian", prefix: "NHAA"},
  {group: "Two or more races", prefix: "NHTOM"},
  {group: "American Indian and Alaska Native", prefix: "NHIA"},
  {group: "Native Hawaiian and Other Pacific Islander", prefix: "NHNA"}
];

// ---- Step 1: Download the Census file ----------------------------------------
// If the download fails (e.g. the website is down), the build stops.
const response = await fetch(url);
if (!response.ok) throw new Error(`fetch failed: ${response.status} ${url}`);
const rows = csvParse(await response.text());

// ---- Step 2: Find the July 1, 2025, all-ages row -----------------------------
const row = rows.find((d) => d.MONTH === "7" && d.YEAR === "2025" && d.AGE === "999");
if (!row) throw new Error("July 1, 2025 all-ages row not found");

// ---- Step 3: Count each group and its share of the total ---------------------
// The Census file splits each group into male and female, so add them together.
const total = +row.TOT_POP;
const data = groups.map(({group, prefix}) => {
  const population = +row[`${prefix}_MALE`] + +row[`${prefix}_FEMALE`];
  return {group, hispanic: prefix === "H" ? "Any race" : "Not Hispanic", population, share: population / total};
});

// ---- Step 4: Safety check -----------------------------------------------------
// The seven groups must add up exactly to the U.S. total; if not, stop the build.
const sum = data.reduce((s, d) => s + d.population, 0);
if (sum !== total) throw new Error(`groups sum to ${sum}, expected ${total}`);

// ---- Step 5: Save the table for the page ---------------------------------------
process.stdout.write(csvFormat(data));
