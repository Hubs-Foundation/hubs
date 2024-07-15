import { Color, DiscreteInterpolant, Material, Mesh, Object3D, Vector, Vector2, Vector3 } from "three";
import VirtualAgent, { avatarDirection, avatarPos, virtualAgent } from "./agent-system";
import { NavigationProperties, PropertyType, roomPropertiesReader } from "../utils/rooms-properties";
import { element, node, number, object } from "prop-types";
import { renderAsEntity } from "../utils/jsx-entity";
import { removeEntity } from "bitecs";
import { NavigationCues } from "../prefabs/nav-line";
import { HubsWorld } from "../app";
import { clamp, radToDeg } from "three/src/math/MathUtils";
import { COLORS } from "html2canvas/dist/types/css/types/color";
import { copySittingToStandingTransform } from "../systems/userinput/devices/copy-sitting-to-standing-transform";

//------------------------------ interfaces ----------------------------------//
interface RoomObjectDetails {
  angle: Array<number>;
  distance: Array<number>;
  visible: Array<boolean>;
}
export interface Navigation {
  path: Vector3[];
  instructions: Array<Record<string, any>>;
  knowledge: string;
  valid: boolean;
}

//------------------------------ constansts ----------------------------------//
const step = 1;
console.log(step);
const outsidePoint = new Vector2(15.7, 68.7);
const INF = Number.MAX_SAFE_INTEGER;

//------------------------------ functions ----------------------------------//

function SegToPointDist(point: Vector2, a: Vector2, b: Vector2): [number, number] {
  const ab = b.clone().sub(a);
  const ap = point.clone().sub(a);
  const proj = ap.dot(ab);
  const abLengthSq = ab.lengthSq();
  const d = proj / abLengthSq;

  let distance;

  if (a.manhattanDistanceTo(point) === 0) return [0, 0];
  if (b.manhattanDistanceTo(point) === 0) return [0, 0];

  if (d <= 0) {
    distance = point.distanceTo(a);
  } else if (d >= 1) {
    distance = point.distanceTo(b);
  } else {
    const cp = a.clone().add(ab.clone().multiplyScalar(d));
    distance = point.distanceTo(cp);
  }

  return [d, distance];
}

function GetVector2(vector: Vector3) {
  return new Vector2(vector.x, vector.z);
}

function GetVector3(vector: Vector2) {
  return new Vector3(vector.x, 0, vector.y);
}

function V3toS(vector: Vector3) {
  return vector.toArray().toString();
}

function V2toS(vector: Vector2) {
  return vector.toArray().toString();
}

function GetSingedAngle(vector1: Vector3, vector2: Vector3) {
  const crossVector = new THREE.Vector3();
  crossVector.crossVectors(vector1, vector2).normalize();
  const angle = THREE.MathUtils.radToDeg(vector1.angleTo(vector2));
  const signedAngle = angle * (crossVector.dot(new THREE.Vector3(0, 1, 0)) < 0 ? -1 : 1);
  return signedAngle;
}

function AreNodesAdjacent(node1: Node, node2: Node) {
  if (node1.IsIdentical(node2)) return false;
  return (
    node1.y === node2.y && (node1.x === node2.x || node1.z === node2.z) && node1.vector.distanceTo(node2.vector) <= step
  );
}

function RenderNode(node: Node, color: number): Mesh {
  const sphereGeometry = new THREE.BoxGeometry(0.1, 1, 0.1);
  let mat: THREE.MeshBasicMaterial;
  if (node.corridorMember) mat = new THREE.MeshBasicMaterial({ color: 0xc2a17d });
  else if (node.corner) mat = new THREE.MeshBasicMaterial({ color: 0x41368a });
  else mat = new THREE.MeshBasicMaterial({ color: color });
  const sphereMesh = new THREE.Mesh(sphereGeometry, mat);

  APP.world.scene.add(sphereMesh);
  sphereMesh.position.set(node.x, node.y, node.z);
  return sphereMesh;
}

