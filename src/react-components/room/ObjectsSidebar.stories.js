import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { ObjectsSidebar } from "./ObjectsSidebar";

export default {
  title: "ObjectsSidebar"
};

const objects = [
  {
    id: "1",
    name: "Campfire",
    type: "model"
  },
  {
    id: "3",
    name: "longcat.jpg",
    type: "image"
  },
  {
    id: "4",
    name: "Quack.mp3",
    type: "audio"
  },
  {
    id: "5",
    name: "Lofi Hip Hop - beats to test code to",
    type: "video"
  },
  {
    id: "6",
    name: "VRML 1.0 Specification",
    type: "pdf"
  }
];

export const Base = () => <RoomLayout sidebar={<ObjectsSidebar objects={objects} />} />;

Base.parameters = {
  layout: "fullscreen"
};
