import { createElementEntity, renderAsAframeEntity, InteractableCube } from "../utils/jsx-entity";
/** @jsx createElementEntity */

export const mediaFrameSchema = {
  template: "#interactable-media-frame",
  addEntity: function(componentProps) {
    return renderAsAframeEntity(
      <a-entity>
        <entity media-frame={componentProps} />
      </a-entity>,
      APP.world
    );
  },
  components: [
    {
      component: "media-frame",
      property: "targetId"
    },
    {
      component: "media-frame",
      property: "originalTargetScale"
    }
  ],
  // TODO we probably want media frames to support permissioning of some form
  nonAuthorizedComponents: ["media-frame"]
};
