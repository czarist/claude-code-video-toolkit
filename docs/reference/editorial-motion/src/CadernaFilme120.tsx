import React from 'react';
import {AbsoluteFill, Audio, Composition, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import '@fontsource/lora/400-italic.css';
import timing from './filme120-timing.json';

const C = {ink:'#1C1F17',paper:'#F6F4EF',olive:'#B5C79A',amber:'#D7BB8A'};
const blocks=timing.blocks;
const lerp=(a:number,b:number,p:number)=>a+(b-a)*p;
const ramp=(f:number,a:number,b:number)=>interpolate(f,[a,b],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.inOut(Easing.cubic)});
const normal=(s:string)=>s.toLocaleLowerCase('pt-BR').replace(/[^\p{L}\p{N}]/gu,'');
// Provider alignment follows the current performance's natural speech timing.
// Missing words fail loudly rather than silently inventing a synchronization cue.
const cue=(block:number,phrase:string)=>{
  const search=phrase.split(' ').map(normal),words=blocks[block].words;
  const index=words.findIndex((_,i)=>search.every((w,j)=>normal(words[i+j]?.text??'')===w));
  if(index<0) throw new Error(`Missing narrated cue: ${phrase}`);
  return Math.round(words[index].start*30);
};
export const film120Sequences=[
  {id:'01-conteudo',start:0},{id:'02-dispersao',start:cue(0,'Conectar conteúdos')},
  {id:'03-caderna',start:blocks[1].start},{id:'04-plano',start:cue(1,'plano')},
  {id:'05-apostila',start:blocks[2].start},{id:'06-leitura',start:cue(2,'Assim')},
  {id:'07-voz',start:blocks[3].start},{id:'08-quadro',start:cue(3,'O quadro')},
  {id:'09-quiz',start:blocks[4].start},{id:'10-simulado',start:cue(4,'os simulados')},
  {id:'11-marca',start:blocks[5].start},{id:'12-turmas',start:cue(5,'Com o painel')},
  {id:'13-conclusao',start:blocks[6].start},
];
const Line:React.FC<{d:string;p?:number;color?:string;width?:number;opacity?:number}>=({d,p=1,color=C.paper,width=3,opacity=1})=><path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" opacity={opacity} pathLength="1" strokeDasharray="1" strokeDashoffset={1-p}/>;
const Connection:React.FC<{f:number;at:number;x:number;y:number}>=({f,at,x,y})=>{
  const p=Math.sin(Math.PI*ramp(f,at,at+30));
  return <g><circle cx={x} cy={y} r={8+p*16} fill={C.olive} opacity={p*.8} filter="url(#f120-glow)"/><circle cx={x} cy={y} r="4" fill={C.olive} opacity={p}/></g>;
};
const Page:React.FC<{x?:number;y?:number;w?:number;h?:number;label?:string;progress?:number;lineProgress?:number[];mark?:number;opacity?:number}>=({x=540,y=970,w=580,h=660,label='PROGRAMA',progress=1,lineProgress,mark=0,opacity=1})=><g transform={`translate(${x-w/2} ${y-h/2})`} opacity={opacity}>
  <rect width={w} height={h} rx="18" fill="url(#f120-surface)" stroke={C.paper} strokeOpacity=".5" strokeWidth="2"/>
  <Line d={`M${w-80} 0 V70 H${w}`} opacity={.3}/>
  {label&&<text x="42" y="74" fill={C.olive} fontSize="32" letterSpacing="2">{label}</text>}
  {[0,1,2].map(i=><g key={i} transform={`translate(42 ${h*.27+i*h*.21})`}>
    <Line d={`M0 0 H${w*.63}`} color={C.olive} width={5} p={lineProgress?.[i]??progress}/>
    <Line d={`M0 26 H${w-84} M0 50 H${w*.58}`} opacity={.45} p={lineProgress?.[i]??progress}/>
    {i===1&&<rect x="-7" y="15" width={(w-72)*mark} height="48" rx="3" fill={C.amber} opacity=".2"/>}
  </g>)}
