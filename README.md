# Contos de Arandú - Ação Imediata

Jogo de ação 2D de sobrevivência contra ondas de inimigos, ambientado na mística Floresta de Arandú. Escolha uma classe, utilize habilidades especiais e sobreviva o máximo que puder.

## Tecnologias

- **Motor de Jogo:** [Phaser 3](https://phaser.io/) para renderização, física e lógica principal.
- **Linguagem:** JavaScript (ES6+).
- **Plataforma:** HTML5, executado em qualquer navegador moderno.

## Estrutura de Pastas

```
arandu/
├── index.html        # Página principal que carrega o jogo.
├── style.css         # Estilos básicos para a página.
└── src/
    ├── main.js       # Ponto de entrada: configuração e inicialização do Phaser.
    ├── classes/      # Definições de classes principais.
    │   ├── player.js   # Classe do jogador, com stats, level up e lógica de dano.
    │   ├── enemy.js    # Classe dos inimigos, com IA básica e escalonamento por onda.
    │   └── joystick.js # Controle de joystick virtual para dispositivos móveis.
    ├── data/         # Dados e configurações globais do jogo.
    │   └── data.js     # Define stats das classes, inimigos e configuração das ondas.
    ├── scenes/       # Cenas do jogo (telas).
    │   ├── splash.js         # Tela inicial (splash screen).
    │   ├── character-select.js # Tela de seleção de personagem.
    │   ├── dungeon.js        # Cena principal do jogo onde a ação acontece.
    │   └── ui.js             # Cena de interface para exibir status do jogador.
    └── utils/        # Módulos com funções utilitárias reutilizáveis.
        ├── abilityUtils.js   # Lógica para as habilidades especiais das classes.
        ├── assetUtils.js   # Funções para gerar texturas e assets dinamicamente.
        ├── attackUtils.js  # Funções que gerenciam ataques e colisões.
        ├── attributeUtils.js # Funções para calcular atributos (vida, dano, etc.).
        ├── controlUtils.js # Lógica de processamento de controles (teclado/joystick).
        └── hudUtils.js     # Funções para criar e atualizar o Heads-Up Display (HUD).
```

## Funcionalidades

- **Sobrevivência por Ondas:** Enfrente hordas de inimigos com dificuldade crescente. Após as ondas predefinidas, o jogo gera ondas procedurais infinitas.
- **Duas Classes Jogáveis:**
    - **Caçador das Sombras:** Ágil e mortal à distância, com alta chance de crítico e uma habilidade de "Chuva de Flechas".
    - **Guerreiro de Ossos:** Resistente e forte no combate corpo a corpo, com mais vida, redução de dano e uma habilidade de "Impacto Sísmico" que atordoa inimigos.
- **Inimigos Variados:** Lute contra o "Tatu Zumbi" (corpo a corpo) e a "Aranha de Dardo" (à distância).
- **Sistema de Nível:** Ganhe experiência ao derrotar inimigos para subir de nível, curar-se e aumentar seus atributos base.
- **Controles Adaptáveis:**
    - **Desktop:** Movimentação com as teclas `WASD` ou setas. Ataque automático com a tecla `Espaço`.
    - **Mobile:** Joysticks virtuais para movimentação e ataque.
- **Habilidades Especiais:** Cada classe possui uma habilidade única com tempo de recarga, adicionando uma camada tática ao combate.

## Executando localmente

1. Clone o repositório.
2. Inicie um servidor HTTP simples no diretório do projeto. Você pode usar `npx` (vem com o Node.js) ou o módulo `http.server` do Python.
   ```bash
   # Com Node.js/npx
   npx http-server .
   
   # Ou com Python 3
   python3 -m http.server
   ```
3. Acesse `http://localhost:8080` (ou a porta exibida no terminal) no seu navegador para jogar.

## Futuras Melhorias e Contribuições

O projeto é um ótimo ponto de partida e tem espaço para muitas expansões:

- **Novas Classes, Inimigos e Habilidades:** Expandir o conteúdo para aumentar a variedade.
- **Sistema de Atributos:** Implementar a tela onde os jogadores podem gastar os pontos de atributo ganhos ao subir de nível.
- **Equipamentos e Itens:** Adicionar um sistema de loot e equipamentos (a UI já tem placeholders para isso).
- **Sistema de Pontuação e Ranking:** Salvar as melhores pontuações localmente ou em um placar online.
- **Melhorias de Acessibilidade e Interface:** Adicionar mais opções e feedback visual.

Contribuições são muito bem-vindas! Sinta-se à vontade para abrir uma *issue* para discutir ideias ou enviar um *pull request* com melhorias.

