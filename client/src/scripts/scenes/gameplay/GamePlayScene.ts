import Button from "./gameobjects/Button";
import Enemy from "./gameobjects/Enemy";
import Player from "./gameobjects/Player";
import Server from "../../../../server/Server";
import { EventNames } from "../../utils/GameConstants";

/**
 * @class GamePlayScene
 * @description Renders gameplay scene with all needed game objects.
 * @extends Phaser.Scene
 */
export default class GamePlayScene extends Phaser.Scene {
  enemy: Enemy | null;
  enemyBullets: Array<any>;
  gameOverText: Phaser.GameObjects.Text | null;
  intimationText: Phaser.GameObjects.Text | null;
  isEnemyDead: boolean;
  isPlayerDead: boolean;
  obstacles: Array<any>;
  player: Player | null;
  playButton: Button | null;
  playerBullets: Array<any>;
  server: Server;

  /**
   * @constructor
   * @description Create a new instance of this class.
   */
  constructor() {
    super({ key: "gameplayscene" });

    // Set up initial values.
    this.enemy = null;
    this.enemyBullets = [];
    this.gameOverText = null;
    this.intimationText = null;
    this.isEnemyDead = false;
    this.isPlayerDead = false;
    this.obstacles = [];
    this.playButton = null;
    this.player = null;
    this.playerBullets = [];
  }

  /**
   * @access public
   * @description Method called before scene is created. Preload all necessary assets for this scene.
   * @function preload
   * @override `Phaser.Scene#preload`
   * @returns {void}
   */
  public preload(): void {
    this.load.atlas("gui", "assets/images/gui.png", "assets/json/gui.json");
    this.load.atlas("ship", "assets/images/ship.png", "assets/json/ship.json");
    this.load.atlas(
      "shipwear",
      "assets/images/shipwear.png",
      "assets/json/shipwear.json"
    );
    this.load.atlasXML(
      "sheet",
      "assets/spritesheets/sheet.png",
      "assets/spritesheets/sheet.xml"
    );
    this.load.atlasXML(
      "explosion",
      "assets/spritesheets/spritesheet_regularExplosion.png",
      "assets/spritesheets/spritesheet_regularExplosion.xml"
    );
    this.load.image("astroid", "assets/images/astroid.png");
    this.load.image("background", "assets/images/back.png");
  }

  /**
   * @access public
   * @description Method called once scene is created. Create necessary elements.
   * @function create
   * @override `Phaser.Scene#create`
   * @returns {void}
   */
  public create(): void {
    this.server = new Server(this); // Create server.

    // Create necessary elements.
    this.addListeners();
    this.createBackgroundImage();
    this.createExplosionAnimation();
    this.createGameoverText();
    this.createIntimationText();
    this.createPlayButton();
  }

  /**
   * @access private
   * @description Add listeners of the game objects.
   * @function addListeners
   * @returns {void}
   */
  private addListeners(): void {
    this.events.on(EventNames.ASTROID_ADDED, this.onAddAstroid, this); // Listener for adding Astroid game object to the game event.
    this.events.on(EventNames.ENEMY_ADDED, this.onAddEnemy, this); // Listener for adding Enemy game object to the game event.
    this.events.on(EventNames.PLAYER_ADDED, this.onAddPlayer, this); // Listener for adding Player game object to the game event.
    this.events.on("addPlayerBullet", this.onAddPlayerBullet, this); // Listener for adding Player bullet object to the game event.
    this.events.on(EventNames.ENEMY_BULLET, this.onFireBulletEnemy, this); // Listener for firing bullet by the Player game object to the game event.
  }

  /**
   * @access private
   * @description Listener for adding Astroid game object to the game event.
   * @function onAddAstroid
   * @param {any} [astroidProperties] Astroid properties
   * @returns {void}
   */
  private onAddAstroid(astroidProperties: any): void {
    // Create sprite with physics.
    let astroid: Phaser.Physics.Arcade.Sprite = this.physics.add.sprite(
      astroidProperties.x,
      astroidProperties.y,
      "astroid"
    );

    astroid.enableBody(true, astroid.x, astroid.y, true, true); // Enable physics.
    astroid.setScale(astroidProperties.scale.x, astroidProperties.scale.y); // Scale the object in a range.

    // Calculate the velocity and return it as a vector.
    this.physics.velocityFromRotation(
      astroidProperties.rotation, // Rotation, in radians.
      astroidProperties.speed, // Speed.
      astroid.body.velocity // The Vector2 in which the x and y properties will be set to the calculated velocity.
    );

    astroid.setDepth(1); // Depth of this game object within this scene (rendering position), also known as 'z-index' in CSS.
  }

