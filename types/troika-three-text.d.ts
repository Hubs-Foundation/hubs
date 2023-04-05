declare module "troika-three-text" {
  import { Color, Material, Mesh } from "three";

  export class Text extends Mesh {
    text: string;
    anchorX: number | `${number}%` | 'left' | 'center' | 'right';
    anchorY: number | `${number}%` | 'top' | 'top-baseline' | 'top-cap' | 'top-ex' | 'middle' | 'bottom-baseline' | 'bottom';
    clipRect: [number, number, number, number] | null;
    color: string | number | Color | null;
    curveRadius: number;
    depthOffset: number;
    direction: string;
    fillOpacity: number;
    font: string | null;
    fontSize: number;
    glyphGeometryDetail: number;
    gpuAccelerateSDF: boolean;
    letterSpacing: number;
    lineHeight: number | 'normal';
    material: Material | null;
    maxWidth: number;
    outlineBlur: number | `${number}%`;
    outlineColor: string | number | Color;
    outlineOffsetX: number | `${number}%`;
    outlineOffsetY: number | `${number}%`;
    outlineOpacity: number;
    outlineWidth: number | `${number}%`;
    overflowWrap: 'normal' | 'break-word';
    sdfGlyphSize: number | null;
    strokeColor: string | number | Color;
    strokeOpacity: number;
    strokeWidth: number | `${number}%`;
    textAlign: 'left' | 'right' | 'center' | 'justify';
    textIndent: number;
    whiteSpace: 'normal' | 'nowrap';
    sync(callback?: () => void): void;
  }

  export const preloadFont: (
    options: { font?: string; characters: string | string[]; sdfGlyphSize?: number },
    callback: () => void
  ) => void;
}
