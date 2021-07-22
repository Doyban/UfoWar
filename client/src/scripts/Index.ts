import "phaser";
import GamePlayScene from "./scenes/gameplay/GamePlayScene";

/**
 * @class Game
 * @description Create the game canvas with respective options that are given
 */
class Game extends Phaser.Game {
  constructor() {
    const game_config: Phaser.Types.Core.GameConfig = {
      type: Phaser.WEBGL, // Use Renderer WebGL.
      width: 1280,
      height: 840,
      parent: "content", // Use custom div element as parent.
      scene: [GamePlayScene], // the scenes.
      // Add ScaleManager for responsiveness.
      scale: {
        mode: Phaser.Scale.ScaleModes.FIT,
      },
      // Add matter physics.
      physics: {
        default: "arcade",
      },
      backgroundColor: "#000000", // Add default background color to the game.
    };
    super(game_config);
  }
}

// Create the game object once window loaded.
window.onload = () => {
  window.focus(); // focus the game tab right after loading
  new Game();
};
