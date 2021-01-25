/* eslint-disable @calm/react-intl/missing-formatted-message */
import React from "react";
import { withDesign } from "storybook-addon-designs";
import { TextInputField } from "./TextInputField";
import { Button } from "./Button";
import { ReactComponent as WandIcon } from "../icons/Wand.svg";
import { IconButton } from "./IconButton";
import { Column } from "../layout/Column";

export default {
  title: "TextInputField",
  decorators: [withDesign]
};

export const All = () => (
  <Column padding>
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
      afterInput={<Button preset="accept">Copy</Button>}
    />
    <TextInputField
      label="Room Link"
      value="https://hubs.link/123456"
      description={
        <>
          Expires after 24 hours <a href="#">Learn More</a>
        </>
      }
      beforeInput={<Button preset="accept">Copy</Button>}
    />
    <TextInputField placeholder="Type a message..." afterInput={<Button>Send</Button>} />
    <TextInputField
      placeholder="Type a message..."
      afterInput={<Button>Send</Button>}
      invalid
      error="Error sending message."
    />
    <TextInputField
      placeholder="Search..."
      afterInput={
        <IconButton>
          <WandIcon />
        </IconButton>
      }
    />
    <TextInputField
      value="Cat"
      invalid
      afterInput={
        <IconButton>
          <WandIcon />
        </IconButton>
      }
      error="Network error. Please try again."
    />
    <TextInputField
      value="Cat"
      invalid
      beforeInput={
        <IconButton>
          <WandIcon />
        </IconButton>
      }
      error="Network error. Please try again."
    />
  </Column>
);

All.parameters = {
  design: {
    type: "figma",
    url: "https://www.figma.com/file/Xag5qaEgYs3KzXvoxx5m8y/Hubs-Redesign?node-id=68%3A7094"
  }
};
