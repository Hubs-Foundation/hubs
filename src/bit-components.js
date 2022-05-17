import { defineComponent, Types } from "bitecs";

export const Networked = defineComponent({ templateId: Types.ui8, lastOwnerTime: Types.ui32 });
export const Owned = defineComponent();

export const FrameUpdate = defineComponent({
  capturedNid: Types.ui32,
  scale: [Types.f32, 3]
});

// TODO: Try doing it this way
// export const NetworkedMediaFrame = defineComponent({
//   capturedNid: Types.ui32,
//   scale: [Types.f32, 3]
// });

export const MediaFrame = defineComponent({
  capturedNid: Types.ui32,
  scale: [Types.f32, 3],
  captured: Types.eid,
  mediaType: Types.ui8,
  bounds: [Types.f32, 3],
  preview: Types.eid
});

window.$components = {
  Networked,
  Owned,
  MediaFrame
};
