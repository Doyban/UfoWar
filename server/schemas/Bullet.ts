import { Schema, ArraySchema, MapSchema, type } from "@colyseus/schema";

export default class Bullet extends Schema {
  @type("number")
  x: number;

  @type("number")
  y: number;

  @type("number")
  speed: number;

  @type("number")
  angle: number;
}
