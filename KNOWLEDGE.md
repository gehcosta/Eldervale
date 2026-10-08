# Conhecimento técnico — Eldervale

## Organização

[index.html](./index.html) integra Canvas, HUD, aplicação e persistência; carrega os scripts clássicos locais [campaign.js](./campaign.js) e [world-generator.js](./world-generator.js). Manter os três juntos permite abrir via `file://`, sem fetch, ES modules, servidor ou build.

- **Domínio do personagem:** `deriveStats`, `equipItem`, `unlockTalent`, `allocateAttribute`, `grantExperience` e `normalizeSave`.
- **Campanha:** `EldervaleCampaign` fornece catálogos, objetivos tipados, progresso, aceite, normalização/migração, recompensa atômica e comércio. `claim` consome materiais/atualiza flags e retorna a recompensa; engine aplica ouro, XP, talentos e itens.
- **Gerador:** `EldervaleWorld` fornece terreno, seed, regiões, IDs estáveis, sites e normalização do estado de mundo. `ensureRegion` instala entidades uma única vez; `ensureNearbyRegions` descobre vizinhança em intervalos de 0,5 s.
- **Aplicação:** loop, IA, combate, coleta, exploração de construções, NPCs, missões e comércio.
- **Infraestrutura:** Canvas, cache LRU, Web Audio, localStorage, exportação Blob/download e importação por input file com confirmação.
- **Interface:** HUD, diário [L/J], inventário de materiais, foco de modal, teclado/mouse e Pointer Events touch.

## Mundo e renderização

Mapa de 192 × 192 células; 64 regiões de 24 × 24, projeção 64 × 32 pixels. Terreno é função determinística da seed e das coordenadas. A região histórica conserva Willowmere/NPCs/dragão; a fronteira gera sites, props, recursos e inimigos por região. IDs como `site-4-4` e `resource-1-1-0` permanecem iguais no reload. Sites/recursos gerados não são recriados por frame.

Chunks visuais de 12 × 12 são canvases auxiliares com limite LRU de 40. Entidades usam culling e profundidade isométrica; árvores podem ficar translúcidas sobre o personagem. IA distante fica suspensa. Cada fronteira tem trilhas horizontais/verticais e acesso à construção; recursos/construções têm clareiras.

Movimento usa subpassos para reduzir tunneling. Colisões incluem água, prédios e props. Clique direito usa A* limitado a 4.500 expansões, com verificação de diagonais e fallback de direção quando não encontra rota. Não é navegação global ilimitada.

`requestAnimationFrame` recebe delta limitado a 100 ms. A simulação não avança com o documento oculto. Uma renderização inicial explícita evita canvas vazio em prévias que começam em background. Menus interrompem combate e avanço do relógio; partículas cosméticas continuam.

## Regras relevantes

- Origem do jogador e refúgio inicial: praça de Willowmere, fora da colisão da fonte.
- Equipamentos únicos não são consumidos ao trocar. Vender um equipamento inicial não o recria no carregamento; o normalizador só fornece fallback quando falta um slot utilizável.
- Talentos exigem ponto disponível e pré-requisito, sem gastar pontos em tentativas inválidas.
- Nova campanha principal tem cinco capítulos. Vyrath depende da entrega de `rekindle`; flags antigas são sincronizadas para manter a integração de combate.
- `talk` e `visit` mantêm histórico; kills só contam em quests aceitas. `collect` consulta materiais disponíveis; claim verifica todos os objetivos e depois consome os materiais da entrega atomicamente.
- Recompensas têm flag claimed, sem duplicação. Próximo capítulo principal é aceito automaticamente. Três secundárias são opcionais.
- Exploração de construções é um painel narrativo com suprimentos, não uma cena de interior navegável. Visitas podem ser repetidas; saque/XP/ouro só uma vez. Recursos naturais são esgotados permanentemente naquela seed.
- Escudos e vestimentas participam da defesa passiva. Esquiva possui custo e cooldown; ataques usam círculos de aviso antes de causar dano.
- Viagem rápida exige distância dos inimigos, destino acessível e refúgio conhecido; preserva a progressão e atualiza o checkpoint.

## Persistência e diagnóstico

Save `version: 2`, `mapSize: 192` sob `eldervale.save.v2`, contendo `player`/`world`/`worldTime`/`explored`. Mundo tem `version: 1`, seed, generated, harvested, visited e looted. Catálogos e limites normalizam inventário/materiais/talentos/campanha. Enemies comuns são reconstruídos; a vitória do dragão permanece.

Fallback lê a chave v1 sem apagá-la. Migração converte `floor(index / 96) * 192 + index % 96` e preserva evolução/completion. V1 parcial passa para objetivos correspondentes, sem repetir recompensas antigas. V2 normaliza seu próprio estado e não reaplica a migração a cada save.

Exportação gera JSON por Blob e download nativo; importação limita 2 MB, valida schema/versão e só aplica após confirmação no painel. Invalid input não altera sessão/save. Arquivos não podem ser gravados silenciosamente pelo HTML.

`window.Eldervale.snapshot()` retorna cópia para inspeção, incluindo regiões/sites/recursos. `runTests()` ou `index.html#test` reúnem **54 autotestes**: 20 no engine, 25 na campanha e 9 no gerador. Não foram executados por ausência de confirmação. Verificações manuais incluíram capítulo inicial completo, coleta/entrega, recompensa única de construção, migração v1 concluído, export/import e fronteira por fixture JSON. A campanha de cinco capítulos não teve aceitação integral nesta iteração; os resultados e limites estão em [README.md](./README.md).

## Escopo e rastreamento

Changes OpenSpec `RPG/build-eldervale-rpg` e `RPG/expand-procedural-world-campaign`, sem cards vinculados. A criação de card no board WTS - Kanban foi proposta, mas não executada por ausência de confirmação. Nenhum serviço WTS foi alterado. Nenhum commit, push, instalação ou hook Graphify foi realizado.
