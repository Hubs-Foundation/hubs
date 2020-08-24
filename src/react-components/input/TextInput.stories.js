import React from "react";
import { withDesign } from "storybook-addon-designs";
import { TextInput } from "./TextInput";

export default {
  title: "TextInput",
  decorators: [withDesign]
};

export const All = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
    <TextInput id="default" />
    <TextInput id="placeholder" placeholder="Placeholder Text" />
    <TextInput id="value" value="Example Text" />
    <TextInput id="invalid" value="Invalid Text" invalid />
    <TextInput id="disabled" value="Disabled Text" disabled />
    <TextInput id="disabledPlaceholder" placeholder="Disabled Placeholder Text" disabled />
    <TextInput id="withLabel" placeholder="Labeled Input" label="With Label" />
  </div>
);

All.parameters = {
  design: {
    type: "figma",
    url: "https://www.figma.com/file/Xag5qaEgYs3KzXvoxx5m8y/Hubs-Redesign?node-id=68%3A7094"
  }
};
