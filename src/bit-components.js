import { defineComponent, Types } from "bitecs";

export const Networked = defineComponent({ templateId: Types.ui8, lastOwnerTime: Types.ui32 });
export const Owned = defineComponent();

export const NetworkedMediaFrame = defineComponent({
  capturedEntity: Types.eid,
  originalTargetScale: [Types.f32, 3]
});
export const MediaFrame = defineComponent({
  mediaType: Types.ui8,
  capturedEntity: Types.eid,
  bounds: [Types.f32, 3],
  originalTargetScale: [Types.f32, 3],
  preview: Types.eid
});

window.$components = {
  Networked,
  Owned,
  MediaFrame
};
