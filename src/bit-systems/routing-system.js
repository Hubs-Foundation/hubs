import { Vector3 } from "three";
import { virtualAgent } from "./agent-system";

const INF = Number.MAX_SAFE_INTEGER;
class Node {
  constructor(x, y, z) {
    this.vector = new THREE.Vector3(x, y, z);
    this.visited = false;
    this.path = [];
    this.distances = null;
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
}

class Edge {
  constructor(start, stop) {
    this.distance = this.FindDistance(start, stop);
  }

  FindDistance(v1, v2) {
    return Math.abs(v2.vector.x - v1.vector.x) + Math.abs(v2.vector.z - v1.vector.z);
  }
}

class Graph {
  constructor(PlaneX, PlaneY) {
    this.nodes = [];
    this.edges = [];

    for (let y = -PlaneY / 2; y < PlaneY / 2; y++) {
      for (let x = -PlaneX / 2; x < PlaneX / 2; x++) {
        this.nodes.push(new Node(x, y > 0 ? 1 : 0, y));
      }
    }

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

    this.nodeCount = this.nodes.length;
    this.mapped = false;
    this.mappedNodes = new Array(this.nodeCount).fill(false);
    this.paths = new Array(this.nodeCount);
    for (let j = 0; j < this.nodeCount; j++) {
      this.paths[j] = [];
    }
  }

  AreNodesAdjacent(node1, node2) {
    return (
      node1.vector.x === node2.vector.x || node1.vector.z === node2.vector.z /*&& node1.vector.y === node2.vector.y*/
    );
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

  GetInstructions(startIndex, stopIndex) {
    if (!this.mappedNodes[startIndex]) {
      if (this.mapped) this.Reset();
      this.Dijkstra(startIndex);
    }

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
      // if (prev !== undefined) turn.prev = prev;
      turn.line = nextLine.normalize();
      turn.current = current;
      // turn.next = next;

      navigation.instructions.push(turn);

      console.log(turn);

      navigation.instructions.push({
        action: "move",
        from: path[i],
        to: path[i + 1],
        distance: Math.floor(nextLine.length())
      });
    }

    navigation.instructions.push({ action: "finish", to: stopIndex });

    console.log(this.paths);

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

  PrintNodes() {
    this.nodes.forEach(node => {
      console.log(node.vector);
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

  GetNode(index) {
    return this.nodes[i].vector;
  }
}

export const sceneGraph = new Graph(10, 10);
