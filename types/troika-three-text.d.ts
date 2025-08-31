declare module "troika-three-text" {
  import type { Mesh, Material, BufferGeometry } from "three";

  export type FontSource = string | ArrayBuffer | ArrayBufferView;
  export interface PreloadFontOptions {
    font?: FontSource;
    characters?: string;
    sdfGlyphSize?: number;
  }

  export function preloadFont(options: PreloadFontOptions | FontSource): Promise<void>;

  export class Text extends Mesh<BufferGeometry, Material> {
    text: string;
    anchorX?: number | "left" | "center" | "right";
    anchorY?: number | "top" | "top-baseline" | "top-cap" | "top-ex" | "middle" | "bottom-baseline" | "bottom";
    font?: string | null;
    fontSize?: number;
    maxWidth?: number;
    lineHeight?: number | "normal";
    letterSpacing?: number;
    textAlign?: "left" | "right" | "center" | "justify";
    color?: number | string;
    material: Material;
    clipRect?: [number, number, number, number] | null;
    curveRadius?: number;
    depthOffset?: number;
    direction?: "auto" | "ltr" | "trl";
    fillOpacity?: number;
    glyphGeometryDetail?: number;
    gpuAccelerateSDF?: boolean;
    opacity?: number;
    outlineBlur?: number | `${number}%`;
    outlineColor?: string;
    outlineOffsetX?: number | `${number}%`;
    outlineOffsetY?: number | `${number}%`;
    outlineOpacity?: number;
    outlineWidth?: number | `${number}%`;
    overflowWrap?: "normal" | "break-word";
    sdfGlyphSize?: number | null;
    strokeColor?: string;
    strokeOpacity?: number;
    strokeWidth?: number | `${number}%`;
    textIndent?: number;
    whiteSpace?: "normal" | "nowrap";
    sync(): void;
  }
}

