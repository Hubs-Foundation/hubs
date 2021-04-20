import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { RoomSidebar } from "./RoomSidebar";
import backgroundUrl from "../../assets/images/home-hero-background-unbranded.png";

export default {
  title: "Room/RoomSidebar",
  parameters: {
    layout: "fullscreen"
  }
};

const room = {
  name: "Room Name",
  description: "Room Description",
  scene: {
    name: "Scene Name",
    account_id: "123",
    allow_promotion: false,
    allow_remixing: false,
    url: "#",
    screenshot_url: backgroundUrl,
    attributions: {
      creator: "Creator",
      content: [
        {
          name: "Model 1",
          author: "User 1",
          url: "https://sketchfab.com/example"
        },
        {
          name: "Model 2",
          author: "User 2",
          url: "https://poly.google.com"
        },
        {
          name: "Model 3",
          author: "User 3"
        }
      ]
    }
  }
};

export const SceneOwner = () => <RoomLayout sidebar={<RoomSidebar accountId="123" room={room} />} />;

export const NotSceneOwner = () => <RoomLayout sidebar={<RoomSidebar accountId="456" room={room} />} />;

export const CanEdit = () => <RoomLayout sidebar={<RoomSidebar accountId="123" room={room} canEdit />} />;

export const NotLoggedIn = () => <RoomLayout sidebar={<RoomSidebar room={room} />} />;
