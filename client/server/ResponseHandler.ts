import * as Colyseus from "colyseus.js";
import { EventNames } from "../src/scripts/utils/GameConstants";
import { Scene } from "phaser";

/**
 * @class Server
 * @description Contains all the behaviours of server on client end.
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
   * @param {Scene} [scene] Phaser scene.
   */
  constructor(scene: Scene) {
    let url: string = "ws://18.224.7.66:2567"; // Comment to bottom one: with this setup it also works on localhost...
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
   * @param {any} [room] communication channel to implement game session, and/or serve as the communication channel between a group of clients.
   * @returns {void}
   */
  private onRoomJoin(room: Colyseus.Room): void {
    // Set room properties.
    this.clientId = room.sessionId;
    this.room = room;
    this.roomId = room.id;
    this.roomName = room.name;

    room.onStateChange(this.onStateChange.bind(this, room.state)); // Colyseus' callback that will be called if state has any change, it syncs moves.
    room.onMessage("*", this.onMessage.bind(this)); // Colyseus' callback that will be called on all room's messages from the server and based on message type update adequate action.
  }

  /**
   * @access private
   * @callback onStateChange
   * @description Listens to state changes on server side, it syncs moves.
   * @param {any} [state] state of the Player
   * @returns {void}
   */
  private onStateChange(state: any): void {
    for (const key in state) {
      if (state.hasOwnProperty(key)) {
        const value: any = state[key];
        switch (key) {
          case "players":
            this.playersState(value); // Update Player's state based on current state of the game on server end.
            break;
          default:
            break;
        }
      }
    }
  }

  /**
   * @access private
   * @description Update Player's state based on current state of the game on server end.
   * @function playersState
   * @param {any} [currentState] current state of the game on server end
   * @returns {void}
   */
  private playersState(currentState: any): void {
    for (const key in currentState) {
      if (currentState.hasOwnProperty(key)) {
        const element: any = currentState[key]; // Get single element from the state.

        // Get all required properties from the element.
        const elementProperties = {
          bullets: element.bullets,
          id: key,
          rotation: element.rotation,
          x: element.x,
          y: element.y,
        };

        // Check the element if that's a Player.
        if (key === this.clientId) {
          const playerProperties = elementProperties; // Assign element's properties to Player properties.

          // Check if player added already if not, add now.
          if (!this.isPlayerAdded) {
            this.scene.events.emit(EventNames.HERO_ADDED, playerProperties); // Emit "HERO_ADDED" event to the scene with Player properties.
            this.isPlayerAdded = true;
          } else {
            this.correctPositionOfPlayer(element); // Sync Player position with server.
          }
        }
        // The element that's not a Player, therefore that's an Enemy.
        else {
          const enemyProperties = elementProperties; // Assign element's properties to Enemy properties.
          // Check if enemy added already if not, add now.
          if (!this.isEnemyAdded) {
            // Emit "NEW_PLAYER_JOINED" event to the scene with Enemy properties.
            this.scene.events.emit(
              EventNames.NEW_PLAYER_JOINED,
              enemyProperties
            );

            this.isEnemyAdded = true;
          } else {
            this.correctPositionEnemy(element); // Sync enemy position with server.
          }
        }
      }
    }
  }

  /**
   * @access private
   * @function correctPositionOfPlayer
   * @description Sync player position with server.
   * @param {any} [element] Player state object
   * @returns {void}
   */
  private correctPositionOfPlayer(element: any): void {
    let player = this.players[element.id]; // Get adequate Player based on element's from the state ID.

    // Get Player's position.
    player.x = element.x;
    player.y = element.y;

    let j: number = 0;
    while (j < player.pendingInputs.length) {
      const input = player.pendingInputs[j];
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
   * @access private
   * @description Sync enemy position with server.
   * @function correctPositionEnemy
   * @param {any} [element] Enemy state object
   * @returns {void}
   */
  private correctPositionEnemy(element: any): void {
    if (
      this.players[element.id].x == element.x &&
      this.players[element.id].y == element.y
    ) {
    } else {
      let timestamp = +new Date(); // Set timestamp as positive integer.

      // Get Enemy's position.
      let position = {
        x: element.x,
        y: element.y,
      };
      this.players[element.id].positionBuffer.push([timestamp, position]);
    }
  }

  /**
   * @access private
   * @callback onMessage
   * @description Listens to all room's messages from the server and based on message type update adequate action.
   * @param {any} [message] message data
   * @param {any} [type] message type
   * @returns {void}
   */
  private onMessage(message: any, type: any): void {
    switch (type) {
      case EventNames.PLAYER_LEFT:
        this.onPlayerLeft(type, message); // Update gameplay after the player will leave the game.
        break;
      case EventNames.NEW_PLAYER_JOINED:
        this.newPlayerJoin(type, message); // Update gameplay after the player will join the game.
        break;
      case EventNames.BULLET:
        this.scene.events.emit(EventNames.ENEMY_BULLET, message); // Emit "ENEMY_BULLET" event to the scene with message data.
        break;
      case EventNames.ROTATE:
        this.scene.events.emit(EventNames.ENEMY_ROTATE, message); // Emit "ENEMY_ROTATE" event to the scene with message data.
        break;
      case EventNames.ASTROID_ADDED:
        this.scene.events.emit(EventNames.ASTROID_ADDED, message); // Emit "ASTROID_ADDED" event to the scene with message data.
        break;
      default:
        break;
    }
  }

  /**
   * @access private
   * @description Update gameplay after the player will leave the game.
   * @function onPlayerLeft
   * @param {string} [type] message type
   * @param {any} [value] message value
   * @returns {void}
   */
  private onPlayerLeft(type: string, value: any): void {
    this.isEnemyAdded = false; // Enemy is gone as well with the Player (Player can't play alone).
    this.scene.events.emit(type); // Emit event to the scene with message type.
    delete this.players[value.sessionId]; // Delete player from the game.
  }

  /**
   * @access private
   * @description Update gameplay after the player will join the game.
   * @function newPlayerJoin
   * @param {any} [string] message type
   * @param {any} [value] message value
   * @returns {void}
   */
  private newPlayerJoin(type: string, value: any): void {
    this.isEnemyAdded = true; // Enemy has joined.
    value["player"]["id"] = value["client"]["sessionId"]; // Assign Player to "client" and Player's ID to "sessionId".
    this.scene.events.emit(type, value.player); // Emit event to the scene with message type.
  }

  /**
   * @access private
   * @description Listener for firing Bullet event.
   * @function onFire
   * @param {any} [position] position of the Player.
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
   * @param {any} [position] position of the Player.
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
   * @param {any} [position] position of the Player
   */
  private onRotatePlayer(position: any) {
    this.room.send(EventNames.ROTATE, position); // Send a type of "ROTATE" message to the room handler with a position of the Player.
  }
}
