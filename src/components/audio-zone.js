const DEBUG_BBAA_COLOR = 0x49ef4;

const debugMaterial = new THREE.LineBasicMaterial({
  color: DEBUG_BBAA_COLOR,
  linewidth: 2
});

export const AudioZoneShape = {
  Box: "box",
  Sphere: "sphere"
};

const EPSILON = 0.00000000001;

AFRAME.registerComponent("audio-zone", {
  schema: {
    enabled: { default: true },
    inOut: { default: true },
    outIn: { default: true },
    debuggable: { default: true },
    shape: { default: AudioZoneShape.Box }
  },

  init() {
    let geo;
    if (this.data.shape === AudioZoneShape.Box) {
      geo = new THREE.BoxGeometry();
    } else {
      geo = new THREE.SphereGeometry(1, 8, 8);
    }
    this.debugMesh = new THREE.LineSegments(new THREE.EdgesGeometry(geo), debugMaterial);
    this.el.object3D.add(this.debugMesh);

    // In some cases (ie. the scene page) these systems might not exist
    // so we need to check if the do before registering.
    this.el.sceneEl.systems["audio-debug"]?.registerZone(this);
    this.el.sceneEl.systems["hubs-systems"]?.audioZonesSystem.registerZone(this);

    this.enableDebug(window.APP.store.state.preferences.showAudioDebugPanel);
  },

  remove() {
    this.el.object3D.remove(this.debugMesh);
    // In some cases (ie. the scene page) these systems might not exist
    // so we need to check if the do before unregistering.
    this.el.sceneEl.systems["audio-debug"]?.unregisterZone(this);
    this.el.sceneEl.systems["hubs-systems"]?.audioZonesSystem.unregisterZone(this);
  },

  update() {
    this.enableDebug(this.data.debuggable && window.APP.store.state.preferences.showAudioDebugPanel);
  },

  tick: (() => {
    const quat = new THREE.Quaternion();
    return function() {
      this.el.object3D.parent.getWorldQuaternion(quat).invert();
      if (!this.el.object3D.quaternion.near(quat, EPSILON)) {
        this.el.object3D.quaternion.copy(quat);
        this.el.object3D.updateMatrix();
      }
    };
  })(),

  isEnabled() {
    return this.data.enabled;
  },

  getBoundingBox: (function() {
    const bbaa = new THREE.Box3();
    return function() {
      if (this.debugMesh.geometry.boundingBox === null) {
        this.debugMesh.geometry.computeBoundingBox();
      }
      return bbaa.copy(this.debugMesh.geometry.boundingBox).applyMatrix4(this.el.object3D.matrixWorld);
    };
  })(),

  getBoundingSphere: (function() {
    const bbaa = new THREE.Sphere();
    return function() {
      if (this.debugMesh.geometry.boundingSphere === null) {
        this.debugMesh.geometry.computeBoundingSphere();
      }
      return bbaa.copy(this.debugMesh.geometry.boundingSphere).applyMatrix4(this.el.object3D.matrixWorld);
    };
  })(),

  enableDebug(debuggable) {
    this.data.debuggable = debuggable;
    this.el.object3D.visible = debuggable;
  },

  getAudioParams() {
    return APP.audioOverrides.get(this.el);
  },

  contains(position) {
    if (this.data.shape === AudioZoneShape.Box) {
      return this.getBoundingBox().containsPoint(position);
    } else {
      return this.getBoundingSphere().containsPoint(position);
    }
  }
});
