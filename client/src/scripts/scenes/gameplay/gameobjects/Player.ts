import { EventNames } from "../../../utils/GameConstants";

/**
 * @class Player
 * @description Creates the Player game object and adds it to the scene.
 * @extends Phaser.Physics.Arcade.Sprite
 */
export default class Player extends Phaser.Physics.Arcade.Sprite {
  config: any;
  inputSequenceNumber: number;
  keyCodes: any;
  pendingInputs: Array<any>;
  positionBuffer: Array<any>;
  speed: number;

  /**
   * @constructor
   * @description Create a new instance of this class.
   * @param {any} [config] position config
   * @param {Phaser.Scene} [scene] Phaser scene to which Enemy will be added
   */
  constructor(config: any, scene: Phaser.Scene) {
    super(scene, config.x, config.y, config.texture, config.frame);

    this.config = config; // Set up initial configuration.
    this.scene.add.existing(this); // Add game object to the current scene.

    this.inputSequenceNumber = 0; // Input sequence number initially is set to 0 to distinguish keyboard sequence numbers.
    this.pendingInputs = []; // Initialize empty pending inputs to sync moves.
    this.positionBuffer = []; // Initialize empty position buffer to sync moves.
    this.speed = 2; // Speed of the Player.

    this.setAngle(this.config.rotation); // Angle of the game object.
    this.setDepth(2); // Depth of this game object within this scene (rendering position), also known as 'z-index' in CSS.

    this.addKeycodes(); // Add keycodes.
    this.addListeners(); // Add listeners of the game objects.
  }

