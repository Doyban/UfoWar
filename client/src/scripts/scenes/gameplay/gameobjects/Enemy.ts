import { EventNames } from "../../../utils/GameConstants";

/**
 * @class Enemy
 * @description Creates the Enemy game object and adds it to the scene.
 * @extends Phaser.Physics.Arcade.Sprite
 */
export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  config: any;
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
    this.positionBuffer = []; // Initialize empty position buffer to sync moves.
    this.speed = 0.1; // Speed of the Enemy.

    this.setAngle(this.config.rotation); // Angle of the game object.
    this.setDepth(2); // Depth of this game object within this scene (rendering position), also known as 'z-index' in CSS.

    this.addListeners(); // Add listeners of the game objects.
  }

  /**
   * @access private
   * @description Add listeners of the game objects.
   * @function addListeners
   * @returns {void}
   */
  private addListeners(): void {
    this.scene.events.on(EventNames.PLAYER_LEFT, this.onPlayerLeft, this); // Listener for leaving the game event by the Player.
    this.scene.events.on("enemymoved", this.onMoveEnemy, this); // Listener for Enemy move event.
    this.scene.events.on(EventNames.ENEMY_ROTATE, this.onRotateEnemy, this); // Listener for rotate Player event.
  }

  /**
   * @access private
   * @description Listener for leaving the game event by the Player.
   * @function onPlayerLeft
   * @returns {void}
   */
  private onPlayerLeft(): void {
    this.destroy(true); // Destroy the Enemy.
  }

  /**
   * @access private
   * @description Listener for Enemy move event.
   * @function onMoveEnemy
   * @param {any} [enemyProperties] Enemy properties.
   * @returns {void}
   */
  private onMoveEnemy(enemyProperties: any): void {
    // Update position properties of the Enemy.
    this.x += (enemyProperties.x - this.x) * 0.5;
    this.y += (enemyProperties.y - this.y) * 0.5;
  }

  /**
   * @access private
   * @description Listener for rotate Player event.
   * @function onRotateEnemy
   * @param {any} [enemyProperties] Enemy properties.
   * @returns {void}
   */
  private onRotateEnemy(enemyProperties: any): void {
    this.rotation = enemyProperties.rotation; // Update rotation property.
  }

  /**
   * @access public
   * @description Method invoked all the time during the game. Listens to the changes of this game object properties and rerenders every frame.
   * @function update
   * @override `Phaser.Gameobjects#update`
   * @returns {void}
   */
  public update(): void {
    const now: number = +new Date(); // Get current date.
    const render_timestamp: number = now - 1000.0 / 64; // Set render timestamp.
    const buffer: Array<any> = this.positionBuffer; // Get the two authoritative positions surrounding the rendering timestamp.

    // Drop older positions until the buffer's length is less than 2 and t1 from the buffer has older or same timestamp than "render_timestamp".
    while (buffer.length >= 2 && buffer[1][0] <= render_timestamp) {
      buffer.shift(); // Remove the first element and return it.
    }

    // Check if the buffer's length is more or equal than 2 and t0 from the buffer has older or same timestamp than "render_timestamp" and t1 from the buffer has newer or same timestamp than "render_timestamp".
    if (
      buffer.length >= 2 &&
      buffer[0][0] <= render_timestamp &&
      render_timestamp <= buffer[1][0]
    ) {
      // Get positions and timestamps.
      const x0 = buffer[0][1].x;
      const x1 = buffer[1][1].x;
      const y0 = buffer[0][1].y;
      const y1 = buffer[1][1].y;
      const t0 = buffer[0][0];
      const t1 = buffer[1][0];

      // Update position properties of the Enemy.
      this.x = x0 + ((x1 - x0) * (render_timestamp - t0)) / (t1 - t0);
      this.y = y0 + ((y1 - y0) * (render_timestamp - t0)) / (t1 - t0);
    }
  }
}
