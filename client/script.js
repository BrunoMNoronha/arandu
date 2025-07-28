const GameData = {
  character: null,
  level: 1,
  gold: 0,
  // ... outras informações globais
};

const WaveConfig = {
  currentWave: 0,
  enemiesPerWave: 5,
  waveDelay: 5000, // 5 segundos
  enemyHealth: 100,
  enemySpeed: 50,
};

class Joystick {
  constructor(scene, x, y, radius, color) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.base = scene.add
      .circle(x, y, radius, color, 0.5)
      .setScrollFactor(0)
      .setDepth(10);
    this.thumb = scene.add
      .circle(x, y, radius / 2, color, 1)
      .setScrollFactor(0)
      .setDepth(10);
    this.isDown = false;
    this.direction = new Phaser.Math.Vector2(0, 0);
    this.force = 0;

    this.base.setInteractive();
    this.base.on("pointerdown", this.onPointerDown.bind(this));
    scene.input.on("pointermove", this.onPointerMove.bind(this));
    scene.input.on("pointerup", this.onPointerUp.bind(this));
    scene.input.on("pointerupoutside", this.onPointerUp.bind(this));
  }

  onPointerDown(pointer) {
    this.isDown = true;
    this.updateThumbPosition(pointer);
  }

  onPointerMove(pointer) {
    if (this.isDown) {
      this.updateThumbPosition(pointer);
    }
  }

  onPointerUp(pointer) {
    this.isDown = false;
    this.resetThumbPosition();
  }

  updateThumbPosition(pointer) {
    const localPoint = this.scene.cameras.main.getWorldPoint(
      pointer.x,
      pointer.y
    );
    const dx = pointer.x - this.x;
    const dy = pointer.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    if (distance > this.radius) {
      this.thumb.x = this.x + this.radius * Math.cos(angle);
      this.thumb.y = this.y + this.radius * Math.sin(angle);
      this.force = 1;
    } else {
      this.thumb.x = pointer.x;
      this.thumb.y = pointer.y;
      this.force = distance / this.radius;
    }

    this.direction.setTo(Math.cos(angle), Math.sin(angle));
  }

  resetThumbPosition() {
    this.thumb.x = this.x;
    this.thumb.y = this.y;
    this.direction.setTo(0, 0);
    this.force = 0;
  }

  setVisible(visible) {
    this.base.setVisible(visible);
    this.thumb.setVisible(visible);
  }
}

class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, frame) {
    super(scene, x, y, texture, frame);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.health = 100;
    this.speed = 50;
    this.isAttacking = false;
    this.attackCooldown = 2000; // 2 segundos
    this.lastAttackTime = 0;
  }

  update(player) {
    if (!player || !player.active) return;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 150 && !this.isAttacking) {
      // Atacar
      this.isAttacking = true;
      this.setVelocity(0, 0);
      this.anims.play("enemy-attack", true);

      this.scene.time.delayedCall(500, () => {
        // Duração da animação de ataque
        if (this && this.active) {
          const attackRange = 100;
          const distanceToPlayer = Phaser.Math.Distance.Between(
            this.x,
            this.y,
            player.x,
            player.y
          );
          if (distanceToPlayer <= attackRange) {
            this.scene.events.emit("dealDamage", player, 10); // Inimigo causa 10 de dano
          }
        }
      });

      this.scene.time.delayedCall(1000, () => {
        // Cooldown do ataque
        if (this && this.active) {
          this.isAttacking = false;
        }
      });
    } else if (!this.isAttacking) {
      // Perseguir
      const angle = Math.atan2(dy, dx);
      this.setVelocity(
        Math.cos(angle) * this.speed,
        Math.sin(angle) * this.speed
      );
      this.anims.play("enemy-walk", true);
    }

    // Flip sprite based on player position
    if (dx > 0) {
      this.setFlipX(false);
    } else {
      this.setFlipX(true);
    }
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.scene.events.emit("enemyDefeated", this);
      this.destroy();
    } else {
      // Efeito de "hit"
      this.setTint(0xff0000);
      this.scene.time.delayedCall(100, () => {
        this.clearTint();
      });
    }
  }
}

class SplashScreenScene extends Phaser.Scene {
  constructor() {
    super({ key: "SplashScreenScene" });
  }

