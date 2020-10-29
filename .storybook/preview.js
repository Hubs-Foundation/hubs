import React from "react";
import { useAccessibleOutlineStyle } from "../src/react-components/input/useAccessibleOutlineStyle";
import "../src/react-components/styles/global.scss";
import { WrappedIntlProvider } from "../src/react-components/wrapped-intl-provider";

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
