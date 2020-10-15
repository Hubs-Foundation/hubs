import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { ReactComponent as PinIcon } from "../icons/Pin.svg";
import { ReactComponent as LinkIcon } from "../icons/Link.svg";
import { ReactComponent as GoToIcon } from "../icons/GoTo.svg";
import { ReactComponent as DeleteIcon } from "../icons/Delete.svg";
import { ObjectMenu, ObjectMenuButton } from "./ObjectMenu";
import { Sidebar } from "../sidebar/Sidebar";

export default {
  title: "ObjectMenu"
};

export const Base = () => (
  <RoomLayout
    viewport={
      <ObjectMenu title="Object">
        <ObjectMenuButton>
          <PinIcon />
          <span>Pin</span>
        </ObjectMenuButton>
        <ObjectMenuButton>
          <LinkIcon />
          <span>Link</span>
        </ObjectMenuButton>
        <ObjectMenuButton>
          <GoToIcon />
          <span>View</span>
        </ObjectMenuButton>
        <ObjectMenuButton>
          <DeleteIcon />
          <span>Delete</span>
        </ObjectMenuButton>
      </ObjectMenu>
    }
  />
);

export const WithSidebarOpen = () => (
  <RoomLayout
    viewport={
      <ObjectMenu title="Object">
        <ObjectMenuButton>
          <PinIcon />
          <span>Pin</span>
        </ObjectMenuButton>
        <ObjectMenuButton>
          <LinkIcon />
          <span>Link</span>
        </ObjectMenuButton>
        <ObjectMenuButton>
          <GoToIcon />
          <span>View</span>
        </ObjectMenuButton>
        <ObjectMenuButton>
          <DeleteIcon />
          <span>Delete</span>
        </ObjectMenuButton>
      </ObjectMenu>
    }
    sidebar={<Sidebar title="Sidebar" />}
  />
);
