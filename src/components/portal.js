// modified from trigger-volume.js

const sizeVec = new THREE.Vector3();
const boundingBoxWorldPositionVec = new THREE.Vector3();
const colliderWorldPositionVec = new THREE.Vector3();

AFRAME.registerComponent("portal", {
  schema: {
    colliders: { type: "selectorAll", default: "#avatar-pov-node" },
    size: { type: "vec3", default: { x: 1, y: 1, z: 1 } },
    targetRoom: { type: "string", default: null },
    targetPos: { type: "vec3", default: null },
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
    // if (!this.data.target) return;

    const colliders = this.data.colliders;

    for (let i = 0; i < colliders.length; i++) {
      const collider = colliders[i];
      const object3D = collider.object3D;

      object3D.getWorldPosition(colliderWorldPositionVec);
      const isColliding = this.boundingBox.containsPoint(colliderWorldPositionVec);
      const collidingLastFrame = this.collidingLastFrame[object3D.id];

      if (isColliding && !collidingLastFrame) {
        console.log("enter!")
        if (this.data.target) {
          console.log(this.data.targetRoom);
          // map targetRoom to a URL using global mapping
          // location.href = url
        } else if (this.data.targetPos) {
          // TODO: move to targetPos
        }
      } else if (!isColliding && collidingLastFrame) {
        console.log("exit!")
      }

      this.collidingLastFrame[object3D.id] = isColliding;
    }
  }
});
