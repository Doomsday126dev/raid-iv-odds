import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";
import { POKEMON } from "../src/data.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const outputDir = path.join(repoRoot, "outputs", "raid-iv-odds");
const outputPath = path.join(outputDir, "Shadow_Raid_Purified_Hundo_Odds.xlsx");

const workbook = Workbook.create();
const calculator = workbook.worksheets.add("Calculator");
const bosses = workbook.worksheets.add("Bosses");
const detail = workbook.worksheets.add("IV Detail");
const readme = workbook.worksheets.add("Read Me");

const theme = {
  dark: "#132027",
  teal: "#0A7775",
  tealSoft: "#DDF3F0",
  panel: "#F5F8F6",
  green: "#DDF5E7",
  greenText: "#147C45",
  amber: "#FFF1CC",
  amberText: "#9A6200",
  rose: "#FFE3EA",
  roseText: "#B4233A",
  white: "#FFFFFF",
  blue: "#E6F0FF",
};

const firstDetailRow = 2;
const lastDetailRow = 1001;

function setValues(sheet, range, values) {
  sheet.getRange(range).values = values;
}

function setFormulas(sheet, range, formulas) {
  sheet.getRange(range).formulas = formulas;
}

function styleRange(sheet, range, { fill, font, numberFormat, wrapText, columnWidthPx, rowHeightPx } = {}) {
  const target = sheet.getRange(range);
  if (fill) target.format.fill = fill;
  if (font) target.format.font = font;
  if (numberFormat) target.format.numberFormat = numberFormat;
  if (wrapText !== undefined) target.format.wrapText = wrapText;
  if (columnWidthPx) target.format.columnWidthPx = columnWidthPx;
  if (rowHeightPx) target.format.rowHeightPx = rowHeightPx;
}

for (const sheet of [calculator, bosses, detail, readme]) {
  sheet.showGridLines = false;
}

// Boss source data.
setValues(bosses, "A1:D1", [["Pokemon", "Base Attack", "Base Defense", "Base Stamina"]]);
setValues(
  bosses,
  `A2:D${POKEMON.length + 1}`,
  POKEMON.map((pokemon) => [pokemon.name, pokemon.atk, pokemon.def, pokemon.sta]),
);
styleRange(bosses, "A1:D1", { fill: theme.teal, font: { bold: true, color: theme.white } });
styleRange(bosses, "A:A", { columnWidthPx: 190 });
styleRange(bosses, "B:D", { columnWidthPx: 110, numberFormat: "0" });
bosses.freezePanes.freezeRows(1);

// IV detail engine: 1,000 IV spreads from 6/6/6 through 15/15/15.
const combos = [];
for (let a = 6; a <= 15; a += 1) {
  for (let d = 6; d <= 15; d += 1) {
    for (let s = 6; s <= 15; s += 1) {
      combos.push([a, d, s]);
    }
  }
}

setValues(detail, "A1:M1", [
  [
    "Atk IV",
    "Def IV",
    "HP IV",
    "Level 20 CP",
    "Level 25 CP",
    "In Floor",
    "Purifies",
    "L20 Match",
    "L20 Hundo",
    "L25 Match",
    "L25 Hundo",
    "IV Spread",
    "Purified Spread",
  ],
]);
setValues(detail, `A${firstDetailRow}:C${lastDetailRow}`, combos);

