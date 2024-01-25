import { AElement } from "aframe";
import { Object3D, Mesh, WebGLRenderer, Scene, Camera } from "three";

declare module "three" {
  interface Object3D {
    matrixNeedsUpdate: boolean;
    childrenNeedMatrixWorldUpdate: boolean;
    eid?: number;
    el?: AElement;
    updateMatrices: (forceLocalUpdate?: boolean, forceWorldUpdate?: boolean, skipParents?: boolean) => void;
  }
  type GeometryGroup = { start: number; count: number; materialIndex: number };
  interface Material {
    eid?: number;
    onBeforeRender: (
      renderer: WebGLRenderer,
      scene: Scene,
      camera: Camera,
      geometry: Geometry,
      obj: Object3D,
      group: GeometryGroup
    ) => void;
  }
  interface Mesh {
    reflectionProbeMode: "static" | "dynamic" | false;
  }

  interface Vector3 {
    near: Function;
  }
}
