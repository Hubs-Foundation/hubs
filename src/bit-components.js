import { defineComponent, Types } from "bitecs";

export const Networked = defineComponent({ templateId: Types.ui8, lastOwnerTime: Types.ui32 });
export const Owned = defineComponent();

const MediaFrameShape = {
  isFull: Types.ui8,
  capturedEntity: Types.eid,
  originalTargetScale: [Types.f32, 3]
};
export const NetworkedMediaFrame = defineComponent(MediaFrameShape);
export const DesiredMediaFrame = defineComponent(MediaFrameShape);
export const MediaFrame = defineComponent({
  ...MediaFrameShape,
  mediaType: Types.ui8,
  bounds: [Types.f32, 3],
  preview: Types.eid
});

window.$components = {
  Networked,
  Owned,
  MediaFrame
};
