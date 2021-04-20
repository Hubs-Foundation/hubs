/* eslint-disable @calm/react-intl/missing-formatted-message */
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
      <ContentMenu>
        <ObjectsMenuButton />
        <PeopleMenuButton />
      </ContentMenu>
    }
  />
);

export const Active = () => (
  <RoomLayout
    viewport={
      <ContentMenu>
        <ObjectsMenuButton active />
        <PeopleMenuButton />
      </ContentMenu>
    }
  />
);

export const OnlyPeople = () => (
  <RoomLayout
    viewport={
      <ContentMenu>
        <PeopleMenuButton />
      </ContentMenu>
    }
  />
);
