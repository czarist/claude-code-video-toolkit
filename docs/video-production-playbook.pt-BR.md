# Produção editorial de vídeo: método reproduzível

Este guia registra o método usado nos comerciais Caderna aprovados: teste de movimento, filme vertical, revisão de voz e música, recomposição horizontal e campanha para preparatórios. O objetivo é permitir novos conteúdos e novas linguagens visuais sem depender do histórico da conversa.

Leia este guia antes de alterar a referência em [reference/editorial-motion](reference/editorial-motion/README.md). Ela contém o código, os roteiros e os tempos usados na produção. Não inclui mídia, credenciais ou autorização de uso da marca em outras campanhas.

## 1. Separe o método das escolhas da campanha

| Camada | Método que deve permanecer | O que pode mudar |
|---|---|---|
| Verdade do produto | Evidência para cada afirmação e captura real | Produto, público, funcionalidades |
| Roteiro | Problema concreto, percurso, prova visual e convite | Gancho, argumento, vocabulário, duração |
| Voz | Interpretação avaliada, cache, tempo real da fala | Voz autorizada, idioma, intenção, provedor |
| Ritmo | Cenas e ações ancoradas nas palavras | Densidade, pausas, transições |
| Visual | Hierarquia, proporção, continuidade e legibilidade | Paleta, fontes, ilustração, fotografia, interface |
| Som | Voz inteligível, música reduzida sob a fala | Instrumentação, intensidade, efeitos |
| Entrega | Arquivos verificados e estado documentado | Resolução, proporção, legendas, canal |

O estilo Caderna é uma aplicação desse método. Não copie cores, brilho ou documentos animados para uma marca que pede outra linguagem. Preserve o que faz o filme funcionar e reescreva a direção visual.

## 2. Contrato antes da produção

Registre em `design.md`: público e decisão esperada; duração e proporção; referência aprovada; atos; paleta; fontes locais; escala de texto; margens; motivo visual; transições; tratamento de capturas; voz; trilha; frase final; exceções às regras do toolkit. Leia `CLAUDE.md` e a skill `video-design`.

No caso Caderna, o usuário aprovou luz radial, partículas discretas, superfícies translúcidas e brilho pontual nas conexões. Essas escolhas substituem, neste projeto, as restrições anteriores contra gradientes e brilho. Não estenda essa exceção automaticamente a outros projetos.

Antes de chamadas pagas, confira o escopo já autorizado, credenciais e arquivos em cache. Não repita pedidos de aprovação já resolvidos. Não gere mídia para descobrir o roteiro. Alterações locais, rascunhos, validação e preparação podem avançar enquanto alguma informação realmente necessária estiver pendente.

## 3. Roteiro e evidência

1. Defina o destinatário: aluno, professor, coordenação ou comprador. O comercial para concursos fala à escola preparatória; a V2 multipúblico também inclui faculdades, técnicos, EAD, ensino básico e pré-vestibular.
2. Abra com uma situação reconhecível. Exemplos: “Quem apoia o aluno entre uma aula e outra?” e “Saiu o edital. E, de repente, a escola inteira tem um prazo.”
3. Conecte a situação a um percurso visível. Na referência: conteúdo → plano → apostila → conversa → prática → revisão → escola.
4. Para cada função, registre evidência no produto, captura disponível e condições de acesso. Acompanhamento docente exige painel configurado e perfil de professor.
5. Evite promessas de aprovação, economia de horas ou resultados sem comprovação. Identifique dados e gráficos demonstrativos.
6. Posicione o convite antes da assinatura. A frase final fica sozinha e legível; o URL não disputa atenção com ela.
7. Execute `rtk proxy uv run tools/copy_lint.py <roteiro.json>` antes da geração.

Use blocos com `id`, `budget` em segundos e `text`. O filme de referência tem sete blocos: 15, 15, 20, 20, 20, 18 e 12 segundos. A soma de 120 segundos é uma escolha dessa campanha, não uma constante universal. O código atual assume sete blocos e 3600 quadros; outra estrutura exige adaptar o sequenciador e os scripts, não apenas trocar o JSON.

Os 238 termos da campanha para concursos são um dado de produção. Uma estimativa de palavras por minuto serve para planejar, mas o áudio gerado determina os tempos reais.

## 4. Teste de movimento antes do filme inteiro

