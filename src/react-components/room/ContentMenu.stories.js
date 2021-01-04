/* eslint-disable @calm/react-intl/missing-formatted-message */
import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { ContentMenu, PeopleMenuButton, ObjectsMenuButton } from "./ContentMenu";

export default {
  title: "ContentMenu"
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

Base.parameters = {
  layout: "fullscreen"
};

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

Active.parameters = {
  layout: "fullscreen"
};

export const OnlyPeople = () => (
  <RoomLayout
    viewport={
      <ContentMenu>
        <PeopleMenuButton />
      </ContentMenu>
    }
  />
);

OnlyPeople.parameters = {
  layout: "fullscreen"
};
