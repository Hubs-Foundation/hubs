import React from "react";
import { withDesign } from "storybook-addon-designs";
import { Button } from "./Button";

export default {
  title: "Button",
  decorators: [withDesign]
};

export const Basic = () => <Button>Text</Button>;

Basic.parameters = {
  design: {
    type: "figma",
    url: "https://www.figma.com/file/Xag5qaEgYs3KzXvoxx5m8y/Hubs-Redesign?node-id=70%3A2186"
  }
};

export const Accept = () => <Button preset="accept">Accept</Button>;

Accept.parameters = {
  design: {
    type: "figma",
    url: "https://www.figma.com/file/Xag5qaEgYs3KzXvoxx5m8y/Hubs-Redesign?node-id=69%3A4742"
  }
};

export const Cancel = () => <Button preset="cancel">Cancel</Button>;

Cancel.parameters = {
  design: {
    type: "figma",
    url: "https://www.figma.com/file/Xag5qaEgYs3KzXvoxx5m8y/Hubs-Redesign?node-id=70%3A2134"
  }
};

export const Blue = () => <Button preset="blue">Blue</Button>;

Blue.parameters = {
  design: {
    type: "figma",
    url: "https://www.figma.com/file/Xag5qaEgYs3KzXvoxx5m8y/Hubs-Redesign?node-id=70%3A2134"
  }
};

export const Orange = () => <Button preset="orange">Orange</Button>;

Orange.parameters = {
  design: {
    type: "figma",
    url: "https://www.figma.com/file/Xag5qaEgYs3KzXvoxx5m8y/Hubs-Redesign?node-id=70%3A2134"
  }
};

export const Purple = () => <Button preset="purple">Purple</Button>;

Purple.parameters = {
  design: {
    type: "figma",
    url: "https://www.figma.com/file/Xag5qaEgYs3KzXvoxx5m8y/Hubs-Redesign?node-id=70%3A2134"
  }
};
