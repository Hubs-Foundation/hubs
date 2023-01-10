const DEBUG_BBAA_COLOR = 0x49ef4;

const debugMaterial = new THREE.MeshBasicMaterial({
  color: DEBUG_BBAA_COLOR,
  transparent: true,
  opacity: 0.25,
  side: THREE.DoubleSide
});

AFRAME.registerComponent("audio-zone", {
  schema: {
    enabled: { default: true },
    inOut: { default: true },
    outIn: { default: true },
    debuggable: { default: true }
  },

  init() {
    const debugGeometry = new THREE.BoxGeometry();
    this.debugMesh = new THREE.Mesh(debugGeometry, debugMaterial);
    this.debugMesh.el = this.el.object3D.el;
    const debugBBAA = new THREE.BoxHelper(this.debugMesh, DEBUG_BBAA_COLOR);
    this.el.object3D.add(debugBBAA);
    this.el.object3D.updateMatrixWorld(true);

    // In some cases (ie. the scene page) these systems might not exist
    // so we need to check if the do before registering.
    this.el.sceneEl.systems["audio-debug"]?.registerZone(this);
    this.el.sceneEl.systems["hubs-systems"]?.audioZonesSystem.registerZone(this);

    this.enableDebug(window.APP.store.state.preferences.showAudioDebugPanel);
  },

  remove() {
    // In some cases (ie. the scene page) these systems might not exist
    // so we need to check if the do before unregistering.
    this.el.sceneEl.systems["audio-debug"]?.unregisterZone(this);
    this.el.sceneEl.systems["hubs-systems"]?.audioZonesSystem.unregisterZone(this);
  },

  update() {
    this.enableDebug(this.data.debuggable && window.APP.store.state.preferences.showAudioDebugPanel);
  },

  isEnabled() {
    return this.data.enabled;
  },

  getBoundingBox: (function () {
    const bbaa = new THREE.Box3();
    return function () {
      return bbaa.copy(this.debugMesh.geometry.boundingBox).applyMatrix4(this.el.object3D.matrixWorld);
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
    return this.getBoundingBox().containsPoint(position);
  }
});
