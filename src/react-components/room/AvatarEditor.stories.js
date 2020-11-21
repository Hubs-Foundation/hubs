import React from "react";
import { AvatarEditor } from "./AvatarEditor";

export default {
  title: "AvatarEditor",
  parameters: {
    layout: "fullscreen"
  }
};

const avatarModels = [
  {
    label: "Avatar 1",
    thumbnailUrl: "https://demo-ui-stack-assets.hubti.me/files/a9343259-dccb-4e1d-af54-9bfb5ed9df80.png"
  },
  {
    label: "Avatar 2",
    thumbnailUrl: "https://demo-ui-stack-assets.hubti.me/files/a9343259-dccb-4e1d-af54-9bfb5ed9df80.png"
  },
  {
    label: "Avatar 3",
    thumbnailUrl: "https://demo-ui-stack-assets.hubti.me/files/a9343259-dccb-4e1d-af54-9bfb5ed9df80.png"
  }
];

const editorLinks = [
  {
    name: "Editor 1",
    url: "#"
  },
  {
    name: "Editor 2",
    url: "#"
  }
];

export const Loading = () => <AvatarEditor loading />;

export const Base = () => (
  <AvatarEditor avatarModels={avatarModels} showAvatarEditorLink showAvatarPipelinesLink editorLinks={editorLinks} />
);

export const CanDelete = () => (
  <AvatarEditor
    avatarModels={avatarModels}
    showAvatarEditorLink
    showAvatarPipelinesLink
    editorLinks={editorLinks}
    canDelete
  />
);

export const Debug = () => (
  <AvatarEditor
    debug
    avatarModels={avatarModels}
    showAvatarEditorLink
    showAvatarPipelinesLink
    editorLinks={editorLinks}
    canDelete
  />
);
