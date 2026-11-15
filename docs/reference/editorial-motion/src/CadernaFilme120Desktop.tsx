import React from 'react';
import {AbsoluteFill, Audio, Composition, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {filmPalette as C, Line, Connection, Page, Crop, Wave} from './CadernaFilme120';
import approvedTiming from './filme120-timing.json';

export const createDesktopFilm=(timing:typeof approvedTiming, concursos=false)=>{
const blocks=timing.blocks;
const cue=(block:number,phrase:string)=>{
  const clean=(s:string)=>s.toLocaleLowerCase('pt-BR').replace(/[^\p{L}\p{N}]/gu,'');
  const parts=phrase.split(' ').map(clean),words=blocks[block].words;
  const i=words.findIndex((_,i)=>parts.every((part,j)=>clean(words[i+j]?.text??'')===part));
  if(i<0)throw new Error('Missing narration cue: '+phrase);
  return Math.round(words[i].start*30);
};
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
const ease=(f:number,a:number,b:number)=>interpolate(f,[a,b],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.inOut(Easing.cubic)});
// Recompose at native 1920x1080: a reading column at left and an unscaled
// animation workspace at right. Artwork and screenshot pixels keep their ratio.
const Stage:React.FC<{children:React.ReactNode}>=({children})=><svg width="1920" height="1080" style={{position:'absolute'}}><g transform="translate(820 -470)">{children}</g></svg>;
const Title:React.FC<{a:string;b:string;note?:React.ReactNode}>=({a,b,note})=><div style={{position:'absolute',left:120,top:320,width:700}}>
  <div style={{fontSize:a==='SAIU O'?128:78,lineHeight:1.13,letterSpacing:'-.035em'}}>{a}<br/><span style={{fontFamily:'Lora',fontStyle:'italic',color:C.olive}}>{b}</span></div>
  <div style={{width:90,height:3,background:C.amber,marginTop:43}}/>
  {note&&<div style={{fontSize:32,lineHeight:1.5,marginTop:36,color:C.paper,opacity:.85}}>{note}</div>}
</div>;
const Note:React.FC<{children:React.ReactNode}>=({children})=><div style={{position:'absolute',left:980,top:875,width:800,textAlign:'center',fontSize:28,lineHeight:1.3,color:C.paper,opacity:.8}}>{children}</div>;
const Brand:React.FC<{large?:boolean}>=({large=false})=><div style={{display:'flex',gap:large?25:14,alignItems:'center',justifyContent:large?'center':'flex-start'}}><Img src={staticFile('assets/marca/logo-amber.svg')} style={{width:large?112:42,height:large?102:39,objectFit:'contain'}}/><span style={{fontFamily:'Lora',fontSize:large?82:32}}>Caderna</span></div>;
const Ground:React.FC<{f:number}>=({f})=><svg width="1920" height="1080" style={{position:'absolute'}}><defs>
  <radialGradient id="desktop-light"><stop stopColor={C.olive} stopOpacity=".13"/><stop offset="1" stopColor={C.ink} stopOpacity="0"/></radialGradient>
  <linearGradient id="f120-surface" x2="1" y2="1"><stop stopColor={C.paper} stopOpacity=".08"/><stop offset="1" stopColor={C.paper} stopOpacity=".018"/></linearGradient>
  <filter id="f120-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="8"/></filter>
</defs><ellipse cx="1370" cy="500" rx="700" ry="620" fill="url(#desktop-light)"/>
  {Array.from({length:26},(_,i)=><circle key={i} cx={80+(i*173%1760)} cy={90+(i*211%900)-Math.sin(f*.002+i)*8} r={i%4===0?2:1} fill={C.paper} opacity={.09+i%3*.035}/>)}
</svg>;

const Opening:React.FC<{f:number}>=({f})=>{
  const gather=ease(f,blocks[1].start-75,blocks[1].start+35),plan=ease(f,cue(1,'plano'),cue(1,'plano')+42);
  const dense=ease(f,cue(0,'Conectar conteúdos')+35,cue(0,'Conectar conteúdos')+95);
  const paper=(.35+.65*ease(f,0,23))*(1-ease(f,cue(0,'materiais')-10,cue(0,'materiais')+35));
  const isPlan=f>=cue(1,'plano');
  return <><Title a={f<blocks[1].start?(concursos?(f<cue(0,'Cada semana')?'SAIU O':f<cue(0,'Conectar conteúdos')?'A prova tem data.':'Da matéria'):'Quem apoia o aluno'):isPlan?(concursos?'Do edital':'Do conteúdo'):'Caderna.'} b={f<blocks[1].start?(concursos?(f<cue(0,'Cada semana')?'EDITAL.':f<cue(0,'Conectar conteúdos')?'Cada semana conta.':'à rotina da turma.'):'entre as aulas?'):isPlan?'ao plano.':'Um caminho claro.'} note={f<blocks[1].start?<span style={{opacity:ease(f,90,115)}}>{concursos?'Para escolas preparatórias de concursos.':<>Fundamental · Médio · Pré-vestibular<br/>Faculdades · Técnicos · EAD · Concursos</>}</span>:isPlan?'Uma sequência para estudar.':undefined}/>
    <Stage><Page label={concursos?"EDITAL":"CONTEÚDOS"} opacity={paper} lineProgress={[ease(f,0,28),ease(f,60,90),ease(f,110,140)]}/>
      <Line d="M265 810 C355 810 360 1000 540 1000 S725 1190 815 1190" color={C.olive} p={plan} opacity={.6}/>
      <Connection f={f} at={cue(1,'plano')+35} x={540} y={1000}/>
      {[0,1,2].map(i=>{
        const enter=ease(f,cue(0,'materiais')+i*14,cue(0,'materiais')+i*14+24),spread=enter*(1-gather);
        const x=mix(mix(540,[320,710,405][i],spread),[265,540,815][i],plan),y=mix(mix(840+i*145,[780,1000,1210][i],spread),[810,1000,1190][i],plan);
        const w=mix(mix(460,330,spread),240,plan),h=mix(mix(100,180,spread),150,plan);
        return <g key={i} opacity={enter} transform={`translate(${x} ${y}) rotate(${[-9,8,-6][i]*spread})`}><rect x={-w/2} y={-h/2} width={w} height={h} rx="12" fill={C.ink} stroke={gather>.5?C.olive:C.paper} strokeOpacity=".6" strokeWidth="2"/>
          <Line d={`M${-w/2+24} -20 H${w/2-24}`} color={C.amber} p={enter}/><Line d={`M${-w/2+24} 7 H${w/2-45} M${-w/2+24} 29 H${w/2-75}`} opacity={.45}/>
          <text y={h/2+43} textAnchor="middle" fill={C.paper} fontSize="30">{isPlan?`Semana ${i+1}`:['Conteúdos','Materiais','Atividades'][i]}</text></g>;
      })}
      {[0,1,2,3].map(i=><g key={i} opacity={dense*(1-gather)*.5} transform={`translate(${[790,250,810,245][i]} ${[690,1040,1260,650][i]}) rotate(${i%2?12:-12})`}><rect x="-70" y="-60" width="140" height="120" rx="6" fill="url(#f120-surface)" stroke={C.paper}/><Line d="M-45 -20 H45 M-45 0 H30 M-45 20 H40" opacity={.45}/></g>)}
    </Stage></>;
};
const Material:React.FC<{f:number}>=({f})=>{
  const open=ease(f,blocks[2].start,blocks[2].start+40),read=cue(2,'Assim'),reveal=ease(f,read,read+30),mark=ease(f,cue(2,'referências'),cue(2,'referências')+28);
  const handoff=ease(f,blocks[3].start-60,blocks[3].start+36),fit=ease(f,read-18,read+12);
  return <><Title a={f<read?'Cada tópico,':'Ler. Marcar.'} b={f<read?'um caminho.':'Retomar.'}/>
    <Stage>{[0,2].map(i=><rect key={i} x={[145,0,695][i]} y={[735,0,1115][i]} width="240" height="150" rx="12" fill="url(#f120-surface)" stroke={C.paper} strokeOpacity={.6*(1-open)}/>)}
      <Page x={mix(540,570,fit)} y={mix(mix(1000,970,open),922.5,fit)} w={mix(mix(240,620,open),700,fit)} h={mix(mix(150,690,open),545,fit)} label={open>.8?'APOSTILA':''} progress={open} mark={mark} opacity={1-reveal}/>
      <Page x={mix(540,330,handoff)} y={mix(970,1000,handoff)} w={mix(620,280,handoff)} h={mix(690,380,handoff)} label="" mark={1} opacity={handoff}/>
    </Stage><div style={{opacity:1-handoff}}><Crop src="reader-1920.webp" crop={[1607,133,280,218]} x={mix(1040,1010,handoff)} y={mix(180,340,handoff)} width={mix(700,280,handoff)} reveal={reveal}/></div>
    {f>=read&&<Note>Recorte real da apostila e suas marcações.</Note>}</>;
};
const Study:React.FC<{f:number}>=({f})=>{
  const s=blocks[3].start,voice=cue(3,'Na aula por voz'),board=cue(3,'O quadro'),travel=ease(f,s-60,s+36),link=ease(f,voice,voice+40),reveal=ease(f,board,board+30),handoff=ease(f,blocks[4].start-120,blocks[4].start);
  return <><Title a={f<board?'O conteúdo ganha':'A conversa ganha'} b={f<board?'voz.':'forma.'}/>
    <Stage><g opacity={1-reveal}><Page x={mix(540,330,travel)} y={mix(970,1000,travel)} w={mix(620,280,travel)} h={mix(690,380,travel)} label="" mark={1} opacity={travel}/>
      <Line d="M470 1000 C590 1000 570 850 650 850" color={C.olive} p={link}/><Connection f={f} at={voice+32} x={650} y={850}/>
      <circle cx="755" cy="850" r="120" fill="none" stroke={C.olive} strokeWidth="2" opacity={link*.5}/><g opacity={link}><Wave f={f} active={f>voice&&f<board} x={755}/></g>
      <text x="755" y="1055" textAnchor="middle" fill={C.paper} fontSize="36" opacity={link}>Perguntar</text><Line d="M755 1090 C755 1250 330 1320 330 1210" color={C.amber} p={ease(f,cue(3,'perguntas'),cue(3,'perguntas')+32)} opacity={.65}/>
    </g><g opacity={reveal*(1-handoff)}><Line d="M530 830 V910 M230 910 H830 M230 910 V1000 M530 910 V1000 M830 910 V1000" color={C.olive} p={ease(f,board+15,board+55)}/><Wave f={f} active={f<blocks[3].words[blocks[3].words.length-1].end*30} x={530} y={1260} scale={1.65}/></g>
      <g opacity={handoff}><rect x={mix(195,155,handoff)} y={mix(680,640,handoff)} width={mix(670,750,handoff)} height={mix(150,670,handoff)} rx={mix(8,20,handoff)} fill="url(#f120-surface)" stroke={C.olive} strokeOpacity=".5"/><text x="205" y="730" fill={C.olive} fontSize="32" opacity={ease(handoff,.7,1)}>PRÁTICA</text></g>
    </Stage><div style={{opacity:1-travel}}><Crop src="reader-1920.webp" crop={[1607,133,280,218]} x={mix(1040,1010,travel)} y={mix(180,340,travel)} width={mix(700,280,travel)}/></div>
    <div style={{opacity:1-handoff}}><Crop src="whiteboard-1920.webp" crop={[316,852,319,72]} x={1015} y={210} width={670} reveal={reveal}/>{[28,255,482].map((sx,i)=><Crop key={sx} src="whiteboard-1920.webp" crop={[sx,970,208,92]} x={940+i*300} y={530} width={220} reveal={ease(f,board+30+i*8,board+58+i*8)}/>)}</div>
    {f>=board&&<Note>Recortes do quadro branco. Exemplo demonstrativo.</Note>}</>;
};
const Practice:React.FC<{f:number}>=({f})=>{
  const s=blocks[4].start,question=cue(4,'Os quizzes'),result=cue(4,'os simulados'),back=cue(4,'Esse retorno'),choose=ease(f,question+35,question+60),reveal=ease(f,result,result+30),returnPlan=ease(f,back+15,back+52),handoff=ease(f,blocks[5].start-60,blocks[5].start+32);
  return <><Title a={f<result?'Entender. Aplicar.':f<back?'Reconhecer':'Revisar também é'} b={f<result?'Revisar.':f<back?'as dificuldades.':'seguir em frente.'} note={f>=result&&f<back?'Na preparação para provas.':undefined}/>
    <Stage><g opacity={1-reveal}><rect x="155" y="640" width="750" height="670" rx="20" fill="url(#f120-surface)" stroke={C.olive} strokeOpacity=".5"/><text x="205" y="730" fill={C.olive} fontSize="32">PRÁTICA</text><text x="205" y="835" fill={C.paper} fontSize="44">Qual é o próximo passo?</text>
      {['Ler o material','Responder e conferir','Retomar o plano'].map((t,i)=><g key={t} opacity={ease(f,s+14+i*10,s+32+i*10)}><rect x="205" y={890+i*110} width="650" height="80" rx="8" fill={i===1&&choose>.6?'#36412A':'none'} stroke={i===1?C.olive:C.paper} strokeOpacity={i===1?.8:.25}/><circle cx="240" cy={930+i*110} r="10" fill={i===1&&choose>.6?C.olive:'none'} stroke={C.olive}/><text x="270" y={943+i*110} fill={C.paper} fontSize="34">{t}</text></g>)}
    </g><g opacity={returnPlan}><Line d="M330 1170 C150 1170 150 760 390 760 H650 C860 760 860 1170 650 1170" color={C.olive} p={returnPlan} opacity={1-handoff}/><Page x={mix(520,530,handoff)} y={980} w={mix(330,540,handoff)} h={mix(380,680,handoff)} label={handoff<.5?'PLANO':''} mark={1-handoff}/><Line d="M630 1148 L654 1170 L630 1192" color={C.olive} p={returnPlan} opacity={1-handoff}/><Connection f={f} at={back+45} x={650} y={1170}/></g></Stage>
    {f<result&&<Note>Representação do percurso de prática.</Note>}<div style={{opacity:1-returnPlan}}><Crop src="mock-result-1920.webp" crop={[279,211,320,38]} x={1040} y={325} width={750} reveal={reveal}/><Crop src="mock-result-1920.webp" crop={[280,307,452,64]} x={955} y={550} width={840} reveal={reveal}/>{f>=result&&<Note>Recortes reais com dados demonstrativos.</Note>}</div></>;
};
const Institution:React.FC<{f:number}>=({f})=>{
  const s=blocks[5].start,identity=cue(5,'própria marca'),panel=cue(5,'Com o painel'),grow=ease(f,s-60,s+32),branded=ease(f,s+25,identity),connect=ease(f,panel,panel+38),handoff=ease(f,blocks[6].start-50,blocks[6].start);
  return <><Title a={f<panel?(concursos?'Seu preparatório.':'Experiência Caderna.'):'A preparação'} b={f<panel?'A sua marca.':'em perspectiva.'}/><Stage>
    <g opacity={1-connect}><rect x={mix(355,260,grow)} y={mix(790,640,grow)} width={mix(330,540,grow)} height={mix(380,680,grow)} rx="24" fill="url(#f120-surface)" stroke={C.olive}/><rect x="290" y="680" width={480*branded} height="120" rx="10" fill={C.olive} opacity=".14"/><text x="530" y="753" fill={C.paper} textAnchor="middle" fontSize="42" opacity={branded}>Sua instituição</text><Line d="M320 880 H740 M320 980 H620 M320 1080 H695 M320 1180 H560" color={C.olive} p={grow} width={4}/></g>
    <g opacity={connect}><g opacity={1-handoff}><rect x="330" y="655" width="400" height="135" rx="15" fill="url(#f120-surface)" stroke={C.olive}/><text x="530" y="736" textAnchor="middle" fill={C.paper} fontSize="42">Professor</text><Line d="M530 790 V890 M250 890 H810 M250 890 V985 M530 890 V985 M810 890 V985" color={C.olive} p={connect}/></g>
      {[250,530,810].map((x,i)=>{const y=mix(1020,[800,1000,1200][i],handoff),w=mix(70,160,handoff),h=mix(70,210,handoff);return <g key={x}><rect x={x-w/2} y={y-h/2} width={w} height={h} rx={mix(35,10,handoff)} fill={C.ink} stroke={C.olive}/><Line d={`M${x-mix(40,50,handoff)} ${mix(1110,y-40,handoff)} H${x+mix(40,50,handoff)} M${x-mix(30,50,handoff)} ${mix(1140,y,handoff)} H${x+mix(30,35,handoff)}`} color={C.amber} p={ease(f,panel+38+i*8,panel+60+i*8)}/><Line d={`M${x-50} ${y+40} H${x+45}`} color={C.amber} opacity={handoff}/></g>;})}
      <text x="530" y="1265" textAnchor="middle" fill={C.paper} fontSize="34" opacity={1-handoff}>Atividades e progresso da turma</text></g></Stage>
    <Note>{f<panel?'Representação da personalização de marca.':'Requer painel configurado e perfil de professor.'}</Note></>;
};
const Closing:React.FC<{f:number}>=({f})=>{
  const s=blocks[6].start,gather=ease(f,s,s+32),brand=cue(6,'Caderna Dê'),settle=ease(f,brand-12,brand+20),cta=ease(f,s,s+18),spoken=cue(6,concursos?'Dê o':'Dê aos'),message=ease(f,spoken,spoken+18);
  return <><div style={{opacity:1-settle}}><Title a="Marque uma" b="conversa" note={<span style={{color:C.amber,opacity:cta,fontSize:44}}>caderna.ia.br</span>}/></div>
    <Stage><g opacity={1-settle}><Line d="M280 995 H780" color={C.olive} p={gather}/>{[0,1,2].map(i=><g key={i} transform={`translate(${mix([250,530,810][i],280+i*250,gather)} ${mix([800,1000,1200][i],995,gather)})`}><rect x="-80" y="-105" width="160" height="210" rx="10" fill={C.ink} stroke={C.olive}/><Line d="M-50 -40 H50 M-50 0 H35 M-50 40 H45" color={C.amber}/></g>)}</g></Stage>
    <div style={{position:'absolute',left:0,right:0,top:250,opacity:settle,transform:`translateY(${(1-settle)*35}px)`}}><Brand large/></div>
    <div style={{position:'absolute',left:230,right:230,top:465,textAlign:'center',fontSize:78,lineHeight:1.2,letterSpacing:'-.03em',clipPath:`inset(0 0 ${(1-message)*100}% 0)`}}>{concursos?<>Dê o <span style={{fontFamily:'Lora',fontStyle:'italic',color:C.olive}}>diferencial</span><br/>que seus alunos merecem.</>:<>Dê aos seus alunos o<br/><span style={{fontFamily:'Lora',fontStyle:'italic',color:C.olive}}>diferencial</span> que eles merecem.</>}</div>
  </>;
};
const Film:React.FC<{legendas:boolean}>=({legendas})=>{
  const f=useCurrentFrame(),index=blocks.findIndex(b=>f>=b.start&&f<b.end),caption=timing.captions.find(c=>f>=Math.floor(c.start*30)&&f<Math.ceil(c.end*30));
  return <AbsoluteFill style={{backgroundColor:C.ink,color:C.paper,fontFamily:'Instrument Sans',overflow:'hidden'}}><Audio src={staticFile(concursos?'audio/concursos/mix.wav':'audio/filme120/mix.wav')}/><Ground f={f}/>
    {index<6&&<div style={{position:'absolute',left:120,top:84}}><Brand/></div>}
    {index<=1?<Opening f={f}/>:index===2?<Material f={f}/>:index===3?<Study f={f}/>:index===4?<Practice f={f}/>:index===5?<Institution f={f}/>:<Closing f={f}/>}
    {legendas&&caption&&<div style={{position:'absolute',left:310,right:310,top:955,minHeight:64,textAlign:'center',fontSize:34,lineHeight:1.25,fontWeight:600,padding:'12px 28px',borderRadius:10,background:'rgba(20,23,17,.94)',boxSizing:'border-box'}}>{caption.text}</div>}
  </AbsoluteFill>;
};
return Film;
};
export const CadernaFilme120Desktop=createDesktopFilm(approvedTiming);
export const DesktopCompositions:React.FC=()=> <>
  <Composition id="CadernaFilme120Desktop" component={CadernaFilme120Desktop} width={1920} height={1080} fps={30} durationInFrames={3600} defaultProps={{legendas:false}}/>
  <Composition id="CadernaFilme120DesktopLegendado" component={CadernaFilme120Desktop} width={1920} height={1080} fps={30} durationInFrames={3600} defaultProps={{legendas:true}}/>
</>;
