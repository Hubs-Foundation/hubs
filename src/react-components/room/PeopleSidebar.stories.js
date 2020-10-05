import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { PeopleSidebar } from "./PeopleSidebar";

export default {
  title: "PeopleSidebar"
};

const people = [
  {
    id: 1,
    isMe: true,
    name: "Robert",
    isModerator: true,
    device: "desktop",
    micStatus: "unmuted",
    presence: "room"
  },
  {
    id: 2,
    isMe: false,
    name: "Hubs Bot",
    isModerator: false,
    device: "discord-bot",
    micStatus: undefined,
    presence: "lobby"
  },
  {
    id: 3,
    isMe: false,
    name: "Tyler Travers",
    isModerator: false,
    device: "phone",
    micStatus: "talking",
    presence: "room"
  }
];

export const Base = () => <RoomLayout sidebar={<PeopleSidebar people={people} />} />;

Base.parameters = {
  layout: "fullscreen"
};