</g>;
const Heading:React.FC<{a:string;b?:string;y?:number;size?:number}>=({a,b,y=300,size=76})=><div style={{position:'absolute',top:y,left:100,right:125,textAlign:'center',fontSize:size,lineHeight:1.12,letterSpacing:'-.035em',fontWeight:400}}>{a}{b&&<><br/><span style={{fontFamily:'Lora',fontStyle:'italic',color:C.olive}}>{b}</span></>}</div>;
const Note:React.FC<{children:React.ReactNode;y?:number}>=({children,y=1370})=><div style={{position:'absolute',top:y,left:110,right:130,textAlign:'center',fontSize:28,lineHeight:1.3,color:C.paper,opacity:.8}}>{children}</div>;
// Preserve pixels and proportions: no reflow or invented product interface.
const Crop:React.FC<{src:string;crop:[number,number,number,number];x:number;y:number;width:number;reveal?:number}>=({src,crop:[sx,sy,sw,sh],x,y,width,reveal=1})=>{
  const scale=width/sw;
  return <div style={{position:'absolute',left:x,top:y,width,height:sh*scale,overflow:'hidden',clipPath:`inset(0 ${(1-reveal)*100}% 0 0)`,borderRadius:8}}><Img src={staticFile(`assets/telas/${src}`)} style={{position:'absolute',width:1920*scale,maxWidth:'none',left:-sx*scale,top:-sy*scale}}/></div>;
};
const Wave:React.FC<{f:number;active:boolean;x?:number;y?:number;scale?:number}>=({f,active,x=745,y=850,scale=1})=><g transform={`translate(${x} ${y}) scale(${scale})`}>{Array.from({length:21},(_,i)=>{
  const h=16+65*Math.sin(i/20*Math.PI)**2+(active?12*Math.sin(f*.19+i*.7):0);
  return <line key={i} x1={(i-10)*10} x2={(i-10)*10} y1={-h/2} y2={h/2} stroke={C.olive} strokeWidth="5" strokeLinecap="round"/>;
})}</g>;
const Brand:React.FC<{x?:number;y?:number;size?:number}>=({x=540,y=830,size=1})=><div style={{position:'absolute',left:x-200*size,top:y-60*size,width:400*size,display:'flex',alignItems:'center',justifyContent:'center',gap:20*size}}><Img src={staticFile('assets/marca/logo-amber.svg')} style={{width:80*size,height:74*size,objectFit:'contain'}}/><span style={{fontFamily:'Lora',fontSize:58*size}}>Caderna</span></div>;
const Background:React.FC<{f:number}>=({f})=><svg width="1080" height="1920" style={{position:'absolute'}}>
  <defs>
    <radialGradient id="f120-light"><stop stopColor={C.olive} stopOpacity=".13"/><stop offset="1" stopColor={C.ink} stopOpacity="0"/></radialGradient>
    <linearGradient id="f120-surface" x2="1" y2="1"><stop stopColor={C.paper} stopOpacity=".08"/><stop offset="1" stopColor={C.paper} stopOpacity=".018"/></linearGradient>
    <filter id="f120-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="8"/></filter>
  </defs>
  <ellipse cx="540" cy="1000" rx="610" ry="680" fill="url(#f120-light)"/>
  {Array.from({length:22},(_,i)=><circle key={i} cx={85+(i*173%920)} cy={280+(i*251%1310)-Math.sin(f*.002+i)*9} r={i%4===0?2:1} fill={C.paper} opacity={.09+i%3*.035}/>)}
</svg>;
const Art:React.FC<{children:React.ReactNode}>=({children})=><svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute'}}>{children}</svg>;