Produza um trecho curto que contenha abertura, transformação e assinatura. O teste Caderna durou 12 segundos. Valide composição, peso do texto, continuidade dos objetos e ritmo antes de multiplicar a linguagem por dois minutos.

Escolha uma transformação que explique a história. Na Caderna, grupos de linhas de uma folha viram semanas; uma semana cresce em apostila; a apostila se liga à conversa e à revisão. Evite uma apresentação de cartões independentes com a mesma entrada repetida.

Animação determinística: derive tudo de `useCurrentFrame()`, `interpolate()` e easing. Não use relógio real, CSS animation, números aleatórios ou estado que dependa da ordem de renderização. Partículas, quando autorizadas, usam índices e funções matemáticas estáveis.

Uma mudança de cena deve preservar a geometria do objeto que continua: posição, tamanho, cor e andamento. Confira quadros antes, no momento e depois da fronteira. Não confunda uma pausa intencional de leitura com mídia que terminou cedo e congelou.

## 5. Voz expressiva e cache

O problema da primeira versão foi a voz percebida como chapada, agravada por desaceleração. A revisão aprovada usa a voz configurada no ambiente, `eleven_v4`, estabilidade 0,35, similaridade 0,85 e tempo natural 1,0. São parâmetros registrados da produção, não garantia de resultado para qualquer voz nem recomendação permanente de API.

Método:

1. Escreva frases faláveis, com intenção clara e pausas de pontuação. Ouça uma amostra se trocar de voz, idioma ou direção.
2. Para uma campanha nova, gere uma interpretação contínua quando houver espaço no provedor. Solicite alinhamento de caracteres.
3. Converta caracteres em palavras, preservando início e fim. Confira se o texto alinhado corresponde ao roteiro.
4. Separe blocos no ponto médio do intervalo entre a última palavra do bloco anterior e a primeira do seguinte. Aplique apenas uma microentrada de 5 ms para evitar clique de edição.
5. Para revisões pontuais, gere somente os blocos cujo texto mudou. Reutilize os outros takes aprovados.
6. Faça cache por hash de texto, voz e configurações. Guarde áudio, alinhamento, modelo e parâmetros. Nunca substitua silenciosamente a voz se o ID estiver ausente.
7. Em falha de rede, verifique o arquivo e o histórico do provedor antes de repetir uma geração cobrada.

A referência usa `tools/voiceover.py::generate_dialogue_audio`. `filme120-performance.py` registra o resultado em `performance-v2.json`. O nome é histórico: na edição concursos também é o manifesto da interpretação, não uma indicação de que a campanha seja a V2 multipúblico.

`voz/voice.json` é uma configuração de fallback anterior. Com um manifesto de performance presente, o montador usa o modelo e as configurações desse manifesto. Para reproduzir a voz aprovada, execute primeiro o script de performance; não acione o fallback por acidente.

Não desacelere toda a narração para preencher uma duração. Se faltar tempo, use leitura visual, transições com função e assinatura. Se sobrar fala, revise o texto ou a duração antes de acelerar o áudio.

## 6. Timeline ancorada no áudio

Os scripts medem os takes com `ffprobe`, convertem para WAV mono a 48 kHz e mantêm o tempo natural. Para cada bloco:

```text
mínimo = ceil(duração_do_take × 30) + margem
margem = 24 quadros; no último bloco, 105 quadros
sobra = 3600 − soma(mínimos)
peso = max(0, orçamento_do_bloco × 30 − mínimo)
extra = floor(sobra × peso / soma(pesos))
início_da_fala = início_do_bloco + 9 quadros
```

O último bloco recebe o resto do arredondamento. Se os mínimos não couberem, o script interrompe; não corta a fala. Se nenhum bloco tiver peso, distribui a sobra igualmente. Para outro FPS ou outra duração, altere todas essas relações, inclusive os fades, `atrim`, limites dos blocos, composições e revisões.

`src/*-timing.json` é a fonte de verdade do vídeo: blocos em quadros, palavras e legendas em segundos. `cue(bloco, frase)` normaliza caixa e pontuação, encontra a frase no alinhamento e retorna `round(início × 30)`. Frase ausente é erro, não um tempo aproximado.

Ao trocar o roteiro, revise todos os `cue()`. Exemplos de armadilhas reais: “Dê aos” virou “Dê o”; “Caderna” aparece no URL e na assinatura, então a assinatura usa a sequência “Caderna Dê”. Uma troca parcial em duas chamadas pode deixar um erro que só surge no encerramento.

