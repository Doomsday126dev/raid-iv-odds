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
const detail = workbook.worksheets.add("IV Detail");
const bosses = workbook.worksheets.add("Bosses");
const readme = workbook.worksheets.add("Read Me");

const theme = {
  ink: "#142027",
  teal: "#0A7775",
  tealSoft: "#DDF3F0",
  panel: "#F5F8F6",
  input: "#FFF7D7",
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
const bossLastRow = POKEMON.length + 1;
const l20Scenario = "Non-weather boosted (Level 20)";
const l25Scenario = "Weather boosted (Level 25)";

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

function cpFormula(level, atkIv, defIv, staIv) {
  const cpm = level === 20 ? "0.59740001" : "0.667934";
  return `=MAX(10,ROUNDDOWN((($B$10+${atkIv})*SQRT($B$11+${defIv})*SQRT($B$12+${staIv})*${cpm}^2)/10,0))`;
}

for (const sheet of [calculator, detail, bosses, readme]) {
  sheet.showGridLines = false;
}

// Source boss data.
setValues(bosses, "A1:D1", [["Boss", "Base Attack", "Base Defense", "Base Stamina"]]);
setValues(
  bosses,
  `A2:D${bossLastRow}`,
  POKEMON.map((pokemon) => [pokemon.name, pokemon.atk, pokemon.def, pokemon.sta]),
);
styleRange(bosses, "A1:D1", { fill: theme.teal, font: { bold: true, color: theme.white } });
styleRange(bosses, "A:A", { columnWidthPx: 190 });
styleRange(bosses, "B:D", { columnWidthPx: 110, numberFormat: "0" });
bosses.freezePanes.freezeRows(1);

// IV engine: all 1,000 tier-5 shadow raid spreads from 6/6/6 through 15/15/15.
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
    "In Current Floor",
    "Purifies To Hundo",
    "L20 CP Match",
    "L20 Match + Hundo",
    "L25 CP Match",
    "L25 Match + Hundo",
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
styleRange(detail, "A1:M1", { fill: theme.ink, font: { bold: true, color: theme.white } });
styleRange(detail, "A:M", { columnWidthPx: 96 });
styleRange(detail, "D:K", { numberFormat: "0" });
detail.freezePanes.freezeRows(1);

// Calculator.
calculator.mergeCells("A1:H1");
setValues(calculator, "A1:H1", [["Shadow Raid Purified Hundo Odds", null, null, null, null, null, null, null]]);
styleRange(calculator, "A1:H1", { fill: theme.ink, font: { bold: true, color: theme.white }, rowHeightPx: 36 });

setValues(calculator, "A3:B7", [
  ["Boss", "Mewtwo"],
  ["Observed CP", 2387],
  ["Raid IV floor", 6],
  ["Purify bonus", 2],
  ["Pre-purify threshold", null],
]);
setFormulas(calculator, "B7:B7", [["=MAX(0,15-$B$6)"]]);

setValues(calculator, "D3:H7", [
  ["How to use", null, null, null, null],
  ["Pick a boss, enter the CP, and read the auto-detected result.", null, null, null, null],
  ["The sheet checks level 20 and level 25 CP tables and chooses the matching scenario.", null, null, null, null],
  ["Default settings are tier-5 shadow raid floor 6/6/6 and purification +2.", null, null, null, null],
  ["If no IV spread can make that CP, the result says CP not possible.", null, null, null, null],
]);
for (let row = 3; row <= 7; row += 1) calculator.mergeCells(`D${row}:H${row}`);

setValues(calculator, "A10:A12", [["Base Attack"], ["Base Defense"], ["Base Stamina"]]);
setFormulas(calculator, "B10:B12", [
  [`=VLOOKUP($B$3,Bosses!$A$2:$D$${bossLastRow},2,FALSE)`],
  [`=VLOOKUP($B$3,Bosses!$A$2:$D$${bossLastRow},3,FALSE)`],
  [`=VLOOKUP($B$3,Bosses!$A$2:$D$${bossLastRow},4,FALSE)`],
]);

setValues(calculator, "D10:H12", [
  ["CP range", "Min", "Max", "Matching spreads", "Purifies"],
  [l20Scenario, null, null, null, null],
  [l25Scenario, null, null, null, null],
]);
setFormulas(calculator, "E11:H12", [
  [
    cpFormula(20, "$B$5", "$B$5", "$B$5"),
    cpFormula(20, "15", "15", "15"),
    `=SUM('IV Detail'!$H$${firstDetailRow}:$H$${lastDetailRow})`,
    `=SUM('IV Detail'!$I$${firstDetailRow}:$I$${lastDetailRow})`,
  ],
  [
    cpFormula(25, "$B$5", "$B$5", "$B$5"),
    cpFormula(25, "15", "15", "15"),
    `=SUM('IV Detail'!$J$${firstDetailRow}:$J$${lastDetailRow})`,
    `=SUM('IV Detail'!$K$${firstDetailRow}:$K$${lastDetailRow})`,
  ],
]);

setValues(calculator, "A15:H15", [["Auto-detected result", null, null, null, null, null, null, null]]);
calculator.mergeCells("A15:H15");
setValues(calculator, "A17:B23", [
  ["Detected scenario", null],
  ["Odds", null],
  ["Good / Total", null],
  ["Verdict", null],
  ["Purified hundo spreads", null],
  ["Matching spreads", null],
  ["Base odds before CP", null],
]);
setFormulas(calculator, "B17:B23", [
  [`=IF(AND(G11>0,G12>0),"Ambiguous: CP appears in both tables",IF(G11>0,"${l20Scenario}",IF(G12>0,"${l25Scenario}","CP not possible for selected boss")))`],
  [`=IF(B17="${l20Scenario}",IF(G11=0,0,H11/G11),IF(B17="${l25Scenario}",IF(G12=0,0,H12/G12),0))`],
  [`=IF(B17="${l20Scenario}",H11&" / "&G11,IF(B17="${l25Scenario}",H12&" / "&G12,"-"))`],
  [`=IF(B17="CP not possible for selected boss","No matching IV spread at level 20 or 25",IF(B18=1,"Guaranteed purified hundo",IF(B18=0,"Possible CP, but no purified hundo","Mixed odds")))`],
  [`=IF(B17="${l20Scenario}",H11,IF(B17="${l25Scenario}",H12,0))`],
  [`=IF(B17="${l20Scenario}",G11,IF(B17="${l25Scenario}",G12,0))`],
  [`=IFERROR(MAX(0,16-MAX($B$5,$B$7))^3/(16-$B$5)^3,0)`],
]);

setValues(calculator, "D17:H23", [
  ["Notes", null, null, null, null],
  ["The result is conditional on the boss and CP entered above.", null, null, null, null],
  ["A purified hundo requires every pre-purification IV to reach 15 after the bonus.", null, null, null, null],
  ["For default purification +2, that means 13/13/13 or better.", null, null, null, null],
  ["Use the IV Detail tab if you want to inspect exact matching spreads.", null, null, null, null],
  ["No official assets or trademarks are used in this workbook.", null, null, null, null],
  ["This is an unofficial fan calculator.", null, null, null, null],
]);
for (let row = 17; row <= 23; row += 1) calculator.mergeCells(`D${row}:H${row}`);

setValues(calculator, "A26:H26", [["Scenario detail", null, null, null, null, null, null, null]]);
calculator.mergeCells("A26:H26");
setValues(calculator, "A28:D31", [
  ["Scenario", "Purifies", "Total matches", "Odds"],
  [l20Scenario, null, null, null],
  [l25Scenario, null, null, null],
  ["Before checking CP", null, null, null],
]);
setFormulas(calculator, "B29:D31", [
  ["=H11", "=G11", "=IF(C29=0,0,B29/C29)"],
  ["=H12", "=G12", "=IF(C30=0,0,B30/C30)"],
  [`=MAX(0,16-MAX($B$5,$B$7))^3`, [`=(16-$B$5)^3`], [`=IF(C31=0,0,B31/C31)`]].flat(),
]);

calculator.getRange("B3").dataValidation = { rule: { type: "list", formula1: `Bosses!$A$2:$A$${bossLastRow}` } };
calculator.getRange("B4").dataValidation = { rule: { type: "whole", operator: "between", formula1: 10, formula2: 6000 } };
calculator.getRange("B5").dataValidation = { rule: { type: "whole", operator: "between", formula1: 6, formula2: 15 } };
calculator.getRange("B6").dataValidation = { rule: { type: "whole", operator: "between", formula1: 0, formula2: 15 } };

styleRange(calculator, "A3:A7", { fill: theme.panel, font: { bold: true } });
styleRange(calculator, "B3:B7", { fill: theme.input, font: { bold: true } });
styleRange(calculator, "A10:A12", { fill: theme.panel, font: { bold: true } });
styleRange(calculator, "B10:B12", { fill: theme.white });
styleRange(calculator, "D3:H7", { fill: theme.tealSoft, wrapText: true });
styleRange(calculator, "D10:H10", { fill: theme.teal, font: { bold: true, color: theme.white } });
styleRange(calculator, "D11:D12", { fill: theme.panel, font: { bold: true } });
styleRange(calculator, "E11:H12", { fill: theme.white, numberFormat: "0" });
styleRange(calculator, "A15:H15", { fill: theme.teal, font: { bold: true, color: theme.white }, rowHeightPx: 28 });
styleRange(calculator, "A17:A23", { fill: theme.panel, font: { bold: true } });
styleRange(calculator, "B17:B23", { fill: theme.white, wrapText: true });
styleRange(calculator, "B18:B18", { numberFormat: "0.0%" });
styleRange(calculator, "B23:B23", { numberFormat: "0.0%" });
styleRange(calculator, "D17:H23", { fill: theme.blue, wrapText: true });
styleRange(calculator, "A26:H26", { fill: theme.teal, font: { bold: true, color: theme.white }, rowHeightPx: 28 });
styleRange(calculator, "A28:D28", { fill: theme.ink, font: { bold: true, color: theme.white } });
styleRange(calculator, "A29:A31", { fill: theme.panel, font: { bold: true } });
styleRange(calculator, "B29:D31", { fill: theme.white });
styleRange(calculator, "D29:D31", { numberFormat: "0.0%" });
styleRange(calculator, "A:H", { columnWidthPx: 125 });
styleRange(calculator, "B:B", { columnWidthPx: 240 });
styleRange(calculator, "D:D", { columnWidthPx: 190 });
styleRange(calculator, "E:H", { columnWidthPx: 110 });
styleRange(calculator, "B17:B20", { rowHeightPx: 28 });
calculator.freezePanes.freezeRows(1);

for (const cell of ["B18", "D29", "D30", "D31"]) {
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

// Public-safe Read Me.
readme.mergeCells("A1:D1");
setValues(readme, "A1:D1", [["Shadow Raid Purified Hundo Odds - Read Me", null, null, null]]);
styleRange(readme, "A1:D1", { fill: theme.ink, font: { bold: true, color: theme.white }, rowHeightPx: 34 });
setValues(readme, "A3:D10", [
  ["Purpose", "Estimate the conditional chance that a selected Shadow Raid boss purifies to 100% IV based on observed catch CP.", null, null],
  ["How to use", "On Calculator, choose the boss and enter CP. The sheet automatically checks level 20 and weather-boosted level 25 CP tables.", null, null],
  ["Default settings", "Raid IV floor is 6/6/6 and purification bonus is +2, matching typical tier-5 Shadow Raid assumptions.", null, null],
  ["Detected scenario", "Only one catch level should apply for a real catch. The calculator reports the matching scenario based on CP.", null, null],
  ["Odds meaning", "If a CP can come from several IV spreads, odds are purified-hundo spreads divided by all matching spreads.", null, null],
  ["IV Detail", "Use the IV Detail tab to inspect the underlying CP and IV-spread calculations.", null, null],
  ["Disclaimer", "Unofficial fan-made calculator. Pokemon GO mechanics, stats, and raid rules may change.", null, null],
  ["No data collection", "This workbook runs locally and does not collect personal data.", null, null],
]);
styleRange(readme, "A3:A10", { fill: theme.panel, font: { bold: true } });
styleRange(readme, "B3:D10", { wrapText: true });
styleRange(readme, "A:A", { columnWidthPx: 150 });
styleRange(readme, "B:D", { columnWidthPx: 250 });

await fs.mkdir(outputDir, { recursive: true });

const calcInspect = await workbook.inspect({
  kind: "table",
  range: "Calculator!A1:H31",
  include: "values,formulas",
  tableMaxRows: 31,
  tableMaxCols: 8,
});
console.log(calcInspect.ndjson);

const errorScan = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#CALC!",
  options: { useRegex: true, maxResults: 200 },
  summary: "final formula error scan",
});
console.log(errorScan.ndjson);

await workbook.render({ sheetName: "Calculator", range: "A1:H31", scale: 1.4 });
await workbook.render({ sheetName: "IV Detail", range: "A1:M30", scale: 1.0 });
await workbook.render({ sheetName: "Bosses", range: "A1:D25", scale: 1.2 });
await workbook.render({ sheetName: "Read Me", range: "A1:D10", scale: 1.2 });

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(outputPath);
