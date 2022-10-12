import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { RoomSettingsSidebar } from "./RoomSettingsSidebar";
import backgroundUrl from "../../assets/images/home-hero-background-unbranded.png";

export default {
  title: "Room/RoomSettingsSidebar",
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

export const Base = () => (
  <RoomLayout sidebar={<RoomSettingsSidebar room={room} onSubmit={e => console.log(e)} canChangeScene />} />
);
