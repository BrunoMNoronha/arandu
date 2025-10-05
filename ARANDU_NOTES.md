#################################################################
#    DIÁRIO DE BORDO E ROTEIRO ESTRATÉGICO DO PROJETO ARANDÚ    #
#################################################################

**Codinome do Gem:** Arandú
**Status Atual:** Início da Fase 4 - Aprimoramento do Core Gameplay e IA.
**Data da Atualização:** 05/10/2025

-----------------------------------------------------------------
## VISÃO TÉCNICA E ROTEIRO DO PROJETO (ROADMAP)
-----------------------------------------------------------------

Este documento delineia a filosofia arquitetural e o plano de desenvolvimento para o projeto Arandú.

### FILOSOFIA PRINCIPAL

O projeto será construído sobre três pilares: **Modularidade Máxima**, **Design Guiado por Dados** e um **Ambiente de Desenvolvimento Moderno**. A arquitetura será inspirada no padrão **Entity-Component-System (ECS)** para garantir flexibilidade e desacoplamento. A lógica do jogo (spawning, UI) será abstraída em "Sistemas" ou "Gerenciadores" dedicados, mantendo as Cenas do Phaser como orquestradoras.

-----------------------------------------------------------------
### PILAR 1: ARQUITETURA E TECNOLOGIA
-----------------------------------------------------------------

#### 1.1. STACK DE DESENVOLVIMENTO

* **Linguagem: TypeScript**
* **Motor de Jogo: Phaser 3**
* **Ambiente de Desenvolvimento: Vite**

#### 1.2. PADRÃO DE ARQUITETURA: ENTITY-COMPONENT-SYSTEM (ECS)

* **Entidade (Entity):** Um identificador único.
* **Componente (Component):** Um bloco de dados puro.
* **Sistema (System):** Lógica pura que opera em entidades.

-----------------------------------------------------------------
### PILAR 2: FUNCIONALIDADES E ECOSSISTEMA DE BIBLIOTECAS
-----------------------------------------------------------------

#### 2.1. GERENCIAMENTO DE ESTADO GLOBAL
* Necessidade: Para dados acessíveis globalmente (pontuação, progresso do jogo).
* Solução Potencial: Utilização de uma biblioteca leve como Zustand ou criação de um gerenciador de estado singleton com padrão de observador.

#### 2.2. FÍSICA E COLISÕES AVANÇADAS
* Necessidade: Para interações físicas mais complexas.
* Solução Potencial: Utilizar o motor de física Matter.js (integrado ao Phaser) em conjunto com o plugin `phaser-matter-collision-plugin` para callbacks de colisão mais limpos.

#### 2.3. ANIMAÇÕES E EFEITOS VISUAIS ("JUICE")
* Necessidade: Tornar o jogo mais vivo e responsivo.
* Soluções Potenciais:
    * GSAP (GreenSock): Para animações complexas de UI e transições de cena.
    * Partículas do Phaser: Para efeitos de impacto, magias e explosões.

#### 2.4. INTERFACE DO USUÁRIO (UI)
* Necessidade: Construir menus e interfaces complexas de forma eficiente.
* Solução Potencial: Utilizar o Objeto DOM do Phaser (`this.add.dom`) para renderizar HTML e CSS sobre o canvas, aproveitando a flexibilidade do desenvolvimento web moderno para a UI.

-----------------------------------------------------------------
## PRÓXIMOS PASSOS (FASE 4)
-----------------------------------------------------------------

-   [ ] **IA do Inimigo (Básico):** Criar um `EnemyAISystem` que faça o inimigo patrulhar uma área ou perseguir o jogador quando ele se aproximar.
-   [ ] **Sistema de Vida e Dano:** Implementar `HealthComponent` para o jogador e inimigos. A colisão agora deverá causar dano em vez de destruir o inimigo instantaneamente.
-   [ ] **Interface do Usuário (UI):** Desenvolver um `UIScene` para exibir informações básicas, como a vida do jogador.
-   [ ] **Feedback Visual:** Adicionar um efeito de "flash" vermelho no jogador e no inimigo ao receberem dano para melhorar o feedback da ação.

-----------------------------------------------------------------
## HISTÓRICO DE FASES CONCLUÍDAS
-----------------------------------------------------------------

### RESUMO DA FASE 3 (CONCLUÍDA EM 05/10/2025)
* Padrão Factory implementado para a criação de inimigos (`EnemyFactory`).
* `CollisionSystem` implementado para detectar a sobreposição entre jogador e inimigos, com um feedback visual temporário (desaparecimento do inimigo).
* Carregamento de `tileset` e `tilemap` (JSON) implementado para renderizar um mapa de dungeon.
* Adicionada colisão entre entidades (jogador, inimigo) e a camada de paredes do mapa.
* Configuração de escala do jogo corrigida para garantir a renderização adequada em *pixel art* em diferentes tamanhos de tela.
* **Marco Atingido:** O jogo possui um loop de gameplay básico em um ambiente interativo (movimentação, colisão e um mapa com paredes).

### RESUMO DA FASE 2 (CONCLUÍDA EM 05/10/2025)
* Estrutura de cenas (Preloader, DungeonScene) implementada.
* Fluxo de carregamento de assets configurado.
* Código legado removido e projeto refatorado para TypeScript.
* Padrão Factory implementado para a criação do jogador (`PlayerFactory`).
* Sistema de Movimento (`MovementSystem`) implementado para controle via teclado.
* **Marco Atingido:** O jogador pode ser movimentado pela tela.

### RESUMO DA FASE 1 (CONCLUÍDA EM 05/10/2025)
* Projeto inicializado com Vite e TypeScript.
* Dependências (Phaser) instaladas.
* Arquitetura de pastas criada.
* Controle de versão inicializado com Git.
* **Marco Atingido:** Projeto executa e renderiza uma tela preta.