import { DiscreteInterpolant, Vector2, Vector3 } from "three";
import VirtualAgent, { virtualAgent } from "./agent-system";
import { GetProperties, PropertyType, roomPropertiesReader } from "../utils/rooms-properties";
import { node, object } from "prop-types";
import { renderAsEntity } from "../utils/jsx-entity";
import { removeEntity } from "bitecs";
import { NavigationCues } from "../prefabs/nav-line";
import { distanceAndSkiddingToXY } from "@popperjs/core/lib/modifiers/offset";

function matrixInverse(matrix) {
  let det = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
  return [
    [matrix[1][1] / det, -matrix[0][1] / det],
    [-matrix[1][0] / det, matrix[0][0] / det]
  ];
}

function matrixMultiplication(matrixA, matrixB) {
  return [
    matrixA[0][0] * matrixB[0] + matrixA[0][1] * matrixB[1],
    matrixA[1][0] * matrixB[0] + matrixA[1][1] * matrixB[1]
  ];
}

function SegToPointDist(point, sp1, sp2) {
  const a = new Vector2(sp1[0], sp1[1]);
  const b = new Vector2(sp2[0], sp2[1]);
  const p = new Vector2(point[0], point[1]);

  const ab = b.clone().sub(a);
  const ap = p.clone().sub(a);
  const proj = ap.dot(ab);
  const abLengthSq = ab.lengthSq();
  const d = proj / abLengthSq;

  let distance;

  if (a.manhattanDistanceTo(p) === 0) return [0, 0];
  if (b.manhattanDistanceTo(p) === 0) return [0, 0];

  if (d <= 0) {
    distance = p.distanceTo(a);
  } else if (d >= 1) {
    distance = p.distanceTo(b);
  } else {
    const cp = a.clone().add(ab.clone().multiplyScalar(d));
    distance = p.distanceTo(cp);
  }

  return [d, distance];
}

const step = 1;
const outsidePoint = [15.7, 68.7];

const INF = Number.MAX_SAFE_INTEGER;
export class Node {
  constructor(x, y, z) {
    this.vector = new THREE.Vector3(x, y, z);
    this.visited = false;
    this.path = [];
    this.distances = null;
    this.neighboors = {};
    this.x = this.vector.x;
    this.y = this.vector.y;
    this.z = this.vector.z;
  }

  MakeStartingPoint(nodeCount, index) {
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
    this.distances = null;
  }

  IsIdentical(node) {
    return node.x === this.x && node.y === this.x && node.z === this.z;
  }
}

export class NavigationSystem {
  constructor() {
    this.allowed = false;
    this.nodes = [];
    this.targetInfo = {};
    this.nodeCount = null;
    this.mapped = false;
    this.mappedNodes = null;
    this.paths = null;
    this.quesEid = null;
    this.quesObj = null;
    this.dest = { active: false, pos: null, time: null };
  }

