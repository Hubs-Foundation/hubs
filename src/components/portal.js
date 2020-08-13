// modified from trigger-volume.js

import getRoomMetadata from "../room-metadata";

// const sizeVec = new THREE.Vector3();
const boundingSphereWorldPositionVec = new THREE.Vector3();
const colliderWorldPositionVec = new THREE.Vector3();

AFRAME.registerComponent("portal", {
  schema: {
    colliders: { type: "selectorAll", default: "#avatar-pov-node" },
    padding: { type: "float", default: 0.01 },
    targetRoom: { type: "string", default: null },
    targetUrl: { type: "string", default: null },
    targetPos: { type: "vec3", default: null },
    targetObj: { type: "string", default: null },
  },
  init() {
    this.boundingSphere = new THREE.Sphere();
    this.collidingLastFrame = {};

    this.characterController = this.el.sceneEl.systems["hubs-systems"].characterController;
  },
  update() {
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
        var targetUrl;
        if (this.data.targetRoom) {
          targetUrl = getRoomMetadata(this.data.targetRoom).url
          if (!targetUrl) {
            console.error("invalid portal targetRoom:", this.data.targetRoom);
          }
        } else if (this.data.targetUrl) {
          targetUrl = this.data.targetUrl;
        }
        if (targetUrl) {
          location.href = targetUrl;
        } else {
          var targetPos;
          if (this.data.targetObj) {
            const el = document.querySelector("."+this.data.targetObj);
            if (!el || !el.object3D) {
              console.error("invalid targetObj", this.data.targetObj);
            } else {
              targetPos = el.object3D.position; // TODO should probably use getWorldPosition
            }
          } else if (this.data.targetPos) {
            targetPos = this.data.targetPos
          }
          if (targetPos) {
            // move player to targetPos
            this.characterController.teleportTo(targetPos)
          }
        }
      } else if (!isColliding && collidingLastFrame) {
        // exit
      }

      this.collidingLastFrame[object3D.id] = isColliding;
    }
  }
});