Legendas são agrupadas por frase, com orçamento de 56 caracteres e 4,2 segundos, penalizando quebras em artigos e preposições. O alinhamento define os tempos; o texto de exibição pode normalizar o URL falado para `caderna.ia.br`. Revise o resultado e gere também SRT.

## 7. Linguagem visual e formatos

### Referência Caderna

| Elemento | Decisão registrada |
|---|---|
| Fundo | Tinta `#1C1F17`, luz radial discreta |
| Texto | Papel `#F6F4EF` |
| Ênfase | Oliva `#B5C79A`; detalhes âmbar `#D7BB8A` |
| Fontes | Instrument Sans 400/600 e Lora itálica, locais |
| Desktop | Texto em x=120, largura 700; arte à direita |
| Títulos | 78 px; gancho “SAIU O” 128 px |
| Notas e legendas | Notas 28 px; legendas 34 px em faixa inferior |
| Assinatura | Marca centralizada e frase em duas linhas; “diferencial” em itálico |

`Page`, `Line`, `Connection`, `Wave` e `Crop` são primitivas gráficas. `createDesktopFilm(timing, concursos)` compartilha a direção entre as duas campanhas. O booleano atual resolve duas variantes; para várias campanhas, substitua condicionais de conteúdo por um objeto de configuração explícito. Não invente mais combinações de flags.

### Mudar conteúdo mantendo a linguagem

Crie uma edição isolada, com roteiro, manifesto de voz, mix, timeline e IDs de composição próprios. Reutilize somente os takes cujo texto permaneceu idêntico. Troque títulos, cues, capturas e qualificações. Confira se o argumento todo conversa com o novo público, não apenas a abertura.

### Mudar a linguagem mantendo o método

Mantenha roteiro, áudio e timeline aprovados. Redefina `design.md` e substitua os componentes de apresentação. Exemplos: linhas e nós para uma ferramenta de dados; agenda e janelas de tempo para planejamento; capturas reais para demonstração de software; fotografias autorizadas para narrativa institucional.

Preserve a função de cada cena e os pontos de fala. Troque a metáfora visual completa quando necessário: um gráfico não deve herdar uma folha de papel só porque ela já existe no código. Cores e transições devem explicar os atos. Teste novamente um trecho curto antes do render completo.

### Vertical para horizontal

Recomponha o layout. Não estique o vídeo vertical nem preencha a tela com uma ampliação que corte títulos. A versão 1920 × 1080 separa texto e arte; mantém proporções dos recortes e reserva espaço próprio para legendas. A translação de grupos SVG na referência reaproveita geometria, mas é uma decisão daquele arranjo, não uma fórmula universal.

## 8. Capturas reais e limites de afirmação

Capture o produto no tamanho conhecido, preserve a razão de aspecto e use um recorte explícito `[x, y, largura, altura]`. O componente `Crop` da referência pressupõe uma imagem de 1920 px de largura; adapte o cálculo se a captura mudar.

Recortes Caderna registrados, em pixels da origem:

| Arquivo | Recorte | Função |
|---|---|---|
| `reader-1920.webp` | `[1607,133,280,218]` | Marcações da apostila |
| `whiteboard-1920.webp` | `[316,852,319,72]` | Tema do quadro |
| `whiteboard-1920.webp` | `[28,970,208,92]`, x=255 e x=482 nas demais partes | Conceitos ligados |
| `mock-result-1920.webp` | `[279,211,320,38]` | Resultado demonstrativo |
| `mock-result-1920.webp` | `[280,307,452,64]` | Resultado por matéria |

O quadro usa partes rearranjadas da captura, identificadas como recortes demonstrativos. O painel docente é uma representação explicativa, não uma captura de interface. Não apresente desenho conceitual como tela existente. Não esconda qualificações essenciais em texto ilegível.

## 9. Música e mixagem

A produção reutilizou o instrumental local `public/audio/music/caderna-2min_1.mp3`. Verifique origem e permissão de uso antes de reutilizar uma trilha em outra marca ou canal. Não gere outra música quando a existente já resolve o pedido.

Processamento local registrado:

