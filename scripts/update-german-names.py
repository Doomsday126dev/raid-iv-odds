"""Pinned PokeAPI German names. Usage: python3 scripts/update-german-names.py CSV_DIRECTORY.
Inputs and explicit GO form nomenclature are documented in docs/GERMAN-DATA.md.
Unknown forms fail rather than silently falling back to English.
"""
import csv,json,sys,re
from pathlib import Path
base=Path(sys.argv[1])
def rows(name): return list(csv.DictReader((base/name).open()))
species={int(r['pokemon_species_id']):r['name'] for r in rows('raid-ja-species.csv') if r['local_language_id']=='6'}
forms={r['identifier']:r for r in rows('raid-forms.csv')}
labels={r['pokemon_form_id']:r['form_name'] for r in rows('raid-ja-forms.csv') if r['local_language_id']=='6' and r['form_name']}
aliases={'CHERRIM_SUNNY':'cherrim-sunshine','MEOWSTIC':'meowstic-male','ZYGARDE':'zygarde-50','NECROZMA_DAWN_WINGS':'necrozma-dawn','NECROZMA_DUSK_MANE':'necrozma-dusk','ZACIAN_CROWNED_SWORD':'zacian-crowned','ZACIAN_HERO':'zacian','ZAMAZENTA_CROWNED_SHIELD':'zamazenta-crowned','ZAMAZENTA_HERO':'zamazenta'}
# Official GO form labels where GO/source identifiers differ; Meteno is explicitly color-unspecified.
overrides={'TAUROS_AQUA':'Paldea-Tauros (Flutenvariante)','TAUROS_BLAZE':'Paldea-Tauros (Flammenvariante)','TAUROS_COMBAT':'Paldea-Tauros (Gefechtsvariante)','MEWTWO_ARMORED':'Mewtu in Rüstung','WOOPER_PALDEAN':'Paldea-Felino','MIME_JR':'Pantimimi','MINIOR_CORE':'Meteno (Kern)','ENAMORUS_INCARNATE':'Cupidos (Inkarnationsform)','OINKOLOGNE_FEMALE':'Fragrunz (Weiblich)','TATSUGIRI_CURLY':'Nigiragi (Gebogene Form)','TATSUGIRI_DROOPY':'Nigiragi (Hängende Form)','TATSUGIRI_STRETCHY':'Nigiragi (Gestreckte Form)'}
output={}
for p in json.loads(Path('src/catalog.json').read_text())['pokemon']:
 name=species[p['dex']]
 if p['id'] in overrides: name=overrides[p['id']]
 elif '(' in p['name']:
  ident=aliases.get(p['id'],p['id'].lower().replace('_','-').replace('alolan','alola').replace('galarian','galar').replace('hisuian','hisui').replace('paldean','paldea'))
  record=forms.get(ident);suffix=labels.get(record['id']) if record else None
  if not suffix: raise ValueError(f'Unmapped form {p["id"]}: {ident}')
  name=suffix if name in suffix else f'{name} ({suffix})'
 output[p['id']]=name
assert len(set(output.values()))==len(output), 'Duplicate German form names'
Path('src/german-names.json').write_text(json.dumps({'source':'https://github.com/PokeAPI/pokeapi','revision':'2bf639e5572812a67d2b94903fdcb9d095f5aeb2','names':output},ensure_ascii=False,separators=(',',':')))
print(f'Generated {len(output)} unique German species/form names')
