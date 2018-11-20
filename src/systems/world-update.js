const zeroPos = new THREE.Vector3(0, 0, 0);
const zeroQuat = new THREE.Quaternion();
const oneScale = new THREE.Vector3(1, 1, 1);
const identity = new THREE.Matrix4();
identity.identity();

AFRAME.registerSystem("world-update", {
  init() {
    this._patchRenderFunc();
    this._patchThreeJS();
    this.frame = 0;
  },

  _patchThreeJS: function() {
    THREE.Object3D.prototype.getWorldPosition = function(target) {
      if (target === undefined) {
        console.warn("THREE.Object3D: .getWorldPosition() target is now required");
        target = new THREE.Vector3();
      }

      this.updateMatrices();

      return target.setFromMatrixPosition(this.matrixWorld);
    };

    THREE.Object3D.prototype.getWorldQuaternion = (function() {
      const position = new THREE.Vector3();
      const scale = new THREE.Vector3();

      return function getWorldQuaternion(target) {
        if (target === undefined) {
          console.warn("THREE.Object3D: .getWorldQuaternion() target is now required");
          target = new THREE.Quaternion();
        }

        this.updateMatrices(true);
        this.matrixWorld.decompose(position, target, scale);

        return target;
      };
    })();

    THREE.Object3D.getWorldScale = (function() {
      const position = new THREE.Vector3();
      const quaternion = new THREE.Quaternion();

      return function getWorldScale(target) {
        if (target === undefined) {
          console.warn("THREE.Object3D: .getWorldScale() target is now required");
          target = new THREE.Vector3();
        }

        this.updateMatrices(true);
        this.matrixWorld.decompose(position, quaternion, target);

        return target;
      };
    })();

    const updateMatrix = THREE.Object3D.prototype.updateMatrix;
    THREE.Object3D.prototype.updateMatrix = function() {
      updateMatrix.apply(this, arguments);

      if (!this.matrixIsModified) {
        this.matrixIsModified = true;
      }
    };

    const applyMatrix = THREE.Object3D.prototype.applyMatrix;
    THREE.Object3D.prototype.applyMatrix = function() {
      applyMatrix.apply(this, arguments);

      if (!this.matrixIsModified) {
        this.matrixIsModified = true;
      }
    };

    // By the end of this function this.matrix reflects the updated local matrix
    // and this.worldMatrix reflects the updated world matrix, taking into account
    // parent matrices.
    //
    // Unless skipParents is true, all parent matricies are updated before
    // updating this object's local and world matrix.
    THREE.Object3D.prototype.updateMatrices = function(skipParents, forceWorldUpdate) {
      if (!this.hasHadFirstMatrixUpdate) {
        if (
          !this.position.equals(zeroPos) ||
          !this.quaternion.equals(zeroQuat) ||
          !this.scale.equals(oneScale) ||
          !this.matrix.equals(identity)
        ) {
          // Only update the matrix the first time if its non-identity, this way
          // this.matrixIsModified will remain false until the default
          // identity matrix is updated.
          this.updateMatrix();
        }

        this.hasHadFirstMatrixUpdate = true;
        this.cachedMatrixWorld = this.matrixWorld;
      } else if (this.matrixNeedsUpdate || this.matrixAutoUpdate) {
        this.updateMatrix();
        if (this.matrixNeedsUpdate) this.matrixNeedsUpdate = false;
      }

      if (!skipParents && this.parent) {
        this.parent.updateMatrices();
      }

      if (this.matrixWorldNeedsUpdate || forceWorldUpdate) {
        if (this.parent === null) {
          this.matrixWorld.copy(this.matrix);
        } else {
          // If the matrix is unmodified, it is the identity matrix,
          // and hence we can use the parent's world matrix directly.
          //
          // Note this assumes all callers will either not pass skipParents=true
          // *or* will update the parent themselves beforehand as is done in
          // updateMatrixWorld.
          if (!this.matrixIsModified) {
            this.matrixWorld = this.parent.matrixWorld;
          } else {
            this.matrixWorld = this.cachedMatrixWorld;
            this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
          }
        }
      }

      return this.matrixWorld;
    };

    // Computes this object's matrices and then the recursively computes the matrices
    // of all the children.
    THREE.Object3D.prototype.updateMatrixWorld = function(force) {
      if (!this.visible && !force) return;

      this.updateMatrices(true, force); // Do not recurse upwards, since this is recursing downwards

      const children = this.children;

      for (let i = 0, l = children.length; i < l; i++) {
        children[i].updateMatrixWorld(force);
      }
    };
  },

  _patchRenderFunc: function() {
    const renderer = this.el.renderer;
    const render = renderer.render;

    renderer.render = (scene, camera, renderTarget) => {
      scene.updateMatrixWorld(true, this.frame);
      render.call(renderer, scene, camera, renderTarget);
      this.frame++;
    };
  }
});