const detailFormulas = combos.map((_, index) => {
  const row = index + firstDetailRow;
  return [
    `=MAX(10,ROUNDDOWN((('Calculator'!$B$10+A${row})*SQRT('Calculator'!$B$11+B${row})*SQRT('Calculator'!$B$12+C${row})*0.59740001^2)/10,0))`,
    `=MAX(10,ROUNDDOWN((('Calculator'!$B$10+A${row})*SQRT('Calculator'!$B$11+B${row})*SQRT('Calculator'!$B$12+C${row})*0.667934^2)/10,0))`,
    `=--AND(A${row}>='Calculator'!$B$5,B${row}>='Calculator'!$B$5,C${row}>='Calculator'!$B$5)`,
    `=--AND(A${row}+'Calculator'!$B$6>=15,B${row}+'Calculator'!$B$6>=15,C${row}+'Calculator'!$B$6>=15)`,
    `=--AND(F${row}=1,D${row}='Calculator'!$B$4)`,
    `=--AND(H${row}=1,G${row}=1)`,
    `=--AND(F${row}=1,E${row}='Calculator'!$B$4)`,
    `=--AND(J${row}=1,G${row}=1)`,
    `=A${row}&"/"&B${row}&"/"&C${row}`,
    `=MIN(15,A${row}+'Calculator'!$B$6)&"/"&MIN(15,B${row}+'Calculator'!$B$6)&"/"&MIN(15,C${row}+'Calculator'!$B$6)`,
  ];
});
setFormulas(detail, `D${firstDetailRow}:M${lastDetailRow}`, detailFormulas);
styleRange(detail, "A1:M1", { fill: theme.dark, font: { bold: true, color: theme.white } });
styleRange(detail, "A:M", { columnWidthPx: 92 });
styleRange(detail, "D:K", { numberFormat: "0" });
detail.freezePanes.freezeRows(1);

// Calculator dashboard.
calculator.mergeCells("A1:H1");
setValues(calculator, "A1:H1", [["Shadow Raid Purified Hundo Odds Calculator", null, null, null, null, null, null, null]]);
styleRange(calculator, "A1:H1", {
  fill: theme.dark,
  font: { bold: true, color: theme.white },
  rowHeightPx: 34,
});

setValues(calculator, "A3:B7", [
  ["Pokemon", "Mewtwo"],
  ["Observed CP", 2387],
  ["Raid IV floor", 6],
  ["Purify bonus", 2],
  ["Pre-purify threshold", null],
]);
setFormulas(calculator, "B7:B7", [["=MAX(0,15-$B$6)"]]);

setValues(calculator, "A10:A12", [["Base Attack"], ["Base Defense"], ["Base Stamina"]]);
setFormulas(calculator, "B10:B12", [
  [`=VLOOKUP($B$3,Bosses!$A$2:$D$${POKEMON.length + 1},2,FALSE)`],
  [`=VLOOKUP($B$3,Bosses!$A$2:$D$${POKEMON.length + 1},3,FALSE)`],
  [`=VLOOKUP($B$3,Bosses!$A$2:$D$${POKEMON.length + 1},4,FALSE)`],
]);

setValues(calculator, "D3:H7", [
  ["How to use", null, null, null, null],
  ["1. Pick a boss from the dropdown.", null, null, null, null],
  ["2. Enter the CP you see after the raid.", null, null, null, null],
  ["3. Read level 20 and weather-boosted level 25 odds below.", null, null, null, null],
  ["Designed for tier-5 shadow raids with IV floors from 6 to 15.", null, null, null, null],
]);
for (let row = 3; row <= 7; row += 1) calculator.mergeCells(`D${row}:H${row}`);

setValues(calculator, "A15:B16", [
  ["Base purified-hundo chance before checking CP", null],
  ["Good / Total IV spreads", null],
]);
setFormulas(calculator, "B15:B16", [
  [`=IFERROR(MAX(0,16-MAX($B$5,$B$7))^3/(16-$B$5)^3,0)`],
  [`=MAX(0,16-MAX($B$5,$B$7))^3&" / "&(16-$B$5)^3`],
]);

setValues(calculator, "A19:C19", [["Non-weather boosted (Level 20)", null, null]]);
setValues(calculator, "E19:G19", [["Weather boosted (Level 25)", null, null]]);
calculator.mergeCells("A19:C19");
calculator.mergeCells("E19:G19");

setValues(calculator, "A21:B26", [
  ["Purified hundos", null],
  ["Matching IV spreads", null],
  ["Odds", null],
  ["Verdict", null],
  ["Good / Total", null],
  ["Matching IVs", null],
]);
setValues(calculator, "E21:F26", [
  ["Purified hundos", null],
  ["Matching IV spreads", null],
  ["Odds", null],
  ["Verdict", null],
  ["Good / Total", null],
  ["Matching IVs", null],
]);

