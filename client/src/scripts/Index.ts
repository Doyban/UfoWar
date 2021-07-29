import "phaser";
import GamePlayScene from "./scenes/gameplay/GamePlayScene";

/**
 * @class Game
 * @description Creates the game canvas with respective options that are given.
 * @extends Phaser.Game
 */
class Game extends Phaser.Game {
  /**
   * @constructor
   * @description Create a new instance of this class.
   */
  constructor() {
    const game_config: Phaser.Types.Core.GameConfig = {
      type: Phaser.WEBGL, // Use Renderer WebGL.
      width: 1280,
      height: 840,
      parent: "content", // Use custom div element as parent.
      scene: [GamePlayScene], // The scene.
      // Add ScaleManager for responsiveness.
      scale: {
        mode: Phaser.Scale.ScaleModes.FIT,
      },
      // Add arcade physics.
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
  window.focus(); // Focus the game tab right after loading.
  new Game();
};
