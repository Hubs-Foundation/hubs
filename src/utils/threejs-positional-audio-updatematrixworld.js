// Monkeypatch to address performance issue with updating panner nodes
// TODO this needs to be merged into 3.js

THREE.PositionalAudio.prototype.updateMatrixWorld = (function() {
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();

  const scale = new THREE.Vector3();
  const orientation = new THREE.Vector3();

  return function updateMatrixWorld(force) {
    THREE.Object3D.prototype.updateMatrixWorld.call(this, force);

    let setInitial = false;

    if (!this._lastPosition) {
      setInitial = true;
      this._lastPosition = new THREE.Vector3();
      this._lastOrientation = new THREE.Vector3();
      this._lastListenerPosition = new THREE.Vector3();
    }

    const panner = this.panner;
    const listener = panner.context.listener;
    this.matrixWorld.decompose(position, quaternion, scale);
    orientation.set(0, 0, 1).applyQuaternion(quaternion);

    // Need to update the position on this node if either the listener moves or this node moves,
    // because otherwise there are audio artifacts.
    if (
      setInitial ||
      Math.abs(panner.positionX.value - this._lastPosition.x) > Number.EPSILON ||
      Math.abs(panner.positionY.value - this._lastPosition.y) > Number.EPSILON ||
      Math.abs(panner.positionZ.value - this._lastPosition.z) > Number.EPSILON ||
      Math.abs(panner.orientationX.value - this._lastOrientation.x) > Number.EPSILON ||
      Math.abs(panner.orientationY.value - this._lastOrientation.y) > Number.EPSILON ||
      Math.abs(panner.orientationZ.value - this._lastOrientation.z) > Number.EPSILON ||
      Math.abs(listener.positionX.value - this._lastListenerPosition.x) > Number.EPSILON ||
      Math.abs(listener.positionY.value - this._lastListenerPosition.y) > Number.EPSILON ||
      Math.abs(listener.positionZ.value - this._lastListenerPosition.z) > Number.EPSILON
    ) {
      panner.setPosition(position.x, position.y, position.z);
      panner.setOrientation(orientation.x, orientation.y, orientation.z);
      this._lastPosition.x = panner.positionX.value;
      this._lastPosition.y = panner.positionY.value;
      this._lastPosition.z = panner.positionZ.value;
      this._lastListenerPosition.x = listener.positionX.value;
      this._lastListenerPosition.y = listener.positionY.value;
      this._lastListenerPosition.z = listener.positionZ.value;
      this._lastOrientation.x = panner.orientationX.value;
      this._lastOrientation.y = panner.orientationY.value;
      this._lastOrientation.z = panner.orientationZ.value;
    }
  };
})();
