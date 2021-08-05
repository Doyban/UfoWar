import { type, Schema } from "@colyseus/schema";

export default class Bullet extends Schema {
  @type("number")
  angle: number;

  @type("number")
  speed: number;
  
  @type("number")
  x: number;

  @type("number")
  y: number;
}
