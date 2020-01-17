/* global Ammo */
//import { m4String, v3String } from "../utils/pretty-print";
const COLLISION_LAYERS = require("../constants").COLLISION_LAYERS;
import { setMatrixWorld } from "../utils/three-utils";
AFRAME.registerComponent("my-super-cool-button", {
  init() {
    this.active = false;
    this.el.object3D.addEventListener("interact", () => {
      this.active = !this.active;
    });
    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.networkedEl = networkedEl;
    });
  },
  tick() {
    if (!this.active || !this.networkedEl) return;
    const menu = this.networkedEl.querySelector(".freeze-menu").object3D;
    const initialScale = new THREE.Vector3().copy(menu.scale);
    menu.scale.set(1, 1, 1);
    menu.matrixNeedsUpdate = true;
    menu.updateMatrices();

    const menuRotation = new THREE.Matrix4().extractRotation(menu.matrixWorld);

    const menuRight = new THREE.Vector3(1, 0, 0).applyMatrix4(menuRotation).normalize();
    const menuUp = new THREE.Vector3(0, 1, 0).applyMatrix4(menuRotation).normalize();

    let minRight = 0;
    let maxRight = 0;
    let minUp = 0;
    let maxUp = 0;

    const menuPosition = new THREE.Vector3().setFromMatrixPosition(menu.matrixWorld);
    const v = new THREE.Vector3();
    const difference = new THREE.Vector3();
    const root = menu;
    function isVisible(node) {
      if (!node.visible) return false;
      if (node === root) return true;
      return isVisible(node.parent);
    }
    menu.traverse(node => {
      node.updateMatrices();
      if (!isVisible(node)) return;
      if (node.geometry) {
        if (node.geometry.isGeometry) {
          for (let i = 0; i < node.geometry.vertices; i++) {
            v.copy(node.geometry.vertices[i]);
            v.applyMatrix4(node.matrixWorld);
            if (isNaN(v.x)) continue;
            difference.subVectors(v, menuPosition);
            const dotUp = menuUp.dot(difference);
            const dotRight = menuRight.dot(difference);
            maxUp = Math.max(maxUp, dotUp);
            minUp = Math.min(minUp, dotUp);
            maxRight = Math.max(maxRight, dotRight);
            minRight = Math.min(minRight, dotRight);
          }
        } else if (node.geometry.isBufferGeometry && node.geometry.attributes.position) {
          for (let i = 0; i < node.geometry.attributes.position.count; i++) {
            v.fromBufferAttribute(node.geometry.attributes.position, i);
            v.applyMatrix4(node.matrixWorld);
            if (isNaN(v.x)) continue;
            difference.subVectors(v, menuPosition);
            const dotUp = menuUp.dot(difference);
            const dotRight = menuRight.dot(difference);
            maxUp = Math.max(maxUp, dotUp);
            minUp = Math.min(minUp, dotUp);
            maxRight = Math.max(maxRight, dotRight);
            minRight = Math.min(minRight, dotRight);
          }
        }
      }
    });

    const geometry = new THREE.BufferGeometry();
    const points = [];
    const point = new THREE.Vector3();
    const upness = new THREE.Vector3();
    const rightness = new THREE.Vector3();
    function getRectCorner(upFactor, rightFactor, outVec3) {
      return outVec3.addVectors(
        upness.copy(menuUp).multiplyScalar(upFactor),
        rightness.copy(menuRight).multiplyScalar(rightFactor)
      );
    }
    getRectCorner(minUp, minRight, point);
    points.push(point.x, point.y, point.z);
    getRectCorner(maxUp, minRight, point);
    points.push(point.x, point.y, point.z);
    getRectCorner(maxUp, maxRight, point);
    points.push(point.x, point.y, point.z);
    getRectCorner(minUp, maxRight, point);
    points.push(point.x, point.y, point.z);
    getRectCorner(minUp, minRight, point);
    points.push(point.x, point.y, point.z);
    geometry.addAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    const line = new THREE.Line(geometry);
    line.material.linewidth = 3;
    const parent = new THREE.Object3D();
    parent.add(line);
    parent.scale.copy(initialScale);
    parent.position.copy(menuPosition);
    parent.matrixNeedsUpdate = true;
    parent.updateMatrices();
    //this.el.sceneEl.object3D.add(parent);

    const btHalfExtents = new Ammo.btVector3((maxRight - minRight) / 2, (maxUp - minUp) / 2, 0.005);
    const btBoxShape = new Ammo.btBoxShape(btHalfExtents);
    const btLocalTransform = new Ammo.btTransform();
    const btQuaternion = new Ammo.btQuaternion();
    btLocalTransform.setIdentity();
    btLocalTransform.getOrigin().setValue(menuPosition.x, menuPosition.y, menuPosition.z);
    const q = new THREE.Quaternion().setFromRotationMatrix(menuRotation);
    btQuaternion.setValue(q.x, q.y, q.z, q.w);
    btLocalTransform.setRotation(btQuaternion);
    const btScale = new Ammo.btVector3(initialScale.x, initialScale.y, initialScale.z);
    btBoxShape.setLocalScaling(btScale);
    //btBoxShape.localTransform = btLocalTransform;

    const btTransformTo = new Ammo.btTransform();
    btTransformTo.setIdentity();
    this.networkedEl.object3D.updateMatrices();
    const objectPosition = new THREE.Vector3().setFromMatrixPosition(this.networkedEl.object3D.matrixWorld);
    btTransformTo.getOrigin().setValue(objectPosition.x, objectPosition.y, objectPosition.z);
    btTransformTo.setRotation(btQuaternion);

    const btCollisionWorld = this.el.sceneEl.systems["hubs-systems"].physicsSystem.world.physicsWorld;
    //  btCollisionWorld.updateSingleAabb(this.networkedEl.components["body-helper"].body.physicsBody);
    const btClosestConvexResultCallback = new Ammo.ClosestConvexResultCallback(
      btLocalTransform.getOrigin(),
      btTransformTo.getOrigin()
    );
    btClosestConvexResultCallback.set_m_collisionFilterGroup(COLLISION_LAYERS.HANDS); // HANDS seem to always allowed to interact with INTERACTABLES. How long until this comment is out of date?
    btClosestConvexResultCallback.set_m_collisionFilterMask(COLLISION_LAYERS.INTERACTABLES);
    btCollisionWorld.convexSweepTest(btBoxShape, btLocalTransform, btTransformTo, btClosestConvexResultCallback, 0.01);

    const boxMesh = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.05, 2, 2, 2));
    const from = new THREE.Vector3(
      btClosestConvexResultCallback.get_m_convexFromWorld().x(),
      btClosestConvexResultCallback.get_m_convexFromWorld().y(),
      btClosestConvexResultCallback.get_m_convexFromWorld().z()
    );
    const to = new THREE.Vector3(
      btClosestConvexResultCallback.get_m_convexToWorld().x(),
      btClosestConvexResultCallback.get_m_convexToWorld().y(),
      btClosestConvexResultCallback.get_m_convexToWorld().z()
    );
    const desiredMenuPosition = new THREE.Vector3().lerpVectors(
      from,
      to,
      btClosestConvexResultCallback.get_m_closestHitFraction() - 0.01 // Pull back from the hit point just a bit, because of the fudge factor in the convexSweepTest
    );
    const hitPointWorld = new THREE.Vector3(
      btClosestConvexResultCallback.get_m_hitPointWorld().x(),
      btClosestConvexResultCallback.get_m_hitPointWorld().y(),
      btClosestConvexResultCallback.get_m_hitPointWorld().z()
    );
    const debugLineGeo = new THREE.BufferGeometry();
    debugLineGeo.addAttribute(
      "position",
      new THREE.Float32BufferAttribute([from.x, from.y, from.z, to.x, to.y, to.z], 3)
    );
    const debugLine = new THREE.Line(debugLineGeo);
    boxMesh.position.copy(hitPointWorld);
    //this.el.sceneEl.object3D.add(boxMesh);
    //this.el.sceneEl.object3D.add(debugLine);

    Ammo.destroy(btScale);
    Ammo.destroy(btQuaternion);
    Ammo.destroy(btHalfExtents);

    menu.scale.copy(initialScale);
    menu.matrixNeedsUpdate = true;
    menu.updateMatrices();

    const menuTransform = new THREE.Matrix4().copy(menu.matrixWorld);
    const menuWorldScale = new THREE.Vector3();
    const menuWorldPosition = new THREE.Vector3();
    const menuWorldQuaternion = new THREE.Quaternion();
    menuTransform.decompose(menuWorldPosition, menuWorldQuaternion, menuWorldScale);
    menuTransform.compose(
      desiredMenuPosition,
      menuWorldQuaternion,
      menuWorldScale
    );
    setMatrixWorld(menu, menuTransform);
  }
});
