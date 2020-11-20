import React from "react";
import { MediaBrowser } from "./MediaBrowser";
import { IconButton } from "../input/IconButton";
import { ReactComponent as LinkIcon } from "../icons/Link.svg";
import { CreateTile, MediaTile } from "./MediaTiles";
import backgroundUrl from "../../assets/images/home-hero-background-unbranded.png";

export default {
  title: "MediaBrowser",
  parameters: {
    layout: "fullscreen"
  }
};

const room = {
  description: null,
  favorited: true,
  id: "123",
  images: { preview: { url: backgroundUrl } },
  last_activated_at: "2020-11-20T01:22:48Z",
  lobby_count: 1,
  member_count: 0,
  name: "Ultimate Wee Exploration",
  room_size: 24,
  scene_id: "123",
  type: "room",
  url: "#",
  user_data: null
};

export const Favorites = () => (
  <MediaBrowser selectedSource={"favorites"}>
    <MediaTile entry={room} thumbnailWidth={355} thumbnailHeight={200} thumbnailUrl={backgroundUrl} />
  </MediaBrowser>
);

const mediaSources = ["poly", "sketchfab", "videos", "scenes", "avatars", "gifs", "images"];

export const Base = () => (
  <MediaBrowser
    searchPlaceholder="Search Avatars..."
    mediaSources={mediaSources}
    selectedSource={"avatars"}
    activeFilter={"featured"}
    facets={[
      { text: "Featured", params: { filter: "featured" } },
      { text: "My Avatars", params: { filter: "my-avatars" } },
      { text: "Newest", params: { filter: "" } }
    ]}
    headerRight={
      <IconButton lg>
        <LinkIcon />
        <p>Custom Avatar</p>
      </IconButton>
    }
    hasNext
  >
    <CreateTile width={355} height={200} label="Create Avatar" />
  </MediaBrowser>
);
