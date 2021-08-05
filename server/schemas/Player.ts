import { Schema, ArraySchema, type } from "@colyseus/schema";
import Bullet from "./Bullet";

export default class Player extends Schema {
  @type([Bullet])
  bullets: ArraySchema<Bullet>;

  @type("number")
  gravity: number;

  @type("number")
  height: number;

  @type("string")
  id: number;

  @type("number")
  lastProcessedInput: number;

  @type("number")
  rotation: number;

  @type("number")
  width: number;

  @type("number")
  x: number;

  @type("number")
  y: number;
}
