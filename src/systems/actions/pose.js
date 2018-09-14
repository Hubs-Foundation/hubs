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
    }
  };
}
