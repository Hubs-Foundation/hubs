declare namespace createElementEntity.JSX {
  interface ComponentInflators {
    slice9?: {
      size: [width: number, height: number];
      insets: [top: number, buttom: number, left: number, right: number];
    };
    image?: {
      texture: any; // TODO
      textureSrc: string;
      textureVersion: number;
      ratio: number;
      projection: "flat" | "360-equirectangular";
    };
    video?: {
      texture: any; // TODO
      textureSrc: string;
      textureVersion: number;
      ratio: number;
      projection: "flat" | "360-equirectangular";
      autoPlay: boolean;
      playButtonRef: any; // TODO Learn typescript
    };
    networked?: any;
    "networked-video"?: {
      time: number;
    };
    children?: JSX.ElementChildrenAttribute;
  }

  interface IntrinsicElements {
    entity: ComponentInflators;
  }

  interface ElementChildrenAttribute {
    children: {}; // specify children name to use
  }
}
