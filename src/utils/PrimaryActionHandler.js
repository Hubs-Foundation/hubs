export default class PrimaryActionHandler {
  constructor() {
    this.cursor = null;
    this.rightTeleporter = null;
    this.leftTeleporter = null;

    this.registerCursor = this.registerCursor.bind(this);
  }

  registerCursor(cursor) {
    this.cursor = cursor;
  }
}
