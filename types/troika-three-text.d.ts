declare module "troika-three-text" {
  import { Mesh } from "three";

  export interface Text extends Mesh {
    text: string;
    sync(callback?: () => void): void;
  }
}
