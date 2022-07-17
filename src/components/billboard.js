const isMobileVR = AFRAME.utils.device.isMobileVR();

// Billboard component that only updates visible objects and only those in the camera view on mobile VR.
AFRAME.registerComponent("billboard", {
  schema: {
    onlyY: { type: "boolean" }
  },
  init: function() {
    this._updateBillboard = this._updateBillboard.bind(this);
    this._updateIsInView = this._updateIsInView.bind(this);

    if (isMobileVR) {
      this.el.sceneEl.systems["frame-scheduler"].schedule(this._updateIsInView, "billboards");
    }
  },
  remove() {
    if (isMobileVR) {
      this.el.sceneEl.systems["frame-scheduler"].unschedule(this._updateIsInView, "billboards");
    }
  },

  tick() {
    if (this.isInView || !isMobileVR) {
      this._updateBillboard();
    }
  },

  _updateIsInView: (function() {
    const frustum = new THREE.Frustum();
    const frustumMatrix = new THREE.Matrix4();
    const box = new THREE.Box3();
    const boxTemp = new THREE.Box3();

    const expandBox = o => {
      if (o.geometry) {
        o.updateMatrices();
        o.geometry.computeBoundingBox();
        boxTemp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
        box.expandByPoint(boxTemp.min);
        box.expandByPoint(boxTemp.max);
      }
    };

    const isInViewOfCamera = (obj, screenCamera) => {
      frustumMatrix.multiplyMatrices(screenCamera.projectionMatrix, screenCamera.matrixWorldInverse);
      frustum.setFromProjectionMatrix(frustumMatrix);
      box.makeEmpty();
      obj.traverse(expandBox);

      // NOTE: not using box.setFromObject here because text nodes do not have Z values in their geometry buffer,
      // and that routine ultimately assumes they do.
      return frustum.intersectsBox(box);
    };

    return function() {
      if (!this.el.object3D.visible) {
        this.isInView = false;
        return;
      }

      if (!this.playerCamera) {
        this.playerCamera = document.getElementById("viewing-camera").getObject3D("camera");
      }

      if (!this.playerCamera) return;

      this.isInView = this.el.sceneEl.is("vr-mode") ? true : isInViewOfCamera(this.el.object3D, this.playerCamera);

      if (!this.isInView) {
        // Check in-game camera if rendering to viewfinder and owned
        const cameraTools = this.el.sceneEl.systems["camera-tools"];

        if (cameraTools) {
          cameraTools.ifMyCameraRenderingViewfinder(cameraTool => {
            this.isInView = this.isInView || isInViewOfCamera(this.el.object3D, cameraTool.camera);
          });
        }
      }
    };
  })(),

  _updateBillboard: (function() {
    const targetPos = new THREE.Vector3();
    const worldPos = new THREE.Vector3();
    return function() {
      if (!this.el.object3D.visible) return;

      const camera = this.el.sceneEl.camera;
      const object3D = this.el.object3D;

      if (camera) {
        // Set the camera world position as the target.
        targetPos.setFromMatrixPosition(camera.matrixWorld);

        if (this.data.onlyY) {
          object3D.getWorldPosition(worldPos);
          targetPos.y = worldPos.y;
        }
        object3D.lookAt(targetPos);

        object3D.matrixNeedsUpdate = true;
      }
    };
  })()
});
