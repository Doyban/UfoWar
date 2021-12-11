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
    this.clock.setInterval(this.createAstroid.bind(this), 2000); // Time interval between every Astroid creation.
    this.clock.setInterval(this.gameLoop.bind(this), 16); // Game update loop on server.
    this.maxClients = 2; // Maximum number of clients allowed to connect into the room. When room reaches this limit, it is locked automatically. Unless the room was explicitly locked by you via lock() method, the room will be unlocked as soon as a client disconnects from it.
    this.onMessage("*", this.onMessageFromClient.bind(this)); // Colyseus' callback that will be called on all room's messages from the client and based on message type update adequate action.
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
   * @access public
   * @callback createAstroid
   * @description Time interval between every Astroid creation.
   * @returns {void}
   */
  public createAstroid(): void {
    // Show the astroid with 49.999...% probability.
    if (Math.floor(Math.random()) * 100 < 50) {
      const speed = Math.floor(Math.random() * 500); // Speed at which Astroid should move.
      const rotation = Math.floor(Math.random() * 10); // Angle at which Astroid should rotate.

      // Send a message to all connected clients.
      this.broadcast(
        EventNames.ASTROID_ADDED, // Broadcast "ASTROID_ADDED" event (message).
        {
          x: Math.floor(Math.random() * 1280), // "x" position at which Astroid should render.
          y: Math.floor(Math.random() * 840), // "y" position at which Astroid should render.
          rotation: rotation < 1 ? 1 : rotation, // rotation which Astroid should have.
          // Astroid's scale, sometimes it's bigger, sometimes smaller.
          scale: {
            x: Math.random() || 0.25,
          },
          speed: speed < 50 ? 75 : speed, // Astroid's speed, sometimes it's faster, sometimes slower.
        }
      );
    }
  }

  /**
   * @access public
   * @callback onMessageFromClient
   * @description Listens to all room's messages from the client and based on message type update adequate action.
   * @param {Client} client Client (Player) that sent the message
   * @param {any} [type] message type
   * @param {any} [message] message data
   * @returns {void}
   * TODO: Check when the code will compile if these parameters have to be in such an order, like in Server.ts.
   */
  public onMessageFromClient(
    client: Client,
    type: string | number,
    message: any
  ): void {
    // Check if message type is "BULLET".
    if (type === EventNames.BULLET) {
      this.state.fireBullet(client.sessionId, message); // Fire Bullet from Player with associated session ID.

      // Send a message to all connected clients to add bullet object of this Client ID.
      this.broadcast(type, message, {
        except: client, // Instance not to send the message to.
      });
    }
    // Check if message type is "PLAYER_ROTATE".
    else if (type === EventNames.PLAYER_ROTATE) {
      // Send a message to all connected clients to rotate a client of this Client ID.
      this.broadcast(type, message, {
        except: client, // Instance not to send the message to.
      });
    }
    // Case for all other message types.
    else {
      this.state.updatePlayerPosition(client.sessionId, message); // Update Player's position.
    }
  }

  /**
   * TODO: Is it needed? Can't find any docs about it, only https://docs.colyseus.io/colyseus/server/room/#setsimulationinterval-callback-milliseconds166 refers something "kind of" about it.
   * @function gameLoop
   * @description this function will be invoked every 16ms to keep the state in sync
   */
  gameLoop() {}

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
