import React from 'react';
import {Composition} from 'remotion';
import {createDesktopFilm} from './CadernaFilme120Desktop';
import timing from './concursos-timing.json';

const CadernaConcursos=createDesktopFilm(timing,true);
export const ConcursosCompositions:React.FC=()=> <>
  <Composition id="CadernaConcursos120" component={CadernaConcursos} width={1920} height={1080} fps={30} durationInFrames={3600} defaultProps={{legendas:false}}/>
  <Composition id="CadernaConcursos120Legendado" component={CadernaConcursos} width={1920} height={1080} fps={30} durationInFrames={3600} defaultProps={{legendas:true}}/>
</>;
