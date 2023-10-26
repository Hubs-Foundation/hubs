/** @jsx createElementEntity */

import { createElementEntity } from "../utils/jsx-entity";
import { AxesHelper, Object3D, Quaternion, Vector3 } from "three";
import rightArrowSrc from "../assets/models/arrow_right.glb";
import pointSrc from "../assets/models/point.glb";
import { preload } from "../utils/preload";
import { cloneModelFromCache, loadModel } from "../components/gltf-model-plus";
import { Node } from "../bit-systems/routing-system";

preload(loadModel(rightArrowSrc, null, true));
preload(loadModel(pointSrc, null, true));

const depth = 0.1;
const halfDepth = depth / 2;
const height = 0.05;

interface navigationData {
  path: Vector3[];
  instructions: instruction[];
}

interface instruction {
  action: "start" | "finish" | "move" | "turn" | "continue";
  direction?: "right" | "left" | "forward";
  angle?: number;
  from?: Vector3;
  prev?: Vector3;
  line?: Vector3;
  current?: Vector3;
  next?: Vector3;
  to?: Vector3;
  distance?: number;
}

export function NavigationLine(navigation: navigationData) {
  const lines = [];
  const turns: any[] | undefined = [];
  const points = navigation.path;

  navigation.instructions.forEach(instruction => {
    if (instruction.action === "turn") {
      turns.push(<entity name={`turn`} model={{ model: GetArrow(instruction) }}></entity>);
    }
  });

  for (let i = 0; i < points.length - 1; i++) {
    const prev = points[i];
    const next = points[i + 1];
    lines.push(<entity name={`arrow ${i}`} object3D={GetLine(prev, next)} />);
  }

  return (
    <entity>
      <entity>{turns}</entity>
      <entity>{lines}</entity>
    </entity>
  );
}

function GetLine(point1: Vector3, point2: Vector3): any {
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

  return boxMesh;
}

function GetArrow(instruction: instruction) {
  const obj = cloneModelFromCache(rightArrowSrc).scene as Object3D;
  const line = instruction.line!;

  const quaternion1 = new Quaternion().setFromUnitVectors(new Vector3(1, 0, 0), line);
  const correctZaxis = new Vector3(0, 0, 1);

  correctZaxis.applyQuaternion(quaternion1);

  const desiredDirection = new Vector3().crossVectors(line, new Vector3(0, 1, 0));
  const quaternion2 = new Quaternion().setFromUnitVectors(correctZaxis.normalize(), desiredDirection.normalize());

  const finalQuaterion = quaternion2.multiply(quaternion1);
  obj.applyQuaternion(finalQuaterion);
  obj.position.copy(new Vector3(instruction.current!.x, instruction.current!.y + 1.5, instruction.current!.z));

  obj.add(new AxesHelper());

  return obj;
}

export function pivotPoint(nodeArray: Node[]) {
  const points: any[] = [];

  nodeArray.forEach(node => {
    const obj = cloneModelFromCache(pointSrc).scene as Object3D;
    points.push(<entity name="point" object3D={obj} position={[node.x, node.y, node.z]}></entity>);
  });

  return <entity>{points}</entity>;
}
