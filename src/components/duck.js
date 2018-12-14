/* global CANNON */
/**
 * Floats a duck based on its scale.
 * @component duck
 */
AFRAME.registerComponent("duck", {
  schema: {
    initialForce: { default: 0 },
    maxForce: { default: 6.5 },
    maxScale: { default: 5 }
  },

  init: function() {
    this.physicsSystem = this.el.sceneEl.systems.physics;
    this.hasBody = false;
    this.position = new CANNON.Vec3();
    this.force = new CANNON.Vec3(0, this.data.initialForce, 0);
    this.initialScale = this.el.object3D.scale.x;
    this.maxScale = this.data.maxScale * this.initialScale;
  },

  play: function() {
    this.physicsSystem.addComponent(this);
  },

  pause: function() {
    this.physicsSystem.removeComponent(this);
  },

  beforeStep: function() {
    if (this.el.body && NAF.utils.isMine(this.el)) {
      const currentScale = this.el.object3D.scale.x;
      const ratio = Math.min(1, (currentScale - this.initialScale) / (this.maxScale - this.initialScale));
      const force = ratio * this.data.maxForce;
      if (force > 0) {
        const angle = Math.random() * Math.PI * 2;
        const x = Math.cos(angle);
        const z = Math.sin(angle);
        this.force.set(x, force, z);
        this.position.set(x * 0.01, 0, z * 0.01);
        this.el.object3D.matrixNeedsUpdate = true;
        this.el.body.applyForce(this.force, this.position);
      }
    }
  }
});