function RenderNodes(nodes: Array<Node>, color: number) {
  nodes.forEach(node => {
    RenderNode(node, color);
  });
}

function AreIntersecting(p1: Vector2, p3: Vector2, p4: Vector2, p2: Vector2) {
  const d = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
  if (d === 0) return false;

  const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / d;
  const u = (((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / d) * -1;

  return t >= 0 && u >= 0 && t <= 1 && u <= 1;
}

function IsPointInside(point: Vector2, vertices: Array<Vector2>, inversed = false) {
  const verticeArray = [...vertices];

  if (
    verticeArray[0].x !== verticeArray[verticeArray.length - 1].x ||
    verticeArray[0].y !== verticeArray[verticeArray.length - 1].y
  )
    verticeArray.push(new Vector2().copy(verticeArray[0]));

  let crosstimes = 0;
  for (let j = 0; j < verticeArray.length - 1; j++) {
    const [per, segtod] = SegToPointDist(point, verticeArray[j], verticeArray[j + 1]);
    const boundry = per > 0 && per < 1 ? step : step * Math.sqrt(2);
    if (segtod <= boundry) return inversed;

    if (AreIntersecting(point, verticeArray[j], verticeArray[j + 1], outsidePoint)) crosstimes++;
  }
  const isInside = crosstimes % 2 === 1;

  return isInside;
}

function CrossingTimes(point: Vector2, vertices: Array<Vector2>, externalPoint: Vector2 = outsidePoint) {
  const verticeArray = [...vertices];

  if (
    verticeArray[0].x !== verticeArray[verticeArray.length - 1].x ||
    verticeArray[0].y !== verticeArray[verticeArray.length - 1].y
  )
    verticeArray.push(new Vector2().copy(verticeArray[0]));

  let crosstimes = 0;
  for (let j = 0; j < verticeArray.length - 1; j++)
    if (AreIntersecting(point, verticeArray[j], verticeArray[j + 1], externalPoint)) crosstimes++;

  return crosstimes;
}

function GetClosestIndex(position: Vector3, positionArray: Vector3[]) {
  let max = INF;
  let index = -1;
  for (let i = 0; i < positionArray.length; i++) {
    const distance = positionArray[i].manhattanDistanceTo(position);
    if (distance < max) {
      max = distance;
      index = i;
    }
  }
  return index;
}

function Orient(vector1: Vector3, vector2: Vector3): { action: string; direction: string; angle: number } {
  let stairs = false;
  let action: "turn" | "stairs" | "continue" = "turn";
  let direction: "down" | "around" | "left" | "right" | "up" | "down" | "forward";

  const crossVector = new THREE.Vector3();
  crossVector.crossVectors(vector1, vector2).normalize();

  if (vector1.y !== 0) vector1.y = 0;
  if (vector2.y !== 0) {
    action = "stairs";
    if (vector2.y > 0) direction = "up";
    else direction = "down";
    vector2.y = 0;
    stairs = true;
  }

  const angle = THREE.MathUtils.radToDeg(vector1.angleTo(vector2));
  const signedAngle = angle * (crossVector.dot(new THREE.Vector3(0, 1, 0)) < 0 ? -1 : 1);

  if (!stairs) {
    if (angle > 90) direction = "around";
    else if (signedAngle > 10) direction = "left";
    else if (signedAngle < -10) direction = "right";
    else {
      action = "continue";
      direction = "forward";
    }
  }
  return { action: action, direction: direction!, angle: Math.floor(signedAngle) };
}

//------------------------------ classes ----------------------------------//

export class Node {
  vector: Vector3;
  visited: boolean;
  path: Array<number>;
  distances: Array<number>;
  x: number;
  y: number;
  z: number;
  neighboors: Record<number, number>;
  corridorMember: boolean;
  targetNode: string | null;
  corner: boolean;

  constructor(x: number, y: number, z: number) {
    this.vector = new THREE.Vector3(x, y, z);
    this.visited = false;
    this.path = [];

    this.neighboors = {};
    this.x = this.vector.x;
    this.y = this.vector.y;
    this.z = this.vector.z;
    this.corridorMember = false;
    this.corner = false;
    this.targetNode = null;
  }

  MakeStartingPoint(nodeCount: number, index: number) {
    this.distances = new Array(nodeCount).fill(INF);
    this.distances[index] = 0;
    this.path.push(index);
  }

  Visit() {
    this.visited = true;
  }

  Reset() {
    this.visited = false;
    this.path = [];
  }

  IsIdentical(node: Node) {
    return node.x === this.x && node.y === this.x && node.z === this.z;
  }
}

export class NavigationSystem {
  allowed: boolean;
  nodes: Array<Node>;
  weights: Array<Array<number>>;
  targetName: Record<string, number>;
  objects: Record<string, Vector3>;
  targetNodes: Record<string, Array<number>>;
  grid: Array<Array<number>>;
  roomDimensions: [number, number, number, number];
  obstacles: Array<Array<Vector2>>;
  nodeCount: number | null;
  mapped: boolean;
  mappedNodes: Array<boolean>;
  paths: Array<Array<Array<number>>>;
  dest: { active: boolean; pos?: Node; time?: Date };
  navProps: NavigationProperties;
  cuesEid: number;
  cuesObj: Object3D;
  activeDest: boolean;
  nodeObjs: Array<Mesh>;
  roomPolygon: Array<Vector2>;

  constructor() {
    this.allowed = false;
    this.nodes = [];
    this.targetName = {};
    this.targetNodes = {};
    this.nodeCount = null;
    this.mapped = false;
    this.dest = { active: false };
    this.objects = {};
  }

  calculateCorridors(direction: "vertical" | "horizontal") {
    const isVertical = direction === "vertical";
    const lineCount = this.grid.length;
    const rowCount = this.grid[0].length;

    const getPoint = (outerIndex: number, innerIndex: number) =>
      isVertical ? this.grid[outerIndex][innerIndex] : this.grid[innerIndex][outerIndex];

    const setCorridorMember = (point: number) => (this.nodes[point].corridorMember = true);
    const isCorridorMember = (point: number) => this.nodes[point].corridorMember;

    for (let outerIndex = 0; outerIndex < (isVertical ? lineCount : rowCount); outerIndex++) {
      const points = []; //even index is startPoint odd is endPoint

      for (let innerIndex = 0; innerIndex < (isVertical ? rowCount : lineCount); innerIndex++) {
        const point = getPoint(outerIndex, innerIndex);

        if (isCorridorMember(point)) continue;

        if (!!point && points.length % 2 === 0) points.push(innerIndex);
        else if (!point && points.length % 2 === 1) points.push(innerIndex - 1);
      }

      for (let k = 0; k < points.length; k += 2) {
        let startPoint = points[k];
        let endPoint = points[k + 1];

        // if (endPoint - startPoint <= 3) {
        let stopOuterIndex = outerIndex;

        for (let i = outerIndex + 1; i < (isVertical ? lineCount : rowCount); i++) {
          let bordersOk = startPoint > 0 ? !getPoint(i, startPoint - 1) : true;
          bordersOk &&= endPoint < (isVertical ? rowCount : lineCount) - 2 ? !getPoint(i, endPoint + 1) : true;

          let pointCount = 0;
          for (let j = startPoint; j <= endPoint; j++) if (!!getPoint(i, j)) pointCount += 1;

          bordersOk &&= pointCount >= endPoint - startPoint + 1;
          if (bordersOk) stopOuterIndex = i;
          else break;
        }

        if (stopOuterIndex - outerIndex > 3 * (endPoint - startPoint) + 1) {
          for (let i = outerIndex; i <= stopOuterIndex; i++) {
            for (let j = points[k]; j <= points[k + 1]; j++) {
              setCorridorMember(getPoint(i, j));
            }
          }
        }
        // }
      }
    }
  }

  findCorners() {
    for (let i = 0; i < this.grid.length; i++) {
      const gridLine = this.grid[i];
      for (let j = 0; j < gridLine.length; j++) {
        const point = this.nodes[gridLine[j]];
        if (point.corridorMember) continue;
        let corridorCount = 0;
        let cornerCount = 0;
        for (let key in point.neighboors) {
          if (this.nodes[parseInt(key)].corridorMember) corridorCount++;
          if (this.nodes[parseInt(key)].corner) cornerCount++;
        }

        if (corridorCount > 1 || cornerCount > 0) point.corner = true;
      }
    }
  }

  async Init() {
    this.allowed = roomPropertiesReader.AllowsNav;

    if (!this.allowed) {
      console.warn("Navigation is not allowed for this room");
      return;
    }
    console.log("navigation is allowed");

    this.navProps = roomPropertiesReader.navProps;
    this.nodes = [];
    this.targetName = {};
    this.obstacles = [];
    this.roomPolygon = [];

    let targets, roomObjects;
    try {
      this.roomDimensions = this.navProps.dimensions!;

      this.navProps.obstacles!.forEach(obstacle =>
        this.obstacles.push(obstacle.map(obstaclePoint => new Vector2(obstaclePoint[0], obstaclePoint[1])))
      );
      this.roomPolygon = this.navProps.polygon!.map(point => new Vector2(point[0], point[1]));

      targets = this.navProps.targets;
      roomObjects = this.navProps.objects;

      if (!this.roomDimensions.length || !this.obstacles.length || !this.roomPolygon.length || !targets || !roomObjects)
        throw new Error("Could not read nav props");
    } catch (e) {
      this.allowed = false;
      console.error(e);
      return;
    }

    this.grid = new Array(Math.floor(this.roomDimensions[1] / step));

    for (let i = 0; i < this.grid.length; i++)
      this.grid[i] = new Array(Math.floor(this.roomDimensions[3] / step)).fill(0);

    for (let x = this.roomDimensions[0]; x < this.roomDimensions[1]; x += step) {
      for (let z = this.roomDimensions[2]; z < this.roomDimensions[3]; z += step) {
        const point = new Vector2(x, z);

        let isInsideBox = false;
        for (let i = 0; i < this.obstacles.length; i++) {
          const obstacle = [...this.obstacles[i]];

          if (IsPointInside(point, obstacle, true)) {
            isInsideBox = true;
            break;
          }
        }
        if (isInsideBox) continue;

        if (IsPointInside(point, [...this.roomPolygon], false)) {
          const newIndex = this.nodes.push(new Node(point.x, 0, point.y)) - 1;
          this.grid[x][z] = newIndex;
        }
      }
    }

    this.calculateCorridors("vertical");
    this.calculateCorridors("horizontal");

    targets.forEach(target => {
      const targetPos = target.position;
      const targetNode = new Node(targetPos[0], 0, targetPos[1]);
      const closestIndices = this.GetClosestIndices(targetNode.vector);
      this.targetNodes[target.name] = closestIndices;
      this.targetName[target.name] = closestIndices[0];
      this.nodes[closestIndices[0]].targetNode = target.name;
    });

    roomObjects.forEach(object => (this.objects[object.name] = new Vector3(object.position[0], 0, object.position[1])));
    console.log(this.objects);

    const targetNodeArray = Object.values(this.targetName).map(index => this.nodes[index]);

    this.weights = new Array(this.nodes.length);
    for (let i = 0; i < this.nodes.length; i++) this.weights[i] = new Array(this.nodes.length).fill(-1);

    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        if (AreNodesAdjacent(this.nodes[i], this.nodes[j])) {
          const distance = this.nodes[i].vector.manhattanDistanceTo(this.nodes[j].vector);

          if (distance > 0) {
            this.weights[i][j] = distance;
            this.weights[j][i] = distance;
            this.nodes[i].neighboors[j] = distance;
            this.nodes[j].neighboors[i] = distance;
          }
        }
      }
    }

    this.nodes.forEach(node => {
      let count = 0;
      Object.keys(node.neighboors).forEach(_ => {
        count++;
      });
      if (count === 0) {
        console.error(node.x, node.z);
      }
    });

    this.nodeCount = this.nodes.length;
    this.mapped = false;
    this.mappedNodes = new Array(this.nodeCount).fill(false);
    this.paths = new Array(this.nodeCount);
    for (let j = 0; j < this.nodeCount; j++) this.paths[j] = [];

    this.findCorners();
    RenderNodes(this.nodes, 0xfffff);
  }

  GetDestIndex(salientName: string): number {
    if (Object.keys(this.targetName).includes(salientName)) return this.targetName[salientName];
    return -1;
  }

  Dijkstra(startIndex: number) {
    if (startIndex < 0 || startIndex > this.nodeCount! - 1) throw new Error("Invalid starting index");
    if (this.mapped) this.Reset();

    let prevNodeIndex = -1;
    let startingNode = this.nodes[startIndex];
    startingNode.MakeStartingPoint(this.nodeCount!, startIndex);

    for (let i = 0; i < this.nodeCount! - 1; i++) {
      const minDistanceIndex = this.GetMinDistanceIndex(startingNode.distances);
      this.nodes[minDistanceIndex].Visit();

      for (let j = 0; j < this.nodeCount!; j++) {
        if (!this.nodes[j].visited && this.nodes[j].neighboors[minDistanceIndex]) {
          let totalDistance = startingNode!.distances[minDistanceIndex] + this.nodes[j].neighboors[minDistanceIndex];
          let nodePath: Array<number> = this.nodes[minDistanceIndex].path;

          let prevVec, curVec, nextVec: Vector3;

          if (nodePath.length > 1) {
            prevVec = this.nodes[nodePath[nodePath.length - 2]].vector.clone();
            curVec = this.nodes[minDistanceIndex].vector.clone();
            nextVec = this.nodes[j].vector.clone();
            prevVec.setY(curVec.y);
          } else {
            prevVec = this.nodes[startIndex].vector.clone();
            curVec = this.nodes[minDistanceIndex].vector.clone();
            nextVec = this.nodes[j].vector.clone();
            prevVec.setY(curVec.y);
          }

          const ax = curVec.clone().sub(prevVec.clone()).normalize();
          const xb = nextVec.clone().sub(curVec.clone()).normalize();
          const cross = xb.cross(ax);

          if (cross.length() !== 0) totalDistance += 0.1;

          if (totalDistance < startingNode.distances[j]) {
            startingNode.distances[j] = totalDistance;
            this.nodes[j].path = [...this.nodes[minDistanceIndex].path, j];
          }
        }
        this.paths[startIndex][j] = this.nodes[j].path;
      }

      prevNodeIndex = minDistanceIndex;
    }

    this.mapped = true;
    this.mappedNodes[startIndex] = true;
  }

  GetMinDistanceIndex(distances: Array<number>) {
    let minDistance = INF;
    let minDistanceIndex = -1;

    for (let i = 0; i < this.nodeCount!; i++) {
      let nodeDistance = distances[i];

      if (!this.nodes[i].visited && nodeDistance < minDistance) {
        minDistance = distances[i];
        minDistanceIndex = i;
      }
    }
    return minDistanceIndex;
  }

  GetNewInstructions(path: Array<number>, playerForward: Vector3) {
    // ------------------- get line object ------------------- //
    const nodeLines: Array<Array<Node>> = [];
    const instructions: Array<string> = [];
    const turnArray: Array<"turn right" | "turn left" | "turn around" | "go forward"> = [];

    let nodeLineArray: Array<Node> = [];
    for (let i = 0; i < path.length - 1; i++) {
      const currentNode = this.nodes[path[i]];
      const current = currentNode.vector;
      const next = this.nodes[path[i + 1]].vector;
      const nextLine = next.clone().sub(current);
      const prevLine = new Vector3();

      if (i === 0) prevLine.copy(playerForward);
      else {
        const prev = this.nodes[path[i - 1]].vector;
        prevLine.copy(current.clone().sub(prev));
      }

      const angle = GetSingedAngle(prevLine, nextLine);

      nodeLineArray.push(currentNode);
      if (i === 0 || angle !== 0) {
        if (Math.abs(angle) > 90) turnArray.push("turn around");
        else if (Math.abs(angle) <= 20) turnArray.push("go forward");
        else if (angle < 0) turnArray.push("turn right");
        else turnArray.push("turn left");
        if (i !== 0) {
          nodeLines.push(nodeLineArray);
          nodeLineArray = [currentNode];
        }
      }
    }

    nodeLines.push(nodeLineArray);
    const vectorLines: Array<Array<Vector3>> = nodeLines.map(innerLine => innerLine.map(node => node.vector));

    const targetVectors: Record<string, Vector3> = {};
    for (let key in this.targetName) {
      targetVectors[key] = this.nodes[this.targetName[key]].vector;
    }

    const allObjects = { ...this.objects, ...targetVectors };

    for (let lineIndex = 0; lineIndex < nodeLines.length; lineIndex++) {
      const line = vectorLines[lineIndex];
      console.log("line", lineIndex);

      // ------------------- get closest object of every point in line ------------------- //

      const objArray: Array<Vector3> = new Array(line.length);
      const objNameArray: Array<string> = new Array(line.length);
      const lineDirection = line[line.length - 1].clone().sub(line[0]).normalize();

      line.forEach((point, index) => {
        const closestInd = GetClosestIndex(point, Object.values(allObjects));
        objArray[index] = Object.values(allObjects)[closestInd];
        objNameArray[index] = Object.keys(allObjects)[closestInd];
      });

      const crossingObjects: Array<Array<string>> = [];

      let location = "";
      let prevAngle = 0;
      let prevVisibility = false;
      let visibilityCount = 0;
      let prevDistance = 0;
      let approachingCount = 0;
      let visibleIndex = line.length - 1;
      let inCorner = false;
      let inCorridor = false;
      let sameClosestObjCount = 0;
      let currentDistance = 0;
      let invisibilityCount = 0;

      // ------------------- get last point index that has visible closest point  ------------------- //
      while (CrossingTimes(GetVector2(line[visibleIndex]), this.roomPolygon, GetVector2(objArray[visibleIndex])) !== 0)
        visibleIndex--;

      // ------------------- get array of all closest points in line  ------------------- //

      const initSet: Set<Vector3> = new Set();
      const filteredIndices: Array<number> = [];

      objArray.forEach((vector, index) => {
        if (!initSet.has(vector)) {
          initSet.add(vector);
          filteredIndices.push(index);
        }
      });

      const ObjVectorSet = filteredIndices.map(index => objArray[index]);
      const ObjNameSet = filteredIndices.map(index => objNameArray[index]);

      // ------------------- iterate objects || iterate once points to calculate all metrics  ------------------- //

      const visibleIndexName = objNameArray[visibleIndex];

      for (let objectIndex = 0; objectIndex < ObjVectorSet.length; objectIndex++) {
        const object = ObjVectorSet[objectIndex];
        visibilityCount = 0;

        for (let pointIndex = 0; pointIndex < line.length; pointIndex++) {
          const point = line[pointIndex];
          const pointToObj = object.clone().sub(point);

          const angle = GetSingedAngle(lineDirection, pointToObj.clone().normalize());
          const crossing = CrossingTimes(GetVector2(point), this.roomPolygon, GetVector2(object)) !== 0;

          if (Math.abs(angle) < 75 && !crossing) {
            visibilityCount++;
            prevVisibility = true;
            invisibilityCount = 0;
          } else {
            invisibilityCount = prevVisibility ? 1 : invisibilityCount + 1;
            prevVisibility = false;
          }

          prevAngle = angle;

          if (objectIndex > 0) continue;

          const pointToclosest = objArray[visibleIndex].clone().sub(point);
          const closestObjAngle = GetSingedAngle(lineDirection, pointToclosest.normalize());

          if (nodeLines[lineIndex][pointIndex].corridorMember) inCorridor = true;

          if (pointIndex <= visibleIndex) {
            sameClosestObjCount = objNameArray[pointIndex] === visibleIndexName ? sameClosestObjCount + 1 : 0;
            currentDistance = pointToclosest.length();

            if (sameClosestObjCount > 0) approachingCount = currentDistance <= prevDistance ? approachingCount + 1 : 0;
            if (sameClosestObjCount >= 0) prevDistance = currentDistance;
          }

          if (pointIndex === line.length - 1) {
            inCorner = nodeLines[lineIndex][pointIndex].corner;
            console.log(approachingCount, sameClosestObjCount, closestObjAngle, currentDistance);

            if (
              approachingCount > Math.min(0, sameClosestObjCount) &&
              line.length >= 4 &&
              ((currentDistance < 7 && Math.abs(closestObjAngle) < 75) || currentDistance <= 2)
            ) {
              location = objNameArray[pointIndex];
            }
          }
        }

        if (visibilityCount > 0 && invisibilityCount > 2 && Math.abs(prevAngle) > 90)
          crossingObjects.push([
            ObjNameSet[objectIndex],
            `${ObjNameSet[objectIndex] === "wall opening" ? "" : prevAngle < 0 ? "right" : "left"}`
          ]);
      }

      instructions.push(turnArray[lineIndex]);
      if (line.length > 5) {
        if (inCorridor) instructions.push("pass corridor");

        crossingObjects.forEach(object => {
          instructions.push(`crossing ${object[0]} ${object[1]}`);
        });
        let arriving;
        console.log(location);
        if (inCorner) arriving = "corner";
        else if (location.length > 0) arriving = location;
        else arriving = "wall";
        instructions.push(`arrive ${arriving}`);
      }
    }

    console.log(`dataset`, instructions.filter(value => value !== "").join(", "));
  }

  GetInstructions(startPos: Vector3, stopName: string) {
    this.RemoveCues();
    const startIndex = this.GetClosestIndices(startPos)[0];
    const stopIndex = this.GetDestIndex(stopName);

    if (stopIndex < 0 || !this.allowed) return { path: [], instructions: [], knowledge: "no location", valid: false };

    if (!this.mappedNodes[startIndex]) {
      if (this.mapped) this.Reset();
      this.Dijkstra(startIndex);
    }

    const path = this.paths[startIndex][stopIndex];
    const pathVectors: Array<Vector3> = [];

    path.forEach(index => {
      pathVectors.push(this.nodes[index].vector);
    });

    const navigation: Navigation = {
      path: pathVectors,
      instructions: [{ action: "start", from: startIndex }],
      knowledge: "",
      valid: false
    };

    const knowledgeArray: Array<Record<string, any>> = [{ action: "start" }];
    const playerForward = avatarDirection();

    let distanceSum = 0;

    this.GetNewInstructions(path, playerForward);

    for (let i = 0; i < path.length - 1; i++) {
      const current = this.nodes[path[i]].vector;
      const next = this.nodes[path[i + 1]].vector;

      const nextLine = next.clone().sub(current);
      const prevLine = new THREE.Vector3();

      let prev;

      if (i === 0) prevLine.copy(playerForward);
      else {
        prev = this.nodes[path[i - 1]].vector;
        prevLine.copy(current.clone().sub(prev));
      }

      // console.log(GetSingedAngle(prevLine.normalize(), nextLine.normalize()));

      let closestObject;
      let closestObjectIndex = GetClosestIndex(current, Object.values(this.objects));
      if (closestObjectIndex > 0) closestObject = Object.values(this.objects)[closestObjectIndex];

      const turn = Orient(prevLine.clone().normalize(), nextLine.clone().normalize());
      const extendedTurn = { ...turn, line: nextLine.clone().normalize(), current: current };

      navigation.instructions.push(extendedTurn);

      navigation.instructions.push({
        action: "move",
        from: path[i],
        to: path[i + 1],
        distance: Math.floor(nextLine.length())
      });

      if (turn.action === "turn" || turn.action === "stairs") {
        if (distanceSum !== 0) knowledgeArray.push({ action: "move", distance: distanceSum });
        knowledgeArray.push({ action: turn.action, direction: turn.direction });
        distanceSum = 0;
      }

      distanceSum += Math.floor(nextLine.length());
    }

    navigation.instructions.push({ action: "finish", to: stopIndex });
    knowledgeArray.push({ action: "move", distance: distanceSum }, { action: "finish" });
    navigation.knowledge = knowledgeArray
      .map(actionObj => {
        const { action, direction, distance } = actionObj;
        if (distance) {
          return `${action} ${distance}`;
        } else if (direction) {
          return `${action} ${direction}`;
        } else {
          return `${action}`;
        }
      })
      .join(", ");

    navigation.valid = true;
    this.dest.pos = this.nodes[stopIndex];
    // console.log(`Destination has changed to:`, navigation);
    return navigation;
  }

  Reset() {
    this.nodes.forEach(node => {
      node.Reset();
    });
  }

  GetIdenticalNode(node: Node): number {
    let max = INF;
    let index = -1;
    for (let i = 0; i < this.nodes.length; i++) {
      const distance = this.nodes[i].vector.manhattanDistanceTo(node.vector);
      if (distance < max) {
        max = distance;
        index = i;
      }
    }
    return max === 0 ? index : -1;
  }

  GetClosestIndices(position: Vector3): number[] {
    let indices = new Array<number>();
    let max = INF;
    for (let i = 0; i < this.nodes.length; i++) {
      const distance = this.nodes[i].vector.manhattanDistanceTo(position);
      if (distance === max) {
        indices.push(i);
      } else if (distance < max) {
        max = distance;
        indices = [i];
      }
    }
    return indices;
  }

  RenderCues(navigation: Navigation) {
    try {
      // this.RenderNodes(navigation.path, 0x00ffff);
      this.cuesEid = renderAsEntity(APP.world, NavigationCues(navigation));
      this.cuesObj = APP.world.eid2obj.get(this.cuesEid)!;
      APP.scene!.object3D.add(this.cuesObj);
      this.dest.active = true;
      this.dest.time = new Date();
      // console.log("Destination is now active: ", this.dest);
    } catch (error) {
      console.log(error);
    }
  }

  RemoveCues() {
    if (!!this.cuesEid) {
      removeEntity(APP.world, this.cuesEid);
      APP.scene!.object3D.remove(this.cuesObj);
      this.dest = { active: false };
      this.cuesEid = -1;
    }
  }

  StopNavigating() {
    if (this.dest.active) {
      this.RemoveCues();
    }
  }

  ShouldFinish() {
    if (avatarPos().distanceTo(this.dest.pos!.vector) < 3) {
      this.StopNavigating();
      virtualAgent.UpdateWithRandomPhrase("success");
    }
    // else if (new Date() - this.dest.time > 30000) this.StopNavigating("cleared");
  }
}

export const navSystem = new NavigationSystem();

export function NavigatingSystem(world: HubsWorld) {
  if (!navSystem.dest.active) return;
  navSystem.ShouldFinish();
}
