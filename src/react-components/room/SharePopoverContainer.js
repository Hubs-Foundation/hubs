import React from "react";
import PropTypes from "prop-types";
import { ReactComponent as VideoIcon } from "../icons/Video.svg";
import { ReactComponent as DesktopIcon } from "../icons/Desktop.svg";
import { SharePopoverButton } from "./SharePopover";

const items = [
  { id: "camera", icon: VideoIcon, color: "purple", label: "Camera" },
  { id: "screen", icon: DesktopIcon, color: "purple", label: "Screen" }
];

export function SharePopoverContainer() {
  return <SharePopoverButton items={items} onSelect={item => console.log(item)} />;
}

SharePopoverContainer.propTypes = {};
