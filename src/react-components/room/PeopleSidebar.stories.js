import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { PeopleSidebar } from "./PeopleSidebar";

export default {
  title: "Room/PeopleSidebar",
  parameters: {
    layout: "fullscreen"
  }
};

const people = [
  {
    id: "1",
    isMe: true,
    profile: {
      displayName: "Robert"
    },
    roles: {
      owner: true
    },
    context: {
      desktop: true
    },
    micPresence: {
      muted: false,
      talking: false
    },
    presence: "room"
  },
  {
    id: "2",
    isMe: false,
    profile: {
      displayName: "Hubs Bot"
    },
    roles: {
      owner: false
    },
    context: {
      discord: true
    },
    micPresence: undefined,
    presence: "lobby"
  },
  {
    id: "3",
    isMe: false,
    profile: {
      displayName: "John"
    },
    roles: {
      owner: false
    },
    context: {
      mobile: true
    },
    micPresence: {
      talking: true,
      muted: false
    },
    presence: "room"
  }
];

export const Base = () => <RoomLayout sidebar={<PeopleSidebar people={people} />} />;
