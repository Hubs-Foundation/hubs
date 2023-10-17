import { DiscreteInterpolant, Vector3 } from "three";
import { virtualAgent } from "./agent-system";
import { GetRoomProperties } from "../utils/rooms-properties";
import { node } from "prop-types";

const INF = Number.MAX_SAFE_INTEGER;
export class Node {
  constructor(x, y, z) {
    this.vector = new THREE.Vector3(x, y, z);
    this.visited = false;
    this.path = [];
    this.distances = null;
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

class Edge {
  constructor(start, stop) {
    this.distance = this.FindDistance(start, stop);
  }

  FindDistance(v1, v2) {
    return Math.abs(v2.x - v1.x) + Math.abs(v2.z - v1.z);
  }
}

export class Graph {
  constructor() {}

  Init(hubID) {
    const roomProperties = GetRoomProperties(hubID);
    if (!roomProperties) {
      console.error("Cannot read room properties, navigation is not enabled for this room");
      this.enabled = false;
    } else {
      this.enabled = true;
      this.nodes = [];
      this.edges = [];

      const connectorPairs = [];
      const manualIndices = [];
      this.targetInfo = {};

      roomProperties.connectors.forEach(object => {
        const end1 = object.end1;
        const end2 = object.end2;
        const node1 = new Node(end1[0], end1[1], end1[2]);
        const node2 = new Node(end2[0], end2[1], end2[2]);

        let index1 = this.FindInArray(this.nodes, node1);
        if (index1 === -1) {
          index1 = this.nodes.push(node1) - 1;
          manualIndices.push(index1);
        }

        let index2 = this.FindInArray(this.nodes, node2);
        if (index2 === -1) {
          index2 = this.nodes.push(node2) - 1;
          manualIndices.push(index2);
        }
        connectorPairs.push([index1, index2]);
      });

      roomProperties.targets.forEach(target => {
        const value = target.pivot;
        const targetNode = new Node(value[0], value[1], -value[2]);
        const index = this.nodes.push(targetNode) - 1;

        manualIndices.push(index);
        this.targetInfo[target.name] = index;
      });

      roomProperties.dimensions.forEach(dimensionElement => {
        const dimension = dimensionElement.box;
        const height = dimensionElement.height;

        for (let z = dimension[2]; z <= dimension[3]; z++) {
          for (let x = dimension[0]; x <= dimension[1]; x++) {
            let discard = false;
            for (let i = 0; i < roomProperties.targets.length; i++) {
              const exception = roomProperties.targets[i].box;
              const exceptionHeight = roomProperties.targets[i].pivot[1];
              discard =
                x >= exception[0] &&
                x <= exception[1] &&
                z >= exception[2] &&
                z <= exception[3] &&
                height === exceptionHeight;
              if (discard) break;
            }
            const node = new Node(x, height, -z);
            if (!discard) {
              manualIndices.forEach(manualIndex => {
                const manualNode = this.nodes[manualIndex];
                if (manualNode.IsIdentical(node)) {
                  discard = true;
                }
              });
            }
            if (!discard) this.nodes.push(node);
          }
        }
      });

      for (let i = 0; i < this.nodes.length; i++) {
        this.edges.push([]);
        for (let j = 0; j < this.nodes.length; j++) {
          if (i === j || !this.AreNodesAdjacent(this.nodes[i], this.nodes[j])) {
            this.edges[i][j] = null;
          } else {
            this.edges[i][j] = new Edge(this.nodes[i], this.nodes[j]);
          }
        }
      }

      connectorPairs.forEach(pair => {
        const index1 = pair[0];
        const index2 = pair[1];
        this.edges[index1][index2] = new Edge(this.nodes[index1], this.nodes[index2]);
        this.edges[index2][index1] = new Edge(this.nodes[index2], this.nodes[index1]);
      });

      this.nodeCount = this.nodes.length;
      this.mapped = false;
      this.mappedNodes = new Array(this.nodeCount).fill(false);
      this.paths = new Array(this.nodeCount);
      for (let j = 0; j < this.nodeCount; j++) {
        this.paths[j] = [];
      }
    }
  }

  AreNodesAdjacent(node1, node2) {
    return (
      node1.y === node2.y &&
      (node1.x === node2.x || node1.z === node2.z) &&
      node1.vector.distanceTo(node2.vector) <= 1.0
    );
  }

  GetDestIndex(salientName) {
    if (Object.keys(this.targetInfo).includes(salientName)) {
      return this.targetInfo[salientName];
    } else {
      console.error("This point is not a registered salient point");
    }
  }

  Dijkstra(startIndex) {
    if (this.mapped) {
      this.Reset();
    }

    let startingNode = this.nodes[startIndex];
    startingNode.MakeStartingPoint(this.nodeCount, startIndex);

    for (let i = 0; i < this.nodeCount - 1; i++) {
      const minDistanceIndex = this.GetMinDistanceIndex(startingNode.distances, this.nodes, this.edges);

      this.nodes[minDistanceIndex].Visit();

      for (let j = 0; j < this.nodeCount; j++) {
        if (!this.nodes[j].visited && this.edges[minDistanceIndex][j]) {
          const totalDistance = startingNode.distances[minDistanceIndex] + this.edges[minDistanceIndex][j].distance;

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

  GetInstructions(startIndex, stopName) {
    if (!this.mappedNodes[startIndex]) {
      if (this.mapped) this.Reset();
      this.Dijkstra(startIndex);
    }

    const stopIndex = this.GetDestIndex(stopName);
    console.log("stopName:", stopName);
    console.log("stopIndex:", stopIndex);

    const path = this.paths[startIndex][stopIndex];
    const pathVectors = [];

    path.forEach(index => {
      pathVectors.push(this.nodes[index].vector);
    });

    const navigation = { path: pathVectors, instructions: [{ action: "start", from: startIndex }] };
    const playerForward = virtualAgent.AvatarDirection();

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

      const turn = this.Orient(prevLine.clone().normalize(), nextLine.clone().normalize(), i === 0);
      turn.line = nextLine.normalize();
      turn.current = current;

      navigation.instructions.push(turn);

      navigation.instructions.push({
        action: "move",
        from: path[i],
        to: path[i + 1],
        distance: Math.floor(nextLine.length())
      });
    }
    navigation.instructions.push({ action: "finish", to: stopIndex });

    return navigation;
  }

  Orient(vector1, vector2, initial) {
    const crossVector = new THREE.Vector3();
    crossVector.crossVectors(vector1, vector2).normalize();

    const angle = THREE.MathUtils.radToDeg(vector1.angleTo(vector2));
    const signedAngle = angle * (crossVector.dot(new THREE.Vector3(0, 1, 0)) < 0 ? -1 : 1);
    let action = initial ? "initial turn" : "turn";
    let direction;

    if (angle > 90) direction = "around";
    else if (signedAngle > 10) direction = "left";
    else if (signedAngle < -10) direction = "right";
    else {
      action = "continue";
      direction = "forward";
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

  Random() {
    const randomNumber = Math.random();
    return randomNumber * 2 - 1;
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
}

export const sceneGraph = new Graph(10, 10);
