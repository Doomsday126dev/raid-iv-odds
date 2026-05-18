import { readFile, writeFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";

const files = ["data", "math", "main"];

for (const name of files) {
  const source = await readFile(new URL(`../src/${name}.ts`, import.meta.url), "utf8");
  let output = stripTypeScriptTypes(source, { mode: "transform" });

  output = output
    .replaceAll('from "./data"', 'from "./data.js"')
    .replaceAll('from "./math"', 'from "./math.js"');

  await writeFile(new URL(`../src/${name}.js`, import.meta.url), output);
}
