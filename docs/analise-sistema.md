# Visão Geral do Sistema

## Arquitetura Atual
- **Phaser Game Config** (`src/main.ts`): define um jogo pixel-art com resolução base 320x240, escalonamento FIT e cenas `Preloader`, `DungeonScene` e `UIScene` em sequência.
- **Cenas**:
  - `Preloader`: carrega atlas do jogador, texturas de inimigos e mapas tileados antes de iniciar a `DungeonScene`.
  - `DungeonScene`: instancia o mapa, jogador, inimigos e integra os sistemas de movimento, colisão, IA e ataque.
  - `UIScene`: apresenta HUD de vida e reage a eventos globais de alteração de HP.
- **Fábricas** (`PlayerFactory`, `EnemyFactory`): encapsulam a criação de sprites com física arcade e componentes anexados.
- **Componentes**: `HealthComponent` controla vida, efeitos de dano e destruição; emite eventos globais para sincronizar UI.
- **Sistemas**:
  - `MovementSystem`: processa entrada direcional e animações de caminhada/parado.
  - `AnimationSystem`: abstrai a lógica de escolha de animação baseada na velocidade.
  - `CollisionSystem`: registra colisores físicos entre jogador e inimigos.
  - `EnemyAISystem`: aplica comportamento simples de patrulha horizontal.
  - `AttackSystem`: gerencia ataques do jogador, cria hitboxes temporárias e aplica dano via `HealthComponent`.

## Padrões de Projeto Identificados
- **Factory Method**: `PlayerFactory` e `EnemyFactory` centralizam configuração de entidades, facilitando variações futuras.
- **Component-Based Design**: `HealthComponent` permite reutilização de lógica de vida entre jogador e inimigos.
- **Event-Driven Architecture**: Eventos Phaser (`player-health-changed`) desacoplam o HUD das entidades de jogo.
- **Separation of Concerns**: Sistemas especializados (movimento, animação, IA, ataque) reduzem acoplamento na cena principal.

## Fluxo de Dados Principal
1. `Preloader` carrega recursos e inicia `DungeonScene`.
2. `DungeonScene` monta o mapa, cria entidades via fábricas e registra sistemas.
3. `MovementSystem` atualiza velocidade do jogador conforme entrada; `AnimationSystem` ajusta animação e orientação.
4. `EnemyAISystem` altera velocidade horizontal dos inimigos ao detectar bloqueios laterais.
5. `AttackSystem` cria uma hitbox invisível quando a tecla de ataque é pressionada; colisão com inimigos chama `HealthComponent.takeDamage`.
6. `HealthComponent` aplica efeitos, verifica morte e emite evento de vida para a `UIScene` atualizar o texto HUD.

## Pontos Fortes
- Modularidade adequada para expandir comportamentos sem inflar a cena principal.
- Uso consistente de `Physics.Arcade` e sistemas separados, facilitando testes futuros.
- HUD desacoplado via eventos garante sincronização simples entre gameplay e UI.

## Riscos Técnicos e Lacunas
- **Ausência de testes automatizados**: atualmente não há verificação de regressão.
- **Controle de estado limitado**: ataques e IA são síncronos e podem precisar de cooldowns/estados adicionais.
- **Hitbox invisível**: instanciada como `Sprite` vazio; considerar usar `Physics.Arcade.Image` para reduzir custo de animação.
- **Animações**: dependem de nomes hardcoded; seria útil centralizar num registrador único para evitar duplicação.

## Oportunidades de Melhoria
- **Sistema de Partículas/Efeitos**: extrair efeitos visuais para um sistema dedicado.
- **Pooling de Objetos**: implementar object pooling para hitboxes e inimigos a fim de reduzir alocações frequentes.
- **Mapeamento de Controles**: encapsular teclado em um serviço que permita rebind e suporte a gamepad.
- **IA Hierárquica**: substituir a lógica de bloqueio simples por uma máquina de estados ou comportamento baseado em pathfinding.
- **Separação de Dados de Configuração**: mover constantes (velocidade, dano, vida) para arquivos JSON ou estrutura de balanceamento.

## Alternativas Performáticas
- **Hitboxes com `Physics.Arcade.Body` customizado**: em vez de criar sprites visíveis, utilizar `this.scene.add.rectangle` + `physics.add.existing` com `setAllowGravity(false)` para reduzir overhead.
- **Tilemap Static Layer**: converter camadas estáticas para `StaticTilemapLayer` quando possível, melhorando renderização.
- **Animações Pré-Registradas**: registrar animações no `Preloader` uma única vez para evitar recriação redundante ao instanciar múltiplos jogadores.
- **Pathfinding com Grid Pré-Computado**: caso haja muitos inimigos, utilizar algoritmo A* com grid pré-processado para diminuir verificações de colisão a cada frame.

## Próximos Passos Recomendados
1. Adicionar testes unitários para componentes e sistemas críticos (ex.: danos, emissão de eventos, movimentação).
2. Implementar logging/telemetria de debug em desenvolvimento para inspecionar estados de entidades.
3. Criar documentação complementar detalhando convenções de assets e pipeline de build.
4. Avaliar introdução de um contêiner de injeção de dependências leve para gerenciar sistemas e serviços compartilhados.

