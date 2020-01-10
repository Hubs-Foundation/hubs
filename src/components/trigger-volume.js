const sizeVec = new THREE.Vector3();
const boundingBoxWorldPositionVec = new THREE.Vector3();
const colliderWorldPositionVec = new THREE.Vector3();

AFRAME.registerComponent("trigger-volume", {
  schema: {
    colliders: { type: "selectorAll" },
    size: { type: "vec3", default: { x: 1, y: 1, z: 1 } },
    target: { type: "selector" },
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
    this.boundingBox = new THREE.Box3();
    this.collidingLastFrame = {};
  },
  update() {
    this.el.object3D.getWorldPosition(boundingBoxWorldPositionVec);
    sizeVec.copy(this.data.size);
    this.boundingBox.setFromCenterAndSize(boundingBoxWorldPositionVec, sizeVec);
  },
  tick() {
    if (!this.data.target) return;

    const colliders = this.data.colliders;

    for (let i = 0; i < colliders.length; i++) {
      const collider = colliders[i];
      const object3D = collider.object3D;

      object3D.getWorldPosition(colliderWorldPositionVec);
      const isColliding = this.boundingBox.containsPoint(colliderWorldPositionVec);
      const collidingLastFrame = this.collidingLastFrame[object3D.id];

      if (isColliding && !collidingLastFrame) {
        this.data.target.setAttribute(this.data.enterComponent, this.data.enterProperty, this.data.enterValue);
      } else if (!isColliding && collidingLastFrame) {
        this.data.target.setAttribute(this.data.leaveComponent, this.data.leaveProperty, this.data.leaveValue);
      }

      this.collidingLastFrame[object3D.id] = isColliding;
    }
  }
});
