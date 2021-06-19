import { Sprite } from "../Interfaces";
import { EventNames } from "../../../utils/GameConstants";


/**
 * @class Enemy
 * @description this class is pack of alll the behaviours of enemy
 * @extends `Phaser Arcade Sprite`
 */
export default class Enemy extends Phaser.Physics.Arcade.Sprite
{
    config: any
    speed: number
    positionBuffer: Array<any>
    /**
     * @constructor
     * @param scene [Phaser Scene] scene to which enemy should be added 
     * @param config position config
     */
    constructor(scene: Phaser.Scene, config: any)
    {
        super(scene, config.x, config.y, config.texture, config.frame);
        this.scene.add.existing(this);
        this.config = config;
        this.speed = 0.1;
        this.positionBuffer = [];
        this.setAngle(this.config.rotation);
        this.setDepth(2);
        this.addListeners();
    }

    /**
     * @function addListeners
     * @description this function includes all the listeners of this game object
     * @access private
     */
    private addListeners()
    {
        this.scene.events.on(EventNames.PLAYER_LEFT, this.onPlayerLeft, this);
        this.scene.events.on("enemymoved", this.onEnemyMoved, this);
        this.scene.events.on(EventNames.ENEMY_ROTATE, this.onEnemyRotated, this);

    }

    /**
     * @function onPlayerLeft
     * @description this function will be responsible for the functionality of destroying the enemy after exit
     * @access private
     */
    private onPlayerLeft()
    {
        this.destroy(true);
    }

    /**
    * @function onEnemyMoved
    * @description this function will be responsible for the functionality of enemy moving after server response properties
    * @access private
    * @param {any} [prop = null]
    */
    private onEnemyMoved(prop: any)
    {
        this.x += (prop.x - this.x) * 0.5;
        this.y += (prop.y - this.y) * 0.5;
    }

    /**
    * @function onEnemyMoved
    * @description this function will be responsible for the functionality of enemy moving after server response properties
    * @access private
    * @param {any} [prop = null]
    */
    private onEnemyRotated(prop: any)
    {
        this.rotation = prop.rotation;
    }

    /**
     * @access public
     * @function update
     * @override `Phaser #update`
     * @description the update function which executes at given fps
     * @param {number} time The time value from the most recent Game step. Typically a high-resolution timer value, or Date.now().
     * @param {number} deltaTime The delta value since the last frame. This is smoothed to avoid delta spikes by the TimeStep class.
     */
    public update(time, deltaTime)
    {
        var now = +new Date();
        var render_timestamp = now - (1000.0 / 64);
        // Find the two authoritative positions surrounding the rendering timestamp.
        var buffer = this.positionBuffer;
        // Drop older positions.
        while (buffer.length >= 2 && buffer[1][0] <= render_timestamp)
        {
            console.log('buffer **************:>> ', buffer);
            buffer.shift();
        }
        // console.log('this.positionBuffer :>> ', this.positionBuffer);
        if (buffer.length >= 2 && buffer[0][0] <= render_timestamp && render_timestamp <= buffer[1][0])
        {
            console.log('buffer[0][1] :>> ', buffer[0][1]);
            var x0 = buffer[0][1].x;
            var x1 = buffer[1][1].x;
            var y0 = buffer[0][1].y;
            var y1 = buffer[1][1].y;
            var t0 = buffer[0][0];
            var t1 = buffer[1][0];

            this.x = x0 + (x1 - x0) * (render_timestamp - t0) / (t1 - t0);
            this.y = y0 + (y1 - y0) * (render_timestamp - t0) / (t1 - t0);
        }
        // console.log('this.x, this.y :>> ', this.x, this.y);
        // this.x += Phaser.Math.Linear(this.x, this['targetX'] || this.x, 0.07);
        // this.y += Phaser.Math.Linear(this.y, this['targetY'] || this.x, 0.07);
        // this.x += Phaser.Math.GetSpeed(this['targetX'] - this.x, this.speed) * deltaTime;
        // this.y += Phaser.Math.GetSpeed(this['targetY'] - this.y, this.speed) * deltaTime;
    }
};
