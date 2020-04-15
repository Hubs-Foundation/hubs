import {
  Object3D,
  MeshBasicMaterial,
  SphereBufferGeometry,
  DoubleSide,
  Mesh,
  sRGBEncoding,
  LinearFilter,
  RGBAFormat,
  PlaneBufferGeometry
} from "three";

import { loadTexture } from "../utils/loadTexture";

export const ImageProjection = {
  Flat: "flat",
  Equirectangular360: "360-equirectangular"
};

export class Image extends Object3D {
  constructor() {
    super();
    this._src = null;
    this._projection = "flat";

    const geometry = new PlaneBufferGeometry();
    const material = new MeshBasicMaterial();
    material.side = DoubleSide;
    this._mesh = new Mesh(geometry, material);
    this._mesh.name = "ImageMesh";
    this.add(this._mesh);
    this._texture = null;
  }

  get src() {
    return this._src;
  }

  set src(src) {
    this.load(src).catch(console.error);
  }

  loadTexture(src) {
    return loadTexture(src);
  }

  get projection() {
    return this._projection;
  }

  set projection(projection) {
    const material = new MeshBasicMaterial();

    let geometry;

    if (projection === "360-equirectangular") {
      geometry = new SphereBufferGeometry(1, 64, 32);
      // invert the geometry on the x-axis so that all of the faces point inward
      geometry.scale(-1, 1, 1);
    } else {
      geometry = new PlaneBufferGeometry();
      material.side = DoubleSide;
    }

    material.map = this._texture;

    if (this._texture && this._texture.format === RGBAFormat) {
      material.transparent = true;
    }

    this._projection = projection;

    const nextMesh = new Mesh(geometry, material);
    nextMesh.name = "ImageMesh";
    nextMesh.visible = this._mesh.visible;

    const meshIndex = this.children.indexOf(this._mesh);

    if (meshIndex === -1) {
      this.add(nextMesh);
    } else {
      this.children.splice(meshIndex, 1, nextMesh);
      nextMesh.parent = this;
    }

    this._mesh = nextMesh;

    this.onResize();
  }

  async load(src) {
    this._src = src;
    this._mesh.visible = false;

    const material = this._mesh.material;

    if (material.map) {
      material.map.dispose();
    }

    const texture = await this.loadTexture(src);
    // TODO: resize to maintain aspect ratio but still allow scaling.
    texture.encoding = sRGBEncoding;
    texture.minFilter = LinearFilter;

    this._texture = texture;

    this.onResize();

    if (texture.format === RGBAFormat) {
      this._mesh.material.transparent = true;
    }

    this._mesh.material.map = this._texture;
    this._mesh.material.needsUpdate = true;
    this._mesh.visible = true;

    return this;
  }

  onResize() {
    if (this._texture && this.projection === ImageProjection.Flat) {
      const ratio = (this._texture.image.height || 1.0) / (this._texture.image.width || 1.0);
      const width = Math.min(1.0, 1.0 / ratio);
      const height = Math.min(1.0, ratio);
      this._mesh.scale.set(width, height, 1);
    }
  }

  copy(source, recursive = true) {
    if (recursive) {
      this.remove(this._mesh);
    }

    super.copy(source, recursive);

    if (recursive) {
      const _meshIndex = source.children.indexOf(source._mesh);

      if (_meshIndex !== -1) {
        this._mesh = this.children[_meshIndex];
      }
    }

    this.projection = source.projection;
    this.src = source.src;

    return this;
  }
}
