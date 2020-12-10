import React from "react";
import { useAccessibleOutlineStyle } from "../src/react-components/input/useAccessibleOutlineStyle";
import "../src/react-components/styles/global.scss";
import { WrappedIntlProvider } from "../src/react-components/wrapped-intl-provider";
import { MINIMAL_VIEWPORTS } from "@storybook/addon-viewport";

const Layout = ({ children }) => {
  useAccessibleOutlineStyle();
  return <WrappedIntlProvider>{children}</WrappedIntlProvider>;
};

export const decorators = [
  Story => (
    <Layout>
      <Story />
    </Layout>
  )
];

export const parameters = {
  viewport: {
    viewports: {
      ...MINIMAL_VIEWPORTS,
      oculusQuest: {
        name: "Oculus Quest",
        styles: {
          width: "800px",
          height: "450px"
        }
      }
    }
  }
};