  async Init(hubsProperties) {
    roomPropertiesReader.waitForProperties().then(() => {
      this.allowed = roomPropertiesReader.navProps.allow;

      if (!this.allowed) {
        console.warn("Navigation is not allowed for this room");
        return;
      }

      this.navProps = roomPropertiesReader.navProps;
      this.nodes = [];
      this.targetInfo = {};

      const roomDimensions = this.navProps.dimensions;
      const obstacles = this.navProps.obstacles;
      const polygonPoints = this.navProps.polygon;
      const targets = this.navProps.targets;

      for (let x = roomDimensions[0]; x < roomDimensions[1]; x += step) {
        for (let z = roomDimensions[2]; z < roomDimensions[3]; z += step) {
          const point = [x, z];

          let isInsideBox = false;
          for (let i = 0; i < obstacles.length; i++) {
            const obstacle = obstacles[i];
            if (this.IsPointInside(point, obstacle, true)) {
              isInsideBox = true;
              break;
            }
          }
          if (isInsideBox) {
            console.log(x, z, `is inside box`);
            continue;
          }
          if (this.IsPointInside(point, polygonPoints, false)) this.nodes.push(new Node(point[0], 0, point[1]));
        }
      }

      targets.forEach(target => {
        const targetPos = target.position;
        const targetNode = new Node(targetPos[0], 0, targetPos[1]);

        let minDistanceNodeIndex;
        let minDistance = INF;
        this.nodes.forEach((node, index) => {
          const dist = targetNode.vector.distanceTo(node.vector);
          if (dist < minDistance) {
            minDistance = dist;
            minDistanceNodeIndex = index;
          }
        });

        if (targetPos[1] % step !== 0) {
          const helperNode = new Node(targetPos[0], 0, this.nodes[minDistanceNodeIndex].z);
          minDistanceNodeIndex = this.nodes.push(helperNode) - 1;
          minDistance = helperNode.vector.distanceTo(targetNode.vector);
        }

        const targetIndex = this.nodes.push(targetNode) - 1;
        this.targetInfo[target.name] = targetIndex;

        this.nodes[minDistanceNodeIndex].neighboors[targetIndex] = minDistance;
        this.nodes[targetIndex].neighboors[minDistanceNodeIndex] = minDistance;
      });

      for (let i = 0; i < this.nodes.length; i++) {
        for (let j = i + 1; j < this.nodes.length; j++) {
          if (this.AreNodesAdjacent(this.nodes[i], this.nodes[j])) {
            const distance = this.nodes[i].vector.manhattanDistanceTo(this.nodes[j]);
            if (distance > 0) {
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
        if (count === 0) console.log(node.x, node.z);
      });

      this.nodeCount = this.nodes.length;
      this.mapped = false;
      this.mappedNodes = new Array(this.nodeCount).fill(false);
      this.paths = new Array(this.nodeCount);
      for (let j = 0; j < this.nodeCount; j++) this.paths[j] = [];
    });
  }

  AreNodesAdjacent(node1, node2) {
    if (node1.IsIdentical(node2)) return false;
    return (
      node1.y === node2.y &&
      (node1.x === node2.x || node1.z === node2.z) &&
      node1.vector.distanceTo(node2.vector) <= step
    );
  }

  RenderNodes(nodes, color) {
    nodes.forEach(node => this.RenderNode(node, color));
  }

  RenderNode(node, color) {
    const sphereGeometry = new THREE.BoxGeometry(0.1, 1, 0.1);
    const mat = new THREE.MeshBasicMaterial({ color: color });
    const sphereMesh = new THREE.Mesh(sphereGeometry, mat);

    APP.world.scene.add(sphereMesh);
    sphereMesh.position.set(node.x, node.y, node.z);
  }

  IsPointInside(point, vertices, inversed = false) {
    if (vertices[0][0] !== vertices[vertices.length - 1][0] || vertices[0][1] !== vertices[vertices.length - 1][1])
      vertices.push(vertices[0]);

    let crosstimes = 0;
    for (let j = 0; j < vertices.length - 1; j++) {
      const a = outsidePoint;
      const b = point;
      const c = vertices[j + 1].map((val, ind) => val - vertices[j][ind]);
      const d = vertices[j];

      const [per, segtod] = SegToPointDist(point, vertices[j], vertices[j + 1]);
      console.log(per, segtod);

      const boundry = per > 0 && per < 1 ? step : step * Math.sqrt(2);

      if (segtod <= boundry) return inversed;

      const inversedMatrix = [
        [a[0], -c[0]],
        [a[1], -c[1]]
      ];
      const ts = matrixMultiplication(matrixInverse(inversedMatrix), [d[0] - b[0], d[1] - b[1]]);

      if (ts && ts[0] > 0 && ts[1] >= 0 && ts[1] < 1) crosstimes++;
    }

    const isInside = crosstimes % 2 === 1;

    return isInside;
  }

  GetDestIndex(salientName) {
    if (Object.keys(this.targetInfo).includes(salientName)) return this.targetInfo[salientName];
    return false;
  }

  Dijkstra(startIndex) {
    if (startIndex < 0 || startIndex > this.nodeCount - 1) throw new Error("Invalid starting index");
    if (this.mapped) {
      this.Reset();
    }

    let startingNode = this.nodes[startIndex];
    startingNode.MakeStartingPoint(this.nodeCount, startIndex);
    for (let i = 0; i < this.nodeCount - 1; i++) {
      const minDistanceIndex = this.GetMinDistanceIndex(startingNode.distances, this.nodes);

      console.log(minDistanceIndex);
      this.nodes[minDistanceIndex].Visit();

      for (let j = 0; j < this.nodeCount; j++) {
        if (!this.nodes[j].visited && this.nodes[j].neighboors[minDistanceIndex]) {
          const totalDistance = startingNode.distances[minDistanceIndex] + this.nodes[j].neighboors[minDistanceIndex];

          if (totalDistance < startingNode.distances[j]) {
            startingNode.distances[j] = totalDistance;

            this.nodes[j].path = [...this.nodes[minDistanceIndex].path, j];
          }
        }
        this.paths[startIndex][j] = this.nodes[j].path;
      }
    }

    this.mapped = true;
    this.mappedNodes[startIndex] = true;
  }

  GetInstructions(startPos, stopName) {
    this.RemoveCues();
    const startIndex = this.GetClosestIndex(startPos);
    const stopIndex = this.GetDestIndex(stopName);

    if (!stopIndex || !this.allowed) return { path: [], instructions: [], knowledge: "no location", valid: false };

    if (!this.mappedNodes[startIndex]) {
      if (this.mapped) this.Reset();
      this.Dijkstra(startIndex);
    }

    const path = this.paths[startIndex][stopIndex];
    const pathVectors = [];

    path.forEach(index => {
      pathVectors.push(this.nodes[index].vector);
    });

    const navigation = {
      path: pathVectors,
      instructions: [{ action: "start", from: startIndex }]
    };

    const knowledgeArray = [{ action: "start" }];
    const playerForward = virtualAgent.avatarDirection;

    let distanceSum = 0;

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

      const turn = this.Orient(prevLine.clone().normalize(), nextLine.clone().normalize());
      turn.line = nextLine.clone().normalize();
      turn.current = current;

      navigation.instructions.push(turn);

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
    navigation["knowledge"] = knowledgeArray
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

    navigation["valid"] = true;
    this.dest.pos = this.nodes[stopIndex];
    console.log(`Destination has changed to:`, this.dest);
    return navigation;
  }

  Orient(vector1, vector2) {
    let stairs = false;
    let action = "turn";
    let direction;

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
    return { action: action, direction: direction, angle: Math.floor(signedAngle) };
  }

  GetMinDistanceIndex(distances, nodes) {
    let minDistance = INF;
    let minDistanceIndex = -1;

    for (let i = 0; i < this.nodeCount; i++) {
      if (!nodes[i].visited && distances[i] < minDistance) {
        minDistance = distances[i];
        minDistanceIndex = i;
      }
    }
    return minDistanceIndex;
  }

  Reset() {
    this.nodes.forEach(node => {
      node.Reset();
    });
  }

  GetClosestIndex(position) {
    let max = INF;
    let index;
    for (let i = 0; i < this.nodes.length; i++) {
      const distance = this.nodes[i].vector.manhattanDistanceTo(position);
      if (distance < max) {
        max = distance;
        index = i;
      }
    }
    return index;
  }

  FindInArray(myArray, myElement) {
    for (let i = 0; i < myArray.length; i++) {
      if (myArray[i] === myElement) {
        return i; // Element found, return its index
      }
    }
    return -1; // Element not found in the array
  }

  RenderCues(navigation) {
    try {
      // this.RenderNodes(navigation.path, 0x00ffff);
      this.cuesEid = renderAsEntity(APP.world, NavigationCues(navigation));
      this.cuesObj = APP.world.eid2obj.get(this.cuesEid);
      APP.scene.object3D.add(this.cuesObj);
      this.dest.active = true;
      this.dest.time = new Date();
      console.log("Destination is now active: ", this.dest);
    } catch (error) {
      console.log(error);
    }
  }

  RemoveCues() {
    if (!!this.cuesEid) {
      removeEntity(APP.world, this.cuesEid);
      APP.scene.object3D.remove(this.cuesObj);
      this.cuesEid = null;
      this.dest = { active: false, pos: null, time: null };
      console.log("Destination is now inactive: ", this.dest);
    }
  }

  StopNavigating() {
    if (this.dest.active) {
      this.RemoveCues();
    }
  }

  ShouldFinish() {
    if (virtualAgent.avatarPos.distanceTo(this.dest.pos) < 3) {
      this.StopNavigating();
      virtualAgent.UpdateWithRandomPhrase("success");
    }
    // else if (new Date() - this.dest.time > 30000) this.StopNavigating("cleared");
  }
}

export const navSystem = new NavigationSystem(10, 10);

export function NavigatingSystem(world) {
  if (!navSystem.dest.active) return;
  navSystem.ShouldFinish();
}
