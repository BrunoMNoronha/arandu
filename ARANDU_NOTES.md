# Diário de Bordo do Projeto Arandú

**Codinome do Gem:** Arandú
**Status Atual:** Fase 2 Concluída.

## Resumo da Fase 2 (Data: 05/10/2025)

-   Estrutura de cenas (Preloader, DungeonScene) implementada.
-   Fluxo de carregamento de assets configurado.
-   Código legado (counter.ts, GameScene) removido e projeto refatorado para TypeScript.
-   Padrão Factory implementado para a criação do jogador.
-   **Sistema de Movimento implementado** para controle via teclado.
-   **Objetivo alcançado:** O jogador pode ser movimentado pela tela.

## Resumo da Fase 1 (Data: 05/10/2025)

-   Projeto inicializado com Vite e TypeScript.
-   Dependências (Phaser) instaladas.
-   Arquitetura de pastas criada (scenes, components, systems, config).
-   Configuração inicial do Phaser (`main.ts`) implementada.
-   Objetivo alcançado: Renderizar uma tela de jogo preta.

## Próximos Passos (Sugestão para Fase 3)

-   [ ] **Inimigos:** Criar uma `EnemyFactory` e adicionar inimigos à cena.
-   [ ] **Combate:** Implementar um sistema de detecção de colisão entre jogador e inimigos.
-   [ ] **Mapa:** Carregar um tileset e criar um mapa básico para a dungeon.