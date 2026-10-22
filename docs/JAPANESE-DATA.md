# Japanese localization data

Japanese species names are from PokeAPI `pokemon_species_names.csv`, language 1 (Japanese kana). Form names are matched by gameplay-form identifier to `pokemon_forms.csv` / `pokemon_form_names.csv`; documented GO display labels in `scripts/update-japanese-names.py` cover source-specific aliases/costumes. These labels describe forms, not current availability. All 1,065 catalog entries receive Japanese species/form display names. English aliases, canonical IDs and Pokédex numbers remain searchable in either language. Hiragana, katakana and half-width input are normalized for Japanese search.

Pinned upstream commit: `2bf639e5572812a67d2b94903fdcb9d095f5aeb2`

Source: https://github.com/PokeAPI/pokeapi/tree/2bf639e5572812a67d2b94903fdcb9d095f5aeb2/data/v2/csv

Attribution and redistribution terms are retained in `POKEAPI-LICENSE.txt`. Pokémon names remain trademarks of their owners. Numeric stats continue to come from the separately pinned PvPoke catalog.

Refresh: download the pinned `pokemon_species_names.csv`, `pokemon_form_names.csv`, `pokemon_forms.csv`, and `pokemon.csv` into a directory, naming them `raid-ja-species.csv`, `raid-ja-forms.csv`, `raid-forms.csv`, and `raid-pokemon.csv`. Run `python3 scripts/update-japanese-names.py DIRECTORY` from repository root. The script fails for unknown form-label aliases rather than silently conflating forms. Review changes against source names before updating the pin.

Language precedence: explicit `lang`/`language` link, current saved preference, prior calculator preference, then browser language. Canonical species IDs, CP, encounter category and reference search are retained across English/日本語 switching. Legacy hash-language links route to the advanced calculator with their original hash precedence.

Eight removed cosmetic Pikachu labels remain in cosmetic-aliases.json for legacy search/URL compatibility; they are not separate catalog entries.
