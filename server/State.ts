import { Schema, ArraySchema, MapSchema, type } from "@colyseus/schema";
import Player from "./schemas/Player";
import { EventNames } from "./utils/EventNames";
import Bullet from "./schemas/Bullet";

/**
 * @class State
 * @description will hold the game world state of a room
 * @extends Colyseus#Schema
 */
export default class State extends Schema {
  @type({ map: Player })
  players: MapSchema<Player>;
  @type("number")
  gameWidth: number;
  @type("number")
  gameHeight: number;
  @type(["number"])
  lastProcessedInput: ArraySchema;
  constructor() {
    super();
    this.gameWidth = -1;
    this.gameHeight = -1;
    this.players = new MapSchema<Player>();
    this.lastProcessedInput = new ArraySchema<number>();
  }

  /**
   * @function setGameBounds
   * @description will set the game bounds in state
   * @param obj
   * @access public
   */
  public setGameBounds(obj: any) {
    this.gameWidth = obj.gameWidth;
    this.gameHeight = obj.gameHeight;
  }

  /**
   * @function positionPlayer
   * @description will be responsible for positioning player on join
   * @param id client id
   * @access public
   */
  public positionPlayer(id: string) {
    let x = null;
    let y = null;
    let rotation = 0; //Math.floor(Math.random() * 360);
    console.log("Obje :>> ", Object.values(this.players).length);
    let playersCount = Object.values(this.players).length;
    if (playersCount === 1) {
      x = 75;
      y = this.gameHeight - 75;
    } else {
      x = this.gameWidth - 75;
      y = this.gameHeight - 75;
    }
    this.players[id]["id"] = id;
    this.players[id].x = x;
    this.players[id].y = y;
    this.players[id].width = 100;
    this.players[id].height = 100;
    this.players[id].rotation = rotation;
    this.players[id].bullets = new ArraySchema<Bullet>();
  }

  /**
   * @access public
   * @function movePlayer
   * @description will be responsible for updating the player position
   * @param id client id
   * @param type message type
   * @param value the position object to where player should be moved to
   */
  public movePlayer(id: string, type: string, value: any) {
    this.players[id].lastProcessedInput = value.sequenceNumber;
    this.players[id].x = value.x;
    this.players[id].y = value.y;
  }

  /**
   * @access public
   * @function fireBullet
   * @description will be responsible for adding the player bullet
   * @param id client id
   * @param type message type
   * @param value the position object to where player should be moved to
   */
  public fireBullet(id: string, type: string, value: any) {
    let bullet = new Bullet();
    bullet.x = value.x;
    bullet.y = value.y;
    this.players[id].bullets.push(bullet); // inserting the bullets to player bullets property
  }
}
