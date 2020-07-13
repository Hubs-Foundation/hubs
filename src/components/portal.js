// modified from trigger-volume.js

// const sizeVec = new THREE.Vector3();
const boundingSphereWorldPositionVec = new THREE.Vector3();
const colliderWorldPositionVec = new THREE.Vector3();

const roomMapping = window.ROOM_MAPPING || {
  "room2": "/J99QnJf/room-2",
  "room3": "/fcWA7EE/room-3",
}

AFRAME.registerComponent("portal", {
  schema: {
    colliders: { type: "selectorAll", default: "#avatar-pov-node" },
    padding: { type: "float", default: 0.01 },
    targetRoom: { type: "string", default: null },
    targetPos: { type: "vec3", default: null },
  },
  init() {
    this.boundingSphere = new THREE.Sphere();
    this.collidingLastFrame = {};
  },
  update() {
    // this.el.object3D.getWorldPosition(boundingBoxWorldPositionVec);
    // sizeVec.copy(this.data.size);
    // this.boundingBox.setFromCenterAndSize(boundingBoxWorldPositionVec, sizeVec);

    // this.boundingBox.setFromObject(this.el.object3D);
    // this.boundingBox.expandByScalar(this.data.padding);

    const mesh = this.el.getObject3D('mesh');
    mesh.getWorldPosition(boundingSphereWorldPositionVec);
    mesh.geometry.computeBoundingSphere();
    boundingSphereWorldPositionVec.add(mesh.geometry.boundingSphere.center);
    this.boundingSphere.set(boundingSphereWorldPositionVec, mesh.geometry.boundingSphere.radius + this.data.padding)

  },
  tick() {
    const colliders = this.data.colliders;

    for (let i = 0; i < colliders.length; i++) {
      const collider = colliders[i];
      const object3D = collider.object3D;

      object3D.getWorldPosition(colliderWorldPositionVec);
      const isColliding = this.boundingSphere.containsPoint(colliderWorldPositionVec);
      const collidingLastFrame = this.collidingLastFrame[object3D.id];

      if (isColliding && !collidingLastFrame) {
        // enter
        if (this.data.targetRoom) {
          const url = roomMapping[this.data.targetRoom];
          if (url) {
            location.href = url
          } else {
            console.error("invalid portal targetRoom:",this.data.targetRoom);
          }
          // console.log(url);
        } else if (this.data.targetPos) {
          // TODO: move to targetPos
        }
      } else if (!isColliding && collidingLastFrame) {
        // exit
      }

      this.collidingLastFrame[object3D.id] = isColliding;
    }
  }
});