  preload() {
    this.load.image("logo", "https://labs.phaser.io/assets/sprites/phaser3-logo.png");
  }

  create() {
    const logo = this.add.image(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      "logo"
    );
    this.time.delayedCall(2000, () => {
      this.scene.start("CharacterSelectScene");
    });
  }
}

class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: "CharacterSelectScene" });
  }

  preload() {
    this.load.image("background", "https://labs.phaser.io/assets/skies/space.jpg");
    this.load.spritesheet("player-warrior", "https://labs.phaser.io/assets/sprites/dude.png", {
      frameWidth: 32,
      frameHeight: 48,
    });
    this.load.spritesheet("player-hunter", "https://labs.phaser.io/assets/sprites/metalslug_mummy37x45.png", {
      frameWidth: 37,
      frameHeight: 45,
    });
  }

  create() {
    this.add
      .image(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        "background"
      )
      .setScale(2);

    this.add
      .text(
        this.cameras.main.width / 2,
        100,
        "Selecione seu Personagem",
        {
          fontSize: "32px",
          fill: "#fff",
        }
      )
      .setOrigin(0.5);

    // Opção 1: Guerreiro
    const warriorButton = this.add
      .rectangle(
        this.cameras.main.width / 2 - 100,
        this.cameras.main.height / 2,
        150,
        200,
        0x6666ff
      )
      .setInteractive();
    this.add
      .text(warriorButton.x, warriorButton.y - 50, "Guerreiro", {
        fontSize: "24px",
        fill: "#fff",
      })
      .setOrigin(0.5);
    this.add
      .sprite(warriorButton.x, warriorButton.y + 20, "player-warrior")
      .setScale(2);

    warriorButton.on("pointerdown", () => {
      GameData.character = "warrior";
      this.scene.start("DungeonScene");
    });

    // Opção 2: Caçador
    const hunterButton = this.add
      .rectangle(
        this.cameras.main.width / 2 + 100,
        this.cameras.main.height / 2,
        150,
        200,
        0xff6666
      )
      .setInteractive();
    this.add
      .text(hunterButton.x, hunterButton.y - 50, "Caçador", {
        fontSize: "24px",
        fill: "#fff",
      })
      .setOrigin(0.5);
    this.add
      .sprite(hunterButton.x, hunterButton.y + 20, "player-hunter")
      .setScale(2);

    hunterButton.on("pointerdown", () => {
      GameData.character = "hunter";
      this.scene.start("DungeonScene");
    });
  }
}

class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: "UIScene", active: false });
  }

  create() {
    this.healthText = this.add
      .text(10, 10, "Vida: 100", { fontSize: "20px", fill: "#ffffff" })
      .setScrollFactor(0);
    this.waveText = this.add
      .text(10, 40, "Wave: 0", { fontSize: "20px", fill: "#ffffff" })
      .setScrollFactor(0);

    const dungeonScene = this.scene.get("DungeonScene");
    dungeonScene.events.on("updateUI", (data) => {
      this.healthText.setText("Vida: " + data.health);
      this.waveText.setText("Wave: " + data.wave);
    });
  }
}

class DungeonScene extends Phaser.Scene {
  constructor() {
    super({ key: "DungeonScene" });
    this.lastMoveDirection = new Phaser.Math.Vector2(0, 1); // Padrão para baixo
  }

  preload() {
    this.load.image("tiles", "https://labs.phaser.io/assets/tilemaps/tiles/dungeon_tiles.png");
    this.load.tilemapTiledJSON("map", "https://labs.phaser.io/assets/tilemaps/maps/dungeon.json");
    this.load.spritesheet("player-warrior", "https://labs.phaser.io/assets/sprites/dude.png", {
      frameWidth: 32,
      frameHeight: 48,
    });
    this.load.spritesheet("player-hunter", "https://labs.phaser.io/assets/sprites/metalslug_mummy37x45.png", {
      frameWidth: 37,
      frameHeight: 45,
    });
    this.load.spritesheet("enemy", "https://labs.phaser.io/assets/sprites/metalslug_mummy37x45.png", {
      frameWidth: 37,
      frameHeight: 45,
    });
    this.load.image("attack-hit", "https://labs.phaser.io/assets/particles/red.png");
    this.load.image("arrow", "https://labs.phaser.io/assets/sprites/arrow.png");
  }

