/** @jsx createElementEntity */

import { createElementEntity } from "../utils/jsx-entity";
import {
  AxesHelper,
  BoxBufferGeometry,
  Mesh,
  MeshBasicMaterial,
  PlaneBufferGeometry,
  Quaternion,
  Vector3
} from "three";

const depth = 0.1;
const halfDepth = depth / 2;
const height = 0.05;

export function NavigationLine(points: Array<THREE.Vector3>) {
  const arrows = [];

  for (let i = 0; i < points.length - 1; i++) {
    const prev = points[i];
    const next = points[i + 1];

    arrows.push(<entity name={`arrow ${i}`} object3D={GetLine(prev, next)} />);
  }
  return <entity>{arrows}</entity>;
}

export function GetLine(point1: Vector3, point2: Vector3): any {
  const width = point1.distanceTo(point2);

  const center = new THREE.Vector3().addVectors(point1, point2).multiplyScalar(0.5);

  const direction = new THREE.Vector3().subVectors(point2, point1).normalize();
  const quaternion1 = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), direction);

  const crossVector = new Vector3().crossVectors(new Vector3(0, 1, 0), direction);
  const intermediateVector = crossVector.clone().applyQuaternion(quaternion1);
  const quaternion2 = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), intermediateVector);
  const finalQuaterion = new Quaternion().multiplyQuaternions(quaternion1, quaternion2);
  const boxGeometry = new THREE.BoxGeometry(width, height, depth);

  const boxMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);

  boxMesh.position.copy(center.clone().addScaledVector(direction, -halfDepth));
  boxMesh.quaternion.copy(finalQuaterion);

  boxMesh.add(new AxesHelper(5));

  return boxMesh;
}
