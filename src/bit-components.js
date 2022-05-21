import { defineComponent, Types } from "bitecs";

export const Networked = defineComponent({ templateId: Types.ui8, lastOwnerTime: Types.ui32 });
export const Owned = defineComponent();
export const NetworkedMediaFrame = defineComponent({
  capturedNid: Types.ui32,
  scale: [Types.f32, 3]
});
export const MediaFrame = defineComponent({
  capturedNid: Types.ui32,
  scale: [Types.f32, 3],
  mediaType: Types.ui8,
  bounds: [Types.f32, 3],
  preview: Types.eid
});
export const Text = defineComponent();
export const Slice9 = defineComponent({
  insets: [Types.ui32, 4],
  size: [Types.f32, 2]
});

export const Object3DTag = defineComponent();
export const Spin = defineComponent({ x: Types.f32, y: Types.f32, z: Types.f32 });
export const CursorRaycastable = defineComponent();
export const RemoteHoverTarget = defineComponent();
export const Holdable = defineComponent();
export const RemoveNetworkedEntityButton = defineComponent();
export const Interacted = defineComponent();
export const HoveredRightHand = defineComponent();
export const HoveredLeftHand = defineComponent();
export const HoveredRightRemote = defineComponent();
export const HoveredLeftRemote = defineComponent();
export const HeldRightHand = defineComponent();
export const HeldLeftHand = defineComponent();
export const HeldRightRemote = defineComponent();
export const HeldLeftRemote = defineComponent();
export const Held = defineComponent();
export const MediaFramePreviewClone = defineComponent({
  preview: Types.eid
});
export const OffersRemoteConstraint = defineComponent();
export const HandCollisionTarget = defineComponent();
export const OffersHandConstraint = defineComponent();
export const TogglesHoveredActionSet = defineComponent();
export const SingleActionButton = defineComponent();
export const HoldableButton = defineComponent();
export const Pen = defineComponent();
export const HoverMenuChild = defineComponent();
export const Static = defineComponent();
export const Inspectable = defineComponent();
export const PreventAudioBoost = defineComponent();
export const IgnoreSpaceBubble = defineComponent();
export const Rigidbody = defineComponent({ bodyId: Types.ui16 });
export const PhysicsShape = defineComponent({ shapeId: Types.ui16, halfExtents: [Types.f32, 3] });
export const Pinnable = defineComponent();
export const Pinned = defineComponent();
export const FloatyObject = defineComponent();
