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

    this.onIntersection = this.onIntersection.bind(this);
    this.onIntersectionCleared = this.onIntersectionCleared.bind(this);

    // gizmo stuff:
    // shared materials

    var gizmoMaterial = new THREE.MeshBasicMaterial({
      depthTest: false,
      depthWrite: false,
      transparent: true,
      side: THREE.DoubleSide,
      fog: false
    });

    var gizmoLineMaterial = new THREE.LineBasicMaterial({
      depthTest: false,
      depthWrite: false,
      transparent: true,
      linewidth: 300,
      fog: false
    });
    var matInvisible = gizmoMaterial.clone();
    matInvisible.opacity = 0.0;
    matInvisible.visible = false;

    var matHelper = gizmoMaterial.clone();
    matHelper.opacity = 0.33;

    var matRed = gizmoMaterial.clone();
    matRed.color.set(0xff0000);

    var matGreen = gizmoMaterial.clone();
    matGreen.color.set(0x00ff00);

    var matBlue = gizmoMaterial.clone();
    matBlue.color.set(0x0000ff);

    var matWhiteTransperent = gizmoMaterial.clone();
    matWhiteTransperent.opacity = 0.25;

    var matYellowTransparent = matWhiteTransperent.clone();
    matYellowTransparent.color.set(0xffff00);

    var matCyanTransparent = matWhiteTransperent.clone();
    matCyanTransparent.color.set(0x00ffff);

    var matMagentaTransparent = matWhiteTransperent.clone();
    matMagentaTransparent.color.set(0xff00ff);

    var matYellow = gizmoMaterial.clone();
    matYellow.color.set(0xffff00);

    var matLineRed = gizmoLineMaterial.clone();
    matLineRed.color.set(0xff0000);

    var matLineGreen = gizmoLineMaterial.clone();
    matLineGreen.color.set(0x00ff00);

    var matLineBlue = gizmoLineMaterial.clone();
    matLineBlue.color.set(0x0000ff);

    var matLineCyan = gizmoLineMaterial.clone();
    matLineCyan.color.set(0x00ffff);

    var matLineMagenta = gizmoLineMaterial.clone();
    matLineMagenta.color.set(0xff00ff);

    var matLineYellow = gizmoLineMaterial.clone();
    matLineYellow.color.set(0xffff00);

    var matLineGray = gizmoLineMaterial.clone();
    matLineGray.color.set(0x787878);

    var matLineYellowTransparent = matLineYellow.clone();
    matLineYellowTransparent.opacity = 0.25;

    // reusable geometry

    var arrowGeometry = new THREE.CylinderBufferGeometry(0, 0.05, 0.2, 12, 1, false);

    var scaleHandleGeometry = new THREE.BoxBufferGeometry(0.125, 0.125, 0.125);

    var lineGeometry = new THREE.BufferGeometry();
    lineGeometry.addAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0], 3));

    var CircleGeometry = function(radius, arc) {
      var geometry = new THREE.BufferGeometry();
      var vertices = [];

      for (var i = 0; i <= 64 * arc; ++i) {
        vertices.push(0, Math.cos((i / 32) * Math.PI) * radius, Math.sin((i / 32) * Math.PI) * radius);
      }

      geometry.addAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));

      return geometry;
    };

    // Special geometry for transform helper. If scaled with position vector it spans from [0,0,0] to position

    var TranslateHelperGeometry = function(radius, arc) {
      var geometry = new THREE.BufferGeometry();

      geometry.addAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 1, 1, 1], 3));

      return geometry;
    };

    this.gizmoRotate = {
      X: [
        [new THREE.Line(CircleGeometry(1, 0.5), matLineRed)],
        [new THREE.Mesh(new THREE.OctahedronBufferGeometry(0.04, 0), matRed), [0, 0, 0.99], null, [1, 3, 1]]
      ],
      Y: [
        [new THREE.Line(CircleGeometry(1, 0.5), matLineGreen), null, [0, 0, -Math.PI / 2]],
        [new THREE.Mesh(new THREE.OctahedronBufferGeometry(0.04, 0), matGreen), [0, 0, 0.99], null, [3, 1, 1]]
      ],
      Z: [
        [new THREE.Line(CircleGeometry(1, 0.5), matLineBlue), null, [0, Math.PI / 2, 0]],
        [new THREE.Mesh(new THREE.OctahedronBufferGeometry(0.04, 0), matBlue), [0.99, 0, 0], null, [1, 3, 1]]
      ]
    };

    this.pickerRotate = {
      X: [
        [
          new THREE.Mesh(new THREE.TorusBufferGeometry(1, 0.1, 4, 24), matInvisible),
          [0, 0, 0],
          [0, -Math.PI / 2, -Math.PI / 2]
        ]
      ],
      Y: [[new THREE.Mesh(new THREE.TorusBufferGeometry(1, 0.1, 4, 24), matInvisible), [0, 0, 0], [Math.PI / 2, 0, 0]]],
      Z: [[new THREE.Mesh(new THREE.TorusBufferGeometry(1, 0.1, 4, 24), matInvisible), [0, 0, 0], [0, 0, -Math.PI / 2]]]
    };
    var setupGizmo = function(gizmoMap, el) {
      var gizmo = new THREE.Object3D();

      for (var name in gizmoMap) {
        for (var i = gizmoMap[name].length; i--; ) {
          var object = gizmoMap[name][i][0].clone();
          var position = gizmoMap[name][i][1];
          var rotation = gizmoMap[name][i][2];
          var scale = gizmoMap[name][i][3];
          var tag = gizmoMap[name][i][4];

          // name and tag properties are essential for picking and updating logic.
          object.name = name;
          object.tag = tag;

          if (position) {
            object.position.set(position[0], position[1], position[2]);
          }
          if (rotation) {
            object.rotation.set(rotation[0], rotation[1], rotation[2]);
          }
          if (scale) {
            object.scale.set(scale[0], scale[1], scale[2]);
          }

          object.updateMatrix();

          var tempGeometry = object.geometry.clone();
          tempGeometry.applyMatrix(object.matrix);
          object.geometry = tempGeometry;

          object.position.set(0, 0, 0);
          object.rotation.set(0, 0, 0);
          object.scale.set(1, 1, 1);

          object.el = el;
          gizmo.add(object);
        }
      }

      return gizmo;
    };
    this.gizmo = new THREE.Object3D();
    this.gizmo.el = this.el;
    this.el.sceneEl.object3D.add(this.gizmo);
    this.gizmo.add(setupGizmo(this.pickerRotate, this.el));
    this.gizmo.add(setupGizmo(this.gizmoRotate, null));
    this.gizmo.scale.set(0.5, 0.5, 0.5);

    this.gizmo.visible = false;
    this.el.addEventListener("raycaster-intersection", this.onIntersection);
    this.el.addEventListener("raycaster-intersection-cleared", this.onIntersectionCleared);
  },
  onIntersection(e) {
    const object = e.detail.intersection.object;
    if (!this.rotationInProgress && this.target) {
      if (object.parent.parent === this.gizmo) {
        this.hovering = object;
      }
    }
  },
  onIntersectionCleared(e) {
    if (!this.rotationInProgress) {
      if (
        !e.detail.intersection ||
        (e.detail.intersection &&
          e.detail.intersection.object &&
          e.detail.intersection.object.parent.parent !== this.gizmo)
      ) {
        this.hovering = null;
      }
    }
  },

  setTarget(el) {
    if (!this.raycaster) {
      this.raycaster = document.querySelector("#cursor-controller").components["cursor-controller"].raycaster;
    }
    if (this.target === el.object3D) {
      this.stopRotating();
      return;
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
          wireframe: true,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.3
        })
      );

      AFRAME.scenes[0].object3D.add(this.plane);
    }
    this.plane.position.copy(this.center);
    this.plane.matrixNeedsUpdate = true;

    this.gizmo.position.copy(this.center);
    this.gizmo.quaternion.copy(this.target.quaternion);
    this.gizmo.matrixNeedsUpdate = true;
    this.gizmo.visible = true;
  },

  stopRotating() {
    this.target = null;
    this.rotationInProgress = false;
    this.gizmo.visible = false;
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

    this.gizmo.visible = true;
  },

  tick() {
    const userinput = AFRAME.scenes[0].systems.userinput;
    if (userinput.get(paths.actions.cursor.drop)) {
      this.rotationInProgress = false;
    }
    if (!this.rotationInProgress) {
      if (this.hovering && userinput.get(paths.device.mouse.buttonLeft)) {
        this.engageAxis(
          new THREE.Vector3(
            this.hovering.name === "X" ? 1 : 0,
            this.hovering.name === "Y" ? 1 : 0,
            this.hovering.name === "Z" ? 1 : 0
          )
        );
      } else {
        return;
      }
    }
    if (!userinput.get(paths.device.mouse.buttonLeft)) {
      return;
    }

    this.intersections.length = 0;
    const far = this.raycaster.far;
    this.raycaster.far = 1000;
    this.plane.raycast(this.raycaster, this.intersections);
    this.raycaster.far = far;
    const intersection = this.intersections[0]; // point
    if (!intersection) return;
    if (!this.initialIntersection) return; // todo what?
    const angle = intersection.point.sub(this.initialIntersection.point).y;

    this.target.quaternion.copy(
      this.newOrientation
        .copy(this.initialOrientation)
        .multiply(this.deltaQuaternion.setFromAxisAngle(this.axis, angle))
    );
    this.target.matrixNeedsUpdate = true;
    this.gizmo.quaternion.copy(this.target.quaternion);
    this.target.getWorldPosition(this.gizmo.position);
    this.gizmo.matrixNeedsUpdate = true;

    this.plane.position.copy(this.gizmo.position);
    this.plane.quaternion.copy(document.querySelector("#player-camera").object3D.quaternion);
    this.plane.matrixNeedsUpdate = true;
  }
});

AFRAME.registerSystem("rotation-gizmo", {
  init() {
    this.donuts = [];
    this.rings = [];
    this.axes = [];
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
  }
});
