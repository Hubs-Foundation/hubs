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

        this.updateMatrices();
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

        this.updateMatrices();
        this.matrixWorld.decompose(position, quaternion, target);

        return target;
      };
    })();

    THREE.Object3D.prototype.updateMatrix = function() {
      this.matrix.compose(
        this.position,
        this.quaternion,
        this.scale
      );

      this.matrixWorldNeedsUpdate = true;

      if (!this.matrixIsModified) {
        this.matrixIsModified = true;

        if (this.cachedMatrixWorld) {
          this.cachedMatrixWorld.copy(this.matrixWorld);
          this.matrixWorld = this.cachedMatrixWorld;
        }
      }
    };

    THREE.Object3D.prototype.applyMatrix = function(matrix) {
      this.matrix.multiplyMatrices(matrix, this.matrix);
      this.matrix.decompose(this.position, this.quaternion, this.scale);

      this.matrixWorldNeedsUpdate = true;

      if (!this.matrixIsModified) {
        this.matrixIsModified = true;

        if (this.cachedMatrixWorld) {
          this.cachedMatrixWorld.copy(this.matrixWorld);
          this.matrixWorld = this.cachedMatrixWorld;
        }
      }
    };

    // By the end of this function this.matrix reflects the updated local matrix
    // and this.matrixWorld reflects the updated world matrix, taking into account
    // parent matrices.
    //
    // forceLocalUpdate - Forces the local matrix to be updated regardless of if it has not
    // been marked dirty.
    //
    // forceWorldUpdate - Forces the world matrix to be updated regardless of if the local matrix
    // has been updated since the last update.
    //
    // skipParents - unless true, all parent matricies are updated before updating this object's
    // local and world matrix.
    //
    // Returns true if the world matrix was updated.
    //
    THREE.Object3D.prototype.updateMatrices = function(forceLocalUpdate, forceWorldUpdate, skipParents) {
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
      } else if (this.matrixNeedsUpdate || this.matrixAutoUpdate || forceLocalUpdate) {
        this.updateMatrix();
        if (this.matrixNeedsUpdate) this.matrixNeedsUpdate = false;
      }

      if (!skipParents && this.parent) {
        this.parent.updateMatrices(false, forceWorldUpdate, false);
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
            // Once matrixIsModified === true, this.matrixWorld has been updated to be a local
            // copy, not a reference to this.parent.matrixWorld (see updateMatrix/applyMatrix)
            this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
          }
        }

        this.matrixWorldNeedsUpdate = false;

        return true;
      }

      return false;
    };

    // Computes this object's matrices and then the recursively computes the matrices of all the children.
    //
    // forceWorldUpdate - If true and the object is visible, will force the world matrix to be updated for
    // this node and all of its children.
    //
    // includeInvisible - If true, does not ignore non-visible objects.
    THREE.Object3D.prototype.updateMatrixWorld = function(forceWorldUpdate, includeInvisible) {
      if (!this.visible && !includeInvisible) return;

      // Do not recurse upwards, since this is recursing downwards
      const forceChildrenWorldUpdate = this.updateMatrices(false, forceWorldUpdate, true);

      const children = this.children;

      for (let i = 0, l = children.length; i < l; i++) {
        children[i].updateMatrixWorld(forceChildrenWorldUpdate, includeInvisible);
      }
    };
  },

  _patchRenderFunc: function() {
    const renderer = this.el.renderer;
    const render = renderer.render;

    renderer.render = (scene, camera, renderTarget) => {
      scene.updateMatrixWorld();
      render.call(renderer, scene, camera, renderTarget);
      this.frame++;
    };
  }
});
