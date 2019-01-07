import { paths } from "../systems/userinput/paths";

AFRAME.registerComponent("rotate-object-on-axis-button", {
  schema: {
    axis: { type: "vec3" }
  },

  init() {
    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.targetEl = networkedEl;
    });

    this.onGrabStart = e => {
      if (!this.targetEl) {
        return;
      }
      this.hand = e.detail.hand;
      this.hand.emit("haptic_pulse", { intensity: "high" });
      if (!NAF.utils.isMine(this.targetEl)) {
        if (!NAF.utils.takeOwnership(this.targetEl)) {
          return;
        }
      }
      if (this.targetEl.components.body) {
        this.targetEl.setAttribute("body", { type: "static" });
      }
      AFRAME.scenes[0].systems["rotate-selected-object"].startRotating(this.targetEl.object3D, this.data.axis);
    };
    this.onGrabEnd = () => {
      console.log("release!");
      AFRAME.scenes[0].systems["rotate-selected-object"].stopRotating();
    };
  },

  play() {
    this.el.addEventListener("grab-start", this.onGrabStart);
    this.el.addEventListener("grab-end", this.onGrabEnd);
  },

  pause() {
    this.el.removeEventListener("grab-start", this.onGrabStart);
    this.el.removeEventListener("grab-end", this.onGrabEnd);
  }
});

AFRAME.registerSystem("rotate-selected-object", {
  init() {
    this.target = null;
    this.axis = new THREE.Vector3();
    this.angle = 0;

    this.initialIntersection = null;
    this.initialOrientation = new THREE.Quaternion();
    this.deltaQuaternion = new THREE.Quaternion();
    this.newOrientation = new THREE.Quaternion();

    this.intersections = [];

    this.plane = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(100000, 100000, 2, 2),
      new THREE.MeshBasicMaterial({
        visible: true,
        wireframe: true,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3
      })
    );
    this.v = new THREE.Vector3();
    this.q = new THREE.Quaternion();
    this.eye = new THREE.Vector3();
    this.obj = new THREE.Vector3();
    this.eyeToObject = new THREE.Vector3();
    this.planeNormal = new THREE.Vector3();
    this.planarDifference = new THREE.Vector3();

    this.el.object3D.add(this.plane);
  },

  startRotating(target, axis) {
    this.target = target;
    this.axis = axis;
    this.angle = 0;

    this.camera = this.camera || document.querySelector("#player-camera").object3D;
    this.camera.matrixWorld.decompose(this.v, this.plane.quaternion, this.v);
    this.target.matrixWorld.decompose(this.plane.position, this.q, this.v);
    this.plane.matrixNeedsUpdate = true;
    this.plane.updateMatrixWorld(true);

    this.raycaster =
      this.raycaster || document.querySelector("#cursor-controller").components["cursor-controller"].raycaster;
    this.intersections.length = 0;
    const far = this.raycaster.far;
    this.raycaster.far = 1000;
    this.plane.raycast(this.raycaster, this.intersections);
    this.raycaster.far = far;
    this.initialIntersection = this.intersections[0]; // point
    this.initialOrientation.copy(this.target.quaternion);

    this.rotationInProgress = true;
  },

  stopRotating() {
    this.rotationInProgress = false;
  },

  tick() {
    if (!this.rotationInProgress) {
      return;
    }
    if (this.el.systems.userinput.get(paths.actions.cursor.drop)) {
      this.stopRotating();
    }

    this.camera.matrixWorld.decompose(this.v, this.plane.quaternion, this.v);
    this.target.getWorldPosition(this.plane.position);
    this.plane.matrixNeedsUpdate = true;
    this.plane.updateMatrixWorld(true);

    this.intersections.length = 0;
    const far = this.raycaster.far;
    this.raycaster.far = 1000;
    this.plane.raycast(this.raycaster, this.intersections);
    this.raycaster.far = far;
    const intersection = this.intersections[0]; // point
    if (!intersection) return;

    this.planarDifference.copy(intersection.point).sub(this.initialIntersection.point);
    this.camera.getWorldPosition(this.eye);
    this.target.getWorldPosition(this.obj);
    this.eyeToObject.copy(this.eye).sub(this.obj);
    this.planeNormal.copy(this.eyeToObject).normalize();
    const differenceInPlane = this.planarDifference.projectOnPlane(this.planeNormal);
    const rotationSpeed = 15 / this.obj.distanceTo(this.eye);

    const rotationAngle = differenceInPlane.x * rotationSpeed;
    this.target.quaternion.copy(
      this.newOrientation
        .copy(this.initialOrientation)
        .multiply(this.deltaQuaternion.setFromAxisAngle(this.axis, rotationAngle))
    );
    this.target.matrixNeedsUpdate = true;
  }
});
