const forward = new THREE.Vector3(0, 0, -1);
export function Pose() {
  return {
    position: new THREE.Vector3(),
    direction: new THREE.Vector3(),
    orientation: new THREE.Quaternion(),
    fromOriginAndDirection: function(origin, direction) {
      this.position = origin;
      this.direction = direction;
      this.orientation = this.orientation.setFromUnitVectors(forward, direction);
      return this;
    },
    fromCameraProjection: function(camera, normalizedX, normalizedY) {
      this.position.setFromMatrixPosition(camera.matrixWorld);
      this.direction
        .set(normalizedX, normalizedY, 0.5)
        .unproject(camera)
        .sub(this.position)
        .normalize();
      this.fromOriginAndDirection(this.position, this.direction);
      return this;
    }
  };
}
