export default class SharedBufferGeometry {

  constructor(material, primitiveMode) {
    this.material = material;
    this.primitiveMode = primitiveMode;

    this.maxBufferSize = 1000000;
    this.geometries = [];
    this.current = null;
    this.drawing = new THREE.Object3D();
    this.addBuffer(false);
  }

  getDrawing () {
    return this.drawing;
  }

  restartPrimitive () {
    if (this.idx.position >= this.current.attributes.position.count) {
      this.addBuffer(false);
    } else if (this.idx.position !== 0) {
      let prev = (this.idx.position - 1) * 3;
      const position = this.current.attributes.position.array;
      this.addVertex(position[prev++], position[prev++], position[prev++]);

      this.idx.color++;
      this.idx.normal++;
      this.idx.uv++;
    }
  }

  remove (prevIdx, idx) {
    const pos = this.current.attributes.position.array;

    // Loop through all the attributes: position, color, uv, normal,...
    if (this.idx.position > idx.position) {
      for (let key in this.idx) {
        const componentSize = key === 'uv' ? 2 : 3;
        let pos = (prevIdx[key]) * componentSize;
        const start = (idx[key] + 1) * componentSize;
        const end = this.idx[key] * componentSize;
        for (let i = start; i < end; i++) {
          this.current.attributes[key].array[pos++] = this.current.attributes[key].array[i];
        }
      }
    }

    for (key in this.idx) {
      const diff = (idx[key] - prevIdx[key]);
      this.idx[key] -= diff;
    }

    this.update();
  }

  undo (prevIdx) {
    this.idx = prevIdx;
    this.update();
  }

  addBuffer (copyLast) {
    const geometry = new THREE.BufferGeometry();

    const vertices = new Float32Array(this.maxBufferSize * 3);
    const normals = new Float32Array(this.maxBufferSize * 3);
    const uvs = new Float32Array(this.maxBufferSize * 2);
    const colors = new Float32Array(this.maxBufferSize * 3);

    const mesh = new THREE.Mesh(geometry, this.material);

    mesh.drawMode = this.primitiveMode;

    mesh.frustumCulled = false;
    mesh.vertices = vertices;

    this.object3D = new THREE.Object3D();
    this.drawing.add(this.object3D);
    this.object3D.add(mesh);

    geometry.setDrawRange(0, 0);
    geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3).setDynamic(true));
    geometry.addAttribute('uv', new THREE.BufferAttribute(uvs, 2).setDynamic(true));
    geometry.addAttribute('normal', new THREE.BufferAttribute(normals, 3).setDynamic(true));
    geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3).setDynamic(true));


    this.previous = null;
    if (this.geometries.length > 0) {
      this.previous = this.current;
    }

    this.idx = {
      position: 0,
      uv: 0,
      normal: 0,
      color: 0
    };

    this.geometries.push(geometry);
    this.current = geometry;

    if (this.previous && copyLast) {
      let prev = (this.maxBufferSize - 2) * 3;
      let col = (this.maxBufferSize - 2) * 3;
      const uv = (this.maxBufferSize - 2) * 2;
      let norm = (this.maxBufferSize - 2) * 3;

      const position = this.previous.attributes.position.array;
      this.addVertex(position[prev++], position[prev++], position[prev++]);
      this.addVertex(position[prev++], position[prev++], position[prev++]);

      const normal = this.previous.attributes.normal.array;
      this.addNormal(normal[norm++], normal[norm++], normal[norm++]);
      this.addNormal(normal[norm++], normal[norm++], normal[norm++]);

      const color = this.previous.attributes.color.array;
      this.addColor(color[col++], color[col++], color[col++]);
      this.addColor(color[col++], color[col++], color[col++]);

      const uvs = this.previous.attributes.uv.array;

    }
  }

  addColor (r, g, b) {
    this.current.attributes.color.setXYZ(this.idx.color++, r, g, b);
  }

  addNormal (x, y, z) {
    this.current.attributes.normal.setXYZ(this.idx.normal++, x, y, z);
  }

  addVertex (x, y, z) {
    let buffer = this.current.attributes.position;
    if (this.idx.position === buffer.count) {
      this.addBuffer(true);
      buffer = this.current.attributes.position;
    }
    buffer.setXYZ(this.idx.position++, x, y, z);
  }

  addUV (u, v) {
    this.current.attributes.uv.setXY(this.idx.uv++, u, v);
  }

  update () {
    this.current.setDrawRange(0, this.idx.position);

    this.current.attributes.color.needsUpdate = true;
    this.current.attributes.normal.needsUpdate = true;
    this.current.attributes.position.needsUpdate = true;
    this.current.attributes.uv.needsUpdate = true;
  }
};
