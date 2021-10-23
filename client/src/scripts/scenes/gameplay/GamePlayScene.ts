import Button from "./gameobjects/Button";
import Enemy from "./gameobjects/Enemy";
import Player from "./gameobjects/Player";
import Server from "../../../../server/ResponseHandler";
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
  playBtn: Button | null;
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
    this.player = null;
    this.playerBullets = [];
    this.playBtn = null;
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
    this.addBackgroundImage();
    this.addGameoverText();
    this.addIntimationText();
    this.addListeners();
    this.addPlayButton();
    this.createExplosionAnimation();
  }

  /**
   * @access private
   * @description Creates background image of the game.
   * @function createBackground
   * @returns {void}
   */
  private addBackgroundImage(): void {
    this.add.image(0, 0, "background").setOrigin(0); // Setting the value of "setOrigin" to "0" means the position now relates to the left of the Game Object.
  }

  /**
   * @access private
   * @description Creates game over text.
   * @function addGameoverText
   * @returns {void}
   */
  private addGameoverText(): void {
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
   * @function addIntimationText
   * @returns {void}
   */
  private addIntimationText(): void {
    this.intimationText = this.add.text(+this.game.config.width / 2, 20, ""); // Set up text properties.
    this.intimationText.setFontSize(25); // Set font size of the text.
    this.intimationText.setOrigin(0.5); // The default value of "setOrigin" is "0.5", meaning all Game Objects are positioned based on their center.
  }

  /**
   * @function createExplosionAnimation
   * @description this function is responsible for adding explosion animation to the scene
   * @access private
   */
  private createExplosionAnimation() {
    this.anims.create({
      key: "explosion",
      frames: this.anims.generateFrameNames("explosion", {
        prefix: "regularExplosion0",
        suffix: ".png",
        end: 8,
        start: 0,
      }),
      frameRate: 16,
      showOnStart: true,
      hideOnComplete: true,
    });
  }

  /**
   * @access private
   * @function addPlayButton
   * @description this function will add the play button to the scene
   */
  private addPlayButton() {
    let button_config = {
      x: +this.game.config.width / 2,
      y: +this.game.config.height / 2,
      texture: "gui",
      frame: "blue_button00.png",
      text: {
        content: "Play",
      },
    };
    this.playBtn = new Button(button_config, this);
    this.playBtn.on("pointerup", this.onPlayBtnClick, this);
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
   * @function addListeners
   * @description this function includes all the listeners of this game object
   * @access private
   */
  private addListeners() {
    this.events.on(EventNames.PLAYER_ADDED, this.onAddPlayer, this);
    this.events.on(EventNames.NEW_PLAYER_JOINED, this.onAddEnemy, this);
    this.events.on(EventNames.ENEMY_BULLET, this.onEnemyFired, this);
    this.events.on(EventNames.ASTROID_ADDED, this.onAddAstroid, this);
    this.events.on("addPlayerBullet", this.addPlayerBullet, this);
  }

  /**
   * @function onAddPlayer
   * @description this function will render the player ship with given properties by server
   * @access private
   */
  private onAddPlayer(obj: any) {
    let playerConfig = {
      texture: "ship",
      frame: "shipBeige_manned.png",
    };
    let config = Phaser.Utils.Objects.Merge(obj, playerConfig);
    this.player = new Player(config, this);
    // inserting players to players array of server
    this.server.players[obj.id] = this.player;
  }

  /**
   * @function onAddEnemy
   * @description this function will render the enemy ship with given properties by server
   * @access private
   */
  private onAddEnemy(obj: any) {
    // console.trace(obj);
    let enemyConfig = {
      texture: "ship",
      frame: "shipBlue_manned.png",
    };
    let config = Phaser.Utils.Objects.Merge(obj, enemyConfig);
    this.enemy = new Enemy(config, this);
    // adding enemy to players array of server
    this.server.players[obj.id] = this.enemy;
  }

  /**
   * @function onEnemyFired
   * @description this function will render the enemy ship bullet with given properties by server
   * @access private
   */
  private onEnemyFired(obj: any) {
    let dome = this.physics.add.sprite(
      obj.x,
      obj.y,
      "shipwear",
      "laserBeige3.png"
    );
    dome.enableBody(true, dome.x, dome.y, true, true);
    dome.setScale(0.5, -0.5);
    dome.rotation = obj.rotation;
    this.physics.velocityFromRotation(
      dome.rotation - 4.7,
      500,
      dome.body.velocity
    ); // physics function to make movement from the current rotation of the object
    this.enemyBullets.push(dome); // pushing bullet to enemy bullets array
  }

  /**
   * @function onPlayBtnClick
   * @description this function will be called once play button clicked
   * @access private
   */
  private onPlayBtnClick() {
    this.playBtn.hide(); // hiding play button
    this.server.connect(); // trying to establish a connection to server
  }

  /**
   * @function addPlayerBullet
   * @description this function will be responsible to add bullet object to player but=llets array
   * @param bullet
   * @access private
   */
  private addPlayerBullet(bullet) {
    this.playerBullets.push(bullet);
  }

  /**
   * @function onAddAstroid
   * @description this function will be responsible for adding astroid game object to the scene
   * @param obj
   * @access private
   */
  private onAddAstroid(obj) {
    let astroid = this.physics.add.sprite(obj.x, obj.y, "astroid");
    astroid.enableBody(true, astroid.x, astroid.y, true, true);
    astroid.setScale(obj.scale.x, obj.scale.y);
    this.physics.velocityFromRotation(
      obj.rotation,
      obj.speed,
      astroid.body.velocity
    );
    astroid.setDepth(1);
    // this.enemyBullets.push(dome);
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