  create() {
    this.setupMap();
    this.setupPlayer();
    this.setupEnemies();
    this.setupControls();
    this.setupCamera();
    this.setupUI();
    this.setupEventListeners();

    this.isTargetingAbility = false;
    this.targetLine = this.add.graphics({
      lineStyle: { width: 2, color: 0xff0000 },
    });
    this.targetLine.setVisible(false);
  }

  update(time, delta) {
    this.handleControls();
    this.enemies.getChildren().forEach((enemy) => enemy.update(this.player));

    if (this.isTargetingAbility) {
      this.updateTargetLine();
    }
  }

  setupMap() {
    const map = this.make.tilemap({ key: "map" });
    const tileset = map.addTilesetImage("dungeon", "tiles");
    this.groundLayer = map.createLayer("Ground", tileset, 0, 0);
    this.wallsLayer = map.createLayer("Walls", tileset, 0, 0);
    this.wallsLayer.setCollisionByProperty({ collides: true });
  }

  setupPlayer() {
    const playerTexture =
      GameData.character === "warrior" ? "player-warrior" : "player-hunter";
    this.player = this.physics.add.sprite(400, 300, playerTexture);
    this.player.setCollideWorldBounds(true);
    this.player.health = 100;
    this.player.attackPower =
      GameData.character === "warrior" ? 25 : 15;
    this.player.attackCooldown =
      GameData.character === "warrior" ? 500 : 750;
    this.player.lastAttack = 0;
    this.player.abilityCooldown = 10000; // 10 segundos
    this.player.lastAbility = 0;

    this.anims.create({
      key: "player-left",
      frames: this.anims.generateFrameNumbers(playerTexture, {
        start: 0,
        end: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "player-turn",
      frames: [{ key: playerTexture, frame: 4 }],
      frameRate: 20,
    });
    this.anims.create({
      key: "player-right",
      frames: this.anims.generateFrameNumbers(playerTexture, {
        start: 5,
        end: 8,
      }),
      frameRate: 10,
      repeat: -1,
    });
  }

  setupEnemies() {
    this.enemies = this.physics.add.group({
      classType: Enemy,
      runChildUpdate: true,
    });
    this.physics.add.collider(this.player, this.enemies);
    this.physics.add.collider(this.enemies, this.enemies);
    this.physics.add.collider(this.player, this.wallsLayer);
    this.physics.add.collider(this.enemies, this.wallsLayer);

    this.startNextWave();
  }

  setupControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceBar = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );

    // Joysticks
    this.moveJoystick = new Joystick(this, 100, this.cameras.main.height - 100, 80, 0xcccccc);
    this.attackJoystick = new Joystick(this, this.cameras.main.width - 100, this.cameras.main.height - 100, 80, 0xff0000);

    // Botão de Habilidade
    this.abilityButton = this.add
      .circle(
        this.cameras.main.width - 100,
        this.cameras.main.height - 220,
        40,
        0x0000ff,
        0.8
      )
      .setScrollFactor(0)
      .setDepth(10)
      .setInteractive();

    this.abilityButton.on("pointerdown", () => {
      this.useAbility();
    });
  }

  setupCamera() {
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setBounds(
      0,
      0,
      this.wallsLayer.width,
      this.wallsLayer.height
    );
  }

  setupUI() {
    this.scene.launch("UIScene");
    this.events.emit("updateUI", {
      health: this.player.health,
      wave: WaveConfig.currentWave,
    });
  }

  setupEventListeners() {
    this.events.on("enemyDefeated", this.checkWaveCompletion, this);
    this.events.on("dealDamage", this.dealDamage, this);
  }

