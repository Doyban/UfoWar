import { Room, Client } from "colyseus";
import State from "./State";
import Player from "./schemas/Player";
import { EventNames } from "./utils/EventNames";

/**
 * @class MyRoom 
 * @description game state room object
 * @extends Colyseus#Room
 */
export class MyRoom extends Room
{
  /**
   * @callback onCreate
   * @param options [any] that are selected while creating the room
   */
  onCreate(options: any)
  {
    this.setState(new State()); // setting a state to the room
    this.setPatchRate(50);
    this.maxClients = 2; // lock clients limit to 2
    this.onMessage("*", this.onMessageFromClient.bind(this)); // listening to all the message from clients
    this.clock.setInterval(this.gameLoop.bind(this), 16) // game update loo on server
    this.clock.setInterval(this.astroidAlarm.bind(this), 2000) // time interval between every astroid creation 
  }

  /**
   * @callback onJoin
   * @description will be called every time new player has joined
   * @param client client that is joined
   * @param options 
   */
  onJoin(client: Client, options: any)
  {
    // console.log('options :>> ', options);
    this.state.setGameBounds(options);
    this.state.players[client.sessionId] = new Player();
    this.state.positionPlayer(client.sessionId);
    this.notifyOtherPlayers(client);

  }

  
  /**
   * @callback onLeave
   * @description will be called every time new player has left
   * @param client client that is left
   * @param options 
   */
  onLeave(client: Client, consented: boolean)
  {
    if (!consented)
    {
      this.broadcast("playerleft", client); // broadcast a message to other player about player leaving the room
      delete this.state.players[client.sessionId]; // remove it from players object of game state
    }
  }

  onDispose()
  {
    // console.log('disposed :>> ');
  }

  /**
   * @function onMessageFromClient
   * @description this function responsible for listening to all the players messages
   * @param client the client who has sent the message
   * @param type message type
   * @param message any payload object that is sent by client
   */
  onMessageFromClient(client: Client, type: string | number, message: any)
  {
    // console.log(`message from client ${ client.id } :>> `, type, message);
    if (type === EventNames.BULLET) //check if message is bullet
    {
      this.state.fireBullet(client.sessionId, type, message);
      // brodcast a message to add bullet object of this client id on all other player worlds
      this.broadcast(type, message, {
        except: client
      });
    } else if (type === EventNames.ROTATE)//check if message is bullet
    {
      // broadcast message to rotate a client on other players worlds
      this.broadcast(type, message, {
        except: client
      });
    }
    else 
    {
      // move player
      this.state.movePlayer(client.sessionId, type, message);
    }
  }

  /**
   * @function gameLoop
   * @description this function will be invoked every 16ms to keep the state in sync
   */
  gameLoop()
  {
  }

  /**
   * @function astroidAlarm
   * @description a callbeack to create an astroid
   */
  astroidAlarm()
  {
    // to make this probabilty of 50 perc
    if (Math.floor(Math.random()) * 100 < 50)
    {
      const speed = Math.floor(Math.random() * 500); // speed at which astroid should move
      const rotation = Math.floor(Math.random() * 10); // angle at which astroid should rotate
      this.broadcast(EventNames.ASTROID_ADDED, {
        x: Math.floor(Math.random() * 1280), // x position at which astroid should render
        y: Math.floor(Math.random() * 840), // y position at which astroid should render
        rotation: rotation < 1 ? 1 : rotation,
        scale: {
          x: Math.random() || 0.25
        },
        speed: speed < 50 ? 75 : speed
      })
    }
  }

  /**
   * @function notifyOtherPlayers
   * @description this function will broadcast a message to other players of new player arrival 
   * @param client player who is joined
   */
  notifyOtherPlayers(client: Client)
  {
    this.broadcast(EventNames.NEW_PLAYER_JOINED, {
      client: client,
      player: this.state.players[client.sessionId]
    }, {
      except: client
    })
  }
}
