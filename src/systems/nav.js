const { Pathfinding } = require("three-pathfinding");
import qsTruthy from "../utils/qs_truthy";

const Vector3 = THREE.Vector3;
const Vector2 = THREE.Vector2;
const Face3 = THREE.Face3;
const Color = THREE.Color;

// TODO this is backported from a later version of THREE.
// Geometry is going to be dropped from ThreeJS anyway so just copying here for now.
// Ideally three-pathfinding will just use BufferGeometry in the future
// https://github.com/donmccurdy/three-pathfinding/issues/74
function fromBufferGeometry(scope, geometry) {
  const index = geometry.index !== null ? geometry.index : undefined;
  const attributes = geometry.attributes;

  if (attributes.position === undefined) {
    console.error("THREE.Geometry.fromBufferGeometry(): Position attribute required for conversion.");
    return scope;
  }

  const position = attributes.position;
  const normal = attributes.normal;
  const color = attributes.color;
  const uv = attributes.uv;
  const uv2 = attributes.uv2;

  if (uv2 !== undefined) scope.faceVertexUvs[1] = [];

  for (let i = 0; i < position.count; i++) {
    scope.vertices.push(new Vector3().fromBufferAttribute(position, i));

    if (color !== undefined) {
      scope.colors.push(new Color().fromBufferAttribute(color, i));
    }
  }

  function addFace(a, b, c, materialIndex) {
    const vertexColors =
      color === undefined ? [] : [scope.colors[a].clone(), scope.colors[b].clone(), scope.colors[c].clone()];

    const vertexNormals =
      normal === undefined
        ? []
        : [
            new Vector3().fromBufferAttribute(normal, a),
            new Vector3().fromBufferAttribute(normal, b),
            new Vector3().fromBufferAttribute(normal, c)
          ];

    const face = new Face3(a, b, c, vertexNormals, vertexColors, materialIndex);

    scope.faces.push(face);

    if (uv !== undefined) {
      scope.faceVertexUvs[0].push([
        new Vector2().fromBufferAttribute(uv, a),
        new Vector2().fromBufferAttribute(uv, b),
        new Vector2().fromBufferAttribute(uv, c)
      ]);
    }

    if (uv2 !== undefined) {
      scope.faceVertexUvs[1].push([
        new Vector2().fromBufferAttribute(uv2, a),
        new Vector2().fromBufferAttribute(uv2, b),
        new Vector2().fromBufferAttribute(uv2, c)
      ]);
    }
  }

  const groups = geometry.groups;

  if (groups.length > 0) {
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];

      const start = group.start;
      const count = group.count;

      for (let j = start, jl = start + count; j < jl; j += 3) {
        if (index !== undefined) {
          addFace(index.getX(j), index.getX(j + 1), index.getX(j + 2), group.materialIndex);
        } else {
          addFace(j, j + 1, j + 2, group.materialIndex);
        }
      }
    }
  } else {
    if (index !== undefined) {
      for (let i = 0; i < index.count; i += 3) {
        addFace(index.getX(i), index.getX(i + 1), index.getX(i + 2));
      }
    } else {
      for (let i = 0; i < position.count; i += 3) {
        addFace(i, i + 1, i + 2);
      }
    }
  }

  scope.computeFaceNormals();

  if (geometry.boundingBox !== null) {
    scope.boundingBox = geometry.boundingBox.clone();
  }

  if (geometry.boundingSphere !== null) {
    scope.boundingSphere = geometry.boundingSphere.clone();
  }

  return scope;
}

AFRAME.registerSystem("nav", {
  init: function() {
    this.pathfinder = new Pathfinding();
    this.mesh = null;
    this.el.addEventListener("reset_scene", this.removeNavMeshData.bind(this));
    this.el.addEventListener("leaving_loading_environment", this.removeNavMeshData.bind(this));
  },

  loadMesh: function(mesh, zone) {
    if (this.mesh) {
      console.error("tried to load multiple nav meshes");
      this.removeNavMeshData();
    }
    const geometry = fromBufferGeometry(new THREE.Geometry(), mesh.geometry);
    mesh.updateMatrices();
    geometry.applyMatrix(mesh.matrixWorld);
    this.pathfinder.setZoneData(zone, Pathfinding.createZone(geometry));
    this.mesh = mesh;
    this.el.sceneEl.emit("nav-mesh-loaded");

    if (qsTruthy("debugNavmesh")) {
      this.helperMesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ wireframe: true }));
      this.el.sceneEl.object3D.add(this.helperMesh);
    }
  },

  removeNavMeshData() {
    if (this.mesh && this.mesh.geometry && this.mesh.geometry.dispose) {
      this.mesh.geometry.dispose();
    }
    if (this.helperMesh) {
      this.helperMesh.parent.remove(this.helperMesh);
      this.helperMesh = null;
    }
    this.mesh = null;
    this.pathfinder.zones = {};
  }
});
