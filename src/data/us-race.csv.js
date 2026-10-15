import {csvParse, csvFormat} from "d3-dsv";

// U.S. Census Bureau, Vintage 2025 national population estimates by age, sex,
// race, and Hispanic origin (resident population). file12 covers July–December
// 2025; we use the official July 1, 2025 estimate, all ages (AGE = 999).
// See https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/national/asrh/
const url =
  "https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/national/asrh/nc-est2025-alldata-r-file12.csv";

// Mutually exclusive groups: Hispanic of any race, plus non-Hispanic race-alone
// groups and non-Hispanic two or more races. These sum to the total population.
const groups = [
  {group: "White", prefix: "NHWA"},
  {group: "Hispanic or Latino", prefix: "H"},
  {group: "Black", prefix: "NHBA"},
  {group: "Asian", prefix: "NHAA"},
  {group: "Two or more races", prefix: "NHTOM"},
  {group: "American Indian and Alaska Native", prefix: "NHIA"},
  {group: "Native Hawaiian and Other Pacific Islander", prefix: "NHNA"}
];

const response = await fetch(url);
if (!response.ok) throw new Error(`fetch failed: ${response.status} ${url}`);
const rows = csvParse(await response.text());

const row = rows.find((d) => d.MONTH === "7" && d.YEAR === "2025" && d.AGE === "999");
if (!row) throw new Error("July 1, 2025 all-ages row not found");

const total = +row.TOT_POP;
const data = groups.map(({group, prefix}) => {
  const population = +row[`${prefix}_MALE`] + +row[`${prefix}_FEMALE`];
  return {group, hispanic: prefix === "H" ? "Any race" : "Not Hispanic", population, share: population / total};
});

const sum = data.reduce((s, d) => s + d.population, 0);
if (sum !== total) throw new Error(`groups sum to ${sum}, expected ${total}`);

process.stdout.write(csvFormat(data));
