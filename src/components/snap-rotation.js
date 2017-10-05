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
    rightEventSrc: { type: "selector" }
  },

  init: function() {
    this.onButtonPressed = this.onButtonPressed.bind(this);
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

  onButtonPressed: function(e) {
    const {
      rotationAxis,
      rotationDegres,
      leftKey,
      leftEvent,
      rightKey,
      rightEvent
    } = this.data;
    const obj = this.el.object3D;

    if (e.type === leftEvent || (leftKey && e.key === leftKey)) {
      obj.rotateOnAxis(rotationAxis, rotationDegres * THREE.Math.DEG2RAD);
    } else if (e.type === rightEvent || (rightKey && e.key === rightKey)) {
      obj.rotateOnAxis(rotationAxis, -rotationDegres * THREE.Math.DEG2RAD);
    }

    // @TODO this is really ugly, can't just set the rotation directly or it wont network
    this.el.setAttribute("rotation", {
      x: obj.rotation.x * THREE.Math.RAD2DEG,
      y: obj.rotation.y * THREE.Math.RAD2DEG,
      z: obj.rotation.z * THREE.Math.RAD2DEG
    });
  }
});
