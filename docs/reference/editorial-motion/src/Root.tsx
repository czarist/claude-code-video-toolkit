import React from 'react';
import '@fontsource/lora/600.css';
import '@fontsource/instrument-sans/400.css';
import '@fontsource/instrument-sans/600.css';
import {Filme120Compositions} from './CadernaFilme120';
import {DesktopCompositions} from './CadernaFilme120Desktop';
import {ConcursosCompositions} from './CadernaConcursos';

export const Root:React.FC=()=> <>
  <Filme120Compositions/>
  <DesktopCompositions/>
  <ConcursosCompositions/>
</>;
