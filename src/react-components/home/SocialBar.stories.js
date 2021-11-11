import React from "react";
import { Column } from "../layout/Column";
import { SocialBar } from "../home/SocialBar.js";
import { INITIAL_VIEWPORTS } from "@storybook/addon-viewport";

export default {
  title: "SocialBar",
  parameters: {
    viewport: {
      viewports: INITIAL_VIEWPORTS
    }
  }
};

export const All = () => (
  <Column padding>
    <SocialBar />
    <SocialBar mobile />
  </Column>
);

export const Mobile = () => (
  <Column padding>
    <SocialBar mobile />
  </Column>
);

Mobile.parameters = {
  viewport: {
    defaultViewport: "iphone6"
  }
};
