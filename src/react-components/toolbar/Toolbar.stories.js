import React from "react";
import { withDesign } from "storybook-addon-designs";
import { ReactComponent as ShareIcon } from "../icons/Share.svg";
import { ToolbarButton, presets } from "./ToolbarButton";

export default {
  title: "Toolbar",
  decorators: [withDesign],
  argTypes: {
    selected: { control: "boolean" }
  }
};

export const AllButtons = ({ selected }) => (
  <>
    {presets.map(preset => <ToolbarButton icon={<ShareIcon />} label={preset} preset={preset} selected={selected} />)}
  </>
);

AllButtons.parameters = {
  design: {
    type: "figma",
    url: "https://www.figma.com/file/Xag5qaEgYs3KzXvoxx5m8y/Hubs-Redesign?node-id=17%3A725"
  },
  selected: false
};
