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
        <PeopleMenuButton presencecount={3} />
      </ContentMenu>
    }
  />
);

export const Active = () => (
  <RoomLayout
    viewport={
      <ContentMenu>
        <ObjectsMenuButton active />
        <PeopleMenuButton presencecount={3} />
      </ContentMenu>
    }
  />
);

export const OnlyPeople = () => (
  <RoomLayout
    viewport={
      <ContentMenu>
        <PeopleMenuButton presencecount={5} />
      </ContentMenu>
    }
  />
);
