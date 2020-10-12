export default class SharedBufferGeometry {
  constructor(material, maxBufferSize) {
    this.material = material;

    this.maxBufferSize = maxBufferSize;
    this.geometries = [];
    this.current = null;
    this.drawing = new THREE.Object3D();
    this.addBuffer();
  }

  remove(prevIdx, idx) {
    // Loop through all the attributes: position, color, normal,...
    if (this.idx.position > idx.position) {
      for (const key in this.idx) {
        const componentSize = key === "index" ? 1 : 3;
        let pos = prevIdx[key] * componentSize;
        const start = (idx[key] + 1) * componentSize;
        const end = this.idx[key] * componentSize;
        for (let i = start; i < end; i++) {
          if (key === "index") {
            //index needs to be handled specially
            this.current.index.array[pos++] = this.current.index.array[i] - idx.position - 1;
          } else {
            this.current.attributes[key].array[pos++] = this.current.attributes[key].array[i];
          }
        }
        const diff = idx[key] - prevIdx[key] + 1;
        this.idx[key] -= diff;
      }
    } else {
      for (const key in this.idx) {
        const diff = idx[key] - prevIdx[key];
        this.idx[key] -= diff;
      }
    }

    this.update();
  }

  undo(prevIdx) {
    this.idx = prevIdx;
    this.update();
  }

  addBuffer() {
    const geometry = new THREE.BufferGeometry();

    const vertices = new Float32Array(this.maxBufferSize * 3);
    const normals = new Float32Array(this.maxBufferSize * 3);
    const colors = new Float32Array(this.maxBufferSize * 3);
    const indices = new Uint32Array(this.maxBufferSize * 3);

    const mesh = new THREE.Mesh(geometry, this.material);

    mesh.frustumCulled = false;
    mesh.vertices = vertices;

    const object3D = new THREE.Object3D();
    this.drawing.add(object3D);
    object3D.add(mesh);

    geometry.setDrawRange(0, 0);
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1).setUsage(THREE.DynamicDrawUsage));

    this.previous = null;
    if (this.geometries.length > 0) {
      this.previous = this.current;
    }

    this.idx = {
      position: 0,
      normal: 0,
      color: 0,
      index: 0
    };

    this.geometries.push(geometry);
    this.current = geometry;
  }

  addColor(r, g, b) {
    this.current.attributes.color.setXYZ(this.idx.color++, r, g, b);
  }

  addNormal(x, y, z) {
    this.current.attributes.normal.setXYZ(this.idx.normal++, x, y, z);
  }

  addVertex(x, y, z) {
    const buffer = this.current.attributes.position;
    if (this.idx.position === buffer.count) {
      console.error("maxBufferSize limit exceeded");
    }
    buffer.setXYZ(this.idx.position++, x, y, z);
  }

  addIndex(a, b, c) {
    this.current.index.setXYZ(this.idx.index, a, b, c);
    this.idx.index += 3;
  }

  update() {
    this.current.setDrawRange(0, this.idx.index);

    this.current.attributes.color.needsUpdate = true;
    this.current.attributes.normal.needsUpdate = true;
    this.current.attributes.position.needsUpdate = true;
    this.current.index.needsUpdate = true;
  }

  computeBoundingSpheres() {
    for (let i = 0; i < this.geometries.length; i++) {
      this.geometries[i].computeBoundingSphere();
    }
  }
}
