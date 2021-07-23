import * as Colyseus from "colyseus.js";
import { EventNames } from "../src/scripts/utils/GameConstants";
import { Scene } from "phaser";

/**
 * @class Server
 * @description this class is pack of all the behaviours of Server on client end.
 * @extends Colyseus.Client
 */
export default class Server extends Colyseus.Client {
  clientId: string;
  isEnemyAdded: boolean;
  isPlayerAdded: boolean;
  players: any;
  room: Colyseus.Room;
  roomId: string;
  roomName: string;
  scene: Scene;

  /**
   * @constructor
   * @description Create a new instance of this class.
   * @param {ctx} Phaser scene.
   */
  constructor(scene: Scene) {
    let url = "ws://18.224.7.66:2567"; // Comment to bottom one: with this setup it also works on localhost...
    // url = "ws://localhost:2567"; // uncomment this line to make it work locally
    super(url);

    // Set up initial values.
    this.clientId = "";
    this.isEnemyAdded = false;
    this.isPlayerAdded = false;
    this.players = {};
    this.scene = scene;
    this.roomName = "";
    this.roomId = "";

    this.addListeners(); // Add listeners of the game objects.
  }

  /**
   * @access private
   * @description Add listeners of the game objects.
   * @function addListeners
   * @returns {void}
   */
  private addListeners(): void {
    this.scene.events.on(EventNames.BULLET, this.onFire, this); // Listener for firing Bullet event.
    this.scene.events.on(EventNames.ENEMY_DEAD, this.onEnemyDead, this); // Listener for Enemy dead event after the Player hits the enemy.
    this.scene.events.on(EventNames.MOVE, this.onMovePlayer, this); // Listener for Player move event.
    this.scene.events.on(EventNames.MOVE_DOWN, this.onMovePlayerDown, this); // Listener for Player move down event.
    this.scene.events.on(EventNames.MOVE_LEFT, this.onMovePlayerLeft, this); // Listener for Player move left event.
    this.scene.events.on(EventNames.MOVE_RIGHT, this.onMovePlayerRight, this); // Listener for Player move right event.
    this.scene.events.on(EventNames.MOVE_UP, this.onMovePlayerUp, this); // Listener for Player move up event.
    this.scene.events.on(EventNames.PLAYER_DEAD, this.onPlayerDead, this); // Listener for Player dead event after the enemy hits the Player.
    this.scene.events.on(EventNames.ROTATE, this.onRotatePlayer, this); // Listener for rotate Player event.
  }

  /**
   * @access public
   * @async
   * @description Establish connection between client and server.
   * @function connect
   * @returns {Promise<void>}
   */
  public async connect(): Promise<void> {
    // Set game dimensions.
    const options = {
      gameHeight: this.scene.game.config.height,
      gameWidth: this.scene.game.config.width,
    };

    // Join room if exists else will create and join. The class extends Colyseus.Client and therefore there's an access on "this" to Colyseus#joinOrCreate.
    await this.joinOrCreate("my_room", options).then(
      this.onRoomJoin.bind(this)
    );
  }

  /**
   * @access private
   * @description Configure room properties and listen to room's changes once the client will join the room successfully.
   * @function onRoomJoin
   * @param {any} [room]
   * @returns {void}
   */
  private onRoomJoin(room: Colyseus.Room): void {
    // Set room properties.
    this.clientId = room.sessionId;
    this.room = room;
    this.roomId = room.id;
    this.roomName = room.name;

    room.onStateChange(this.onStateChange.bind(this, room.state)); // Colyseus' callback that will be called if state has any change, it syncs moves.
    room.onMessage("*", this.onMessage.bind(this)); // Colyseus' callback that will be called on all room's messages from the server.
  }

  /**
   * @access private
   * @description Listen to state changes on server side, it syncs moves.
   * @function onStateChange
   * @param {any} [state]
   * @returns {void}
   */
  private onStateChange(state: any): void {
    for (const key in state) {
      if (state.hasOwnProperty(key)) {
        const value = state[key];
        switch (key) {
          case "players":
            this.playersState(value); // Update Player's state based on given value from the state.
            break;
          default:
            break;
        }
      }
    }
  }

  /**
   * @function onMessage
   * @description this function will be executed on message from server
   * @param {any} [type] -message name
   * @param {any} [message] -message data
   * @access private
   */
  private onMessage(type: any, message: any): void {
    // console.log('res :>> ', type, message);
    switch (type) {
      case EventNames.PLAYER_LEFT:
        this.onPlayerLeft(type, message);
        break;
      case EventNames.NEW_PLAYER_JOINED:
        this.newPlayerJoin(type, message);
        break;
      case EventNames.BULLET:
        this.scene.events.emit(EventNames.ENEMY_BULLET, message);
        break;
      case EventNames.ROTATE:
        this.scene.events.emit(EventNames.ENEMY_ROTATE, message);
        break;
      case EventNames.ASTROID_ADDED:
        this.scene.events.emit(EventNames.ASTROID_ADDED, message);
        break;

      default:
        break;
    }
  }

