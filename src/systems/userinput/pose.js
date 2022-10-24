import { Vector3, Quaternion } from "three";
const forward = new Vector3(0, 0, -1);
export function Pose() {
  return {
    position: new Vector3(),
    direction: new Vector3(),
    orientation: new Quaternion(),
    fromOriginAndDirection: function (origin, direction) {
      this.position = origin;
      this.direction = direction;
      this.orientation = this.orientation.setFromUnitVectors(forward, direction);
      return this;
    },
    fromCameraProjection: function (camera, normalizedX, normalizedY) {
      this.position.setFromMatrixPosition(camera.matrixWorld);
      this.direction.set(normalizedX, normalizedY, 0.5).unproject(camera).sub(this.position).normalize();
      this.fromOriginAndDirection(this.position, this.direction);
      return this;
    },
    copy: function (pose) {
      this.position.copy(pose.position);
      this.direction.copy(pose.direction);
      this.orientation.copy(pose.orientation);
    }
  };
}
