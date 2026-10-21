// node scripts/update-catalog.mjs /path/to/pokemon.json <full-PvPoke-commit>
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
const [path, revision] = process.argv.slice(2);
if (!path || !/^[a-f0-9]{40}$/.test(revision ?? ""))
  throw Error("Provide a snapshot path and full commit SHA");
const raw = readFileSync(path);
const source = JSON.parse(raw);
const pokemon = source
  .filter(
    (p) =>
      p.released === true &&
      !p.tags?.some((t) => ["shadow", "mega", "primal"].includes(t)) &&
      !/_(shadow|mega|primal)(_|$)/.test(p.speciesId) &&
      [p.baseStats.atk, p.baseStats.def, p.baseStats.hp].every(
        (x) => Number.isFinite(x) && x > 0,
      ),
  )
  .map((p) => ({
    id: p.speciesId.toUpperCase(),
    dex: p.dex,
    name: p.speciesName,
    atk: p.baseStats.atk,
    def: p.baseStats.def,
    sta: p.baseStats.hp,
    shadow: !!p.tags?.includes("shadoweligible"),
    types: p.types
      .filter((x) => x !== "none")
      .map((x) => x[0].toUpperCase() + x.slice(1)),
  }))
  .sort((a, b) => a.dex - b.dex || a.name.localeCompare(b.name));
if (
  pokemon.length < 900 ||
  new Set(pokemon.map((p) => p.id)).size !== pokemon.length
)
  throw Error("Unexpected catalog scope/schema");
writeFileSync(
  new URL("../src/catalog.json", import.meta.url),
  JSON.stringify({
    source: "https://github.com/pvpoke/pvpoke",
    revision,
    sha256: createHash("sha256").update(raw).digest("hex"),
    generated: new Date().toISOString().slice(0, 10),
    pokemon,
  }),
);
console.log(`Generated ${pokemon.length} released species/forms`);