  /**
   * @access private
   * @description Listener for adding Enemy game object to the game event.
   * @function onAddEnemy
   * @param {any} [enemyProperties] Enemy properties
   * @returns {void}
   */
  private onAddEnemy(enemyProperties: any): void {
    // Create Enemy config.
    let enemyConfig = {
      frame: "shipBlue_manned.png",
      texture: "ship",
    };

    // Create Enemy object config by merging Enemy's config and properties.
    // !Important: these parameters have to be in such an order.
    let config: object = Phaser.Utils.Objects.Merge(
      enemyProperties,
      enemyConfig
    );

    this.enemy = new Enemy(config, this); // Create Enemy with given config.
    this.server.players[enemyProperties.id] = this.enemy; // Insert Enemy to Players array of server.
  }

  /**
   * @access private
   * @description Listener for adding Player game object to the game event.
   * @function onAddPlayer
   * @param {any} [playerProperties] Player properties
   * @returns {void}
   */
  private onAddPlayer(playerProperties: any): void {
    // Create Player config.
    let playerConfig: { frame: string; texture: string } = {
      frame: "shipBeige_manned.png",
      texture: "ship",
    };

    // Create Player object config by merging Player's config and properties.
    // !Important: these parameters have to be in such an order.
    let configPlayer: object = Phaser.Utils.Objects.Merge(
      playerConfig,
      playerProperties
    );

    this.player = new Player(configPlayer, this); // Create Player with given config.
    this.server.players[playerProperties.id] = this.player; // Insert Player to Players array of server.
  }

  /**
   * @access private
   * @description Listener for adding Player bullet object to the game event.
   * @function onAddPlayerBullet
   * @param {any} [bullet] Player's bullet
   * @returns {void}
   */
  private onAddPlayerBullet(bullet): void {
    this.playerBullets.push(bullet); // Push bullet to Player bullets array.
  }

  /**
   * @access private
   * @description Listener for firing bullet by the Player game object to the game event.
   * @function onFireBulletEnemy
   * @param {any} [enemyProperties] Enemy properties
   * @returns {void}
   */
  private onFireBulletEnemy(enemyProperties: any): void {
    // Create sprite with physics.
    let dome = this.physics.add.sprite(
      enemyProperties.x,
      enemyProperties.y,
      "shipwear",
      "laserBeige3.png"
    );

    dome.enableBody(true, dome.x, dome.y, true, true); // Enable physics.
    dome.setScale(0.5, -0.5); // Scale the object in a range.
    dome.rotation = enemyProperties.rotation; // Set rotation.

    // Calculate the velocity and return it as a vector.
    this.physics.velocityFromRotation(
      dome.rotation - 4.7, // Rotation, in radians.
      500, // Speed.
      dome.body.velocity // The Vector2 in which the x and y properties will be set to the calculated velocity.
    );

    this.enemyBullets.push(dome); // Push bullet to Enemy bullets array.
  }

  /**
   * @access private
   * @description Creates background image of the game.
   * @function createBackground
   * @returns {void}
   */
  private createBackgroundImage(): void {
    this.add.image(0, 0, "background").setOrigin(0); // Setting the value of "setOrigin" to "0" means the position now relates to the left of the Game Object.
  }

  /**
   * @access private
   * @description Creates explosion animation.
   * @function createExplosionAnimation
   * @returns {void}
   */
  private createExplosionAnimation(): void {
    // Create animation.
    this.anims.create({
      frames: this.anims.generateFrameNames("explosion", {
        end: 8,
        prefix: "regularExplosion0",
        suffix: ".png",
        start: 0,
      }),
      frameRate: 16,
      hideOnComplete: true,
      key: "explosion",
      showOnStart: true,
    });
  }

  /**
   * @access private
   * @description Creates game over text.
   * @function createGameoverText
   * @returns {void}
   */
  private createGameoverText(): void {
    // Set up text properties.
    this.gameOverText = this.add.text(
      +this.game.config.width / 2,
      250,
      "Game Over"
    );

    this.gameOverText.setFontSize(50); // Set font size of the text.
    this.gameOverText.setOrigin(0.5); // The default value of "setOrigin" is "0.5", meaning all Game Objects are positioned based on their center.
    this.gameOverText.visible = false; // Make it invisible by default.
  }

  /**
   * @access private
   * @description Creates intimation text.
   * @function createIntimationText
   * @returns {void}
   */
  private createIntimationText(): void {
    this.intimationText = this.add.text(+this.game.config.width / 2, 20, ""); // Set up text properties.
    this.intimationText.setFontSize(25); // Set font size of the text.
    this.intimationText.setOrigin(0.5); // The default value of "setOrigin" is "0.5", meaning all Game Objects are positioned based on their center.
  }

  /**
   * @access private
   * @description Creates play button.
   * @function createPlayButton
   * @returns {void}
   */
  private createPlayButton(): void {
    // Set up button properties.
    let button_config = {
      frame: "blue_button00.png",
      text: {
        content: "Play",
      },
      texture: "gui",
      x: +this.game.config.width / 2,
      y: +this.game.config.height / 2,
    };

    // Add the button.
    this.playButton = new Button(button_config, this);
    this.playButton.on("pointerup", this.onPlayButtonClick, this);
  }

