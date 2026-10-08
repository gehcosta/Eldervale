'use strict';
(() => {
 const SIZE=192,REGION=24;
 const hash=(x,y,seed=0)=>{let n=Math.imul(x+seed*113,374761393)+Math.imul(y+seed*71,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;};
 function normalizeSeed(value){if(Number.isInteger(value)&&value>=0&&value<=2147483647)return value;const text=String(value||'eldervale').slice(0,80);let seed=2166136261;for(let i=0;i<text.length;i++){seed^=text.charCodeAt(i);seed=Math.imul(seed,16777619);}return (seed>>>0)&2147483647;}
 function noise(x,y,seed){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,a=fx*fx*(3-2*fx),b=fy*fy*(3-2*fy),lerp=(p,q,t)=>p+(q-p)*t;return lerp(lerp(hash(ix,iy,seed+2),hash(ix+1,iy,seed+2),a),lerp(hash(ix,iy+1,seed+2),hash(ix+1,iy+1,seed+2),a),b);}
 const SITES=Object.freeze([
  {id:'mine-0',x:54,y:44,w:3,h:2.4,kind:'mine',name:'Mina de Prataverde',description:'Veios luminosos conduzem a galerias antigas. Uma expedição encontra minério e cristais.',material:'ore',amount:4},
  {id:'sawmill-0',x:35,y:39,w:3.4,h:2.3,kind:'sawmill',name:'Serraria do Carvalho',description:'As engrenagens silenciosas guardam reservas de madeira para reconstruir o vale.',material:'wood',amount:5},
  {id:'mill-0',x:17,y:42,w:2.8,h:2.8,kind:'mill',name:'Moinho de Mira',description:'As velas voltam a girar. Entre os sacos de grãos há ervas secas e histórias da velha vila.',material:'herb',amount:4},
  {id:'watchtower-0',x:37,y:47,w:2.4,h:2.4,kind:'watchtower',name:'Torre dos Vigias',description:'Do alto da torre, a névoa recua. O símbolo da aurora aponta para a Coroa das Cinzas.',material:'crystal',amount:2},
  {id:'temple-0',x:69,y:57,w:3.7,h:3,kind:'temple',name:'Santuário das Raízes',description:'Inscrições falam de Vyrath não como inimigo, mas como guardião de um pacto esquecido.',material:'crystal',amount:3},
  {id:'camp-0',x:63,y:38,w:3.2,h:2.3,kind:'camp',name:'Acampamento dos Batedores',description:'Mapas amarelados revelam os caminhos das expedições além da fronteira.',material:'wood',amount:3},
  {id:'library-0',x:32,y:20,w:2.4,h:2.3,kind:'library',name:'Arquivo da Aurora',description:'Nara decifra a história do vale: três nascentes alimentavam o pacto. Sua luz está enfraquecendo.',material:'crystal',amount:1}
 ]);
 function roadAt(x,y){
  if(x<96&&y<96)return (Math.abs(y-29)<.85&&x>28)||(Math.abs(x-65)<.85&&y>29&&y<59)||(Math.abs(y-57)<.85&&x>47)||(y>16&&y<29&&Math.abs(x-(65+(29-y)*.92))<.9)||(Math.abs(x-35)<.85&&y>29&&y<40)||(Math.abs(y-43)<.85&&x>16&&x<36)||(Math.abs(x-37)<.85&&y>39&&y<48)||(Math.abs(y-44)<.85&&x>37&&x<66)||(Math.abs(x-17)<.85&&y>29&&y<44);
  const lx=(x+REGION)%REGION,ly=(y+REGION)%REGION;return Math.abs(lx-12)<1||Math.abs(ly-12)<1||(Math.abs(lx-8)<1&&ly>9&&ly<13)||(Math.abs(y-29)<1&&x<110)||(Math.abs(x-65)<1&&y<110);
 }
 function terrainAt(x,y,seed=0){
  if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>=SIZE||y>=SIZE)return 'void';
  const river=43+Math.sin(y*.115)*4;
  if(Math.abs(x-river)<1.6){const crossing=(y>=27&&y<=31)||(y>=56&&y<=59)||(y>=42&&y<=46)||(y>=95&&Math.abs((y+REGION)%REGION-12)<1.7);return crossing?'bridge':'water';}
  if(Math.hypot(x-77,y-16)<9)return noise(x*.17,y*.17,seed)>.45?'ash':'dark';
  if(Math.hypot(x-25,y-29)<11){if(Math.abs(y-29)<1.5||Math.abs(x-25)<1.3||Math.hypot(x-25,y-29)<3.5)return 'paving';return 'meadow';}
  if(roadAt(x,y))return 'path';
  const n=noise(x*.095,y*.095,seed);return n>.68?'meadow':n<.3?'dark':'grass';
 }
 function createState(seed=0){return {version:1,seed:normalizeSeed(seed),generated:[],harvested:[],visited:[],looted:[]};}
 const validRegion=id=>typeof id==='string'&&/^[0-7],[0-7]$/.test(id);
 const validObject=id=>typeof id==='string'&&id.length<80&&/^(?:resource-\d+-\d+-\d+|site-\d+-\d+|(?:mine|sawmill|mill|watchtower|temple|camp|library)-0)$/.test(id);
 function normalizeState(source){const state=createState(source?.seed??0);if(source&&source.version!==1)return state;for(const key of ['generated','harvested','visited','looted'])if(Array.isArray(source?.[key]))state[key]=[...new Set(source[key].filter(key==='generated'?validRegion:validObject))].slice(0,key==='generated'?64:3000);return state;}
 function regionId(x,y){return clampRegion(Math.floor(x/REGION))+','+clampRegion(Math.floor(y/REGION));}
 const clampRegion=n=>Math.max(0,Math.min(7,n));
 const inBuilding=(x,y,b,margin=1)=>Math.abs(x-b.x)<b.w/2+margin&&Math.abs(y-b.y)<b.h/2+margin;
 function generateRegion(seed,rx,ry){
  if(!Number.isInteger(rx)||!Number.isInteger(ry)||rx<0||ry<0||rx>7||ry>7)return null;
  seed=normalizeSeed(seed);const id=rx+','+ry,frontier=rx>=4||ry>=4,result={id,props:[],resources:[],sites:[],enemies:[]},ox=rx*REGION,oy=ry*REGION,salt=seed+rx*97+ry*211;
  if(frontier){const kinds=['mine','sawmill','mill','watchtower','temple','camp','observatory'],kind=kinds[Math.floor(hash(rx,ry,salt)*kinds.length)],center={x:ox+8,y:oy+8};result.sites.push({id:'site-'+rx+'-'+ry,...center,w:3.2,h:2.6,kind,name:({mine:'Mina',sawmill:'Serraria',mill:'Moinho',watchtower:'Torre',temple:'Santuário',camp:'Acampamento',observatory:'Observatório'})[kind]+' da Fronteira '+(ry*8+rx+1),description:'Uma construção esquecida revela novas pistas sobre as expedições do vale. Explore para recuperar seus suprimentos.',material:kind==='mine'?'ore':kind==='sawmill'?'wood':kind==='temple'||kind==='observatory'?'crystal':'herb',amount:3+Math.floor(hash(rx,ry,seed)*3)});
   for(let i=0;i<26;i++){const x=ox+2+hash(i,rx,salt)*20,y=oy+2+hash(ry,i,salt+3)*20;if(['water','bridge','path'].includes(terrainAt(x,y,seed))||result.sites.some(b=>inBuilding(x,y,b,3)))continue;result.props.push({x,y,kind:hash(i,ry,salt+8)>.2?'tree':'rock',scale:.7+hash(i,rx,salt+9)*.7,variant:hash(i,ry,salt+10),solid:true,radius:.35});}
   for(let i=0;i<3;i++){const x=ox+11+i*3,y=oy+15;if(terrainAt(x,y,seed)!=='water')result.enemies.push({id:1000+ry*100+rx*10+i,type:hash(rx,i,salt)>.5?'goblin':'slime',x,y});}
  }
  const siteBuildings=frontier?result.sites:SITES;
  for(let i=0;i<12;i++){
   let x=ox+3+hash(i,rx,salt+15)*18,y=oy+3+hash(ry,i,salt+16)*18;
   if(rx===1&&ry===1&&i<6){x=33.5+(i%3)*1.7;y=32+Math.floor(i/3)*1.8;}
   if(terrainAt(x,y,seed)==='water'||siteBuildings.some(b=>inBuilding(x,y,b,1.7))||(x<34&&y<38&&x>15&&y>18&&!(x>30&&y>31)))continue;
   const material=rx===1&&ry===1&&i<6?['wood','ore','herb','wood','ore','crystal'][i]:['wood','ore','herb','crystal'][Math.floor(hash(i,ry,salt+17)*4)];
   result.resources.push({id:'resource-'+rx+'-'+ry+'-'+i,x,y,kind:'resource',material,amount:material==='crystal'?2:2+Math.floor(hash(i,rx,salt+18)*2),solid:false,scale:1});
  }
  const clearings=[...result.resources,...result.sites.map(s=>({x:s.x,y:s.y+s.h/2+1}))];result.props=result.props.filter(p=>!clearings.some(c=>Math.hypot(p.x-c.x,p.y-c.y)<1.6));
  return result;
 }
 function runTests(){const results=[],test=(name,fn)=>{try{if(!fn())throw new Error('Resultado inesperado');results.push({name,passed:true});}catch(error){results.push({name,passed:false,error:error.message});}};
  test('GenerateRegion_SameSeed_IsDeterministic',()=>JSON.stringify(generateRegion(123,4,2))===JSON.stringify(generateRegion(123,4,2)));
  test('GenerateRegion_DifferentSeeds_ProducesVariation',()=>JSON.stringify(generateRegion(123,4,2))!==JSON.stringify(generateRegion(124,4,2)));
  test('GenerateRegion_InvalidCoordinates_Rejects',()=>generateRegion(1,-1,2)===null&&generateRegion(1,8,0)===null);
  test('GenerateRegion_Frontier_HasExplorableSiteAndResources',()=>{const r=generateRegion(77,4,4);return r.sites.length===1&&r.resources.length>0&&r.props.length>0;});
  test('GenerateRegion_Core_DoesNotDuplicateDecorations',()=>generateRegion(12,1,1).props.length===0&&generateRegion(12,1,1).resources.length>=6);
  test('NormalizeState_InvalidAndDuplicateIds_RemovesUnsafeValues',()=>{const s=normalizeState({version:1,seed:22,generated:['4,4','4,4','99,3'],harvested:['resource-1-1-0','../x']});return s.generated.length===1&&s.harvested.length===1&&s.seed===22;});
  test('TerrainAt_BridgeAndRiver_AreDistinct',()=>terrainAt(43+Math.sin(29*.115)*4,29)==='bridge'&&terrainAt(43+Math.sin(20*.115)*4,20)==='water');
  test('TerrainAt_FrontierRoads_ConnectRegions',()=>terrainAt(108,96,10)==='path'&&terrainAt(120,108,10)==='path');
  test('GenerateRegion_Resources_DoNotSpawnInWater',()=>{for(let y=0;y<8;y++)for(let x=0;x<8;x++)if(generateRegion(987,x,y).resources.some(r=>terrainAt(r.x,r.y,987)==='water'))return false;return true;});
  return results;
 }
 window.EldervaleWorld=Object.freeze({SIZE,REGION,SITES,hash,normalizeSeed,terrainAt,createState,normalizeState,regionId,generateRegion,runTests});
})();