  handleControls() {
    if (!this.player.active) return;

    const speed = 160;
    let velocityX = 0;
    let velocityY = 0;

    // Controle pelo Teclado
    if (this.cursors.left.isDown) velocityX = -speed;
    else if (this.cursors.right.isDown) velocityX = speed;

    if (this.cursors.up.isDown) velocityY = -speed;
    else if (this.cursors.down.isDown) velocityY = speed;

    // Controle pelo Joystick de Movimento
    if (this.moveJoystick.force > 0) {
      velocityX = this.moveJoystick.direction.x * speed;
      velocityY = this.moveJoystick.direction.y * speed;
    }

    this.player.setVelocity(velocityX, velocityY);

    // Atualiza a última direção de movimento se o jogador estiver se movendo
    if (velocityX !== 0 || velocityY !== 0) {
      this.lastMoveDirection.set(velocityX, velocityY).normalize();
    }

    // Animações do jogador
    if (velocityX < 0) {
      this.player.anims.play("player-left", true);
      this.player.setFlipX(false);
    } else if (velocityX > 0) {
      this.player.anims.play("player-right", true);
      this.player.setFlipX(false);
    } else {
      this.player.anims.play("player-turn");
    }

    // Controle de Ataque
    const time = this.time.now;
    if (
      (this.attackJoystick.force > 0.5 || this.spaceBar.isDown) &&
      time > this.player.lastAttack + this.player.attackCooldown
    ) {
      this.fireAttack();
      this.player.lastAttack = time;
    }
  }

  fireAttack() {
    let attackDirection;

    // Prioriza o joystick de ataque
    if (this.attackJoystick.force > 0.5) {
      attackDirection = this.attackJoystick.direction.clone();
    } else {
      // Usa a última direção de movimento como fallback
      attackDirection = this.lastMoveDirection.clone();
    }

    if (GameData.character === "warrior") {
      this.performMeleeAttack(attackDirection);
    } else {
      this.performRangedAttack(attackDirection);
    }
  }

  performMeleeAttack(direction) {
    const attackHitbox = this.add
      .zone(
        this.player.x + direction.x * 40,
        this.player.y + direction.y * 40,
        60,
        60
      );
    this.physics.world.enable(attackHitbox);
    attackHitbox.body.setAllowGravity(false);

    // Efeito visual
    const hitEffect = this.add
      .sprite(attackHitbox.x, attackHitbox.y, "attack-hit")
      .setScale(0.5)
      .setAlpha(0.5);
    this.tweens.add({
      targets: hitEffect,
      alpha: 0,
      duration: 200,
      onComplete: () => hitEffect.destroy(),
    });

    this.physics.overlap(attackHitbox, this.enemies, (box, enemy) => {
      this.events.emit("dealDamage", enemy, this.player.attackPower);
    });

    this.time.delayedCall(100, () => attackHitbox.destroy());
  }

  performRangedAttack(direction) {
    const arrow = this.physics.add.sprite(
      this.player.x,
      this.player.y,
      "arrow"
    );
    arrow.setRotation(direction.angle());
    arrow.setVelocity(direction.x * 300, direction.y * 300);

    this.physics.overlap(arrow, this.enemies, (arr, enemy) => {
      this.events.emit("dealDamage", enemy, this.player.attackPower);
      arr.destroy();
    });

    this.time.delayedCall(2000, () => arrow.destroy());
  }

  useAbility() {
    const time = this.time.now;
    if (time < this.player.lastAbility + this.player.abilityCooldown) return; // Cooldown

    if (GameData.character === "warrior") {
      // Habilidade do Guerreiro: Giro
      this.player.lastAbility = time;
      const attackHitbox = this.add.zone(
        this.player.x,
        this.player.y,
        120,
        120
      );
      this.physics.world.enable(attackHitbox);
      attackHitbox.body.setAllowGravity(false);
      attackHitbox.body.isCircle = true;

      this.tweens.add({
        targets: this.player,
        angle: 360,
        duration: 500,
        onComplete: () => (this.player.angle = 0),
      });

      this.physics.overlap(attackHitbox, this.enemies, (box, enemy) => {
        this.events.emit("dealDamage", enemy, this.player.attackPower * 2);
      });

      this.time.delayedCall(500, () => attackHitbox.destroy());
    } else if (GameData.character === "hunter") {
      // Habilidade do Caçador: Tiro Mirado
      this.isTargetingAbility = true;
      this.targetLine.setVisible(true);
      this.input.once("pointerup", (pointer) => {
        this.fireTargetedShot(pointer);
        this.isTargetingAbility = false;
        this.targetLine.setVisible(false);
        this.player.lastAbility = time;
      });
    }
  }

