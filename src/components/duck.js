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
    this.initialScale = this.el.object3D.scale.x;
    this.maxScale = this.data.maxScale * this.initialScale;

    NAF.utils.getNetworkedEntity(this.el).then(networkedEntity => {
      this.networkedEntity = networkedEntity;

      this.initialScale = this.networkedEntity.object3D.scale.x;
      this.maxScale = this.data.maxScale * this.initialScale;
    });
  },

  tick: function() {
    if (!this.networkedEntity || NAF.utils.isMine(this.networkedEntity)) {
      const entity = this.networkedEntity || this.el;
      const currentScale = entity.object3D.scale.x;
      const ratio = Math.min(1, (currentScale - this.initialScale) / (this.maxScale - this.initialScale));
      const force = ratio * this.data.maxForce;
      if (force > 0) {
        const angle = Math.random() * Math.PI * 2;
        const x = Math.cos(angle);
        const z = Math.sin(angle);
        entity.setAttribute("body-helper", { gravity: { x, y: force, z } });
      }
    }
  }
});
