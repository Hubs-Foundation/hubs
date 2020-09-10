import React from "react";
import { withDesign } from "storybook-addon-designs";
import { Button, presets } from "./Button";

export default {
  title: "Button",
  decorators: [withDesign]
};

export const All = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
    {presets.map(preset => (
      <Button key={preset} preset={preset}>
        {preset.replace(/^\w/, c => c.toUpperCase())}
      </Button>
    ))}
    <Button disabled>Disabled</Button>
    <Button>Really Really Long Button Name</Button>
  </div>
);

All.parameters = {
  design: {
    type: "figma",
    url: "https://www.figma.com/file/Xag5qaEgYs3KzXvoxx5m8y/Hubs-Redesign?node-id=70%3A2186"
  }
};
