# Arandú

Status: Em Desenvolvimento
Phaser: 3.90.0
TypeScript: ~5.9.3
Licença: MIT

Um jogo 2D de exploração de masmorras, desenvolvido com Phaser 3 e TypeScript, focado em uma arquitetura modular e escalável inspirada no padrão Entity-Component-System (ECS).

---

## 🎮 Sobre o Projeto

O Arandú, que em Tupi-Guarani remete a sabedoria e conhecimento, é um projeto que visa criar uma base robusta para jogos 2D. A arquitetura foi desenhada sobre três pilares fundamentais: Modularidade Máxima, Design Guiado por Dados e um Ambiente de Desenvolvimento Moderno.

A lógica do jogo é desacoplada em "Sistemas" (como MovementSystem e CollisionSystem) que operam sobre "Entidades" (jogador, inimigos) e seus "Componentes" de dados, mantendo as Cenas do Phaser como orquestradoras principais.

### ✨ Funcionalidades Atuais

* Renderização de Mapa: Carregamento de `tilemap` e `tileset` a partir de arquivos Tiled (JSON).
* Criação de Entidades: Implementação do padrão *Factory* para criação do jogador (`PlayerFactory`) e inimigos (`EnemyFactory`).
* Movimentação do Jogador: Controle via teclado através de um `MovementSystem` dedicado.
* Sistema de Colisão: Detecção de colisão entre entidades e entre entidades e o cenário.
* Câmera Dinâmica: A câmera segue o jogador e respeita os limites do mapa.
* Renderização Pixel Art: Configuração de escala otimizada para garantir a nitidez dos gráficos.

---

## 🛠️ Tecnologias Utilizadas

A stack do projeto foi selecionada para garantir produtividade e um desenvolvimento moderno.

* Motor de Jogo: Phaser 3
* Linguagem: TypeScript
* Ambiente de Desenvolvimento: Vite

---

## 🚀 Como Executar o Projeto

Siga os passos abaixo para configurar e rodar o ambiente de desenvolvimento localmente.

### Pré-requisitos

* Node.js (versão 18 ou superior recomendada)
* NPM ou Yarn

### Instalação e Execução

1.  Clone o repositório:
    ```sh
    git clone https://github.com/BrunoMNoronha/arandu.git
    cd arandu
    ```

2.  Instale as dependências:
    ```sh
    npm install
    ```

3.  Inicie o servidor de desenvolvimento:
    ```sh
    npm run dev
    ```

4.  Acesse a aplicação:
    Abra seu navegador e acesse `http://localhost:5173`.

---

## 🗺️ Roadmap (Próximos Passos - Fase 4)

Com a base do gameplay estabelecida, o foco agora é aprimorar a interatividade e a inteligência do jogo.

-   [ ] IA do Inimigo (Básico): Criar um `EnemyAISystem` para patrulha e perseguição.
-   [ ] Sistema de Vida e Dano: Implementar um `HealthComponent` para o jogador e inimigos.
-   [ ] Interface do Usuário (UI): Desenvolver uma `UIScene` para exibir a vida do jogador.
-   [ ] Feedback Visual: Adicionar um efeito de "flash" ao receber dano.
