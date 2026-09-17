import {mkdir,writeFile,access,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const directory=new URL('../public/assets/materials/',import.meta.url);
await mkdir(directory,{recursive:true});
const manifest=[];
async function download(file,name,source,license='CC0'){
  if(!file?.url)throw new Error('Missing asset '+name);
  const out=new URL(name,directory);
  try{await access(out);manifest.push({file:name,source,url:file.url,license,bytes:(await stat(out)).size});console.log('Reusing',name);return;}catch{}
  const response=await fetch(file.url);
  if(!response.ok)throw new Error(`${name}: ${response.status}`);
  const bytes=Buffer.from(await response.arrayBuffer());
  if(file.md5&&createHash('md5').update(bytes).digest('hex')!==file.md5)throw new Error('Asset integrity failure: '+name);
  await writeFile(out,bytes);
  manifest.push({file:name,source,url:file.url,license,bytes:bytes.length});
  console.log('Downloaded',name,bytes.length);
}
for(const [id,name] of [['aerial_grass_rock','grass'],['concrete_wall_006','concrete'],['coast_sand_rocks_02','rock'],['wood_planks_dirt','wood'],['oak_veneer_01','oak']]){
  const r=await fetch('https://api.polyhaven.com/files/'+id);
  if(!r.ok)throw new Error('Unavailable source: '+id);
  const files=await r.json();
  await download(files.Diffuse['1k'].jpg,name+'-colour.jpg','https://polyhaven.com/a/'+id);
  await download(files.nor_gl['1k'].jpg,name+'-normal.jpg','https://polyhaven.com/a/'+id);
}
const tree=await(await fetch('https://api.polyhaven.com/files/tree_small_02')).json();
await download(tree.leaves_diff['1k'].png,'leaves.png','https://polyhaven.com/a/tree_small_02');
await download(tree.leaves_alpha['1k'].png,'leaves-alpha.png','https://polyhaven.com/a/tree_small_02');
const sky=await(await fetch('https://api.polyhaven.com/files/overcast_soil')).json();
await download(sky.hdri['1k'].hdr,'daylight.hdr','https://polyhaven.com/a/overcast_soil');
await download({url:'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_2k.jpg'},'moon-colour.jpg','https://svs.gsfc.nasa.gov/4720','NASA SVS — credit required; see source media-use guidance');
await download({url:'https://www.solarsystemscope.com/textures/download/2k_mars.jpg'},'mars-colour.jpg','https://www.solarsystemscope.com/textures/','CC BY 4.0 — Solar System Scope / INOVE');
await writeFile(new URL('sources.json',directory),JSON.stringify(manifest,null,2)+'\n');
