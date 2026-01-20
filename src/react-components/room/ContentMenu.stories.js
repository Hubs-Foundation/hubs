import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { ContentMenu, PeopleMenuButton, ObjectsMenuButton } from "./ContentMenu";

export default {
  title: "Room/ContentMenu",
  parameters: {
    layout: "fullscreen"
  }
};

export const Base = () => (
  <RoomLayout
    viewport={
      <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
        <ContentMenu>
          <ObjectsMenuButton />
          <PeopleMenuButton />
        </ContentMenu>
      </div>
    }
  />
);

export const Active = () => (
  <RoomLayout
    viewport={
      <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
        <ContentMenu>
          <ObjectsMenuButton active />
          <PeopleMenuButton />
        </ContentMenu>
      </div>
    }
  />
);

export const OnlyPeople = () => (
  <RoomLayout
    viewport={
      <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
        <ContentMenu>
          <PeopleMenuButton />
        </ContentMenu>
      </div>
    }
  />
);
