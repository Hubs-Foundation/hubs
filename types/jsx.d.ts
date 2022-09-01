interface ComponentInflators {
  slice9?: {
    size: [width: number, height: number];
    insets: [top: number, buttom: number, left: number, right: number];
  };
}

declare namespace createElementEntity.JSX {
  interface IntrinsicElements {
    entity: ComponentInflators;
  }
}
