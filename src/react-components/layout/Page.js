import React from "react";
import PropTypes from "prop-types";
import "./Page.scss";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function Page({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}

Page.propTypes = {
  children: PropTypes.node
};
