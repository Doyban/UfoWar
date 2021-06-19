import * as Colyseus from "colyseus.js";
import { Scene } from "phaser";
import { EventNames } from "../src/scripts/utils/GameConstants";
/**
 * @class Server
 * @description this class is pack of alll the behaviours of Server on client end
 * @override `Colyseus #Client`
 */
export default class Server extends Colyseus.Client {
  clientId: string;
  scene: Scene;
  roomName: string;
  roomId: string;
  isPlayerAdded: boolean;
  isEnemyAdded: boolean;
  room: Colyseus.Room;
  players: any;
  /**
   * @constructor
   * @param ctx [Scene] Phaser scene
   */
  constructor(ctx: Scene) {
    let url = "ws://18.224.7.66:2567";
    // url = "ws://localhost:2567"; // uncomment this line to make it work locally
    super(url);
    this.scene = ctx;
    this.clientId = "";
    this.roomName = "";
    this.roomId = "";
    this.isPlayerAdded = false;
    this.isEnemyAdded = false;
    // this.connect();
    this.addListeners();
    this.players = {};
  }

  /**
   * @function addListeners
   * @description this function includes all the listeners of this game object
   * @access private
   */
  private addListeners() {
    this.scene.events.on(EventNames.MOVE, this.onMovePlayer, this);
    this.scene.events.on(EventNames.ROTATE, this.onRotatePlayer, this);
    this.scene.events.on(EventNames.MOVE_DOWN, this.onMovePlayerDown, this);
    this.scene.events.on(EventNames.MOVE_UP, this.onMovePlayerUp, this);
    this.scene.events.on(EventNames.MOVE_RIGHT, this.onMovePlayerRight, this);
    this.scene.events.on(EventNames.MOVE_LEFT, this.onMovePlayerLeft, this);
    this.scene.events.on(EventNames.BULLET, this.onFire, this);
    this.scene.events.on(EventNames.PLAYER_DEAD, this.onPlayerDead, this);
    this.scene.events.on(EventNames.ENEMY_DEAD, this.onEnemyDead, this);
  }

  /**
   * @function connect
   * @description this function is responsible for establishing the connection between client and server
   * @access public
   */
  public connect() {
    let options = {
      gameWidth: this.scene.game.config.width,
      gameHeight: this.scene.game.config.height,
    };
    // will join room if exists else will create and join (Colyseus#joinOrCreate)
    this.joinOrCreate("my_room", options).then(this.onRoomJoin.bind(this));
  }

  /**
   * @function onRoomJoin
   * @description this function is executed once the client has joined the room successfully
   * @param {any} [room]
   * @access private
   */
  private onRoomJoin(room: Colyseus.Room) {
    // console.log('room :>> ', room);
    this.room = room;
    this.clientId = room.sessionId;
    this.roomId = room.id;
    this.roomName = room.name;
    room.onStateChange(this.onStateChange.bind(this, room.state)); // in built colyseus callback that will be called if stage has any change
    room.onStateChange.once(this.onStateChangeOnce.bind(this, room.state));
    room.onMessage("*", this.onMessage.bind(this)); // listening to all the room messages
  }

  /**
   * @function onStateChange
   * @description this function will be executed everytime that state changes on server side
   * @param {any} [state]
   * @access private
   */
  private onStateChange(state: any) {
    // console.log('state change', state);
    for (const key in state) {
      if (state.hasOwnProperty(key)) {
        const value = state[key];
        // console.log('stateField.value :>> ', key, value);
        switch (key) {
          case "players":
            this.playersState(value);
            break;

          default:
            break;
        }
      }
    }
  }

  /**
   * @function onStateChangeOnce
   * @description this function will be executed once and first time that state change happens
   * @param {any} [state]
   * @access private
   */
  private onStateChangeOnce(state: any) {
    // console.log('onstateChange :>>>>>>>>>>>>>>>>>>> ');
    for (const key in state) {
      if (state.hasOwnProperty(key)) {
        const value = state[key];
        // console.log('stateField.value :>> ', key, value);
        switch (key) {
          case "players":
            this.playersState(value);
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
   * @function onMovePlayer
   * @description this function will be executed on move player event
   * @param {any} [pos] -positions of player
   * @access private
   */
  private onMovePlayer(pos: any) {
    this.room.send(EventNames.MOVE, pos);
  }

  /**
   * @function onRotatePlayer
   * @description this function will be executed on rotate player event
   * @param {any} [pos] -rotations of player
   * @access private
   */
  private onRotatePlayer(pos: any) {
    this.room.send(EventNames.ROTATE, pos);
  }

  /**
   * @function onFire
   * @description this function will be executed on player fire event
   * @param {any} [pos] -positions of player
   * @access private
   */
  private onFire(pos: any) {
    this.room.send(EventNames.BULLET, pos);
  }

  /**
   * @function onPlayerDead
   * @description this function will be executed on player got hit
   * @access private
   */
  private onPlayerDead() {
    this.room.send(EventNames.PLAYER_DEAD);
  }

  /**
   * @function onEnemyDead
   * @description this function will be executed on player fired enemy
   * @access private
   */
  private onEnemyDead() {
    this.room.send(EventNames.ENEMY_DEAD);
  }

  /**
   * @function onMovePlayerDown
   * @description this function will be executed on move player down player event
   * @access private
   */
  private onMovePlayerDown() {
    this.room.send(EventNames.MOVE_DOWN);
  }

  /**
   * @function onMovePlayerUp
   * @description this function will be executed on move player up event
   * @access private
   */
  private onMovePlayerUp() {
    this.room.send(EventNames.MOVE_UP);
  }

  /**
   * @function onMovePlayerLeft
   * @description this function will be executed on move player left event
   * @access private
   */
  private onMovePlayerLeft() {
    this.room.send(EventNames.MOVE_LEFT);
  }

  /**
   * @function onMovePlayerRight
   * @description this function will be executed on move player right event
   * @access private
   */
  private onMovePlayerRight() {
    this.room.send(EventNames.MOVE_RIGHT);
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
    // console.log('element :>> ', element);
    if (
      this.players[element.id].x == element.x &&
      this.players[element.id].y == element.y
    ) {
    } else {
      let timestamp = +new Date();
      let pos = {
        x: element.x,
        y: element.y,
      };
      this.players[element.id].positionBuffer.push([timestamp, pos]);
      // this.players[element.id].targetX = element.x;
      // this.players[element.id].targetY = element.y;
      // this.players[element.id].onEnemyMoved();
    }
  }
}
