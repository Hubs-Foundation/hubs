declare module "troika-three-text" {
  import { Mesh } from "three";

  export interface Text extends Mesh {
    text: string;
    sync(callback?: () => void): void;
  }

  export const preloadFont: (
    options: { font?: string; characters: string | string[]; sdfGlyphSize?: number },
    callback: () => void
  ) => void;
}
