const isMobileVR = AFRAME.utils.device.isMobileVR();

// Billboard component that only updates visible objects and only those in the camera view on mobile VR.
AFRAME.registerComponent("billboard", {
  init: function() {
    this.target = new THREE.Vector3();
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
      frustum.setFromMatrix(frustumMatrix);
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

      this.isInView = isInViewOfCamera(this.el.object3D, this.playerCamera);
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