setFormulas(calculator, "B21:B26", [
  [`=SUM('IV Detail'!$I$${firstDetailRow}:$I$${lastDetailRow})`],
  [`=SUM('IV Detail'!$H$${firstDetailRow}:$H$${lastDetailRow})`],
  ["=IF(B22=0,0,B21/B22)"],
  [`=IF(B22=0,"CP not possible",IF(B21=0,"Possible CP, no purified hundo",IF(B21=B22,"Guaranteed purified hundo","Mixed odds")))`],
  [`=IF(B22=0,"-",TEXT(B21,"0")&" / "&TEXT(B22,"0"))`],
  [`=IF(B22=0,"No matching spreads",TEXTJOIN(", ",TRUE,FILTER('IV Detail'!$L$${firstDetailRow}:$L$${lastDetailRow},'IV Detail'!$H$${firstDetailRow}:$H$${lastDetailRow}=1)))`],
]);
setFormulas(calculator, "F21:F26", [
  [`=SUM('IV Detail'!$K$${firstDetailRow}:$K$${lastDetailRow})`],
  [`=SUM('IV Detail'!$J$${firstDetailRow}:$J$${lastDetailRow})`],
  ["=IF(F22=0,0,F21/F22)"],
  [`=IF(F22=0,"CP not possible",IF(F21=0,"Possible CP, no purified hundo",IF(F21=F22,"Guaranteed purified hundo","Mixed odds")))`],
  [`=IF(F22=0,"-",TEXT(F21,"0")&" / "&TEXT(F22,"0"))`],
  [`=IF(F22=0,"No matching spreads",TEXTJOIN(", ",TRUE,FILTER('IV Detail'!$L$${firstDetailRow}:$L$${lastDetailRow},'IV Detail'!$J$${firstDetailRow}:$J$${lastDetailRow}=1)))`],
]);

setValues(calculator, "A28:B29", [["Level 20 purified-hundo IVs", null], ["Level 25 purified-hundo IVs", null]]);
setFormulas(calculator, "B28:B29", [
  [`=IF(B21=0,"None",TEXTJOIN(", ",TRUE,FILTER('IV Detail'!$L$${firstDetailRow}:$L$${lastDetailRow},'IV Detail'!$I$${firstDetailRow}:$I$${lastDetailRow}=1)))`],
  [`=IF(F21=0,"None",TEXTJOIN(", ",TRUE,FILTER('IV Detail'!$L$${firstDetailRow}:$L$${lastDetailRow},'IV Detail'!$K$${firstDetailRow}:$K$${lastDetailRow}=1)))`],
]);

calculator.getRange("B3").dataValidation = { rule: { type: "list", formula1: `Bosses!$A$2:$A$${POKEMON.length + 1}` } };
calculator.getRange("B4").dataValidation = { rule: { type: "whole", operator: "between", formula1: 10, formula2: 6000 } };
calculator.getRange("B5").dataValidation = { rule: { type: "whole", operator: "between", formula1: 6, formula2: 15 } };
calculator.getRange("B6").dataValidation = { rule: { type: "whole", operator: "between", formula1: 0, formula2: 15 } };

styleRange(calculator, "A3:A7", { fill: theme.panel, font: { bold: true } });
styleRange(calculator, "B3:B7", { fill: theme.white, font: { bold: true } });
styleRange(calculator, "A10:A12", { fill: theme.panel, font: { bold: true } });
styleRange(calculator, "D3:H7", { fill: theme.tealSoft, wrapText: true });
styleRange(calculator, "A15:B16", { fill: theme.blue, wrapText: true });
styleRange(calculator, "B15:B15", { numberFormat: "0.0%" });
styleRange(calculator, "A19:C19", { fill: theme.teal, font: { bold: true, color: theme.white } });
styleRange(calculator, "E19:G19", { fill: theme.teal, font: { bold: true, color: theme.white } });
styleRange(calculator, "A21:A26", { fill: theme.panel, font: { bold: true } });
styleRange(calculator, "E21:E26", { fill: theme.panel, font: { bold: true } });
styleRange(calculator, "B21:B29", { fill: theme.white, wrapText: true });
styleRange(calculator, "F21:F26", { fill: theme.white, wrapText: true });
styleRange(calculator, "B23:B23", { numberFormat: "0.0%" });
styleRange(calculator, "F23:F23", { numberFormat: "0.0%" });
styleRange(calculator, "A28:A29", { fill: theme.panel, font: { bold: true } });
styleRange(calculator, "A:H", { columnWidthPx: 125 });
styleRange(calculator, "D:D", { columnWidthPx: 24 });
styleRange(calculator, "B:B", { columnWidthPx: 230 });
styleRange(calculator, "F:F", { columnWidthPx: 230 });
styleRange(calculator, "D:H", { columnWidthPx: 120 });
styleRange(calculator, "B26:B29", { rowHeightPx: 42 });
styleRange(calculator, "F26:F26", { rowHeightPx: 42 });
calculator.freezePanes.freezeRows(1);

