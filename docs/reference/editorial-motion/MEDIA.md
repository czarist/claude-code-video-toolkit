# Mídias que precisam ser fornecidas

As mídias ficam fora desta referência textual. Use os arquivos autorizados do projeto original ou substitua-os por arquivos adequados ao novo conteúdo.

| Destino relativo à cópia de trabalho | Requisito |
|---|---|
| `public/assets/marca/logo-amber.svg` | Logo autorizado, proporção original |
| `public/assets/telas/reader-1920.webp` | Captura de origem com 1920 px de largura, coordenadas no playbook |
| `public/assets/telas/whiteboard-1920.webp` | Captura de origem com 1920 px de largura |
| `public/assets/telas/mock-result-1920.webp` | Captura de origem com 1920 px de largura |
| `public/audio/music/caderna-2min_1.mp3` | Instrumental autorizado, pelo menos 122 segundos para o corte atual |
| `public/audio/filme120/mix.wav` | Gerado pelos scripts da edição multipúblico |
| `public/audio/concursos/mix.wav` | Gerado pelos scripts da edição concursos |

Saídas locais adicionais: takes e metadados em `<edição>/cache/`; `performance-v2.json`; voz seca e música reduzida em `public/audio/<edição>/`; premaster, relatórios, palavras, legendas e SRT na pasta da edição.

Sem esses arquivos, o TypeScript pode passar, mas o render deve falhar por mídia ausente. Não interprete esse erro como necessidade de gerar novamente todas as mídias. Prepare um inventário e recupere somente o que falta.

Não publique credenciais, tokens, arquivos `.env`, IDs reais de voz, amostras pessoais, takes ou capturas privadas junto desta referência. Configuração de API é externa ao código. Para outro produto, atualize recortes e evidências; não reutilize uma captura Caderna como se fosse sua interface.
