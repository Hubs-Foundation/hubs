/* eslint-disable @calm/react-intl/missing-formatted-message */
import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { ContentMenu, ContentMenuButton } from "./ContentMenu";
import { ReactComponent as ObjectsIcon } from "../icons/Objects.svg";
import { ReactComponent as PeopleIcon } from "../icons/People.svg";

export default {
  title: "ContentMenu"
};

export const Base = () => (
  <RoomLayout
    viewport={
      <ContentMenu>
        <ContentMenuButton>
          <ObjectsIcon />
          <span>Objects</span>
        </ContentMenuButton>
        <ContentMenuButton>
          <PeopleIcon />
          <span>People</span>
        </ContentMenuButton>
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
        <ContentMenuButton active>
          <ObjectsIcon />
          <span>Objects</span>
        </ContentMenuButton>
        <ContentMenuButton>
          <PeopleIcon />
          <span>People</span>
        </ContentMenuButton>
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
        <ContentMenuButton>
          <PeopleIcon />
          <span>People</span>
        </ContentMenuButton>
      </ContentMenu>
    }
  />
);

OnlyPeople.parameters = {
  layout: "fullscreen"
};
