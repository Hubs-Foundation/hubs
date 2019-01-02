import { paths } from "../systems/userinput/paths";
AFRAME.registerComponent("rotate-object-button", {
  init() {
    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.targetEl = networkedEl;
    });

    this.onClick = () => {
      AFRAME.scenes[0].systems["rotate-selected-object"].setTarget(this.targetEl);
    };
  },

  play() {
    this.el.addEventListener("grab-start", this.onClick);
  },

  pause() {
    this.el.removeEventListener("grab-start", this.onClick);
  }
});

AFRAME.registerComponent("rotate-object-on-axis-button", {
  schema: {
    axis: { type: "vec3" }
  },

  init() {
    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
        this.targetEl = networkedEl;
    });

    this.onClick = () => {
      AFRAME.scenes[0].systems["rotate-selected-object"].setTarget(this.targetEl);
      AFRAME.scenes[0].systems["rotate-selected-object"].engageAxis(this.data.axis);
    };
  },

  play() {
    this.el.addEventListener("grab-start", this.onClick);
  },

  pause() {
    this.el.removeEventListener("grab-start", this.onClick);
  }
});

AFRAME.registerSystem("rotate-selected-object", {
  init() {
    this.target = null;
    this.center = new THREE.Vector3();
    this.axis = new THREE.Vector3();
    this.angle = 0;
    this.intersections = [];
    this.initialOrientation = new THREE.Quaternion();
    this.newOrientation = new THREE.Quaternion();
    this.deltaQuaternion = new THREE.Quaternion();

    // not needed, right?
    this.setTarget.bind(this);
    this.stopRotating.bind(this);
    this.engageAxis.bind(this);
  },

  setTarget(el) {
    if (!this.raycaster) {
      this.raycaster = document.querySelector("#cursor-controller").components["cursor-controller"].raycaster;
    }
    this.target = el.object3D;
    this.target.getWorldPosition(this.center);
    this.angle = 0;
    if (!this.plane) {
      // We move this plane behind the target object. When you start to rotate, it will
      // help us track how much you move your cursor (and how much you want to rotate the object)
      this.plane = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(100000, 100000, 2, 2),
        new THREE.MeshBasicMaterial({
          visible: true,
          wireframe: false,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.3
        })
      );

      AFRAME.scenes[0].object3D.add(this.plane);
    }
    this.plane.position.copy(this.center);
    this.plane.lookAt(this.raycaster.ray.origin);
    this.plane.matrixNeedsUpdate = true;
  },

  stopRotating() {
    this.rotationInProgress = false;
  },

  engageAxis(axis) {
    if (!this.raycaster) {
      this.raycaster = document.querySelector("#cursor-controller").components["cursor-controller"].raycaster;
    }
    this.axis = axis;
    this.angle = 0;
    this.intersections.length = 0;
    const far = this.raycaster.far;
    this.raycaster.far = 1000;
    this.plane.raycast(this.raycaster, this.intersections);
    this.raycaster.far = far;
    this.initialIntersection = this.intersections[0]; // point
    this.rotationInProgress = true;
    this.initialOrientation.copy(this.target.quaternion);
  },

  tick() {
    if (AFRAME.scenes[0].systems.userinput.get(paths.actions.cursor.drop)) {
      this.rotationInProgress = false;
    }
    if (!this.rotationInProgress) return;
    this.intersections.length = 0;
    const far = this.raycaster.far;
    this.raycaster.far = 1000;
    this.plane.raycast(this.raycaster, this.intersections);
    this.raycaster.far = far;
    const intersection = this.intersections[0]; // point
    if (!intersection) return;
    const angle = intersection.point.sub(this.initialIntersection.point).y;

    this.target.quaternion.copy(
      this.newOrientation
        .copy(this.initialOrientation)
        .multiply(this.deltaQuaternion.setFromAxisAngle(this.axis, angle))
    );
    this.target.matrixNeedsUpdate = true;
  }
});
