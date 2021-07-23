import { Sprite } from "../Interfaces";
import { EventNames } from "../../../utils/GameConstants";

/**
 * @class Player
 * @description this class is pack of alll the behaviours of player
 * @extends `Phaser Arcade Sprite`
 */
export default class Player extends Phaser.Physics.Arcade.Sprite {
  config: any;
  keyCodes: any;
  speed: number;
  positionBuffer: Array<any>;
  inputSequenceNumber: number;
  pendingInputs: Array<any>;
  lag: number;
  /**
   * @constructor
   * @param scene [Phaser Scene] scene to which player should be added
   * @param config position config
   */
  constructor(scene: Phaser.Scene, config: any) {
    super(scene, config.x, config.y, config.texture, config.frame);
    this.scene.add.existing(this);
    this.config = config;
    this.speed = 2;
    this.positionBuffer = [];
    this.pendingInputs = [];
    this.inputSequenceNumber = 0;
    this.lag = 0;
    this.setAngle(this.config.rotation);
    this.setDepth(2);
    this.addKeycodes();
    this.addListeners();
  }

  /**
   * @function addListeners
   * @description this function includes all the listeners of this game object
   * @access private
   */
  private addListeners() {
    this.scene.events.on("playermoved", this.onPlayerMoved, this);
    // this.scene.input.keyboard.on('keydown_SPACE', this.onSpaceDown, this);
  }

  /**
   * @function addKeycodes
   * @description this function will be responsible for the functionality that happens after keycode up down
   * @access private
   */
  private addKeycodes() {
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
   * @function sendMovementUpdate
   * @description this function will be responsible for the functionality that updates server with movement change
   * @access private
   * @param {any} [obj = null]
   */
  private sendMovementUpdate(inputObj: any) {
    // console.log('pos :>> ', inputObj);
    inputObj["x"] = this.x;
    inputObj["y"] = this.y;
    this.scene.events.emit(EventNames.MOVE, inputObj);
    this.pendingInputs.push(inputObj);
  }

  /**
   * @function sendRotationUpdate
   * @description this function will be responsible for the functionality that updates server with rotation change
   * @access private
   * @param {any} [obj = null]
   */
  private sendRotationUpdate(inputObj: any) {
    this.scene.events.emit(EventNames.ROTATE, inputObj);
  }

  /**
   * @function onPlayerMoved
   * @description this function will be responsible for the functionality of player moving after server response properties
   * @access private
   * @param {any} [prop = null]
   */
  private onPlayerMoved(prop: any = null) {
    this.x = Phaser.Math.Linear(this.x, prop.x, 0.7);
    this.y = Phaser.Math.Linear(this.y, prop.y, 0.7);
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
   * @function onSpaceDown
   * @description this function will be listening on space button click, and will create a player bullet and adds it to the scene
   */
  private onSpaceDown() {
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

  /**
   * @access public
   * @function update
   * @override `Phaser #update`
   * @description the update function which executes at given fps
   * @param {number} time The time value from the most recent Game step. Typically a high-resolution timer value, or Date.now().
   * @param {number} deltaTime The delta value since the last frame. This is smoothed to avoid delta spikes by the TimeStep class.
   */
  public update(time, deltaTime) {
    let input = { down_time: deltaTime };
    // check if key board down is down
    if (this.scene.input.keyboard.checkDown(this.keyCodes.down, 100)) {
      this.y += this.speed * deltaTime;
      input["sequenceNumber"] = this.inputSequenceNumber++;
      input["key"] = 0;
      input["down_time"] = deltaTime;
      this.sendMovementUpdate(input);
    }
    // check if key board up is down
    if (this.scene.input.keyboard.checkDown(this.keyCodes.up, 100)) {
      this.y += this.speed * -deltaTime;
      input["sequenceNumber"] = this.inputSequenceNumber++;
      input["key"] = 0;
      input["down_time"] = -deltaTime;
      this.sendMovementUpdate(input);
    }
    // check if key board left is down
    if (this.scene.input.keyboard.checkDown(this.keyCodes.left, 100)) {
      this.x += this.speed * -deltaTime;
      input["sequenceNumber"] = this.inputSequenceNumber++;
      input["key"] = 1;
      input["down_time"] = -deltaTime;
      this.sendMovementUpdate(input);
    }
    // check if key board A is down
    if (this.scene.input.keyboard.checkDown(this.keyCodes.a, 100)) {
      this.rotation += 0.01 * deltaTime;
      input["rotation"] = this.rotation;
      this.sendRotationUpdate(input);
    }
    // check if key board D is down
    if (this.scene.input.keyboard.checkDown(this.keyCodes.d, 100)) {
      this.rotation -= 0.01 * deltaTime;
      input["rotation"] = this.rotation;
      this.sendRotationUpdate(input);
    }
    // check if key board right is down
    if (this.scene.input.keyboard.checkDown(this.keyCodes.right, 100)) {
      this.x += this.speed * deltaTime;
      input["sequenceNumber"] = this.inputSequenceNumber++;
      input["key"] = 1;
      input["down_time"] = deltaTime;
      this.sendMovementUpdate(input);
    }
    // check if key board space is down
    if (this.scene.input.keyboard.checkDown(this.keyCodes.space, 3000)) {
      this.onSpaceDown();
    }
  }
}