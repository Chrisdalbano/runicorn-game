import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {stats,achievements} from '../src/wavedash-catalog.js';
const cli='vendor/wavedash-cli/wavedash.exe',game='j970hj6zbxbbfjqw6b5bfyb9vs8e3sag';
const file='docs/wavedash-resources.json';
const receipt=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):{game,stats:{},achievements:{}};
if(receipt.game!==game)throw Error('Resource receipt belongs to another game');
const existing=JSON.parse(execFileSync(cli,['achievement','list','--game-id',game,'--json'],{encoding:'utf8'}));
if(!process.argv.includes('--apply')){console.log({game,stats,achievements,existing});process.exit(0);}
function create(kind,id,args){
 const output=execFileSync(cli,[kind,'create','--game-id',game,'--identifier',id,...args],{encoding:'utf8'});
 receipt[kind==='stat'?'stats':'achievements'][id]=output.trim();
 fs.writeFileSync(file,JSON.stringify(receipt,null,2)+'\n');console.log(output.trim());
}
for(const [id,name] of stats)if(!receipt.stats[id])create('stat',id,['--name',name]);
for(const [id,title,description] of achievements){
 if(receipt.achievements[id]||existing.some(a=>a.identifier===id))continue;
 create('achievement',id,['--title',title,'--description',description,'--image','promo/achievements/'+id+'.png']);
}
const verified=JSON.parse(execFileSync(cli,['achievement','list','--game-id',game,'--json'],{encoding:'utf8'}));
fs.writeFileSync('docs/wavedash-achievements.json',JSON.stringify(verified,null,2)+'\n');
if(!achievements.every(([id])=>verified.some(a=>a.identifier===id)))throw Error('Achievement verification failed');
console.log('Verified all eight remote achievement definitions.');
