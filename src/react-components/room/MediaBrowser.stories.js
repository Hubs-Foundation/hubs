/* eslint-disable @calm/react-intl/missing-formatted-message */
import React from "react";
import { MediaBrowser } from "./MediaBrowser";
import { IconButton } from "../input/IconButton";
import { ReactComponent as LinkIcon } from "../icons/Link.svg";
import { CreateTile, MediaTile } from "./MediaTiles";
import backgroundUrl from "../../assets/images/home-hero-background-unbranded.png";

export default {
  title: "Room/MediaBrowser",
  parameters: {
    layout: "fullscreen"
  }
};

const FACETS = {
  sketchfab: [
    { text: "Featured", params: { filter: "featured" } },
    { text: "Animals", params: { filter: "animals-pets" } },
    { text: "Architecture", params: { filter: "architecture" } },
    { text: "Art", params: { filter: "art-abstract" } },
    { text: "Vehicles", params: { filter: "cars-vehicles" } },
    { text: "Characters", params: { filter: "characters-creatures" } },
    { text: "Culture", params: { filter: "cultural-heritage-history" } },
    { text: "Gadgets", params: { filter: "electronics-gadgets" } },
    { text: "Fashion", params: { filter: "fashion-style" } },
    { text: "Food", params: { filter: "food-drink" } },
    { text: "Furniture", params: { filter: "furniture-home" } },
    { text: "Music", params: { filter: "music" } },
    { text: "Nature", params: { filter: "nature-plants" } },
    { text: "News", params: { filter: "news-politics" } },
    { text: "People", params: { filter: "people" } },
    { text: "Places", params: { filter: "places-travel" } },
    { text: "Science", params: { filter: "science-technology" } },
    { text: "Sports", params: { filter: "sports-fitness" } },
    { text: "Weapons", params: { filter: "weapons-military" } }
  ],
  avatars: [
    { text: "Featured", params: { filter: "featured" } },
    { text: "My Avatars", params: { filter: "my-avatars" } },
    { text: "Newest", params: { filter: "" } }
  ],
  favorites: [],
  scenes: [
    { text: "Featured", params: { filter: "featured" } },
    { text: "My Scenes", params: { filter: "my-scenes" } }
  ]
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

const scene = {
  allow_remixing: false,
  attributions: {
    content: [
      {
        author: "mozillareality",
        name: "House with Open Atrium",
        url: "https://sketchfab.com/3d-models/house-with-open-atrium-bc1046092d334bbbacdb40c1cf8796cd"
      },
      {
        author: "mozillareality",
        name: "Couch - midcentury modern",
        url: "https://sketchfab.com/models/f8def3c5f656454c935fe3d626ed9fab"
      },
      {
        author: "mozillareality",
        name: "Armchair - midcentury modern",
        url: "https://sketchfab.com/models/f26063c8ca6a438d9e328b28434d1c44"
      },
      {
        author: "mozillareality",
        name: "End table - wooden with magazine rack",
        url: "https://sketchfab.com/models/7fab655234e84e0ea6a3ada36ece2ad1"
      },
      {
        author: "mozillareality",
        name: "Ceiling Fan",
        url: "https://sketchfab.com/models/ec2c6087d4824211abc827f2a4c2b578"
      },
      {
        author: "mozillareality",
        name: "Light Fixture - Ceiling Recessed",
        url: "https://sketchfab.com/models/269fd427629548a8a0949a6493c5b223"
      },
      {
        author: "mozillareality",
        name: "Dresser - modern light wood",
        url: "https://sketchfab.com/models/25134a84c07e420b93cae181731fd7a0"
      },
      {
        author: "mozillareality",
        name: "Bookshelf - tall wooden",
        url: "https://sketchfab.com/models/efe2a35b92c443519fab5a5b515e92ab"
      },
      {
        author: "mozillareality",
        name: "Desk - marble top",
        url: "https://sketchfab.com/models/328eb54341cc4b3f9c7a07fa1cb71a02"
      },
      {
        author: "mozillareality",
        name: "Desk Lamp - brushed aluminum",
        url: "https://sketchfab.com/models/da4b9020b0614309ab787b67f63c1dba"
      },
      {
        author: "nenjo",
        name: "Spruce Tree - Low Poly",
        url: "https://sketchfab.com/models/b68f79aee62f4e849be265c903f724f5"
      },
      {
        author: "sirenko",
        name: "Radiola Deep Image 209C",
        url: "https://sketchfab.com/models/adf58ffecf8b434bbbecf46596348c56"
      },
      {
        author: "吉木さゆみザ日本のプリンセス (PrincessSayumi92)",
        name: "美人画 2",
        url: "https://sketchfab.com/models/8ed0cbfccfa1449996ff0b06875b1863"
      }
    ],
    creator: "Robert Long"
  },
  description: null,
  id: "123",
  images: { preview: { url: "https://hubs-upload-cdn.com/files/126c3c78-8392-4ea3-bcf8-5dc0c8234933.jpg" } },
  name: "MozAtrium",
  project_id: "123",
  type: "scene",
  url: "#"
};

const sceneListing = {
  allow_remixing: true,
  attributions: {
    content: [
      {
        author: "nigelgoh",
        name: "Viking room",
        url: "https://sketchfab.com/3d-models/viking-room-a49f1b8e4f5c4ecf9e1fe7d81915ad38"
      },
      {
        author: "Kowalo",
        name: "Chandelier",
        url: "https://sketchfab.com/3d-models/chandelier-59171352681843e6a9ebdb057347b8fd"
      }
    ],
    creator: "nigelgoh"
  },
  description: null,
  id: "123",
  images: { preview: { url: "https://hubs-upload-cdn.com/files/8b4efdc8-378e-4a44-a7a9-1006bf2dca7c.jpg" } },
  name: "Viking Room",
  project_id: null,
  type: "scene_listing",
  url: "#"
};

const avatarListing = {
  allow_remixing: false,
  attributions: { creator: "" },
  description: null,
  gltfs: {
    avatar: "https://dev.reticulum.io/api/v1/avatars/yUXsaby/avatar.gltf?v=63734422084",
    base: "https://dev.reticulum.io/api/v1/avatars/yUXsaby/base.gltf?v=63734422084"
  },
  id: "123",
  images: {
    preview: {
      height: 1280,
      url: "https://hubs-upload-cdn.com/files/6d05c5f8-36e2-4bbe-9321-9a4bfb662933.png",
      width: 720
    }
  },
  name: "Sweater",
  type: "avatar_listing",
  url: "#"
};

const avatar = {
  attributions: null,
  description: null,
  gltfs: {
    avatar: "https://dev.reticulum.io/api/v1/avatars/XUbGngS/avatar.gltf?v=63773070094",
    base: "https://dev.reticulum.io/api/v1/avatars/XUbGngS/base.gltf?v=63773070094"
  },
  id: "123",
  images: {
    preview: {
      height: 1280,
      url: "https://hubs-upload-cdn.com/files/deba29fc-f238-4df6-ae04-7eb460133f94.png",
      width: 720
    }
  },
  name: "Sky",
  type: "avatar",
  url: "#"
};

const sketchfabModel = {
  attributions: { creator: { name: "j-conrad", url: "https://sketchfab.com/j-conrad" } },
  id: "a4c500d7358a4a199b6a5cd35f416466",
  images: {
    preview: {
      url: "https://media.sketchfab.com/models/a4c500d7358a4a199b6a5cd35f416466/thumbnails/6b41b00f0f474c058bea071db62097fd/d3a6f64b461f4cc8af7331a220a4122c.jpeg"
    }
  },
  name: "Ducky_MozillaHubs",
  type: "sketchfab_model",
  url: "https://sketchfab.com/models/a4c500d7358a4a199b6a5cd35f416466"
};

const gif = {
  attributions: {},
  id: "17586378",
  images: {
    preview: {
      height: 178,
      type: "mp4",
      url: "https://media.tenor.com/videos/460a01cf67ea961ef7e4e0fc8680ca2d/mp4",
      width: 320
    }
  },
  name: "",
  type: "tenor_image",
  url: "https://media.tenor.com/videos/004424225acc15896c846f6ab3740ad0/mp4"
};

const mediaSources = ["sketchfab", "videos", "scenes", "avatars", "gifs", "images"];

export const Favorites = () => (
  <MediaBrowser selectedSource={"favorites"}>
    <MediaTile entry={room} />
  </MediaBrowser>
);

export const SceneListings = () => (
  <MediaBrowser
    searchPlaceholder="Search Scenes..."
    mediaSources={mediaSources}
    selectedSource={"scenes"}
    activeFilter={"featured"}
    facets={FACETS.scenes}
    headerRight={
      <IconButton lg>
        <LinkIcon />
        <p>Custom Scene</p>
      </IconButton>
    }
    hasNext
  >
    <CreateTile label="Create Scene" type="scene" />
    <MediaTile entry={sceneListing} />
  </MediaBrowser>
);

export const Scenes = () => (
  <MediaBrowser
    searchPlaceholder="Search Scenes..."
    mediaSources={mediaSources}
    selectedSource={"scenes"}
    activeFilter={"my-scenes"}
    facets={FACETS.scenes}
    headerRight={
      <IconButton lg>
        <LinkIcon />
        <p>Custom Scene</p>
      </IconButton>
    }
    hasNext
  >
    <CreateTile label="Create Scene" type="scene" />
    <MediaTile entry={scene} />
    <MediaTile entry={scene} />
    <MediaTile entry={scene} />
    <MediaTile entry={scene} />
    <MediaTile entry={scene} />
    <MediaTile entry={scene} />
  </MediaBrowser>
);

export const AvatarListings = () => (
  <MediaBrowser
    searchPlaceholder="Search Avatars..."
    mediaSources={mediaSources}
    selectedSource={"avatars"}
    activeFilter={"featured"}
    facets={FACETS.avatars}
    headerRight={
      <IconButton lg>
        <LinkIcon />
        <p>Custom Avatar</p>
      </IconButton>
    }
    hasNext
  >
    <CreateTile label="Create Avatar" type="avatar" />
    <MediaTile entry={avatarListing} />
    <MediaTile entry={avatarListing} />
    <MediaTile entry={avatarListing} />
    <MediaTile entry={avatarListing} />
    <MediaTile entry={avatarListing} />
    <MediaTile entry={avatarListing} />
  </MediaBrowser>
);

export const Avatars = () => (
  <MediaBrowser
    searchPlaceholder="Search Avatars..."
    mediaSources={mediaSources}
    selectedSource={"avatars"}
    activeFilter={"my-avatars"}
    facets={FACETS.avatars}
    headerRight={
      <IconButton lg>
        <LinkIcon />
        <p>Custom Avatar</p>
      </IconButton>
    }
    hasNext
  >
    <CreateTile label="Create Avatar" type="avatar" />
    <MediaTile entry={avatar} />
    <MediaTile entry={avatar} />
    <MediaTile entry={avatar} />
    <MediaTile entry={avatar} />
    <MediaTile entry={avatar} />
    <MediaTile entry={avatar} />
  </MediaBrowser>
);

export const SketchfabModel = () => (
  <MediaBrowser
    searchPlaceholder="Search Sketchfab..."
    mediaSources={mediaSources}
    selectedSource={"sketchfab"}
    facets={FACETS.sketchfab}
    headerRight={
      <IconButton lg>
        <LinkIcon />
        <p>Custom Model</p>
      </IconButton>
    }
    hasNext
  >
    <MediaTile entry={sketchfabModel} />
    <MediaTile entry={sketchfabModel} />
    <MediaTile entry={sketchfabModel} />
    <MediaTile entry={sketchfabModel} />
    <MediaTile entry={sketchfabModel} />
    <MediaTile entry={sketchfabModel} />
  </MediaBrowser>
);

export const Gif = () => (
  <MediaBrowser
    searchPlaceholder="Search Tenor..."
    mediaSources={mediaSources}
    selectedSource={"gifs"}
    facets={FACETS.tenor}
    hasNext
  >
    <MediaTile entry={gif} />
    <MediaTile entry={gif} />
    <MediaTile entry={gif} />
    <MediaTile entry={gif} />
    <MediaTile entry={gif} />
    <MediaTile entry={gif} />
  </MediaBrowser>
);