const Opening:React.FC<{f:number}>=({f})=>{
  const gather=ramp(f,blocks[1].start-75,blocks[1].start+35),plan=ramp(f,cue(1,'plano'),cue(1,'plano')+42);
  const dense=ramp(f,cue(0,'Conectar conteúdos')+35,cue(0,'Conectar conteúdos')+95);
  const paper=(.35+.65*ramp(f,0,23))*(1-ramp(f,cue(0,'materiais')-10,cue(0,'materiais')+35));
  const isPlan=f>=cue(1,'plano');
  return <>
    <Heading a={f<blocks[1].start?'Quem apoia o aluno':(isPlan?'Do conteúdo':'Caderna.')} b={f<blocks[1].start?'entre as aulas?':(isPlan?'ao plano.':'Um caminho claro.')}/>
    {f<blocks[1].start&&<div style={{position:'absolute',top:525,left:105,right:125,textAlign:'center',fontSize:32,lineHeight:1.45,color:C.paper,opacity:ramp(f,90,115)}}>Fundamental · Médio · Pré-vestibular<br/>Faculdades · Técnicos · EAD · Concursos</div>}
    <Art><Page label="CONTEÚDOS" opacity={paper} lineProgress={[ramp(f,0,28),ramp(f,60,90),ramp(f,110,140)]}/>
      <Line d="M265 810 C355 810 360 1000 540 1000 S725 1190 815 1190" color={C.olive} p={plan} opacity={.6}/>
      <Connection f={f} at={cue(1,'plano')+35} x={540} y={1000}/>
      {[0,1,2].map(i=>{
        const enter=ramp(f,cue(0,'materiais')+i*14,cue(0,'materiais')+i*14+24),spread=enter*(1-gather);
        const x=lerp(lerp(540,[320,710,405][i],spread),[265,540,815][i],plan),y=lerp(lerp(840+i*145,[780,1000,1210][i],spread),[810,1000,1190][i],plan);
        const w=lerp(lerp(460,330,spread),240,plan),h=lerp(lerp(100,180,spread),150,plan);
        return <g key={i} opacity={enter} transform={`translate(${x} ${y}) rotate(${[-9,8,-6][i]*spread})`}>
          <rect x={-w/2} y={-h/2} width={w} height={h} rx="12" fill={C.ink} stroke={gather>.5?C.olive:C.paper} strokeOpacity=".6" strokeWidth="2"/>
          <Line d={`M${-w/2+24} -20 H${w/2-24}`} color={C.amber} p={enter}/><Line d={`M${-w/2+24} 7 H${w/2-45} M${-w/2+24} 29 H${w/2-75}`} opacity={.45}/>
          <text y={h/2+45} textAnchor="middle" fill={C.paper} fontSize="32">{isPlan?`Semana ${i+1}`:['Conteúdos','Materiais','Atividades'][i]}</text>
        </g>;
      })}
      {[0,1,2,3].map(i=><g key={i} opacity={dense*(1-gather)*.5} transform={`translate(${[790,250,810,245][i]} ${[690,1040,1310,730][i]}) rotate(${i%2?12:-12})`}><rect x="-70" y="-60" width="140" height="120" rx="6" fill="url(#f120-surface)" stroke={C.paper} strokeWidth="2"/><Line d="M-45 -20 H45 M-45 0 H30 M-45 20 H40" opacity={.45}/></g>)}
    </Art>
  </>;
};
const Material:React.FC<{f:number}>=({f})=>{
  const s=blocks[2].start,open=ramp(f,s,s+40),read=cue(2,'Assim'),reveal=ramp(f,read,read+30),marked=ramp(f,cue(2,'referências'),cue(2,'referências')+28);
  const fit=ramp(f,read-18,read+12);
  const handoff=ramp(f,blocks[3].start-60,blocks[3].start+36);
  return <><Heading a={f<read?'Cada tópico,':'Ler. Marcar.'} b={f<read?'um caminho.':'Retomar.'} y={f<read?300:1160} size={f<read?76:62}/>
    <Art>{[0,2].map(i=><g key={i} opacity={1-open}><rect x={[145,0,695][i]} y={[735,0,1115][i]} width="240" height="150" rx="12" fill="url(#f120-surface)" stroke={C.paper} strokeOpacity=".6"/></g>)}
      <Page x={lerp(540,530,fit)} y={lerp(lerp(1000,970,open),795.85,fit)} w={lerp(lerp(240,620,open),760,fit)} h={lerp(lerp(150,690,open),591.7,fit)} label={open>.8?'APOSTILA':''} progress={open} mark={marked} opacity={1-reveal}/>
      <Page x={lerp(540,330,handoff)} y={lerp(970,1000,handoff)} w={lerp(620,280,handoff)} h={lerp(690,380,handoff)} label="" mark={1} opacity={handoff}/>
    </Art>
    <div style={{opacity:1-handoff}}><Crop src="reader-1920.webp" crop={[1607,133,280,218]} x={lerp(150,190,handoff)} y={lerp(500,810,handoff)} width={lerp(760,280,handoff)} reveal={reveal}/></div>
    {f>=read&&<Note y={1400}>Recorte real da apostila e suas marcações.</Note>}
  </>;
};
const Study:React.FC<{f:number}>=({f})=>{
  const s=blocks[3].start,voice=cue(3,'Na aula por voz'),board=cue(3,'O quadro'),travel=ramp(f,s-60,s+36),link=ramp(f,voice,voice+40),reveal=ramp(f,board,board+30);
  const handoff=ramp(f,blocks[4].start-120,blocks[4].start);
  return <><Heading a={f<board?'O conteúdo ganha':'A conversa ganha'} b={f<board?'voz.':'forma.'}/>
    <Art><g opacity={1-reveal}>
      <Page x={lerp(540,330,travel)} y={lerp(970,1000,travel)} w={lerp(620,280,travel)} h={lerp(690,380,travel)} label="" mark={1} opacity={travel}/>
      <Line d="M470 1000 C590 1000 570 850 650 850" color={C.olive} p={link}/>
      <Connection f={f} at={voice+32} x={650} y={850}/>
      <circle cx="755" cy="850" r="120" fill="none" stroke={C.olive} strokeWidth="2" opacity={link*.5}/>
      <g opacity={link}><Wave f={f} active={f>voice&&f<board} x={755}/></g>
      <text x="755" y="1055" textAnchor="middle" fill={C.paper} fontSize="36" opacity={link}>Perguntar</text>
      <Line d="M755 1090 C755 1250 330 1320 330 1210" color={C.amber} p={ramp(f,cue(3,'perguntas'),cue(3,'perguntas')+32)} opacity={.65}/>
    </g><g opacity={reveal*(1-handoff)}>
      <Line d="M530 830 V910 M230 910 H830 M230 910 V1000 M530 910 V1000 M830 910 V1000" color={C.olive} p={ramp(f,board+15,board+55)}/>
      <Wave f={f} active={f<blocks[3].words[blocks[3].words.length-1].end*30} x={530} y={1260} scale={1.65}/>
    </g><g opacity={handoff}>
      <rect x={lerp(195,155,handoff)} y={lerp(680,640,handoff)} width={lerp(670,750,handoff)} height={lerp(150,670,handoff)} rx={lerp(8,20,handoff)} fill="url(#f120-surface)" stroke={C.olive} strokeOpacity=".5" strokeWidth="2"/>
      <text x="205" y="730" fill={C.olive} fontSize="32" opacity={ramp(handoff,.7,1)}>PRÁTICA</text>
    </g></Art>
    <div style={{opacity:1-travel}}><Crop src="reader-1920.webp" crop={[1607,133,280,218]} x={lerp(150,190,travel)} y={lerp(500,810,travel)} width={lerp(760,280,travel)}/></div>
    <div style={{opacity:1-handoff}}><Crop src="whiteboard-1920.webp" crop={[316,852,319,72]} x={195} y={680} width={670} reveal={reveal}/>
    {[28,255,482].map((sx,i)=><Crop key={sx} src="whiteboard-1920.webp" crop={[sx,970,208,92]} x={120+i*300} y={1000} width={220} reveal={ramp(f,board+30+i*8,board+58+i*8)}/>)}</div>
    {f>=board&&<Note>Recortes do quadro branco. Exemplo demonstrativo.</Note>}
  </>;
};
const Practice:React.FC<{f:number}>=({f})=>{
  const s=blocks[4].start,question=cue(4,'Os quizzes'),result=cue(4,'os simulados'),back=cue(4,'Esse retorno');
  const choose=ramp(f,question+35,question+60),reveal=ramp(f,result,result+30),returnPlan=ramp(f,back+15,back+52);
  const handoff=ramp(f,blocks[5].start-60,blocks[5].start+32);
  return <><Heading a={f<result?'Entender. Aplicar.':f<back?'Reconhecer':'Revisar também é'} b={f<result?'Revisar.':f<back?'as dificuldades.':'seguir em frente.'} y={f>=result&&f<back?1160:300} size={f>=result&&f<back?66:76}/>
    <Art><g opacity={1-reveal}>
      <rect x="155" y="640" width="750" height="670" rx="20" fill="url(#f120-surface)" stroke={C.olive} strokeOpacity=".5" strokeWidth="2"/>
      <text x="205" y="730" fill={C.olive} fontSize="32">PRÁTICA</text><text x="205" y="835" fill={C.paper} fontSize="44">Qual é o próximo passo?</text>
      {['Ler o material','Responder e conferir','Retomar o plano'].map((t,i)=><g key={t} opacity={ramp(f,s+14+i*10,s+32+i*10)}>
        <rect x="205" y={890+i*110} width="650" height="80" rx="8" fill={i===1&&choose>.6?'#36412A':'none'} stroke={i===1?C.olive:C.paper} strokeOpacity={i===1?.8:.25} strokeWidth="2"/>
        <circle cx="240" cy={930+i*110} r="10" fill={i===1&&choose>.6?C.olive:'none'} stroke={C.olive} strokeWidth="2"/><text x="270" y={943+i*110} fill={C.paper} fontSize="34">{t}</text>
      </g>)}
    </g><g opacity={returnPlan}>
      <Line d="M330 1170 C150 1170 150 760 390 760 H650 C860 760 860 1170 650 1170" color={C.olive} p={returnPlan} opacity={1-handoff}/>
      <Page x={lerp(520,530,handoff)} y={980} w={lerp(330,540,handoff)} h={lerp(380,680,handoff)} label={handoff<.5?'PLANO':''} mark={1-handoff}/><Line d="M630 1148 L654 1170 L630 1192" color={C.olive} p={returnPlan} opacity={1-handoff}/>
      <Connection f={f} at={back+45} x={650} y={1170}/>
    </g></Art>
    {f<result&&<Note>Representação do percurso de prática.</Note>}
    <div style={{opacity:1-returnPlan}}>
      <Crop src="mock-result-1920.webp" crop={[279,211,320,38]} x={160} y={730} width={750} reveal={reveal}/>
      <Crop src="mock-result-1920.webp" crop={[280,307,452,64]} x={115} y={930} width={840} reveal={reveal}/>
      {f>=result&&<Note y={1380}>Recortes reais com dados demonstrativos.</Note>}
    </div>
  </>;
};
const Institution:React.FC<{f:number}>=({f})=>{
  const s=blocks[5].start,identity=cue(5,'própria marca'),panel=cue(5,'Com o painel');
  const grow=ramp(f,s-60,s+32),branded=ramp(f,s+25,identity),connect=ramp(f,panel,panel+38);
  const handoff=ramp(f,blocks[6].start-50,blocks[6].start);
  return <><Heading a={f<panel?'A experiência Caderna.':'A preparação'} b={f<panel?'A sua marca.':'em perspectiva.'}/>
    <Art><g opacity={1-connect}>
      <rect x={lerp(355,260,grow)} y={lerp(790,640,grow)} width={lerp(330,540,grow)} height={lerp(380,680,grow)} rx="24" fill="url(#f120-surface)" stroke={C.olive} strokeWidth="2"/>
      <rect x="290" y="680" width={480*branded} height="120" rx="10" fill={C.olive} opacity=".14"/><text x="530" y="753" fill={C.paper} textAnchor="middle" fontSize="42" opacity={branded}>Sua instituição</text>
      <Line d="M320 880 H740 M320 980 H620 M320 1080 H695 M320 1180 H560" color={C.olive} p={grow} width={4}/>
    </g><g opacity={connect}>
      <g opacity={1-handoff}><rect x="330" y="655" width="400" height="135" rx="15" fill="url(#f120-surface)" stroke={C.olive} strokeWidth="2"/><text x="530" y="736" textAnchor="middle" fill={C.paper} fontSize="42">Professor</text>
      <Line d="M530 790 V890 M250 890 H810 M250 890 V985 M530 890 V985 M810 890 V985" color={C.olive} p={connect}/></g>
      {[250,530,810].map((x,i)=>{
        const y=lerp(1020,[800,1000,1200][i],handoff),w=lerp(70,160,handoff),h=lerp(70,210,handoff);
        return <g key={x}><rect x={x-w/2} y={y-h/2} width={w} height={h} rx={lerp(35,10,handoff)} fill={C.ink} stroke={C.olive} strokeWidth="2"/>
          <Line d={`M${x-lerp(40,50,handoff)} ${lerp(1110,y-40,handoff)} H${x+lerp(40,50,handoff)} M${x-lerp(30,50,handoff)} ${lerp(1140,y,handoff)} H${x+lerp(30,35,handoff)}`} color={C.amber} p={ramp(f,panel+38+i*8,panel+60+i*8)}/>
          <Line d={`M${x-50} ${y+40} H${x+45}`} color={C.amber} opacity={handoff}/>
        </g>;
      })}
      <text x="530" y="1265" textAnchor="middle" fill={C.paper} fontSize="36" opacity={1-handoff}>Atividades e progresso da turma</text>
    </g></Art>
    <Note>{f<panel?'Representação da personalização de marca.':'Requer painel configurado e perfil de professor.'}</Note>
  </>;
};
const Closing:React.FC<{f:number}>=({f})=>{
  const s=blocks[6].start,gather=ramp(f,s,s+32),brand=cue(6,'Caderna Dê'),settle=ramp(f,brand-12,brand+20),cta=ramp(f,s,s+18),message=ramp(f,cue(6,'Dê aos'),cue(6,'Dê aos')+18);
  return <>
    <Art><g opacity={1-settle}><Line d="M280 995 H780" color={C.olive} p={gather}/>
      {[0,1,2].map(i=><g key={i} transform={`translate(${lerp([250,530,810][i],280+i*250,gather)} ${lerp([800,1000,1200][i],995,gather)})`}><rect x="-80" y="-105" width="160" height="210" rx="10" fill={C.ink} stroke={C.olive} strokeWidth="2"/><Line d="M-50 -40 H50 M-50 0 H35 M-50 40 H45" color={C.amber}/></g>)}
    </g><Line d="M360 810 H700" color={C.olive} p={settle} opacity={.6}/></Art>
    <div style={{opacity:settle,transform:`translateY(${(1-settle)*50}px)`}}><Brand x={530} y={640} size={1.4}/></div>
    <div style={{position:'absolute',top:360,left:100,right:125,textAlign:'center',opacity:1-settle,clipPath:`inset(0 0 ${(1-cta)*100}% 0)`}}><div style={{fontSize:64,fontWeight:600}}>Marque uma conversa</div><div style={{fontSize:48,color:C.amber,marginTop:30}}>caderna.ia.br</div></div>
    <div style={{position:'absolute',top:925,left:95,right:115,textAlign:'center',fontSize:64,lineHeight:1.22,letterSpacing:'-.035em',clipPath:`inset(0 0 ${(1-message)*100}% 0)`}}>Dê aos seus alunos o<br/><span style={{fontFamily:'Lora',fontStyle:'italic',color:C.olive}}>diferencial</span> que eles merecem.</div>
  </>;
};
export const CadernaFilme120:React.FC<{legendas:boolean}>=({legendas})=>{
  const f=useCurrentFrame(),index=blocks.findIndex(b=>f>=b.start&&f<b.end);
  const caption=timing.captions.find(c=>f>=Math.floor(c.start*30)&&f<Math.ceil(c.end*30));
  return <AbsoluteFill style={{backgroundColor:C.ink,color:C.paper,fontFamily:'Instrument Sans',overflow:'hidden'}}>
    <Audio src={staticFile('audio/filme120/mix.wav')}/><Background f={f}/>
    {index<=1?<Opening f={f}/>:index===2?<Material f={f}/>:index===3?<Study f={f}/>:index===4?<Practice f={f}/>:index===5?<Institution f={f}/>:<Closing f={f}/>}
    {legendas&&caption&&<div style={{position:'absolute',left:105,right:135,top:1500,minHeight:112,display:'flex',alignItems:'center',justifyContent:'center',textAlign:'center',fontSize:42,fontWeight:600,lineHeight:1.25,padding:'14px 22px',borderRadius:12,backgroundColor:'rgba(20,23,17,.94)',boxSizing:'border-box'}}>{caption.text}</div>}
  </AbsoluteFill>;
};
export const Filme120Compositions:React.FC=()=> <>
  <Composition id="CadernaFilme120" component={CadernaFilme120} width={1080} height={1920} fps={30} durationInFrames={3600} defaultProps={{legendas:false}}/>
  <Composition id="CadernaFilme120Legendado" component={CadernaFilme120} width={1080} height={1920} fps={30} durationInFrames={3600} defaultProps={{legendas:true}}/>
</>;

export {C as filmPalette, Line, Connection, Page, Crop, Wave, cue as film120Cue};
