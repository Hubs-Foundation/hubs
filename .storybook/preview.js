import React from "react";
import { useAccessibleOutlineStyle } from "../src/react-components/input/useAccessibleOutlineStyle";
import "../src/react-components/styles/global.scss";

const Layout = ({ children }) => {
  useAccessibleOutlineStyle();
  return <>{children}</>;
};

export const decorators = [
  Story => (
    <Layout>
      <Story />
    </Layout>
  )
];