  /**
   * @access private
   * @description Add keycodes.
   * @function addKeycodes
   * @returns {void}
   */
  private addKeycodes(): void {
    this.keyCodes = this.scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
    });
  }

  /**
   * @access private
   * @description Add listeners of the game objects.
   * @function addListeners
   * @returns {void}
   */
  private addListeners(): void {
    this.scene.events.on("playermoved", this.onMovePlayer, this); // Listener for Player move event.
  }

  /**
   * @access private
   * @description Listener for Player move event.
   * @function onMovePlayer
   * @param {any} [null] prop
   * @returns {void}
   */
  private onMovePlayer(playerProperties: any = null): void {
    // Update position properties of the Player.
    this.x = Phaser.Math.Linear(this.x, playerProperties.x, 0.7);
    this.y = Phaser.Math.Linear(this.y, playerProperties.y, 0.7);
  }

  /**
   * @access public
   * @description Method invoked all the time during the game. Listens to the changes of this game object properties and rerenders every frame.
   * @function update
   * @override `Phaser.Gameobjects#update`
   * @param {number} [deltaTime] the delta value since the last frame, this is smoothed to avoid delta spikes by the TimeStep class
   * @param {number} [time] The time value from the most recent Game step. Typically a high-resolution timer value, or Date.now()
   * @returns {void}
   * !Important: the "time" parameter has to be here, otherwise it breaks the game, i.e., the player disappears after first keystroke.
   */
  public update(time: number, deltaTime: number) {
    let playerProperties: { down_time: number } = { down_time: deltaTime };

    // Check if the keyboard button "Up" is currently being held down with at least 100 ms must have elapsed to before this Key is considered down.
    if (this.scene.input.keyboard.checkDown(this.keyCodes.up, 100)) {
      this.y += this.speed * -deltaTime; // Update the "y" position of the Player.

      // Set movement update properties of the Player.
      playerProperties["sequenceNumber"] = this.inputSequenceNumber++;
      playerProperties["key"] = 0;
      playerProperties["down_time"] = -deltaTime;

      this.sendMovementUpdate(playerProperties); // Update Player's movement.
    }
    // Check if the keyboard button "Down" is currently being held down with at least 100 ms must have elapsed to before this Key is considered down.
    if (this.scene.input.keyboard.checkDown(this.keyCodes.down, 100)) {
      this.y += this.speed * deltaTime; // Update the "y" position of the Player.

      // Set movement update properties of the Player.
      playerProperties["sequenceNumber"] = this.inputSequenceNumber++;
      playerProperties["key"] = 0;
      playerProperties["down_time"] = deltaTime;

      this.sendMovementUpdate(playerProperties); // Update Player's movement.
    }
    // Check if the keyboard button "Left" is currently being held down with at least 100 ms must have elapsed to before this Key is considered down.
    if (this.scene.input.keyboard.checkDown(this.keyCodes.left, 100)) {
      this.x += this.speed * -deltaTime; // Update the "x" position of the Player.

      // Set movement update properties of the Player.
      playerProperties["sequenceNumber"] = this.inputSequenceNumber++;
      playerProperties["key"] = 1;
      playerProperties["down_time"] = -deltaTime;

      this.sendMovementUpdate(playerProperties); // Update Player's movement.
    }
    // Check if the keyboard button "Right" is currently being held down with at least 100 ms must have elapsed to before this Key is considered down.
    if (this.scene.input.keyboard.checkDown(this.keyCodes.right, 100)) {
      this.x += this.speed * deltaTime; // Update the "x" position of the Player.

      // Set movement update properties of the Player.
      playerProperties["sequenceNumber"] = this.inputSequenceNumber++;
      playerProperties["key"] = 1;
      playerProperties["down_time"] = deltaTime;

      this.sendMovementUpdate(playerProperties); // Update Player's movement.
    }
    // Check if the keyboard button "Space" is currently being held down with at least 3000 ms must have elapsed to before this Key is considered down.
    if (this.scene.input.keyboard.checkDown(this.keyCodes.space, 3000)) {
      this.createPlayerBullet(); // Create Player's bullet after holding "Space" for 3000 ms.
    }
    // Check if the keyboard button "A" is currently being held down with at least 100 ms must have elapsed to before this Key is considered down.
    if (this.scene.input.keyboard.checkDown(this.keyCodes.a, 100)) {
      this.rotation += 0.01 * deltaTime; // Update the "rotation" of the Player.

      playerProperties["rotation"] = this.rotation; // Set movement update properties of the Player.

      this.onRotatePlayer(playerProperties); // Update Player's rotation.
    }
    // Check if the keyboard button "D" is currently being held down with at least 100 ms must have elapsed to before this Key is considered down.
    if (this.scene.input.keyboard.checkDown(this.keyCodes.d, 100)) {
      this.rotation -= 0.01 * deltaTime; // Update the "rotation" of the Player.

      playerProperties["rotation"] = this.rotation; // Set movement update properties of the Player.

      this.onRotatePlayer(playerProperties); // Update Player's rotation.
    }
  }

  /**
   * @access private
   * @description Update Player's movement.
   * @function sendMovementUpdate
   * @param {any} [playerProperties] Player properties
   * @returns {void}
   */
  private sendMovementUpdate(playerProperties: any): void {
    // Set movement update properties of the Player.
    playerProperties["x"] = this.x;
    playerProperties["y"] = this.y;

    this.scene.events.emit(EventNames.MOVE, playerProperties); // Emit "MOVE" event to the scene with Player properties.

    this.pendingInputs.push(playerProperties); // Update pending inputs to sync moves.
  }

  /**
   * @access private
   * @description Update Player's rotation.
   * @function onRotatePlayer
   * @param {any} [playerProperties] Player properties
   * @returns {void}
   */
  private onRotatePlayer(playerProperties: any): void {
    this.scene.events.emit(EventNames.PLAYER_ROTATE, playerProperties); // Emit "PLAYER_ROTATE" event to the scene with Player properties.
  }

  /**
   * @function correctPosition
   * @description this function is responsible to correct position of player on client side with server position
   * @param inputObj
   * @access public
   */
  public correctPosition(inputObj) {
    // console.log('inputObj :>> ', inputObj);
    if (inputObj.key > 0) {
      this.x += inputObj.down_time * this.speed;
      // console.log('this.x :>> ', this.x);
    } else {
      console.log("this.y :>> ", this.y);
      this.y += inputObj.down_time * this.speed;
    }
  }

  /**
   * @access private
   * @function createPlayerBullet
   * @description // Create Player's bullet after holding "Space" for 3000 ms.
   */
  private createPlayerBullet() {
    let dome = this.scene.physics.add.sprite(
      this.x,
      this.y,
      "shipwear",
      "laserBlue3.png"
    );
    dome.enableBody(true, dome.x, dome.y, true, true);
    dome.setScale(0.5, -0.5);
    dome.rotation = this.rotation;
    this.scene.physics.velocityFromRotation(
      this.rotation - 4.7,
      500,
      dome.body.velocity
    );
    this.scene.events.emit(EventNames.BULLET, {
      x: dome.x,
      y: dome.y,
      rotation: dome.rotation,
    });
    this.scene.events.emit("addPlayerBullet", dome);
  }
}
