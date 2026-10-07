import { mkdirSync, writeFileSync } from 'node:fs';
mkdirSync('public/fonts/pricing', {recursive:true});
const url='https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,500;0,800;0,900;1,900&display=swap';
const response=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36'},signal:AbortSignal.timeout(20000)});
if(!response.ok)throw Error(`Font stylesheet ${response.status}`);
const css=await response.text();
const selected=new Map();
for(const block of css.matchAll(/@font-face\s*\{([^}]+)\}/g)){const body=block[1];const style=body.match(/font-style:\s*(\w+)/)?.[1];const weight=body.match(/font-weight:\s*(\d+)/)?.[1];const source=body.match(/url\(([^)]+)\)/)?.[1];if(source)selected.set(`${style}-${weight}`,source);}
for(const [key,source]of selected){const font=await fetch(source,{signal:AbortSignal.timeout(20000)});if(!font.ok)throw Error(`Font ${key} ${font.status}`);writeFileSync(`public/fonts/pricing/barlow-condensed-${key}.woff2`,Buffer.from(await font.arrayBuffer()));console.log(key);}
writeFileSync('public/fonts/pricing/source.json',JSON.stringify({family:'Barlow Condensed',source:url,license:'SIL Open Font License 1.1'},null,2));
