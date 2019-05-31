const isMobileVR = AFRAME.utils.device.isMobileVR();

// Billboard component that only updates visible objects and only those in the camera view on mobile VR.
AFRAME.registerComponent("billboard", {
  init: function() {
    this.target = new THREE.Vector3();
    this._updateBillboard = this._updateBillboard.bind(this);
    this._updateIsInView = this._updateIsInView.bind(this);
    this.el.sceneEl.systems["frame-scheduler"].schedule(this._updateIsInView, "billboards");
  },
  remove() {
    this.el.sceneEl.systems["frame-scheduler"].unschedule(this._updateIsInView, "billboards");
  },

  tick() {
    if (this.isInView || !isMobileVR) {
      this._updateBillboard();
    }
  },

  _updateIsInView: (function() {
    const frustum = new THREE.Frustum();
    const frustumMatrix = new THREE.Matrix4();
    const cameraWorld = new THREE.Vector3();
    const isInViewOfCamera = (screenCamera, pos) => {
      frustumMatrix.multiplyMatrices(screenCamera.projectionMatrix, screenCamera.matrixWorldInverse);
      frustum.setFromMatrix(frustumMatrix);
      return frustum.containsPoint(pos);
    };

    return function() {
      if (!this.el.object3D.visible) {
        this.isInView = false;
        return;
      }

      if (!this.playerCamera) {
        this.playerCamera = document.querySelector("#player-camera").getObject3D("camera");
      }

      if (!this.playerCamera) return;
      this.el.object3D.getWorldPosition(cameraWorld);

      this.isInView = isInViewOfCamera(this.playerCamera, cameraWorld);
    };
  })(),

  _updateBillboard: function() {
    if (!this.el.object3D.visible) return;

    const camera = this.el.sceneEl.camera;
    const object3D = this.el.object3D;

    if (camera) {
      // Set the camera world position as the target.
      this.target.setFromMatrixPosition(camera.matrixWorld);
      object3D.lookAt(this.target);
      object3D.matrixNeedsUpdate = true;
    }
  }
});
