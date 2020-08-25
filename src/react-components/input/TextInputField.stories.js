import React from "react";
import { withDesign } from "storybook-addon-designs";
import { TextInputField } from "./TextInputField";

export default {
  title: "TextInputField",
  decorators: [withDesign]
};

export const All = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
    <TextInputField />
    <TextInputField placeholder="Placeholder Text" />
    <TextInputField value="Example Text" />
    <TextInputField value="Invalid Text" invalid />
    <TextInputField value="Disabled Text" disabled />
    <TextInputField placeholder="Disabled Placeholder Text" disabled />
    <TextInputField placeholder="Labeled Input" label="With Label" />
    <TextInputField type="password" label="Password" description="Must be at least 12 characters" />
    <TextInputField value="Invalid Text" label="With Label" invalid error="Error value invalid" />
    <TextInputField
      label="Room Link"
      value="https://hubs.link/123456"
      description={
        <>
          Expires after 24 hours <a href="#">Learn More</a>
        </>
      }
    />
  </div>
);

All.parameters = {
  design: {
    type: "figma",
    url: "https://www.figma.com/file/Xag5qaEgYs3KzXvoxx5m8y/Hubs-Redesign?node-id=68%3A7094"
  }
};
