import React from "react";
import { ToolbarButton } from "../input/ToolbarButton";

export function ParticipantContainer({ icon }) {
  return <ToolbarButton icon={icon} preset="user" className="user" />;
}
