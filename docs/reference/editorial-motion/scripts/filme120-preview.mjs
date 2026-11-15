import {bundle} from '@remotion/bundler';
import {openBrowser, selectComposition, renderStill, renderMedia} from '@remotion/renderer';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const concursos=process.argv.includes('--concursos');
const desktop=process.argv.includes('--desktop')||concursos;
const out=path.join(root,concursos?'out/concursos-review':desktop?'out/filme120-desktop-review':'out/filme120-review');
await mkdir(out,{recursive:true});
const timing=JSON.parse(await readFile(path.join(root,concursos?'src/concursos-timing.json':'src/filme120-timing.json'),'utf8'));
const clean=s=>s.toLocaleLowerCase('pt-BR').replace(/[^\p{L}\p{N}]/gu,'');
const cue=(b,p)=>{
  const parts=p.split(' ').map(clean),words=timing.blocks[b].words;
  const i=words.findIndex((_,i)=>parts.every((p,j)=>clean(words[i+j]?.text??'')===p));
  if(i<0)throw new Error(p);
  return Math.round(words[i].start*30);
};
const starts=[0,cue(0,'Conectar conteúdos'),timing.blocks[1].start,cue(1,'plano'),timing.blocks[2].start,cue(2,'Assim'),timing.blocks[3].start,cue(3,'O quadro'),timing.blocks[4].start,cue(4,'os simulados'),timing.blocks[5].start,cue(5,'Com o painel'),timing.blocks[6].start];
const names=['conteudo','dispersao','caderna','plano','apostila','leitura','voz','quadro','quiz','simulado','marca','turmas','conclusao'];
const frames=starts.map((s,i)=>Math.min((starts[i+1]??3600)-1,s+(i===12?225:i===6?130:65)));
frames[8]=Math.min(starts[9]-1,cue(4,'Os quizzes')+75);
frames[10]=Math.min(starts[11]-1,cue(5,'própria marca')+12);
await writeFile(path.join(out,'sequences.json'),JSON.stringify(starts.map((s,i)=>({id:names[i],start:s,end:starts[i+1]??3600,reviewFrame:frames[i]})),null,2));
if(process.argv.includes('--metadata-only')) process.exit(0);
const serveUrl=await bundle({entryPoint:path.join(root,'src/index.ts'),onProgress:()=>{}});
const browser=await openBrowser('chrome');
try{
  const composition=await selectComposition({serveUrl,id:concursos?'CadernaConcursos120Legendado':desktop?'CadernaFilme120DesktopLegendado':'CadernaFilme120Legendado',puppeteerInstance:browser});
  for(let i=0;!process.argv.includes('--handoffs')&&i<frames.length;i++){
    await renderStill({serveUrl,composition,frame:frames[i],output:path.join(out,`${String(i+1).padStart(2,'0')}-${names[i]}.png`),imageFormat:'png',scale:.5,puppeteerInstance:browser,logLevel:'error'});
    console.log(`Still ${i+1}/13: ${names[i]} @ ${(frames[i]/30).toFixed(2)}s`);
  }
  if(process.argv.includes('--handoffs')){
    for(const b of [3,4,5,6]){
      for(const offset of [-25,0,20]){
        const frame=timing.blocks[b].start+offset;
        await renderStill({serveUrl,composition,frame,output:path.join(out,`handoff-${b}-${frame}.png`),imageFormat:'png',scale:.5,puppeteerInstance:browser,logLevel:'error'});
      }
    }
    console.log('12 handoff frames rendered');
  }
  if(process.argv.includes('--clips')){
    for(const [name,center] of [['plano',cue(1,'plano')],['leitura',cue(2,'Assim')],['pratica',cue(4,'os simulados')]]){
      await renderMedia({serveUrl,composition,codec:'h264',outputLocation:path.join(out,`transition-${name}.mp4`),frameRange:[center-15,center+74],scale:.5,concurrency:3,puppeteerInstance:browser,logLevel:'error'});
      console.log(`Transition: ${name}`);
    }
  }
}finally{await browser.close({silent:true});}
