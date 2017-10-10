/**
 * @fileOverview
 * Rotate an entity in fixed increments based on events or keyboard input
 * @name snap-rotation.js
 * @TODO pull keyboard input out into a component that just emits events
 * @TODO allow specifying multiple events and sources
 */

AFRAME.registerComponent("snap-rotation", {
  schema: {
    rotationAxis: { type: "vec3", default: { x: 0, y: 1, z: 0 } },
    rotationDegres: { default: 45 },

    leftKey: { default: "q" },
    leftEvent: { default: "dpadleftdown" },
    leftEventSrc: { type: "selector" },

    rightKey: { default: "e" },
    rightEvent: { default: "dpadrightdown" },
    rightEventSrc: { type: "selector" },
    
    pivotSrc: { type: "selector" }
  },

  init: function() {
    this.onButtonPressed = this.onButtonPressed.bind(this);
  },

  update: function() {
    const {rotationAxis, rotationDegres} = this.data;

    const angle = rotationDegres * THREE.Math.DEG2RAD;
    this.lRotMat = new THREE.Matrix4().makeRotationAxis(rotationAxis, angle);
    this.rRotMat = new THREE.Matrix4().makeRotationAxis(rotationAxis, -angle);
  },

  play: function() {
    const { leftEventSrc, leftEvent, rightEventSrc, rightEvent } = this.data;
    window.addEventListener("keypress", this.onButtonPressed);
    rightEventSrc &&
      rightEventSrc.addEventListener(rightEvent, this.onButtonPressed);
    leftEventSrc &&
      leftEventSrc.addEventListener(leftEvent, this.onButtonPressed);
  },

  pause: function() {
    const { leftEventSrc, leftEvent, rightEventSrc, rightEvent } = this.data;
    window.removeEventListener("keypress", this.onButtonPRessed);
    rightEventSrc &&
      rightEventSrc.removeEventListener(rightEvent, this.onButtonPressed);
    leftEventSrc &&
      leftEventSrc.removeEventListener(leftEvent, this.onButtonPressed);
  },

  onButtonPressed: (function() {
    const trans = new THREE.Matrix4();
    const transInv = new THREE.Matrix4();
    const pivotPos = new THREE.Vector3();

    return function(e) {
      const {
        rotationAxis,
        rotationDegres,
        leftKey,
        leftEvent,
        rightKey,
        rightEvent,
        pivotSrc
      } = this.data;

      var rot;
      if (e.type === leftEvent || (leftKey && e.key === leftKey)) {
        rot = this.lRotMat;
      } else if (e.type === rightEvent || (rightKey && e.key === rightKey)) {
        rot = this.rRotMat;
      } else {
        return;
      }

      const obj = this.el.object3D;
      const pivot = pivotSrc.object3D;

      pivotPos.copy(pivot.position);
      pivotPos.applyMatrix4(obj.matrix);
      trans.setPosition(pivotPos);
      transInv.makeTranslation(-pivotPos.x, -pivotPos.y, -pivotPos.z);
      obj.applyMatrix(transInv);
      obj.applyMatrix(rot);
      obj.applyMatrix(trans);

      // @TODO this is really ugly, can't just set the position/rotation directly or they wont network
      this.el.setAttribute("rotation", {
        x: obj.rotation.x * THREE.Math.RAD2DEG,
        y: obj.rotation.y * THREE.Math.RAD2DEG,
        z: obj.rotation.z * THREE.Math.RAD2DEG
      });
      this.el.setAttribute("position", obj.position);
    };
  })()
});
