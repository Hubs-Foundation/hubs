import React from "react";
import { withDesign } from "storybook-addon-designs";
import { TextInput } from "./TextInput";

export default {
  title: "TextInput",
  decorators: [withDesign]
};

export const All = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
    <TextInput />
    <TextInput placeholder="Placeholder Text" />
    <TextInput value="Example Text" />
    <TextInput value="Disabled Text" disabled />
    <TextInput placeholder="Disabled Placeholder Text" disabled />
  </div>
);

All.parameters = {
  design: {
    type: "figma",
    url: "https://www.figma.com/file/Xag5qaEgYs3KzXvoxx5m8y/Hubs-Redesign?node-id=68%3A7094"
  }
};
