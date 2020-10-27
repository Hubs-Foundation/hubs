import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { ObjectsSidebar, ObjectsSidebarItem, NoObjects } from "./ObjectsSidebar";

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
  },
  {
    id: "7",
    name: "Unknown Object"
  }
];

export const Base = () => (
  <RoomLayout
    sidebar={
      <ObjectsSidebar objectCount={objects.length}>
        {objects.map(object => <ObjectsSidebarItem object={object} key={object.id} />)}
      </ObjectsSidebar>
    }
  />
);

Base.parameters = {
  layout: "fullscreen"
};

export const Empty = () => (
  <RoomLayout
    sidebar={
      <ObjectsSidebar objectCount={0}>
        <NoObjects />
      </ObjectsSidebar>
    }
  />
);

Empty.parameters = {
  layout: "fullscreen"
};

export const EmptyWithAddObjectsPerms = () => (
  <RoomLayout
    sidebar={
      <ObjectsSidebar objectCount={0}>
        <NoObjects canAddObjects />
      </ObjectsSidebar>
    }
  />
);

EmptyWithAddObjectsPerms.parameters = {
  layout: "fullscreen"
};
