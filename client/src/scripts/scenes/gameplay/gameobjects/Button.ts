/**
 * @class Button
 * @description this class is an abstraction of phaser gameobject sprite, it will have all the required functionality to make a sprite as button
 */
export default class Button extends Phaser.GameObjects.Sprite {
  buttonText: Phaser.GameObjects.Text;
  /**
   * @constructor
   * @param scene [Phaser Scene] this scene to which the gameobject will be added
   * @param config position config
   */
  constructor(scene: any, config: any) {
    super(scene, config.x, config.y, config.texture, config.frame);
    this.scene.add.existing(this);
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
    this.scene.add.existing(this.buttonText);
    Phaser.Display.Align.In.Center(this.buttonText, this);
    this.setInteractive({
      useHandCursor: true,
    });
    this.addListeners();
  }

  /**
   * @function addListeners
   * @description this function includes all the listeners of this game object
   * @access private
   */
  private addListeners() {
    // this.on('pointerup', this.onPointerUp);
  }

  /**
   * @access public
   * @function show
   * @description this function is responsible for showing this button, along with the child text object if it has one
   */
  public show() {
    this.setVisible(true);
    this.buttonText.setVisible(true);
  }

  /**
   * @access public
   * @function hide
   * @description this function is responsible for hiding this button, along with the child text object if it has one
   */
  public hide() {
    this.setVisible(false);
    this.buttonText.setVisible(false);
  }
}
