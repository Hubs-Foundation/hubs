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
        const node1 = new Node(end1[0], end1[1], -end1[2]);
        const node2 = new Node(end2[0], end2[1], -end2[2]);

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

      let count = -1;
      roomProperties.dimensions.forEach(dimensionElement => {
        count++;
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
            if (!discard) {
              this.nodes.push(node);
            }
          }
        }
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

      connectorPairs.forEach(pair => {
        const index1 = pair[0];
        const index2 = pair[1];
        const distance = this.nodes[index1].vector.manhattanDistanceTo(this.nodes[index2]);
        if (!Object.keys(this.nodes[index1].neighboors).includes(index2)) {
          this.nodes[index1].neighboors[index2] = distance;
          this.nodes[index2].neighboors[index1] = distance;
        }
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
    if (node1.IsIdentical(node2)) return false;
    return (
      node1.y === node2.y &&
      (node1.x === node2.x || node1.z === node2.z) &&
      node1.vector.distanceTo(node2.vector) <= 1.0
    );
  }

  GetDestIndex(salientName) {
    if (Object.keys(this.targetInfo).includes(salientName)) {
      return this.targetInfo[salientName];
    }
    console.error(`Invalid Salient Name: ${salientName}`);
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

  GetInstructions(startIndex, stopName) {
    const stopIndex = this.GetDestIndex(stopName);

    if (!stopIndex) return { knowledge: "" };

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
      instructions: [{ action: "start", from: startIndex }],
      knowledge: [{ action: "start" }]
    };
    const playerForward = virtualAgent.AvatarDirection();

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
        if (distanceSum !== 0) navigation.knowledge.push({ action: "move", distance: distanceSum });
        navigation.knowledge.push({ action: turn.action, direction: turn.direction });
        distanceSum = 0;
      }

      distanceSum += Math.floor(nextLine.length());
    }
    navigation.instructions.push({ action: "finish", to: stopIndex });
    navigation.knowledge.push({ action: "move", distance: distanceSum }, { action: "finish" });
    const navigationString = navigation.knowledge
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
    navigation.knowledge = navigationString;
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