  /**
   * @access public
   * @function update
   * @override `Phaser #update`
   * @description the update function which executes at given fps
   * @param {number} time The time value from the most recent Game step. Typically a high-resolution timer value, or Date.now().
   * @param {number} deltaTime The delta value since the last frame. This is smoothed to avoid delta spikes by the TimeStep class.
   */
  update(time, delta) {
    // will run the update function on all the game objects of the scene
    this.children.each((child) => {
      child.update(time, delta);
    });
    // update intimation text
    if (this.intimationText) {
      let playersCount = Object.keys(this.server.players).length;
      if (playersCount == 1) {
        this.intimationText.setVisible(true);
        this.intimationText.setText("waiting for opponent to connect");
      } else if (!this.isPlayerDead && !this.isEnemyDead && playersCount == 2) {
        this.intimationText.setText("");
        this.intimationText.setVisible(false);
      }
    }
    // kill bullets if out of bounds
    if (this.enemyBullets) {
      for (let i = 0; i < this.enemyBullets.length; i++) {
        const enemyBullet = this.enemyBullets[i];
        // check if enemy bullet is out of bounds
        if (
          enemyBullet.x < 0 ||
          enemyBullet.x > this.game.config.width ||
          enemyBullet.y < 0 ||
          enemyBullet.y > this.game.config.height
        ) {
          enemyBullet.destroy();
          this.enemyBullets.splice(i, i + 1);
        }
      }
    }
    // kill bullets of player if they are out of bounds
    if (this.playerBullets) {
      for (let i = 0; i < this.playerBullets.length; i++) {
        const playerBullet = this.playerBullets[i];
        // check if player bullet is out of bounds
        if (
          playerBullet.x < 0 ||
          playerBullet.x > this.game.config.width ||
          playerBullet.y < 0 ||
          playerBullet.y > this.game.config.height
        ) {
          playerBullet.destroy();
          this.playerBullets.splice(i, i + 1);
        }
      }
    }
    // kill obstacles if they are out of bounds
    if (this.obstacles) {
      for (let i = 0; i < this.obstacles.length; i++) {
        const obstacle = this.obstacles[i];
        // check if obstacles are out of bounds
        if (
          obstacle.x < 0 ||
          obstacle.x > this.game.config.width ||
          obstacle.y < 0 ||
          obstacle.y > this.game.config.height
        ) {
          obstacle.destroy();
          this.obstacles.splice(i, i + 1);
        }
      }
    }
    // kill player if enemy bullets hits
    if (this.player) {
      for (let i = 0; i < this.enemyBullets.length; i++) {
        const enemyBullet = this.enemyBullets[i];
        // checking collision between enemy bullets and player
        if (
          this.player.x < enemyBullet.x + enemyBullet.width &&
          this.player.x + this.player.width > enemyBullet.x &&
          this.player.y < enemyBullet.y + enemyBullet.height &&
          this.player.y + this.player.height > enemyBullet.y
        ) {
          if (!this.isPlayerDead) {
            // this.events.emit(EventNames.PLAYER_DEAD);
            this.intimationText.visible = true;
            this.intimationText.setText("you have lost");
            this.isPlayerDead = true;
            this.player.play("explosion", true, 0);
            // this.player.destroy(false);
            console.log("collided :>> ", "player dead");
            this.playGameOverTextAnim();
          }
        }
      }
    }
    // kill enemy if player bullet hits
    if (this.enemy) {
      for (let i = 0; i < this.playerBullets.length; i++) {
        const playerBullet = this.playerBullets[i];
        // checking collision between enemy and player bullets
        if (
          this.enemy.x < playerBullet.x + playerBullet.width &&
          this.enemy.x + this.enemy.width > playerBullet.x &&
          this.enemy.y < playerBullet.y + playerBullet.height &&
          this.enemy.y + this.enemy.height > playerBullet.y
        ) {
          if (!this.isEnemyDead) {
            // this.events.emit(EventNames.ENEMY_DEAD);
            // this.enemy.destroy(false);
            this.enemy.play("explosion", true, 0);
            this.intimationText.visible = true;
            this.intimationText.setText("you have won");
            this.isEnemyDead = true;
            console.log("collided :>> ", "enemy dead");
            this.playGameOverTextAnim();
          }
        }
      }
    }
  }

  /**
   * @function onPlayButtonClick
   * @description this function will be called once play button clicked
   * @access private
   */
  private onPlayButtonClick() {
    this.playButton.hide(); // hiding play button
    this.server.connect(); // trying to establish a connection to server
  }

  /**
   * @function playGameOverTextAnim
   * @description this function is responsible for playing gameover text animation
   * @access private
   */
  private playGameOverTextAnim() {
    this.gameOverText.visible = true; // make gameover text visible if it is not
    this.tweens.add({
      targets: this.gameOverText,
      props: {
        scaleX: {
          from: 0,
          to: 1,
        },
        scaleY: {
          from: 0,
          to: 1,
        },
      },
      duration: 1000,
    });
  }
}
