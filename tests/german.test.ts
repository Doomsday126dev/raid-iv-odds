import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(path:string)=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const catalog=read('../src/catalog.json').pokemon;
const names=read('../src/german-names.json').names;
test('German names cover the cleaned catalog exactly, with unique species/form labels',()=>{
 assert.equal(catalog.length,1065);
 assert.deepEqual(Object.keys(names).sort(),catalog.map((p:{id:string})=>p.id).sort());
 assert.equal(new Set(Object.values(names)).size,catalog.length);
 for(const [id,name] of Object.entries({BULBASAUR:'Bisasam',CHARMANDER:'Glumanda',SQUIRTLE:'Schiggy',MAGIKARP:'Karpador',MEWTWO:'Mewtu',MIME_JR:'Pantimimi',MEWTWO_ARMORED:'Mewtu in Rüstung',TAUROS_AQUA:'Paldea-Tauros (Flutenvariante)',TATSUGIRI_DROOPY:'Nigiragi (Hängende Form)',ENAMORUS_THERIAN:'Cupidos (Tiergeistform)'}))assert.equal(names[id],name);
});
test('Only explicit eight Pikachu costumes are hidden; true forms remain',()=>{
 const aliases=read('../src/cosmetic-aliases.json');assert.equal(Object.keys(aliases).length,8);
 for(const [id,entry]of Object.entries(aliases)){assert.match(id,/^PIKACHU_/);assert.equal((entry as {target:string}).target,'PIKACHU');assert.ok(!catalog.some((p:{id:string})=>p.id===id));}
 for(const id of ['MEWTWO_ARMORED','BURMY_SANDY','GENESECT_DOUSE','KELDEO_RESOLUTE','TATSUGIRI_CURLY','RATTATA_ALOLAN'])assert.ok(catalog.some((p:{id:string})=>p.id===id));
});
test('All 78 advanced boss entries resolve to German names or explicit source-backed form aliases',()=>{
 const source=readFileSync(new URL('../src/data.ts',import.meta.url),'utf8');
 const bosses=[...source.matchAll(/\{ name: "(.*?)", nameJa:/g)].map(match=>match[1]!);
 assert.equal(bosses.length,78);
 const key=(value:string)=>value.toLowerCase().replace(/[^a-z0-9]/g,'');
 for(const boss of bosses) assert.ok(['Deoxys Normal','Hoopa Confined'].includes(boss) || catalog.some((p:{name:string;id:string})=>key(p.name)===key(boss)&&names[p.id]),boss);
});
