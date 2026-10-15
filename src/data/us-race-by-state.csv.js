import {csvParse, csvFormat} from "d3-dsv";

// U.S. Census Bureau, Vintage 2025 state population estimates by age, sex,
// race, and Hispanic origin (alldata6: six race groups). We use the July 1,
// 2025 estimate, both sexes (SEX = 0), summed across single years of age.
// See https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/state/asrh/
const url =
  "https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/state/asrh/sc-est2025-alldata6.csv";

// Mutually exclusive groups: Hispanic of any race (ORIGIN = 2), plus
// non-Hispanic (ORIGIN = 1) race-alone groups and two or more races.
const groups = [
  {group: "White", origin: "1", race: "1"},
  {group: "Hispanic or Latino", origin: "2"},
  {group: "Black", origin: "1", race: "2"},
  {group: "Asian", origin: "1", race: "4"},
  {group: "Two or more races", origin: "1", race: "6"},
  {group: "American Indian and Alaska Native", origin: "1", race: "3"},
  {group: "Native Hawaiian and Other Pacific Islander", origin: "1", race: "5"}
];

const response = await fetch(url);
if (!response.ok) throw new Error(`fetch failed: ${response.status} ${url}`);
const rows = csvParse(await response.text()).filter((d) => d.SEX === "0");

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

process.stdout.write(csvFormat(data));
