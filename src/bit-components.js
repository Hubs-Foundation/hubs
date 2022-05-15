import { defineComponent, Types } from "bitecs";

export const Networked = defineComponent({ templateId: Types.ui8, lastOwnerTime: Types.ui32 });
export const Owned = defineComponent();

const MediaFrameUpdateShape = {
  isFull: Types.ui8,
  captured: Types.eid,
  scale: [Types.f32, 3]
};
export const FrameUpdate = defineComponent(MediaFrameUpdateShape);
export const MediaFrame = defineComponent({
  ...MediaFrameUpdateShape,
  mediaType: Types.ui8,
  bounds: [Types.f32, 3],
  preview: Types.eid
});

window.$components = {
  Networked,
  Owned,
  MediaFrame
};