1. Corte a partir de 2 s da faixa de 122 s, para uma cama de 120 s.
2. Normalize a música para −22 LUFS, pico alvo −3 dBTP e LRA 9.
3. Fade de entrada de 1,2 s; saída a partir de 117,4 s, com 2,6 s.
4. Reduza a música pela voz com `sidechaincompress`: threshold 0,05; ratio 3; attack 20 ms; release 550 ms; knee 3.
5. Duplique a voz mono nos canais estéreo, some com `amix normalize=0`, limite a 120 s e normalize o master em duas passagens para −15 LUFS, pico alvo −1,5 dBTP e LRA 11.
6. Guarde voz seca, música reduzida, premaster e relatório. Meça novamente o MP4 após AAC.

Os valores são ponto de partida da referência. Ajuste pela inteligibilidade e caráter da música. Não use música alta para compensar uma locução sem intenção. Na campanha concursos, o MP4 mediu −15 LUFS e pico verdadeiro −1,67 dBTP.

## 10. Execução reproduzível

Pré-requisitos: `rtk`, Git, Node/npm, `uv`, FFmpeg/ffprobe. Python e bibliotecas do toolkit via `rtk proxy uv sync`. Configure `ELEVENLABS_API_KEY` e `ELEVENLABS_VOICE_ID` no ambiente, nunca no repositório. Consulte o código e a documentação atual do provedor antes de migrar modelos ou SDKs.

Copie a referência para `projects/<nome>` conforme o README dela. Os scripts Python calculam a raiz do toolkit a partir dessa profundidade. Não execute geração diretamente dentro de `docs/reference`.

Exemplo com o projeto Caderna existente, a partir da raiz do toolkit:

```powershell
# Geração nova: chamada paga, apenas dentro do escopo autorizado.
rtk proxy uv run python -X utf8 projects/caderna-comercial/scripts/filme120-performance.py --edition concursos --generate

# Revisão: requer um manifesto da edição e gera somente os índices informados.
rtk proxy uv run python -X utf8 projects/caderna-comercial/scripts/filme120-performance.py --edition concursos --patch-blocks 0 1 5 6 --generate

# Montagem e mix locais, sem nova geração.
rtk proxy uv run python -X utf8 projects/caderna-comercial/scripts/filme120-audio.py --edition concursos
rtk proxy uv run python -X utf8 projects/caderna-comercial/scripts/filme120-mix.py --edition concursos
```

Os dois comandos de geração são alternativas. Não execute ambos automaticamente. Ao iniciar uma edição reutilizando outra, copie o manifesto aprovado, ajuste apenas os blocos alterados e registre separadamente quantos takes foram gerados e quantos reutilizados. O contador herdado pode incluir chamadas da campanha anterior.

Dentro do projeto:

```powershell
rtk npm run check
rtk proxy node scripts/filme120-preview.mjs --concursos
rtk proxy node scripts/filme120-preview.mjs --concursos --handoffs
rtk proxy node scripts/filme120-preview.mjs --concursos --clips
rtk proxy npx remotion render src/index.ts CadernaConcursos120 out/caderna-concursos-1080p-limpo.mp4 --codec=h264 --crf=18 --concurrency=4
rtk proxy npx remotion render src/index.ts CadernaConcursos120Legendado out/caderna-concursos-1080p-legendado.mp4 --codec=h264 --crf=18 --concurrency=4
```

Para a V2 horizontal, use `--desktop` na revisão e as composições `CadernaFilme120Desktop` e `CadernaFilme120DesktopLegendado`. Para a vertical, omita `--desktop` e use `CadernaFilme120` e `CadernaFilme120Legendado`. Confira nomes no `Root.tsx`; IDs duplicados impedem o bundle de renderizar.

## 11. Validação antes da entrega

A partir da raiz:

```powershell
rtk proxy uv run python -X utf8 tools/qc.py --project projects/caderna-comercial --layout --composition CadernaConcursos120Legendado --layout-every 2 --skip-loudness --json
rtk proxy uv run python -X utf8 tools/qc.py --project projects/caderna-comercial --render projects/caderna-comercial/out/caderna-concursos-1080p-legendado.mp4 --target-lufs -15 --json
rtk proxy uv run tools/contact_sheet.py projects/caderna-comercial/out/caderna-concursos-1080p-legendado.mp4 --at 0,1,5.5,8.13,17.17,22.5,32.17,39.9,54.33,59.67,76.17,79.93,93.57,96.47,115.5,119.5 --cols 4 --width 480 -o projects/caderna-comercial/out/caderna-concursos-1080p-revisao.png
```

Verificações necessárias:

