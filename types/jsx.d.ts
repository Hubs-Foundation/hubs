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
    };
    networked?: any;
    "networked-video"?: true;
    children?: JSX.ElementChildrenAttribute;
    "video-menu"?: {
      playButtonRef: any; // Ref
    };
  }

  interface IntrinsicElements {
    entity: ComponentInflators;
  }

  interface ElementChildrenAttribute {
    children: {}; // specify children name to use
  }
}
