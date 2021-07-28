/**
 * @class Button
 * @description Creates the Button game object and adds it to the scene.
 * @extends Phaser.GameObjects.Sprite
 */
export default class Button extends Phaser.GameObjects.Sprite {
  public buttonText: Phaser.GameObjects.Text = <Phaser.GameObjects.Text>{};

  /**
   * @constructor
   * @description Create a new instance of this class.
   * @param {any} [config] position config
   * @param {any} [scene] Phaser scene to which Button will be added
   */
  constructor(config: any, scene: any) {
    super(scene, config.x, config.y, config.texture, config.frame);

    this.scene.add.existing(this); // Add game object to the current scene.

    // Set Button text with its styles.
    let text_style = {
      fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
      fontSize: "32px",
    };
    let text = config.text.content || "text";
    this.buttonText = new Phaser.GameObjects.Text(
      scene,
      0,
      0,
      text,
      text_style
    );

    this.scene.add.existing(this.buttonText); // Add Button text to the current scene.
    Phaser.Display.Align.In.Center(this.buttonText, this); // Align the Button text to the center of the Button.

    // Use the hand cursor for the Button.
    this.setInteractive({
      useHandCursor: true,
    });
  }

  /**
   * @access public
   * @description Hide Button along with the Button text.
   * @function hide
   * @returns {void}
   */
  public hide(): void {
    this.setVisible(false);
    this.buttonText.setVisible(false);
  }
}
