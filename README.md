# Contos de Arandú - Ação Imediata

Jogo de ação baseado em ondas de inimigos ambientado na floresta de Arandú. Escolha uma classe, utilize habilidades especiais e sobreviva ao maior número possível de ondas.

## Tecnologias

- [Phaser 3](https://phaser.io/) para renderização e lógica do jogo
- JavaScript e HTML5

## Estrutura de pastas

```
arandu/
├── index.html        # página principal e carregamento do jogo
├── style.css         # estilos básicos
└── src/
    ├── main.js       # configuração e inicialização do Phaser
    ├── classes/      # classes auxiliares (ex.: inimigos, joystick)
    ├── data/         # dados globais (configurações de classes e ondas)
    ├── scenes/       # cenas do jogo (splash, seleção de personagem, dungeon, UI)
    └── utils/        # funções utilitárias de ataque, HUD e controles
```

## Executando localmente

1. Clone o repositório.
2. Inicie um servidor HTTP simples no diretório do projeto:
   ```bash
   npx http-server .
   # ou
   python3 -m http.server
   ```
3. Acesse `http://localhost:8080` (ou a porta exibida) no navegador para jogar.

## Futuras melhorias e contribuições

- Novas classes, inimigos e habilidades
- Sistema de pontuação e ranking
- Suporte aprimorado a dispositivos móveis
- Melhorias de acessibilidade e interface

Contribuições são bem-vindas! Abra uma issue para discutir ideias ou envie um pull request com melhorias.

