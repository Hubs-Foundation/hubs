const DEBUG_BBAA_COLOR = 0x49ef4;

const debugMaterial = new THREE.MeshBasicMaterial({
  color: DEBUG_BBAA_COLOR,
  transparent: true,
  opacity: 0.25,
  side: THREE.DoubleSide
});

// Represents an 3D box area in the audio zones system that can contain audio-zone-entities.
// It can be of inOut or/and outIn type.
// - inOut: applies this zone's audio parameters to an audio-zone-source when the source is inside and listener is outside.
//  i.e. You want to prevent audio to come out from a room containing audio sources.
// - outIn: applies this zone's audio parameters to the an audio-zone-source when the listener is inside and the source is outside.
//  i.e. You want to prevent audio to come into a room from audio sources outside.
AFRAME.registerComponent("audio-zone", {
  schema: {
    enabled: { default: true },
    inOut: { default: true },
    outIn: { default: true },
    debuggable: { default: true }
  },

  init() {
    this.currentPos = new THREE.Vector3();
    this.lastPosition = new THREE.Vector3();
    this.worldBoundingBox = new THREE.Box3();
    this.object3D = this.el.object3D;

    const bbox = new THREE.Box3();
    bbox.setFromObject(this.object3D);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    // Adjust the box scale to the bounding box size
    if (size.length() > 0) {
      this.object3D.scale.set(size.x, size.y, size.z);
    }

    for (let i = this.object3D.children.length - 1; i >= 0; i--) {
      this.object3D.children[i].visible = false;
    }

    const debugGeometry = new THREE.BoxGeometry();
    this.debugMesh = new THREE.Mesh(debugGeometry, debugMaterial);
    this.debugMesh.el = this.object3D.el;
    const debugBBAA = new THREE.BoxHelper(this.debugMesh, DEBUG_BBAA_COLOR);
    this.object3D.add(debugBBAA);

    this.el.sceneEl?.systems["audio-debug"].registerZone(this);
    this.el.sceneEl?.systems["hubs-systems"].audioZonesSystem.registerZone(this);

    this.enableDebug(window.APP.store.state.preferences.showAudioDebugPanel);
    this.el.setAttribute("audio-params", "debuggable", false);
    this.audioParamsComp = this.el.components["audio-params"];
  },

  remove() {
    this.el.sceneEl?.systems["audio-debug"].unregisterZone(this);
    this.el.sceneEl?.systems["hubs-systems"].audioZonesSystem.unregisterZone(this);
  },

  tick() {
    this.lastPosition = this.currentPos.clone();
    this.object3D.getWorldPosition(this.currentPos);
    if (this.data.enabled) {
      this.worldBoundingBox.copy(this.debugMesh.geometry.boundingBox).applyMatrix4(this.object3D.matrixWorld);
    }
  },

  update() {
    this.enableDebug(this.data.debuggable && window.APP.store.state.preferences.showAudioDebugPanel);
  },

  isEnabled() {
    return this.data.enabled;
  },

  getBoundingBox() {
    return this.worldBoundingBox;
  },

  enableDebug(debuggable) {
    this.data.debuggable = debuggable;
    this.object3D.visible = debuggable;
  },

  getAudioParams() {
    return {
      distanceModel: this.audioParamsComp.data.distanceModel,
      maxDistance: this.audioParamsComp.data.maxDistance,
      refDistance: this.audioParamsComp.data.refDistance,
      rolloffFactor: this.audioParamsComp.data.rolloffFactor,
      coneInnerAngle: this.audioParamsComp.data.coneInnerAngle,
      coneOuterAngle: this.audioParamsComp.data.coneOuterAngle,
      coneOuterGain: this.audioParamsComp.data.coneOuterGain,
      gain: this.audioParamsComp.data.gain
    };
  },

  contains(position) {
    return this.worldBoundingBox.containsPoint(position);
  }
});
