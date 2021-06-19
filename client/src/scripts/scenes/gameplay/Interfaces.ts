/**
 * @interface Sprite
 * @description contains Phaser Sprite Position config properties
 */
export interface Sprite
{
    x: number
    y: number
    texture: string
    frame?: string | number
    rotation?: number
}