# Estado e origem da referência

Snapshot preparado em 15/11/2026 a partir de `projects/caderna-comercial`, após aprovação da V2 e produção da campanha para concursos. A pasta original é local e ignorada pelo Git. O material desta referência é textual e rastreado.

Decisões preservadas: voz configurada em tempo natural, música instrumental existente com redução sob a fala, objetos gráficos que continuam entre cenas, recortes reais, legendas sincronizadas por palavras, CTA antes da assinatura e recomposição horizontal. As exceções visuais aprovadas estão em `design.md`.

Diferenças da cópia: `Root.tsx` registra apenas as composições relevantes; package.json remove hooks de assets do workspace original; bundler e renderer têm versões explícitas; o gerador cria a pasta de cache quando ausente. Não há áudio nem manifesto de performance com caminhos para takes indisponíveis. As timelines são exemplos aprovados, a substituir após gerar novas falas.

Validação da referência: instalação via `npm ci`, `tsc --noEmit`, sintaxe Python via AST, JSON parseável, copy lint dos guias e verificação de whitespace. O bootstrap foi exercitado em `projects/editorial-reference-check` e o CLI de performance abriu `--help` sem chamada paga. O render da referência isolada não foi executado: as mídias são deliberadamente externas. Os vídeos de origem foram renderizados e verificados no projeto original.

Próximo agente: leia o playbook, copie para um destino novo, escolha conteúdo e direção, forneça mídia autorizada e configure a voz. Para nova interpretação, gere uma vez, monte a timeline real e revise os cues. Para alteração visual, preserve a timeline aprovada e troque a apresentação. Finalize com revisão visual, áudio, QC e relatório da edição.

Limite conhecido: esta implementação contém sete blocos, 120 segundos, 30 fps e duas edições nomeadas. Para uma estrutura diferente, atualize o contrato e os pontos fixos identificados no playbook antes de renderizar.
