import { setMatrixWorld } from "../utils/three-utils";
import { TRANSFORM_MODE } from "./transform-object-button";

const calculatePlaneMatrix = (function() {
  const planeMatrix = new THREE.Matrix4();
  const planeUp = new THREE.Vector3();
  const planeForward = new THREE.Vector3();
  const planeRight = new THREE.Vector3();
  const planePosition = new THREE.Vector3();
  const camPosition = new THREE.Vector3();

  return function calculatePlaneMatrix(camera, button) {
    camera.updateMatrices();
    camPosition.setFromMatrixPosition(camera.matrixWorld);
    button.updateMatrices();
    planePosition.setFromMatrixPosition(button.matrixWorld);
    planeForward.subVectors(planePosition, camPosition);
    planeForward.y = 0;
    planeForward.normalize();
    planeUp.set(0, 1, 0);
    planeRight.crossVectors(planeForward, planeUp);
    planeMatrix.makeBasis(planeRight, planeUp, planeForward.multiplyScalar(-1));
    planeMatrix.elements[12] = planePosition.x;
    planeMatrix.elements[13] = planePosition.y;
    planeMatrix.elements[14] = planePosition.z;
    return planeMatrix;
  };
})();

const planeForLeftCursor = new THREE.Mesh(
  new THREE.PlaneBufferGeometry(100000, 100000, 2, 2),
  new THREE.MeshBasicMaterial({
    visible: true,
    wireframe: false,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.3
  })
);
const planeForRightCursor = new THREE.Mesh(
  new THREE.PlaneBufferGeometry(100000, 100000, 2, 2),
  new THREE.MeshBasicMaterial({
    visible: true,
    wireframe: false,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.3
  })
);

AFRAME.registerComponent("scale-button", {
  init() {
    this.isScaling = false;
    this.planeRotation = new THREE.Matrix4();
    this.planeUp = new THREE.Vector3();
    this.planeRight = new THREE.Vector3();
    this.intersections = [];
    this.initialIntersectionPoint = new THREE.Vector3();
    this.intersectionPoint = new THREE.Vector3();
    this.initialObjectScale = new THREE.Vector3();
    this.desiredObjectScale = new THREE.Vector3();
    this.deltaScale = new THREE.Vector3();
    this.objectMatrix = new THREE.Matrix4();
    this.dragVector = new THREE.Vector3();
    this.currentObjectScale = new THREE.Vector3();
    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.networkedEl = networkedEl;
      this.objectToScale = networkedEl.object3D;
    });
    const camPosition = new THREE.Vector3();
    const objectPosition = new THREE.Vector3();
    const objectToCam = new THREE.Vector3();
    this.startScaling = e => {
      if (this.isScaling || !this.objectToScale) {
        return;
      }

      if (!(NAF.utils.isMine(this.networkedEl) || NAF.utils.takeOwnership(this.networkedEl))) {
        return;
      }

      if (!this.didGetObjectReferences) {
        this.didGetObjectReferences = true;
        this.leftEventer = document.getElementById("left-cursor").object3D;
        this.leftCursorController = document.getElementById("left-cursor-controller");
        this.leftRaycaster = this.leftCursorController.components["cursor-controller"].raycaster;
        this.rightCursorController = document.getElementById("right-cursor-controller");
        this.rightRaycaster = this.rightCursorController.components["cursor-controller"].raycaster;
        this.viewingCamera = document.getElementById("viewing-camera").object3DMap.camera;
      }
      this.plane = e.object3D === this.leftEventer ? planeForLeftCursor : planeForRightCursor;
      setMatrixWorld(this.plane, calculatePlaneMatrix(this.viewingCamera, this.el.object3D));
      this.planeRotation.extractRotation(this.plane.matrixWorld);
      this.planeUp.set(0, 1, 0).applyMatrix4(this.planeRotation);
      this.planeRight.set(1, 0, 0).applyMatrix4(this.planeRotation);
      this.raycaster = e.object3D === this.leftEventer ? this.leftRaycaster : this.rightRaycaster;
      const intersection = this.raycastOnPlane();
      if (!intersection) return;
      this.isScaling = true;
      this.initialIntersectionPoint.copy(intersection.point);
      this.objectToScale.updateMatrices();
      this.initialObjectScale.setFromMatrixScale(this.objectToScale.matrixWorld);
      this.initialDistanceToObject = objectToCam
        .subVectors(
          camPosition.setFromMatrixPosition(this.viewingCamera.matrixWorld),
          objectPosition.setFromMatrixPosition(this.el.object3D.matrixWorld)
        )
        .length();
      window.APP.store.update({ activity: { hasScaled: true } });

      // TODO: Refactor transform-selected-object system so this isn't so awkward
      this.transformSelectedObjectSystem =
        this.transformSelectedObjectSystem || this.el.sceneEl.systems["transform-selected-object"];
      this.transformSelectedObjectSystem.transforming = true;
      this.transformSelectedObjectSystem.mode = TRANSFORM_MODE.SCALE;
      this.transformSelectedObjectSystem.target = this.objectToScale;
      this.transformSelectedObjectSystem.hand =
        e.object3D === this.leftEventer ? this.leftCursorController.object3D : this.rightCursorController.object3D;
    };
    this.endScaling = e => {
      if (!this.isScaling) {
        return;
      }
      if (
        (e.object3D === this.leftEventer && this.raycaster === this.leftRaycaster) ||
        (e.object3D !== this.leftEventer && this.raycaster === this.rightRaycaster)
      ) {
        this.isScaling = false;
        this.transformSelectedObjectSystem =
          this.transformSelectedObjectSystem || this.el.sceneEl.systems["transform-selected-object"];
        this.transformSelectedObjectSystem.transforming = false;
      }
    };
    this.el.object3D.addEventListener("holdable-button-down", this.startScaling);
    this.el.object3D.addEventListener("holdable-button-up", this.endScaling);
  },
  raycastOnPlane() {
    this.intersections.length = 0;
    const far = this.raycaster.far;
    this.raycaster.far = 1000;
    this.plane.raycast(this.raycaster, this.intersections);
    this.raycaster.far = far;
    return this.intersections[0];
  },
  tick() {
    if (!this.isScaling) return;
    const intersection = this.raycastOnPlane();
    if (!intersection) return;
    this.intersectionPoint.copy(intersection.point);
    this.dragVector.subVectors(this.intersectionPoint, this.initialIntersectionPoint);
    const dotFactor =
      (this.dragVector.dot(this.planeUp) + this.dragVector.dot(this.planeRight)) / this.initialDistanceToObject;

    let scaleFactor = 1;
    if (dotFactor > 0) {
      scaleFactor = 1 + dotFactor;
    } else if (dotFactor < 0) {
      scaleFactor = 1 / (1 + Math.abs(dotFactor));
    }
    this.desiredObjectScale.copy(this.initialObjectScale).multiplyScalar(scaleFactor);
    this.objectToScale.updateMatrices();
    this.currentObjectScale.setFromMatrixScale(this.objectToScale.matrixWorld);
    this.deltaScale.set(
      this.desiredObjectScale.x / this.currentObjectScale.x,
      this.desiredObjectScale.y / this.currentObjectScale.y,
      this.desiredObjectScale.z / this.currentObjectScale.z
    );
    this.objectMatrix.copy(this.objectToScale.matrixWorld);
    this.objectMatrix.scale(this.deltaScale);
    setMatrixWorld(this.objectToScale, this.objectMatrix);
  }
});