for (const cell of ["B23", "F23"]) {
  calculator.getRange(`${cell}:${cell}`).conditionalFormats.add("cellIs", {
    operator: "equal",
    formula: 1,
    format: { fill: theme.green, font: { bold: true, color: theme.greenText }, numberFormat: "0.0%" },
  });
  calculator.getRange(`${cell}:${cell}`).conditionalFormats.add("cellIs", {
    operator: "between",
    formula: [0.00001, 0.99999],
    format: { fill: theme.amber, font: { bold: true, color: theme.amberText }, numberFormat: "0.0%" },
  });
  calculator.getRange(`${cell}:${cell}`).conditionalFormats.add("cellIs", {
    operator: "equal",
    formula: 0,
    format: { fill: theme.rose, font: { bold: true, color: theme.roseText }, numberFormat: "0.0%" },
  });
}

// Read Me.
setValues(readme, "A1:D1", [["Raid IV Odds Excel Tool", null, null, null]]);
readme.mergeCells("A1:D1");
styleRange(readme, "A1:D1", { fill: theme.dark, font: { bold: true, color: theme.white }, rowHeightPx: 34 });
setValues(readme, "A3:D11", [
  ["Purpose", "Pick a raid boss and enter observed catch CP to estimate conditional purified-hundo odds.", null, null],
  ["Default assumptions", "Tier 5 Shadow Raid IV floor = 6/6/6; purification adds +2 to each IV.", null, null],
  ["Calculator tab", "Use the input cells at the top. Results update from formulas.", null, null],
  ["Bosses tab", "Seeded legendary/mythical base stats. Add or edit future bosses here if needed.", null, null],
  ["IV Detail tab", "The 1,000 IV spreads from 6/6/6 through 15/15/15 with formula-driven CP and eligibility flags.", null, null],
  ["Important", "This is an unofficial fan utility. Verify base stats if Pokemon GO changes stats or forms.", null, null],
  ["GitHub repo name", "Recommended: raid-iv-odds", null, null],
  ["PWA first", "Publish the web app first, then wrap with Capacitor when ready for app stores.", null, null],
  ["Privacy", "The app/tool runs locally and does not need user accounts or personal data.", null, null],
]);
styleRange(readme, "A3:A11", { fill: theme.panel, font: { bold: true } });
styleRange(readme, "B3:D11", { wrapText: true });
styleRange(readme, "A:A", { columnWidthPx: 150 });
styleRange(readme, "B:D", { columnWidthPx: 240 });

await fs.mkdir(outputDir, { recursive: true });

const calcInspect = await workbook.inspect({
  kind: "table",
  range: "Calculator!A1:H30",
  include: "values,formulas",
  tableMaxRows: 30,
  tableMaxCols: 8,
});
console.log(calcInspect.ndjson);

const errorScan = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 200 },
  summary: "final formula error scan",
});
console.log(errorScan.ndjson);

await workbook.render({ sheetName: "Calculator", range: "A1:H30", scale: 1.5 });
await workbook.render({ sheetName: "Bosses", range: "A1:D25", scale: 1.2 });
await workbook.render({ sheetName: "IV Detail", range: "A1:M30", scale: 1.0 });
await workbook.render({ sheetName: "Read Me", range: "A1:D11", scale: 1.2 });

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(outputPath);
