/* eslint-disable @calm/react-intl/missing-formatted-message */
import React from "react";
import { Column } from "../layout/Column";
import { RoomLayout } from "../layout/RoomLayout";
import { ReactComponent as PinIcon } from "../icons/Pin.svg";
import { ReactComponent as LinkIcon } from "../icons/Link.svg";
import { ReactComponent as GoToIcon } from "../icons/GoTo.svg";
import { ReactComponent as DeleteIcon } from "../icons/Delete.svg";
import { ObjectMenu, ObjectMenuButton } from "./ObjectMenu";
import { Sidebar } from "../sidebar/Sidebar";

export default {
  title: "Room/ObjectMenu"
};

export const Base = () => (
  <RoomLayout
    objectFocused
    viewport={
      <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
        <ObjectMenu title="Object" currentObjectIndex={1} objectCount={12}>
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
      </div>
    }
  />
);

export const WithSidebarOpen = () => (
  <RoomLayout
    objectFocused
    viewport={
      <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
        <ObjectMenu title="Object" currentObjectIndex={1} objectCount={12}>
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
      </div>
    }
    sidebar={
      <Sidebar title="Sidebar">
        <Column padding>Test</Column>
      </Sidebar>
    }
  />
);
