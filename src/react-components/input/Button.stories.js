import React from "react";
import { withDesign } from "storybook-addon-designs";
import { Button, presets } from "./Button";

export default {
  title: "Button",
  decorators: [withDesign]
};

export const AllButtons = ({ selected }) => (
  <>
    {presets.map(preset => (
      <Button key={preset} preset={preset} selected={selected}>
        {preset}
      </Button>
    ))}
  </>
);

AllButtons.parameters = {
  design: {
    type: "figma",
    url: "https://www.figma.com/file/Xag5qaEgYs3KzXvoxx5m8y/Hubs-Redesign?node-id=70%3A2186"
  }
};