  updateTargetLine() {
    const pointer = this.input.activePointer;
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    this.targetLine.clear();
    this.targetLine.lineStyle(2, 0xff0000);
    this.targetLine.beginPath();
    this.targetLine.moveTo(this.player.x, this.player.y);
    this.targetLine.lineTo(worldPoint.x, worldPoint.y);
    this.targetLine.strokePath();
  }

  fireTargetedShot(pointer) {
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const direction = new Phaser.Math.Vector2(
      worldPoint.x - this.player.x,
      worldPoint.y - this.player.y
    ).normalize();

    const arrow = this.physics.add.sprite(
      this.player.x,
      this.player.y,
      "arrow"
    );
    arrow.setScale(1.5);
    arrow.setTint(0xff0000);
    arrow.setRotation(direction.angle());
    arrow.setVelocity(direction.x * 500, direction.y * 500);

    this.physics.overlap(arrow, this.enemies, (arr, enemy) => {
      this.events.emit("dealDamage", enemy, this.player.attackPower * 3);
      // Não destrói a flecha para perfurar
    });

    this.time.delayedCall(3000, () => arrow.destroy());
  }

  startNextWave() {
    WaveConfig.currentWave++;
    this.events.emit("updateUI", {
      health: this.player.health,
      wave: WaveConfig.currentWave,
    });

    for (let i = 0; i < WaveConfig.enemiesPerWave * WaveConfig.currentWave; i++) {
      const x = Phaser.Math.Between(0, this.wallsLayer.width);
      const y = Phaser.Math.Between(0, this.wallsLayer.height);
      // Garante que não nasça perto do jogador
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y) > 200) {
        const enemy = this.enemies.get(x, y, "enemy");
        if (enemy) {
          enemy.health = WaveConfig.enemyHealth * WaveConfig.currentWave;
          enemy.speed = WaveConfig.enemySpeed + WaveConfig.currentWave * 5;
        }
      } else {
        i--; // Tenta novamente
      }
    }
  }

  checkWaveCompletion() {
    if (this.enemies.countActive(true) === 0) {
      this.time.delayedCall(
        WaveConfig.waveDelay,
        this.startNextWave,
        [],
        this
      );
    }
  }

  dealDamage(target, amount) {
    if (target.health <= 0) return; // Já está morto

    target.health -= amount;
    this.events.emit("updateUI", {
      health: this.player.health,
      wave: WaveConfig.currentWave,
    });

    if (target.health <= 0) {
      this.defeatTarget(target);
    } else {
      // Efeito de "hit"
      target.setTint(0xff0000);
      this.time.delayedCall(100, () => {
        if (target.active) {
          target.clearTint();
        }
      });
    }
  }

  defeatTarget(target) {
    if (target === this.player) {
      this.showGameOverPanel();
    } else {
      this.events.emit("enemyDefeated", target);
      target.destroy();
    }
  }

  showGameOverPanel() {
    // Pausa a cena da masmorra
    this.physics.pause();
    this.player.setTint(0xff0000);
    this.player.anims.stop();

    // Adiciona um painel de "Fim de Jogo"
    const panel = this.add
      .rectangle(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        400,
        200,
        0x000000,
        0.8
      )
      .setScrollFactor(0)
      .setDepth(20);

    this.add
      .text(panel.x, panel.y - 40, "FIM DE JOGO", {
        fontSize: "48px",
        fill: "#ff0000",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(21);

    // Botão de Recomeçar
    const restartButton = this.add
      .text(panel.x, panel.y + 40, "Recomeçar", {
        fontSize: "32px",
        fill: "#ffffff",
        backgroundColor: "#555555",
        padding: { left: 15, right: 15, top: 10, bottom: 10 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(21)
      .setInteractive();

    restartButton.on("pointerdown", () => {
      // Reinicia as configurações do jogo
      WaveConfig.currentWave = 0;
      // Recarrega a cena de seleção de personagem
      this.scene.stop("UIScene");
      this.scene.start("CharacterSelectScene");
    });
  }
}

const config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.RESIZE,
    parent: "game-container",
    width: "100%",
    height: "100%",
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [
    SplashScreenScene,
    CharacterSelectScene,
    DungeonScene,
    UIScene,
  ],
};

const game = new Phaser.Game(config);
