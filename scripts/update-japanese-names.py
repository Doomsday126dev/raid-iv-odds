"""Generate local Japanese names from pinned PokeAPI CSVs; no runtime fetch.
Usage: python3 scripts/update-japanese-names.py /directory/with/CSV inputs
See docs/JAPANESE-DATA.md for source naming and provenance.
"""
import csv,json,sys,re
from pathlib import Path
base=Path(sys.argv[1])
def rows(name): return list(csv.DictReader((base/name).open()))
species={int(r['pokemon_species_id']):r['name'] for r in rows('raid-ja-species.csv') if r['local_language_id']=='1'}
forms={r['identifier']:r for r in rows('raid-forms.csv')}
formnames={r['pokemon_form_id']:r['form_name'] for r in rows('raid-ja-forms.csv') if r['local_language_id']=='1' and r['form_name']}
# GO-only costumes, common cross-source aliases and display variants. These are
# display labels, not claims that a form is currently catchable.
labels={'Alolan':'アローラのすがた','Galarian':'ガラルのすがた','Hisuian':'ヒスイのすがた','Paldean':'パルデアのすがた','5th Anniversary':'そらをとぶ・5周年','Flying':'そらをとぶ','Horizons':'キャップ','Kariyushi':'かりゆし','Libre':'マスクド','Pop Star':'アイドル','Rock Star':'ハードロック','Shaymin Scarf':'シェイミのスカーフ','Aqua':'パルデア・ウォーター','Blaze':'パルデア・ブレイズ','Combat':'パルデア・コンバット','Armored':'アーマード','Rainy':'あまみずのすがた','Snowy':'ゆきぐものすがた','Sunny':'たいようのすがた','Attack':'アタックフォルム','Defense':'ディフェンスフォルム','Speed':'スピードフォルム','Plant':'くさきのミノ','Sandy':'すなちのミノ','Trash':'ゴミのミノ','Overcast':'ネガフォルム','Sunshine':'ポジフォルム','Jr':'ジュニア','Fan':'スピン','Frost':'フロスト','Heat':'ヒート','Mow':'カット','Wash':'ウォッシュ','Origin':'オリジンフォルム','Altered':'アナザーフォルム','Land':'ランドフォルム','Sky':'スカイフォルム','Standard':'ノーマルモード','Incarnate':'けしんフォルム','Therian':'れいじゅうフォルム','Black':'ブラック','White':'ホワイト','Ordinary':'いつものすがた','Resolute':'かくごのすがた','Aria':'ボイスフォルム','Burn':'ブレイズカセット','Chill':'フリーズカセット','Douse':'アクアカセット','Shock':'イナズマカセット','Female':'メス','Male':'オス','Shield':'シールドフォルム','Average':'ふつうのサイズ','Large':'おおきいサイズ','Small':'ちいさいサイズ','Super':'とくだいサイズ','10% Forme':'10％フォルム','50% Forme':'50％フォルム','Complete Forme':'パーフェクトフォルム','Unbound':'ときはなたれしすがた','Baile':'めらめらスタイル',"Pa'u":'ふらふらスタイル','Pom-Pom':'ぱちぱちスタイル','Sensu':'まいまいスタイル','Dusk':'たそがれのすがた','Midday':'まひるのすがた','Midnight':'まよなかのすがた','Core':'コア','Dawn Wings':'あかつきのつばさ','Dusk Mane':'たそがれのたてがみ','Full Belly':'まんぷくもよう','Crowned Sword':'けんのおう','Hero':'れきせんのゆうしゃ','Crowned Shield':'たてのおう','Rapid Strike':'れんげきのかた','Single Strike':'いちげきのかた','Curly':'カールフォルム','Droopy':'たれたフォルム','Stretchy':'のびたフォルム'}
catalog=json.loads(Path('src/catalog.json').read_text())
output={}
for p in catalog['pokemon']:
 name=species[p['dex']]
 form=re.search(r'\((.*)\)',p['name'])
 if form:
  ident=p['id'].lower().replace('_','-').replace('alolan','alola').replace('galarian','galar').replace('hisuian','hisui').replace('paldean','paldea')
  record=forms.get(ident)
  suffix=formnames.get(record['id']) if record else None
  suffix=suffix or labels[form[1]]
  name+=f'（{suffix}）'
 output[p['id']]=name
Path('src/japanese-names.json').write_text(json.dumps({'source':'https://github.com/PokeAPI/pokeapi','revision':'2bf639e5572812a67d2b94903fdcb9d095f5aeb2','names':output},ensure_ascii=False,separators=(',',':')))
print(f'Generated {len(output)} Japanese species/form labels')
