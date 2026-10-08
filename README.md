# Eldervale — O despertar da floresta

RPG original de mundo aberto **isométrico 2.5D**, desenhado em Canvas. Abra [index.html](./index.html), mantendo [campaign.js](./campaign.js) e [world-generator.js](./world-generator.js) na mesma pasta. Continua offline, sem servidor, instalação, CDN ou assets externos. Os arquivos auxiliares organizam campanha e geração procedural.

## Jogar

Abra [index.html](./index.html) em Chrome, Edge ou Firefox recente e escolha **Iniciar aventura**. Consulte a ajuda com **H**. O jogo também oferece joystick e botões em dispositivos touch.

### Controles

| Controle | Ação |
|---|---|
| WASD / setas | Movimento nas direções da tela |
| Clique / Espaço | Ataque básico; teclado mira na posição do cursor |
| Clique direito | Caminhar até um ponto livre, com busca de rota A* limitada |
| 1 | Corte lunar em área |
| 2 | Chama astral, projétil mágico |
| 3 | Renovação, cura |
| 4 | Nova glacial, desbloqueada pelo talento Abraço do inverno |
| Shift | Esquiva com invulnerabilidade, consome energia |
| E | Conversar, coletar materiais, explorar construções, abrir baús, ativar nascentes |
| R | Poção de vida |
| I / K / C | Inventário / árvore de talentos / atributos |
| L (ou J) / M / H / Esc | Missões / mapa / ajuda / pausa |
| ♫ | Ativar/desativar áudio sintetizado |

Os botões da hotbar usam mira assistida no inimigo mais próximo. No mapa, clique para marcar um destino. Os botões de refúgio permitem viagem rápida para Willowmere e nascentes descobertas, quando não há inimigos próximos.

## Sistemas

- Mundo procedural de **192 × 192 células**, com seed digitável ou aleatória e 64 regiões de 24 × 24. Willowmere, bosque, ruínas e covil permanecem como locais principais; a fronteira gera novas construções, recursos e inimigos conforme a exploração.
- **Oito tipos exploráveis**: mina, serraria, moinho, torre de vigia, santuário, acampamento, arquivo e observatório. Use E no acesso marcado para ler a história e recuperar suprimentos uma única vez.
- Materiais: madeira, minério, ervas, cristais e gel de slime. Coleta com E e drops dos inimigos; as missões consomem materiais somente na entrega.
- Terreno cacheado, câmera suave, ordenação isométrica, sombras, água animada, partículas, folhagens e ciclo de dia/noite.
- Slimes e goblins com perseguição e ataques telegrafados; Vyrath, dragão com duas fases e ataques em área.
- Vida, mana, energia, ouro, XP, níveis e quatro atributos: força, destreza, inteligência e vitalidade.
- Três caminhos combináveis — Guardião, Arcanista e Andarilho — com nove talentos e pré-requisitos reais.
- Doze equipamentos únicos entre armas, vestimentas e escudos, quatro raridades e efeitos sobre atributos. Defesa de escudo é passiva.
- NPCs com diálogo, comércio, compra/venda, descanso, baús e nascentes de recuperação.
- **Campanha em cinco capítulos**: A primeira luz → Caminhos abertos → Ecos ancestrais → Reacender o vale → O juramento esmeralda. Objetivos de conversa com NPCs, coleta/entrega, exploração de locais e quantidades de slimes/goblins/dragão.
- Três missões secundárias com recompensas próprias. Diário [L] mostra pré-requisitos, contadores, NPC da entrega e botão para marcar cada objetivo no mapa. Recompensas não podem ser resgatadas novamente.
- Vyrath é liberado ao concluir Reacender o vale. Jogadores com saves antigos mantêm progresso/conclusão e acesso aos contratos secundários.
- Ao cair, o personagem volta ao último refúgio com sua progressão e perde 10% do ouro.
- Menus pausam o combate e a passagem do tempo do mundo; animações cosméticas podem continuar.

## Salvamento e privacidade

O save **v2** usa `eldervale.save.v2` no `localStorage`, incluindo seed, regiões geradas, névoa explorada, recursos coletados, construções visitadas/saqueadas, materiais e campanha. A chave antiga `eldervale.save.v1` é lida/migrada sem ser apagada; os índices do mapa 96 × 96 são convertidos para a dimensão nova.

No menu **Esc**, use **Exportar backup JSON** ou **Importar backup JSON**. O backup pode ser transferido para outro navegador/computador. Importação valida versão/conteúdo, limita arquivos a 2 MB e pede confirmação antes de substituir a jornada. O navegador não grava silenciosamente um arquivo arbitrário: o JSON é um download escolhido pelo usuário.

Salvamento automático a cada 20 segundos, nas alterações de progressão e ao gerar regiões. Uma nova aventura também pede confirmação. Arquivos e dados nunca são enviados a servidores.

A persistência depende da política do navegador para páginas `file://`, do perfil utilizado e das configurações de privacidade. Com armazenamento indisponível, o jogo continua na sessão atual e informa a limitação. Inimigos comuns reaparecem após um intervalo e são recriados ao carregar; a conclusão do dragão permanece salva.

## Validação

Nesta iteração, foram verificados no navegador: carregamento dos scripts por `file://`, migração do save v1 concluído, diário L, conversas, coleta, persistência de recursos, entrega de A primeira luz com consumo correto e recompensa, desbloqueio do segundo capítulo, equipamento, combate/XP, rota ao redor da serraria, exploração e recompensa única da construção, exportação/importação JSON e rejeição de versão inválida sem alterar o save.

Uma **fixture importada** foi usada para chegar à fronteira e verificar geração de regiões, acesso a uma construção procedural e preservação de sua identidade/saque após reload. Uma travessia real entre regiões 4 e 5 confirmou a geração automática de três regiões adicionais. Não foi uma travessia completa do mapa pelo gameplay. Layout de diário em 390 × 844 também verificado.

**54 autotestes embutidos** cobrem domínio, geração, comércio, recompensas, normalização, migração e colisão; abra `index.html#test` para executá-los. Não modificam o save. A suíte **não foi executada**, pois a confirmação solicitada não pôde ser obtida. Não houve instalação de dependências, hooks Graphify, commit ou push. A campanha antiga foi concluída na versão anterior; os cinco capítulos novos e todos os contratos não tiveram aceitação integral. Touch em dispositivo físico, falhas de armazenamento e todos os trajetos/seeds não foram reproduzidos.

## Limites

Demo single-player local: não é um MMORPG, não usa WebGL/Three.js, não é um jogo AAA e não sincroniza saves entre dispositivos. Gráficos, formas e áudio são gerados pelo próprio código, sem conteúdo de jogos comerciais.
