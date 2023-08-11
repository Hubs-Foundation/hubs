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
  }

  AreNodesAdjacent(node1, node2) {
    return (
      node1.vector.x === node2.vector.x || node1.vector.z === node2.vector.z /*&& node1.vector.y === node2.vector.y*/
    );
  }

  Dijkstra(startIndex, stopIndex = -1) {
    if (this.mapped) {
      this.Reset();
    }

    let startingNode = this.nodes[startIndex];
    this.start = startIndex;
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
      }
    }

    if (stopIndex !== -1) {
      this.path = this.nodes[stopIndex].path;
      this.destination = stopIndex;
    } else {
      this.path = [];
      for (let i = 0; i < this.nodeCount; i++) {
        this.path.push({ i: this.nodes[i].path });
      }
    }

    this.mapped = true;
  }

  GetInstructions() {
    if (!this.mapped) {
      console.log("The gaph is not mapped");
      return;
    } else {
      this.instructions = [{ start: this.start }];
      const x = 0;
      const y = 1;
      const playerForward = new THREE.Vector3(x, y, 0).normalize();

      for (let i = 0; i < this.path.length - 1; i++) {
        const current = this.nodes[this.path[i]].vector;
        const next = this.nodes[this.path[i + 1]].vector;

        const nextLine = next.clone().sub(current);
        const prevLine = new THREE.Vector3();

        if (i === 0) prevLine.copy(playerForward);
        else {
          const prev = this.nodes[this.path[i - 1]].vector;
          prevLine.copy(current.clone().sub(prev));
        }

        const orientation = this.Orient(prevLine.clone().normalize(), nextLine.clone().normalize());
        if (orientation !== "straight") {
          this.instructions.push({ turn: orientation });
        }

        this.instructions.push({ move: nextLine.length() });
      }

      this.instructions.push({ finish: this.destination });
    }
  }

  Orient(vector1, vector2) {
    const crossVector = new THREE.Vector3();
    const zAxis = new THREE.Vector3(0, 0, 1);
    crossVector.crossVectors(vector1, vector2).normalize();
    const dotProduct = crossVector.dot(zAxis);

    if (dotProduct > 0) return "left";
    else if (dotProduct < 0) return "right";
    else return "straight";
  }

  LogDistance() {}

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
}

export const sceneGraph = new Graph(10, 10);
