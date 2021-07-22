import { Schema, ArraySchema, MapSchema, type } from "@colyseus/schema";
import Bullet from "./Bullet";

export default class Player extends Schema {
  @type("string")
  id: number;

  @type("number")
  x: number;

  @type("number")
  y: number;

  @type("number")
  width: number;

  @type("number")
  height: number;

  @type("number")
  gravity: number;

  @type("number")
  rotation: number;

  @type("number")
  lastProcessedInput: number;

  @type([Bullet])
  bullets: ArraySchema<Bullet>;
}
