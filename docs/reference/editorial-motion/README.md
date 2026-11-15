# Referência de produção editorial

Código e dados textuais da produção Caderna, preservados para estudo e adaptação. Leia primeiro o [playbook](../../video-production-playbook.pt-BR.md). Esta pasta é uma referência, não um template registrado no catálogo nem um pacote com mídia pronta para renderizar.

## Preparar uma cópia de trabalho

A partir da raiz do toolkit, copie para um destino novo. O teste de existência evita misturar arquivos com outro projeto.

```powershell
rtk proxy python -c "import shutil; shutil.copytree('docs/reference/editorial-motion', 'projects/editorial-novo', ignore=shutil.ignore_patterns('node_modules', '__pycache__', '.remotion', 'out'))"
rtk proxy npm --prefix projects/editorial-novo ci
rtk proxy npm --prefix projects/editorial-novo run check
```

Depois da cópia, todos os comandos do playbook podem usar `projects/editorial-novo` em lugar de `projects/caderna-comercial`. Os scripts Python esperam essa profundidade dentro de `projects/`; não os execute nesta pasta de documentação.

## Conteúdo

| Caminho | Papel |
|---|---|
| `src/CadernaFilme120.tsx` | Vertical aprovada e primitivas gráficas |
| `src/CadernaFilme120Desktop.tsx` | Layout horizontal e fábrica compartilhada |
| `src/CadernaConcursos.tsx` | Composições da campanha para concursos |
| `src/*-timing.json` | Timelines aprovadas como exemplos de esquema e cues |
| `filme120/roteiro.json`, `concursos/roteiro.json` | Roteiros das campanhas |
| `scripts/filme120-performance.py` | Geração expressiva, alinhamento e substituição parcial |
| `scripts/filme120-audio.py` | Alocação temporal, voz seca, palavras, legendas e SRT |
| `scripts/filme120-mix.py` | Trilha, redução sob a voz e normalização |
| `scripts/filme120-preview.mjs` | Cenas, fronteiras e clipes para revisão |
| `scripts/concursos-asr.py` | Reconhecimento independente dos takes novos |
| `voz/voice.json` | Fallback histórico, sem ID real |
| `MEDIA.md` | Inventário das mídias ausentes |

`Root.tsx` registra somente as composições desta referência. Não contém outras campanhas do workspace original. Fontes são dependências locais. `package-lock.json` fixa a instalação Node. O toolkit pai fornece Python, ferramentas de geração e QC.

## Primeira geração e reutilização

Não há cache de voz ou manifesto de performance nesta pasta. Para uma produção nova autorizada, forneça as mídias indicadas em `MEDIA.md`, configure a voz e gere a interpretação com `--edition filme120 --generate` ou `--edition concursos --generate`. Em seguida, monte a timeline e o mix da mesma edição. A geração completa cria o manifesto necessário às revisões posteriores.

Para reutilizar takes do workspace original, copie também os arquivos referenciados pelo manifesto; copiar apenas JSON não basta. Use `--patch-blocks` somente quando já existir um manifesto válido. A referência tem nomes de edição fixos; renomear ou acrescentar edições exige atualizar opções CLI, paths, imports e composições juntos.

As timelines incluídas descrevem takes anteriores. Quando gerar outra voz, o comando de montagem deve substituí-las pelos tempos reais antes do render. Não sincronize uma nova fala com os tempos antigos.

As campanhas são exemplos de conteúdo da Caderna. Para outra marca, atualize identidade, copy, recortes, restrições, voz autorizada e `design.md`; não apresente os exemplos como fatos sobre outro produto.

## Histórico preservado

- V2: narrativa multipúblico, expressão natural e música.
- Desktop: recomposição horizontal, sem esticar o vertical.
- Concursos: gancho “Saiu o edital” e assinatura “Dê o diferencial que seus alunos merecem.”

A aprovação estética não substitui validação de uma nova edição. Faça preview, confira áudio e execute QC antes de entregar.