  /**
   * @function playersState
   * @description this function will be called on change in state on server
   * @param {any} [currentState] - current state of the game on server end
   * @access private
   */
  private playersState(currentState: any) {
    for (const key in currentState) {
      if (currentState.hasOwnProperty(key)) {
        const element = currentState[key];
        let prop = {
          id: key,
          x: element.x,
          y: element.y,
          rotation: element.rotation,
          bullets: element.bullets,
        };
        if (key === this.clientId) {
          let playerProp = prop;
          if (!this.isPlayerAdded) {
            // check if player added already if not, add now
            this.scene.events.emit(EventNames.HERO_ADDED, playerProp); // emit an event to add player gameobject to the scene
            this.isPlayerAdded = true;
          } else {
            this.correctPositionOfPlayer(element); // sync player position with server
          }
        } else {
          let enemyProp = prop;
          if (!this.isEnemyAdded) {
            // if enemy not added yet, add now
            this.scene.events.emit(EventNames.NEW_PLAYER_JOINED, enemyProp); // emit an event to add enemy game object to scene
            this.isEnemyAdded = true;
          } else {
            this.correctPositionEnemy(element); // sync enemy position with server
          }
        }
      }
    }
  }

  /**
   * @access private
   * @description Listener for firing Bullet event.
   * @function onFire
   * @param {any} position Position of the Player.
   * @returns {void}
   */
  private onFire(position: any): void {
    this.room.send(EventNames.BULLET, position); // Send a type of "PLAYER_DEAD" message to the room handler with a position of the Player.
  }

  /**
   * @access private
   * @description Listener for Enemy dead event after the Player hits the enemy.
   * @function onEnemyDead
   * @returns {void}
   */
  private onEnemyDead(): void {
    this.room.send(EventNames.ENEMY_DEAD); // Send a type of "ENEMY_DEAD" message to the room handler.
  }

  /**
   * @access private
   * @description Listener for Player move event.
   * @function onMovePlayer
   * @param {any} position Position of the Player.
   * @returns {void}
   */
  private onMovePlayer(position: any): void {
    this.room.send(EventNames.MOVE, position); // Send a type of "MOVE" message to the room handler with a position of the Player.
  }

  /**
   * @access private
   * @description Listener for Player move down event.
   * @function onMovePlayerDown
   * @returns {void}
   */
  private onMovePlayerDown(): void {
    this.room.send(EventNames.MOVE_DOWN); // Send a type of "MOVE_DOWN" message to the room handler.
  }

  /**
   * @access private
   * @description Listener for Player move left event.
   * @function onMovePlayerLeft
   * @returns {void}
   */
  private onMovePlayerLeft(): void {
    this.room.send(EventNames.MOVE_LEFT); // Send a type of "MOVE_LEFT" message to the room handler.
  }

  /**
   * @access private
   * @description Listener for Player move right event.
   * @function onMovePlayerRight
   * @returns {void}
   */
  private onMovePlayerRight(): void {
    this.room.send(EventNames.MOVE_RIGHT); // Send a type of "MOVE_RIGHT" message to the room handler.
  }

  /**
   * @access private
   * @description Listener for Player move up event.
   * @function onMovePlayerUp
   * @returns {void}
   */
  private onMovePlayerUp(): void {
    this.room.send(EventNames.MOVE_UP); // Send a type of "MOVE_UP" message to the room handler.
  }

  /**
   * @access private
   * @description Listener for Player dead event after the Enemy hits the Player.
   * @function onPlayerDead
   * @returns {void}
   */
  private onPlayerDead(): void {
    this.room.send(EventNames.PLAYER_DEAD); // Send a type of "PLAYER_DEAD" message to the room handler.
  }

  /**
   * @access private
   * @description Listener for rotate Player event.
   * @function onRotatePlayer
   * @param {any} position Position of the Player.
   */
  private onRotatePlayer(position: any) {
    this.room.send(EventNames.ROTATE, position); // Send a type of "ROTATE" message to the room handler with a position of the Player.
  }

  /**
   * @function onPlayerLeft
   * @description this function will be executed on any plyer left the room
   * @access private
   */
  private onPlayerLeft(type: string, value: any) {
    this.isEnemyAdded = false;
    this.scene.events.emit(type);
    delete this.players[value.sessionId];
  }

  /**
   * @function newPlayerJoin
   * @description this function will be executed on move player event
   * @param {any} [type] -message type
   * @param {any} [value] -message value
   * @access private
   */
  private newPlayerJoin(type: string, value: any) {
    this.isEnemyAdded = true;
    value["player"]["id"] = value["client"]["sessionId"];
    this.scene.events.emit(type, value.player);
  }

  /**
   * @function correctPositionOfPlayer
   * @description will be responsible to sync player position with server
   * @param element player state object
   * @access private
   */
  private correctPositionOfPlayer(element) {
    let player = this.players[element.id];
    player.x = element.x;
    player.y = element.y;
    var j = 0;
    while (j < player.pendingInputs.length) {
      var input = player.pendingInputs[j];
      if (input.sequenceNumber <= element.lastProcessedInput) {
        // Already processed. Its effect is already taken into account into the world update
        // we just got, so we can drop it.
        player.pendingInputs.splice(j, 1);
      } else {
        // Not processed by the server yet. Re-apply it.
        player.correctPosition(input);
        j++;
      }
    }
  }

  /**
   * @function correctPositionEnemy
   * @description will be responsible to sync enemy position with server
   * @param element enemy state object
   * @access private
   */
  private correctPositionEnemy(element) {
    if (
      this.players[element.id].x == element.x &&
      this.players[element.id].y == element.y
    ) {
    } else {
      let timestamp = +new Date();
      let position = {
        x: element.x,
        y: element.y,
      };
      this.players[element.id].positionBuffer.push([timestamp, position]);
    }
  }
}
