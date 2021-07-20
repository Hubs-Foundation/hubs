import React from "react";
import ReactDOM from "react-dom";
import { ToolbarButton } from "../input/ToolbarButton";
export function CanvasMenu({ onClick }) {
  return <ToolbarButton onClick={onClick} preset="toggle" />;
}
