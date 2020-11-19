import React from "react";
import { MediaBrowser } from "./MediaBrowser";
import { IconButton } from "../input/IconButton";
import { ReactComponent as LinkIcon } from "../icons/Link.svg";

export default {
  title: "MediaBrowser",
  parameters: {
    layout: "fullscreen"
  }
};

export const Base = () => (
  <MediaBrowser
    searchPlaceholder="Search..."
    searchDescription="Search Description"
    mediaSources={["Models", "Images", "Gifs", "Videos", "Scenes", "Avatars"]}
    selectedSource={"Scenes"}
    activeFilter={"featured"}
    facets={[
      { text: "Featured", params: { filter: "featured" } },
      { text: "My Scenes", params: { filter: "my-scenes" } }
    ]}
    headerRight={
      <IconButton lg>
        <LinkIcon />
        <p>Custom Scene</p>
      </IconButton>
    }
  >
    Content
  </MediaBrowser>
);
