import Bullet from "./schemas/Bullet";
import Player from "./schemas/Player";
import { type, ArraySchema, MapSchema, Schema } from "@colyseus/schema";

/**
 * @class State
 * @description Holds the game world state of a room.
 * @extends Colyseus.Schema
 */
export default class State extends Schema {
  @type("number")
  gameHeight: number;

  @type("number")
  gameWidth: number;

  @type(["number"])
  lastProcessedInput: ArraySchema;

  @type({ map: Player })
  players: MapSchema<Player>;

  /**
   * @constructor
   * @description Create a new instance of this class.
   */
  constructor() {
    super();

    // Set up initial values.
    this.gameWidth = -1;
    this.gameHeight = -1;
    this.players = new MapSchema<Player>();
    this.lastProcessedInput = new ArraySchema<number>();
  }

  /**
   * @access public
   * @description Fire bullet.
   * @function fireBullet
   * @param {string} [playerId] Player's ID
   * @param {any} [positionValues] Position object from which bullet should get position values
   * @returns {void}
   */
  public fireBullet(playerId: string, positionValues: any): void {
    let bullet: Bullet = new Bullet(); // Create a new bullet.

    // Update position properties of the bullet.
    bullet.x = positionValues.x;
    bullet.y = positionValues.y;

    this.players[playerId].bullets.push(bullet); // Push bullet to Player bullets array.
  }

  /**
   * @access public
   * @description Position Player.
   * @function positionPlayer
   * @param {string} [playerId] Player's ID
   * @returns {void}
   */
  public positionPlayer(playerId: string): void {
    // Initiate Player's basic properties.
    let x: number = 0;
    let y: number = 0;

    let playersCount: number = Object.values(this.players).length; // Calculate number of Players.

    // Depending by the Players count set up different positions.
    if (playersCount === 1) {
      x = 75;
      y = this.gameHeight - 75;
    } else {
      x = this.gameWidth - 75;
      y = this.gameHeight - 75;
    }

    // Position Player by setting up its properties.
    this.players[playerId]["id"] = playerId;
    this.players[playerId].bullets = new ArraySchema<Bullet>();
    this.players[playerId].height = 100;
    this.players[playerId].rotation = 0;
    this.players[playerId].width = 100;
    this.players[playerId].x = 0;
    this.players[playerId].y = 0;
  }

  /**
   * @access public
   * @description Set game boundaries.
   * @function setGameBoundaries
   * @param {any} [gameObject] Game properties
   * @returns {void}
   */
  public setGameBoundaries(gameObject: any): void {
    this.gameHeight = gameObject.gameHeight;
    this.gameWidth = gameObject.gameWidth;
  }

  /**
   * @access public
   * @description Update Player's position.
   * @function movePlayer
   * @param {string} [playerId] Player's ID
   * @param {any} [positionValues] Position object from which Player should get position values and sequenceNumber
   * @returns {void}
   */
  public updatePlayerPosition(playerId: string, positionValues: any): void {
    this.players[playerId].lastProcessedInput = positionValues.sequenceNumber;
    this.players[playerId].x = positionValues.x;
    this.players[playerId].y = positionValues.y;
  }
}
