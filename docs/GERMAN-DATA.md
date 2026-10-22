# German names and catalog scope

The user-facing catalog contains **1,065 species/forms**, with **1,065 unique German labels**, no missing species and no English fallback. German species names come from PokeAPI's `pokemon_species_names.csv`, language 6; form labels come from `pokemon_forms.csv` and `pokemon_form_names.csv` at pinned commit `2bf639e5572812a67d2b94903fdcb9d095f5aeb2`. These are established structured game-localization data, not literal translations of English names. The existing `POKEAPI-LICENSE.txt` applies. Numeric stats retain the separately pinned PvPoke source and license.

Refresh with the same CSV inputs documented in JAPANESE-DATA.md:

```
python3 scripts/update-german-names.py /path/to/csvs
```

The generator fails on unknown form identifiers and duplicate labels. Nine explicit identifier aliases bridge catalog/PokeAPI naming differences; twelve explicit labels cover GO nomenclature or incomplete source rows. The source's full `pokemon_name` is deliberately not used blindly: the German Cupidos row incorrectly contains English Enamorus. Regional forms retain their German species name and localized form descriptor. Pantimimi has no redundant “Jr” suffix. Rotom, Kyurem and Hoopa labels already containing the species name are not duplicated. Advanced-only labels Deoxys Normalform and Gebanntes Hoopa use pinned form rows 386 and 720.

Official naming checks for overrides:

- [Paldea-Tauros variants](https://pokemongo.com/de/news/stunning-styles-2025): Gefechtsvariante, Flammenvariante, Flutenvariante.
- [Nigiragi forms](https://pokemongo.com/de/post/water-festival-2025): Gebogene Form, Hängende Form, Gestreckte Form.
- [Mewtu in Rüstung](https://pokemongo.com/de/news/armoredmewtworaids2019).
- [Paldea-Felino](https://pokemongo.com/de/news/communityday-november-2023-wooper).
- [Cupidos Inkarnationsform](https://pokemongo.com/de/post/elite-raids-incarnate-enamorus).
- [Fragrunz](https://www.pokemon.com/de/pokedex/fragrunz): female form remains distinct.
- [Meteno](https://www.pokemon.com/de/pokedex/meteno): **one transparent naming limitation**. PvPoke's `MINIOR_CORE` does not specify a color. “Meteno (Kern)” is a descriptive color-unspecified label, not a claim that this is an official color-specific form name. The generator does not invent a color. All other entries have source-backed species/form labels.

## Costume cleanup

Exactly eight cosmetic Pikachu entries are excluded by an explicit allowlist in `src/cosmetic-aliases.json`: 5th Anniversary, Flying, Horizons, Kariyushi, Libre, Pop Star, Rock Star and Shaymin Scarf. All eight have the same Dex, attack 112, defense 96, stamina 111, Electric type and encounter-policy fields as Pikachu in the pinned PvPoke snapshot. The refresh script checks stat/type equivalence before exclusion and fails if it changes. This is not general deduplication by equal stats.

All retained records are unchanged. Genuine forms remain even when stats coincide: Burmy cloaks, Cherrim forms, Keldeo forms, Genesect drives, Meowstic genders and Tatsugiri forms. Armored Mewtwo remains because it is stat-distinct (182/278/214 versus Mewtwo 300/182/214). Eight old IDs, old English names and Japanese costume labels resolve to Pikachu; they are not displayed as separate search/reference entries. Japanese labels for removed costumes remain only as compatibility aliases. Trade-app data is untouched.

English, Japanese and German aliases remain searchable in every language. German accents and ß accept normalized equivalents without removing Japanese voicing marks. Language links, saved preferences and the browser locale accept `de`; advanced shared links retain their language. All copy, errors, result details, types, reference dialogs and advanced controls are localized; German uses WP, Crypto-Pokémon, Erlösen, Angriff, Verteidigung and KP. Percent decimals use a comma in German. No runtime localization fetch is required; data works offline.
