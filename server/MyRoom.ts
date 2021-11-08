import Player from "./schemas/Player";
import State from "./State";
import { Client, Room } from "colyseus";
import { EventNames } from "./utils/EventNames";

/**
 * @class MyRoom
 * @description Creates game state room game object.
 * @extends Colyseus.Room
 */
export class MyRoom extends Room {
  /**
   * @callback onCreate
   * @param options [any] that are selected while creating the room
   */
  onCreate(options: any) {
    this.setState(new State()); // setting a state to the room
    this.setPatchRate(50);
    this.maxClients = 2; // lock clients limit to 2
    this.onMessage("*", this.onMessageFromClient.bind(this)); // listening to all the message from clients
    this.clock.setInterval(this.gameLoop.bind(this), 16); // game update loo on server
    this.clock.setInterval(this.astroidAlarm.bind(this), 2000); // time interval between every astroid creation
  }

  /**
   * @callback onJoin
   * @description will be called every time new player has joined
   * @param client client that is joined
   * @param options
   */
  onJoin(client: Client, options: any) {
    this.state.setGameBoundaries(options);
    this.state.players[client.sessionId] = new Player();
    this.state.positionPlayer(client.sessionId);
    this.notifyOtherPlayers(client);
  }

  /**
   * @access public
   * @callback onLeave
   * @description Called when a client (Player) leaves the room.
   * @override `Colyseus.Room#onLeave`
   * @param {Client} client Client (Player) that is still left in the room
   * @param {boolean} consented Flag to check whether disconnection was initiated by the client (true), or not (false)
   * @returns {void}
   */
  public onLeave(client: Client, consented: boolean): void {
    // Check if the disconnection was NOT initiated by the client.
    if (!consented) {
      this.broadcast("playerleft", client); // Broadcast a message to other Player about Player leaving the room.
      delete this.state.players[client.sessionId]; // Remove Player based on its ID from Players object of game state.
    }
  }

  /**
   * @function onMessageFromClient
   * @description this function responsible for listening to all the players messages
   * @param client the client who has sent the message
   * @param type message type
   * @param message any payload object that is sent by client
   */
  onMessageFromClient(client: Client, type: string | number, message: any) {
    if (type === EventNames.BULLET) {
      //check if message is bullet
      this.state.fireBullet(client.sessionId, message);
      // brodcast a message to add bullet object of this client id on all other player worlds
      this.broadcast(type, message, {
        except: client,
      });
    } else if (type === EventNames.PLAYER_ROTATE) {
      //check if message is bullet
      // broadcast message to rotate a client on other players worlds
      this.broadcast(type, message, {
        except: client,
      });
    } else {
      // move player
      this.state.updatePlayerPosition(client.sessionId, message);
    }
  }

  /**
   * @function gameLoop
   * @description this function will be invoked every 16ms to keep the state in sync
   */
  gameLoop() {}

  /**
   * @function astroidAlarm
   * @description a callbeack to create an astroid
   */
  astroidAlarm() {
    // to make this probabilty of 50 perc
    if (Math.floor(Math.random()) * 100 < 50) {
      const speed = Math.floor(Math.random() * 500); // speed at which astroid should move
      const rotation = Math.floor(Math.random() * 10); // angle at which astroid should rotate
      this.broadcast(EventNames.ASTROID_ADDED, {
        x: Math.floor(Math.random() * 1280), // x position at which astroid should render
        y: Math.floor(Math.random() * 840), // y position at which astroid should render
        rotation: rotation < 1 ? 1 : rotation,
        scale: {
          x: Math.random() || 0.25,
        },
        speed: speed < 50 ? 75 : speed,
      });
    }
  }

  /**
   * @function notifyOtherPlayers
   * @description this function will broadcast a message to other players of new player arrival
   * @param client player who is joined
   */
  notifyOtherPlayers(client: Client) {
    this.broadcast(
      EventNames.ENEMY_ADDED,
      {
        client: client,
        player: this.state.players[client.sessionId],
      },
      {
        except: client,
      }
    );
  }
}
