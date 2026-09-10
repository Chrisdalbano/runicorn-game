import fs from 'node:fs';
import {build,transform} from 'esbuild';
import {minify} from 'terser';
import {zipSync,strToU8,unzipSync} from 'fflate';
import {createHash} from 'node:crypto';
import {Packer,defaultSparseSelectors} from 'roadroller';
import {deflateAsync} from '@gfx/zopfli';
const verify=process.argv.includes('--verify');
const result=await build({entryPoints:['src/game.js'],bundle:true,write:false,format:'iife',target:'es2020',define:{__DEV__:String(verify)}});
let source=result.outputFiles[0].text;
// The original pixel font maps lowercase to capitals. Normalize prose for packing.
source=source.replace(/"(?:[^"\\]|\\.)*"/g,literal=>{try{const value=JSON.parse(literal);return value.includes(' ')&&!value.includes('px ')?JSON.stringify(value.toUpperCase()):literal;}catch{return literal;}});
const ids=['gun','pierce','ricochet','haste','recharge','longdash','trail','blast','magnet','shield','heart','requiem','nyan','herb'];
const compactIds=ids.map((_,i)=>String.fromCharCode(65+i));
ids.forEach((id,i)=>source=source.replace(new RegExp('\\b'+id+'\\b','g'),compactIds[i]));
let template=fs.readFileSync('index.html','utf8'),cssSource=fs.readFileSync('src/style.css','utf8');
const domNames=[...new Set([...template.matchAll(/(?:id|class)="([^"]+)"/g)].flatMap(m=>m[1].split(' ')))];
const domMap=Object.fromEntries(domNames.map((n,i)=>[n,(i<26?'':String.fromCharCode(96+Math.floor(i/26)))+String.fromCharCode(97+i%26)]));
if(new Set(Object.values(domMap)).size!==domNames.length)throw Error('Duplicate DOM identifiers');
for(const [name,short] of Object.entries(domMap)){
 source=source.replaceAll('\"'+name+'\"','\"'+short+'\"').replaceAll("'"+name+"'","'"+short+"'");
 cssSource=cssSource.replace(new RegExp('([#.])'+name+'(?![\\w-])','g'),'$1'+short);
}
template=template.replace(/(id|class)="([^"]+)"/g,(_,a,b)=>a+'="'+b.split(' ').map(n=>domMap[n]).join(' ')+'"');
const js=await minify(source,{compress:{passes:10,keep_fargs:false,unsafe_arrows:true,ecma:2020,unsafe:true,unsafe_math:false},mangle:{toplevel:true,properties:{reserved:[...compactIds,'__verify']}},format:{comments:false}});
const fontCSS=cssSource.match(/@font-face\{[^}]+\}/)[0].replace('../art/runicorn.woff2','data:;base64,'+fs.readFileSync('art/runicorn.woff2').toString('base64'));
const css=(await transform(cssSource.replace(/@font-face\{[^}]+\}/,''),{loader:'css',minify:true})).code;
const body=template.match(/<body>([\s\S]*)<script type="module"/)[1].replace(/>\s+</g,'><').replace(/>([^<>]+)</g,(_,t)=>'>'+t.toUpperCase()+'<').replace(/="([\w./#:-]+)"/g,'=$1');
const payload=`document.body.innerHTML=${JSON.stringify('<style>'+fontCSS+css+'</style>'+body)};${js.code}`;
const tuningFile='scripts/packing.json',retune=process.argv.includes('--retune')||!fs.existsSync(tuningFile);
const options=retune?{sparseSelectors:defaultSparseSelectors(12)}:JSON.parse(fs.readFileSync(tuningFile,'utf8'));
const packer=new Packer([{data:payload,type:'js',action:'eval'}],{...options,maxMemoryMB:96});
if(retune){const optimized=await packer.optimize(2);fs.writeFileSync(tuningFile,JSON.stringify(optimized.best,null,2)+'\n');}
const {firstLine,secondLine}=packer.makeDecoder();
let html=template.slice(0,template.indexOf('<body>')).trim().replace('<link rel="stylesheet" href="src/style.css">','').replace(/<\/?head>/g,'').replace(/="([\w-]+)"/g,'=$1')+'<body><script>'+firstLine+secondLine+'</script>';
if(verify){fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/packed-probe.html',html);process.exit(0);}
const original=Buffer.from(zipSync({'index.html':[strToU8(html),{mtime:new Date(2026,7,13,12)}]},{level:9}));
// Recompress the sole ZIP entry with standard DEFLATE. No custom runtime decoder for ZIP.
const raw=Buffer.from(await deflateAsync(Buffer.from(html),{numiterations:300}));
const end=Buffer.from(original.subarray(-22)),centralOffset=end.readUInt32LE(16);
const local=Buffer.from(original.subarray(0,30+original.readUInt16LE(26)+original.readUInt16LE(28)));
if(local.readUInt16LE(6)&8)throw Error('Unexpected ZIP data descriptor');
const central=Buffer.from(original.subarray(centralOffset,-22));
local.writeUInt32LE(raw.length,18);central.writeUInt32LE(raw.length,20);end.writeUInt32LE(local.length+raw.length,16);
const zip=Buffer.concat([local,raw,central,end]);
fs.mkdirSync('dist',{recursive:true});fs.writeFileSync('dist/dom.json',JSON.stringify(domMap));fs.writeFileSync('dist/index.html',html);fs.writeFileSync('dist/runicorn.zip',zip);
const unpacked=unzipSync(zip);
if(Object.keys(unpacked).join()!=='index.html'||Buffer.from(unpacked['index.html']).toString()!==html)throw Error('Invalid archive');
const report={bytes:zip.length,limit:13312,remaining:13312-zip.length,sha256:createHash('sha256').update(zip).digest('hex'),htmlBytes:Buffer.byteLength(html)};
fs.writeFileSync('dist/size.json',JSON.stringify(report,null,2)+'\n');console.log(report);
if(zip.length>13312){console.error('Competition size limit exceeded');process.exitCode=1;}