- TypeScript, copy lint, cues existentes e IDs únicos.
- Blocos contíguos, duração correta, fala dentro do bloco e legendas dentro do vídeo.
- Primeiro quadro, todas as cenas, transições, CTA e último quadro real. Inspecione o último quadro com FFmpeg se o gerador de painel limitar a amostra a 0,5 s antes do fim.
- Resolução, FPS, contagem de quadros, duração, presença de áudio e codecs via `ffprobe`.
- Recortes, proporções, acentos, logo, contraste, quebras de linha e área das legendas.
- Voz audível, sem cortes, sem aceleração indesejada; música e pico verdadeiro no MP4.
- Revisão humana da locução ou reconhecimento independente como apoio. ASR não avalia atuação nem substitui a escuta.

O auxiliar `concursos-asr.py` usa faster-whisper local, modelo small já disponível, CPU int8. Instale o extra com `uv run --with faster-whisper`; o script exige o modelo em cache. Decodifique via FFmpeg para float32/16 kHz se a versão de PyAV rejeitar `metadata_errors`. Nomes de marca podem sair errados no ASR; compare alinhamento e áudio antes de comprar outra geração.

Leia os avisos do QC. Uma pausa de leitura planejada pode permanecer, com justificativa registrada. Um trecho congelado por erro deve ser corrigido. Não declare “sem avisos” quando apenas não houve erros. Depois de corrigir conteúdo, cenas ou áudio, repita os testes afetados; não regenere tudo sem motivo.

## 12. Entrega e memória para o próximo agente

Entregue MP4 limpo e legendado quando fizer parte do escopo, SRT, painel de revisão e um documento de produção. Registre dimensões, duração, composições, comandos, fontes de mídia, parâmetros de voz e mix, validações, ressalvas e localização dos caches. Preserve versões aprovadas com nomes distintos.

Deixe um checkpoint com: objetivo atual; decisões aprovadas; arquivos alterados; gerações já pagas; erros pendentes; próximos comandos. Não dependa de mensagens de chat para descobrir qual voz ou roteiro foi aprovado.

No Git, `projects/` é ignorado. Documentação que precisa chegar ao fork deve estar em pasta rastreada, com fontes selecionadas e sem `.env`, IDs de conta, áudios pessoais, caches, binários ou `node_modules`. Não use `git add -f projects/` indiscriminadamente. Confira o diff staged, crie a branch, faça commit e envie apenas o escopo solicitado. Branch publicada não implica autorização para abrir PR.

## 13. Falhas conhecidas e recuperação

| Sintoma | Causa provável | Ação |
|---|---|---|
| Voz robótica ou arrastada | Interpretação inadequada ou alongamento artificial | Rever atuação e frases; preservar tempo natural |
| Vídeo sem energia sonora | Trilha ausente ou mix inadequada | Usar trilha pertinente com redução sob a fala |
| Erro só na assinatura | Cue antigo após troca de frase | Revisar todas as ocorrências e renderizar o fim |
| Composição duplicada | ID já usado no projeto | Criar ID exclusivo, como `CadernaConcursos120` |
| Fonte ou recorte errado no desktop | Redimensionamento do vertical | Recompor áreas e preservar proporções |
| Saída quebrada no Windows | Code page ou leitura sem encoding | `python -X utf8`, leitura e escrita UTF-8 |
| `rtk proxy Get-Content` falha | Cmdlet não é executável externo | Usar `rtk proxy powershell -NoProfile -Command ...` |
| Narração diz URL como sequência longa | Texto de fala e legenda tratados igualmente | Preservar fala; normalizar apenas exibição |
| Próximo agente não encontra fontes | Projeto ignorado pelo Git | Referência rastreada e inventário de mídia |
| API falha depois de gerar áudio | Retry sem inspeção duplica custo | Recuperar take e alinhamento antes de repetir |

## 14. Prompt de retomada

> Leia `docs/video-production-playbook.pt-BR.md`, o README da referência e o `design.md` da edição. Produza [objetivo] para [público], em [formato/duração]. Preserve [decisões aprovadas] e altere [conteúdo/linguagem]. Valide as afirmações do produto, reaproveite takes idênticos e gere somente o necessário dentro do escopo autorizado. Ancore cenas e legendas no áudio; revise quadros e transições; entregue arquivos verificados e atualize o checkpoint. Não substitua voz, identidade, frase final ou mídia aprovada sem uma razão registrada.
