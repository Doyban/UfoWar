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
   * @access public
   * @callback onCreate
   * @description Called once, when the room is created by the matchmaker.
   * @override `Colyseus.Room#onCreate`
   * @returns {void}
   */
  public onCreate(): void {
    this.clock.setInterval(this.astroidAlarm.bind(this), 2000); // Time interval between every Astroid creation.
    this.clock.setInterval(this.gameLoop.bind(this), 16); // Game update loop on server.
    this.maxClients = 2; // Maximum number of clients allowed to connect into the room. When room reaches this limit, it is locked automatically. Unless the room was explicitly locked by you via lock() method, the room will be unlocked as soon as a client disconnects from it.
    this.onMessage("*", this.onMessageFromClient.bind(this)); // Colyseus' callback that will be called on all room's messages from the server and based on message type update adequate action.
    this.setPatchRate(50); // Set frequency the patched state should be sent to all clients, default is 50ms (20fps).
    this.setState(new State()); // Set state of the room.
  }

  /**
   * @access public
   * @callback onJoin
   * @description Called when a client (Player) joins the room.
   * @override `Colyseus.Room#onJoin`
   * @param {Client} client Client (Player) that is still left in the room
   * @param {any} options Game properties
   * @returns {void}
   */
  public onJoin(client: Client, options: any): void {
    this.state.setGameBoundaries(options); // Set game boundaries with given game properties.
    this.state.players[client.sessionId] = new Player(); // Create Player with associated session ID.
    this.state.positionPlayer(client.sessionId); // Position Player.
    this.notifyOtherPlayers(client); // Broadcast a message to other Player about new Player (Enemy) joining the room.
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
   * @access public
   * @description Broadcast a message to other Player about new Player (Enemy) joining the room.
   * @function notifyOtherPlayers
   * @param {Client} client Client (Player) that is still left in the room
   * @returns {void}
   */
  public notifyOtherPlayers(client: Client): void {
    // Send a message to all connected clients.
    this.broadcast(
      EventNames.ENEMY_ADDED, // Broadcast "ENEMY_ADDED" event (message).
      {
        player: this.state.players[client.sessionId], //  Assign Player to its associated session ID.
        client: client, // Assign the Player that is still left in the room.
      },
      {
        except: client, // Instance not to send the message to.
      }
    );
  }
}
