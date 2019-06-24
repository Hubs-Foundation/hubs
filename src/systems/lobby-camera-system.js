/* global AFRAME, NAF, THREE */
import cameraModelSrc from "../assets/camera_tool.glb";
AFRAME.registerComponent("lobby-camera-transform-component", {
  init() {
    this.el.sceneEl.systems["post-physics"].lobbyCameraSystem.lobbyCameraTransform = this.el;
    this.el.addEventListener("model-loaded", ()=>{
      this.el.object3DMap.mesh.scale.set(2.0, 2.0, 2.0);
      this.el.object3DMap.mesh.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI);
      this.el.object3DMap.mesh.matrixNeedsUpdate =true;
      this.el.object3DMap.mesh.updateMatrices();
    }, {once: true})
    this.el.setAttribute("gltf-model-plus", {src: cameraModelSrc});
  }
});

export function takeOrReleaseLobbyCam() {
  const scene = AFRAME.scenes[0];
  const sys = scene.systems["post-physics"].lobbyCameraSystem;
  if (!sys.lobbyCameraTransform) {
    sys.lobbyCameraTransform = document.createElement("a-entity");
    sys.lobbyCameraTransform.id = "lobby-camera-transform-entity";
    sys.lobbyCameraTransform.setAttribute("networked", "template: #lobby-camera");
    scene.appendChild(sys.lobbyCameraTransform);
  } else if (!NAF.utils.isMine(sys.lobbyCameraTransform)) {
    NAF.utils.takeOwnership(sys.lobbyCameraTransform);
  } else {
    sys.lobbyCameraTransform.parentNode.removeChild(sys.lobbyCameraTransform);
    sys.lobbyCameraTransform = null;
  }
}

const setMatrixWorld = (function() {
  const inv = new THREE.Matrix4();
  return function setMatrixWorld(object3D, m) {
    object3D.matrixWorld.copy(m);
    object3D.matrix = inv.getInverse(object3D.parent.matrixWorld).multiply(object3D.matrixWorld);
    object3D.matrix.decompose(object3D.position, object3D.quaternion, object3D.scale);
  };
})();

export class LobbyCameraSystem {
  constructor() {
    this.inLobby = true;
  }
  tick() {
    if (!this.lobbyCameraTransform || !this.lobbyCameraTransform.parentNode) {
      return;
    }
    this.playerCamera = this.playerCamera || document.querySelector("#player-camera");
    if (NAF.utils.isMine(this.lobbyCameraTransform)) {
      setMatrixWorld(this.lobbyCameraTransform.object3D, this.playerCamera.object3D.matrixWorld);
      if (this.lobbyCameraTransform.object3DMap.mesh) {
        this.lobbyCameraTransform.object3DMap.mesh.visible = false;
      }
    } else if (this.inLobby) {
      this.lobbyCameraTransform.object3D.matrixNeedsUpdate = true;
      this.lobbyCameraTransform.object3D.updateMatrices();
      setMatrixWorld(this.playerCamera.object3D, this.lobbyCameraTransform.object3D.matrixWorld);
      // translate the camera such that we don't see the avatar's eyes
      this.playerCamera.object3D.translateZ(-0.1);
      this.playerCamera.object3D.matrixNeedsUpdate = true;
      if (this.lobbyCameraTransform.object3DMap.mesh) {
        this.lobbyCameraTransform.object3DMap.mesh.visible = true;
      }
      // Third person:
      // this.playerCamera.object3D.translateZ(1.5);
      // this.playerCamera.object3D.translateY(0.2);
      // this.playerCamera.object3D.matrixNeedsUpdate = true;
    }
  }
}
