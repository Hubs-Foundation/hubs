AFRAME.registerComponent("trigger-volume", {
  schema: {
    colliders: { type: "selectorAll", default: "#player-rig" },
    scope: { type: "selector", default: "#environment-root" },
    size: { type: "vec3", default: { x: 1, y: 1, z: 1 } },
    target: { type: "string" },
    enterComponent: { type: "string" },
    enterProperty: { type: "string" },
    enterValue: {
      default: "",
      parse: v => (typeof v === "object" ? v : JSON.parse(v)),
      stringify: JSON.stringify
    },
    leaveComponent: { type: "string" },
    leaveProperty: { type: "string" },
    leaveValue: {
      default: "",
      parse: v => (typeof v === "object" ? v : JSON.parse(v)),
      stringify: JSON.stringify
    }
  },
  init() {
    this.size = new THREE.Vector3();
    this.boundingBoxWorldPosition = new THREE.Vector3();
    this.boundingBox = new THREE.Box3();
    this.colliderWorldPosition = new THREE.Vector3();
    this.collidingLastFrame = {};
  },
  update() {
    this.el.object3D.getWorldPosition(this.boundingBoxWorldPosition);
    this.size.copy(this.data.size);
    this.boundingBox.setFromCenterAndSize(this.boundingBoxWorldPosition, this.size);
  },
  tick() {
    const colliders = this.data.colliders;

    this.el.object3D.getWorldPosition(this.boundingBoxWorldPosition);

    for (let i = 0; i < colliders.length; i++) {
      const collider = colliders[i];
      const object3D = collider.object3D;

      object3D.getWorldPosition(this.colliderWorldPosition);
      const isColliding = this.boundingBox.containsPoint(this.colliderWorldPosition);
      const collidingLastFrame = this.collidingLastFrame[object3D.id];

      if (isColliding && !collidingLastFrame) {
        const target = this.data.scope.object3D.getObjectByName(this.data.target);
        if (!target || !target.el) {
          console.warn(`trigger-volume: Couldn't find node: "${this.data.target}"`);
        }
        target.el.setAttribute(this.data.enterComponent, this.data.enterProperty, this.data.enterValue);
      } else if (!isColliding && collidingLastFrame) {
        const target = this.data.scope.object3D.getObjectByName(this.data.target);
        if (!target || !target.el) {
          console.warn(`trigger-volume: Couldn't find node: "${this.data.target}"`);
        }
        target.el.setAttribute(this.data.leaveComponent, this.data.leaveProperty, this.data.leaveValue);
      }

      this.collidingLastFrame[object3D.id] = isColliding;
    }
  }
});
