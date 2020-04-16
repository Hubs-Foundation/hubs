export default class SharedBufferGeometry {
  constructor(material, primitiveMode, maxBufferSize) {
    this.material = material;
    this.primitiveMode = primitiveMode;

    this.maxBufferSize = maxBufferSize;
    this.geometries = [];
    this.current = null;
    this.drawing = new THREE.Object3D();
    this.addBuffer();
  }

  restartPrimitive() {
    if (this.idx.position >= this.current.attributes.position.count) {
      console.error("maxBufferSize limit exceeded");
    } else if (this.idx.position !== 0) {
      let prev = (this.idx.position - 1) * 3;
      const position = this.current.attributes.position.array;
      this.addVertex(position[prev++], position[prev++], position[prev++]);

      this.idx.color++;
      this.idx.normal++;
    }
  }

  remove(prevIdx, idx) {
    // Loop through all the attributes: position, color, normal,...
    if (this.idx.position > idx.position) {
      for (const key in this.idx) {
        const componentSize = 3;
        let pos = prevIdx[key] * componentSize;
        const start = (idx[key] + 1) * componentSize;
        const end = this.idx[key] * componentSize;
        for (let i = start; i < end; i++) {
          this.current.attributes[key].array[pos++] = this.current.attributes[key].array[i];
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

    const mesh = new THREE.Mesh(geometry, this.material);

    mesh.drawMode = this.primitiveMode;

    mesh.frustumCulled = false;
    mesh.vertices = vertices;

    const object3D = new THREE.Object3D();
    this.drawing.add(object3D);
    object3D.add(mesh);

    geometry.setDrawRange(0, 0);
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage));

    this.previous = null;
    if (this.geometries.length > 0) {
      this.previous = this.current;
    }

    this.idx = {
      position: 0,
      normal: 0,
      color: 0
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

  update() {
    this.current.setDrawRange(0, this.idx.position);

    this.current.attributes.color.needsUpdate = true;
    this.current.attributes.normal.needsUpdate = true;
    this.current.attributes.position.needsUpdate = true;
  }

  computeBoundingSpheres() {
    for (let i = 0; i < this.geometries.length; i++) {
      this.geometries[i].computeBoundingSphere();
    }
  }
}
