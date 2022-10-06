declare module "aframe" {
  import { Scene, Clock, Object3D, Mesh } from "three";

  export interface AElement extends HTMLElement {
    object3D: Object3D;
    object3DMap: {
      mesh: Mesh;
      [name: string]: Object3D;
    };
    getObject3D(string): Object3D?;
  }
  interface AScene extends AElement {
    object3D: Scene;
    renderStarted: boolean;
    tick(time: number, delta: number): void;
    isPlaying: boolean;
    frame: XRFrame;
    clock: Clock;
  }
}
