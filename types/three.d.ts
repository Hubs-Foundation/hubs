import { AElement } from "aframe";
import { Object3D, Mesh } from "three";

declare module "three" {
  interface Object3D {
    matrixNeedsUpdate: boolean;
    childrenNeedMatrixWorldUpdate: boolean;
    eid?: number;
    el?: AElement;
    updateMatrices: (forceLocalUpdate?: boolean, forceWorldUpdate?: boolean, skipParents?: boolean) => void;
  }
  interface Mesh {
    reflectionProbeMode: "static" | "dynamic" | false;
  }
}
