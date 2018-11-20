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

      this.updateMatrices(true, true);

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

        this.updateMatrices(true, true);
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

        this.updateMatrices(true, true);
        this.matrixWorld.decompose(position, quaternion, target);

        return target;
      };
    })();

    const updateMatrix = THREE.Object3D.prototype.updateMatrix;
    THREE.Object3D.prototype.updateMatrix = function() {
      updateMatrix.apply(this, arguments);

      if (!this.matrixIsModified) {
        this.matrixIsModified = true;

        if (this.cachedMatrixWorld) {
          this.cachedMatrixWorld.copy(this.matrixWorld);
          this.matrixWorld = this.cachedMatrixWorld;
        }
      }
    };

    const applyMatrix = THREE.Object3D.prototype.applyMatrix;
    THREE.Object3D.prototype.applyMatrix = function() {
      applyMatrix.apply(this, arguments);

      if (!this.matrixIsModified) {
        this.matrixIsModified = true;

        if (this.cachedMatrixWorld) {
          this.cachedMatrixWorld.copy(this.matrixWorld);
          this.matrixWorld = this.cachedMatrixWorld;
        }
      }
    };

    // By the end of this function this.matrix reflects the updated local matrix
    // and this.worldMatrix reflects the updated world matrix, taking into account
    // parent matrices.
    //
    // Unless skipParents is true, all parent matricies are updated before
    // updating this object's local and world matrix.
    //
    // Returns true if the world matrix was updated
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
        this.matrixWorldNeedsUpdate = true;
        this.cachedMatrixWorld = this.matrixWorld;
      } else if (this.matrixNeedsUpdate || this.matrixAutoUpdate || forceLocalUpdate) {
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
            // Once matrixIsModified === true, this.matrixWorld has been updated to be a local
            // copy, not a reference to this.parent.matrixWorld (see updateMatrix/applymatrix)
            this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
          }
        }

        this.matrixWorldNeedsUpdate = false;
        return true;
      }

      return false;
    };

    // Computes this object's matrices and then the recursively computes the matrices
    // of all the children.
    THREE.Object3D.prototype.updateMatrixWorld = function(forceAll) {
      //if (!this.visible && !forceAll) return;

      // Do not recurse upwards, since this is recursing downwards
      const worldMatrixUpdated = this.updateMatrices(false, forceAll, true);

      const children = this.children;

      for (let i = 0, l = children.length; i < l; i++) {
        children[i].updateMatrixWorld(false, worldMatrixUpdated);
      }
    };
  },

  _patchRenderFunc: function() {
    const renderer = this.el.renderer;
    const render = renderer.render;

    let c = 0;
    let t = 0;

    renderer.render = (scene, camera, renderTarget) => {
      const t0 = performance.now();
      scene.updateMatrixWorld(true, true);
      if (c > 250) {
        t += performance.now() - t0;
      }
      if (c === 250) {
        console.log("starting");
      }
      if (c === 1000) {
        console.log((t * 1.0) / (c - 250.0));
      }
      c++;
      render.call(renderer, scene, camera, renderTarget);
      this.frame++;
    };
  }
});

/*
 * scene with 5 ducks
 *
 * full optimizations - 0.211 0.221 0.219 0.224 0.218 0.204
 * hold out identity optimization - 0.264 0.259 0.260
 * hold out visibility optimization - 0.252 0.283 0.247
 * non-auto matrix update, no identity optimization, no visibility optimization - 0.418 0.426 0.397
 * baseline (auto matrix update, default updateMatrixWorld) 0.388 0.407 0.438
 */
