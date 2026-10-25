import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {allMatchesAlreadyPerfect} from "../src/presentation.ts";
import {analyzeShadowCatch} from "../src/encounters.ts";
const catalog=JSON.parse(readFileSync(new URL('../src/catalog.json',import.meta.url),'utf8'));
const contexts=(id:string,cp:number)=>analyzeShadowCatch(catalog.pokemon.find((p:{id:string})=>p.id===id),cp).matches;
test('already-hundo distinction requires every compatible spread to be original 15/15/15',()=>{
 assert.equal(allMatchesAlreadyPerfect(contexts('MEWTWO',2387)),true);
 assert.equal(allMatchesAlreadyPerfect(contexts('WEEDLE',102)),false); // all purifiable, only one originally perfect
 assert.equal(allMatchesAlreadyPerfect(contexts('MAGIKARP',61)),false);
 assert.equal(allMatchesAlreadyPerfect([]),false);
 assert.equal(allMatchesAlreadyPerfect([{summary:{combos:[]}}]),false);
 assert.equal(allMatchesAlreadyPerfect([{summary:{combos:[{a:15,d:15,s:15}]}},{summary:{combos:[{a:13,d:15,s:15}]}}]),false);
});
