// This gives a warning for some reason but is needed to extend the class with our interface
import { Object3D } from "three";
declare module "three" {
  interface Object3D {
    matrixNeedsUpdate: boolean;
    eid?: number;
  }
}
