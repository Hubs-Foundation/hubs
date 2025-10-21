import React from "react";
import SceneUI from "./scene-ui";

export default {
  title: "scene-ui",
  parameters: {
    layout: "fullscreen"
  }
};

export const Base = () => (
  <SceneUI sceneName="Very Cool Scene" sceneDescription="A must see!" sceneScreenshotURL="https://example.com/" />
);

export const ShowCreateRoom = () => (
  <SceneUI
    sceneName="Very Cool Scene"
    sceneDescription="A must see!"
    sceneScreenshotURL="https://example.com/"
    showCreateRoom={true}
  />
);

export const SceneAllowRemixing = () => (
  <SceneUI
    sceneName="Very Cool Scene"
    sceneDescription="A must see!"
    sceneScreenshotURL="https://example.com/"
    sceneAllowRemixing={true}
  />
);

export const SceneAttributions = () => (
  <SceneUI
    sceneName="Very Cool Scene"
    sceneDescription="A must see!"
    sceneScreenshotURL="https://example.com/"
    sceneAttributions={{
      creator: "Some Artist",
      content: [{ title: "Some Title", name: "Parent", author: "Joe Cool", remix: true }]
    }}
  />
);

export const OwnerProjectId = () => (
  <SceneUI
    sceneName="Very Cool Scene"
    sceneDescription="A must see!"
    sceneScreenshotURL="https://example.com/"
    isOwner={true}
    sceneProjectId="abc123"
  />
);

export const ShowUnavailable = () => (
  <SceneUI
    sceneName="Very Cool Scene"
    sceneDescription="A must see!"
    sceneScreenshotURL="https://example.com/"
    unavailable={true}
  />
);
