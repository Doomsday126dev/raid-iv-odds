import aliases from "./cosmetic-aliases.json";
const normalize = (value:string) => value.normalize("NFKC").toLowerCase().replace(/[\s_()（）-]/g, "");
export function cosmeticTarget(value:string):string|undefined {
  const q=normalize(value);
  return Object.entries(aliases).find(([id,entry]) => [id,entry.english,entry.japanese].some(alias=>normalize(alias)===q))?.[1].target;
}
export function cosmeticSearchAliases(target:string):string[] {
  return Object.entries(aliases).filter(([,entry])=>entry.target===target).flatMap(([id,entry])=>[id,entry.english,entry.japanese]);
}
