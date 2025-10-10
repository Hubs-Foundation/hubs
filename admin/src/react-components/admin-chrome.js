import React from "react";
import classNames from "classnames";
import { withStyles } from "@material-ui/core/styles";
import KeyboardArrowUpIcon from "@material-ui/icons/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@material-ui/icons/KeyboardArrowDown";
import { AppBar, Sidebar } from "react-admin";

export const HiddenAppBar = withStyles({
  hideOnDesktop: {
    "@media (min-width: 768px) and (min-height: 480px)": {
      display: "none"
    }
  }
})(props => {
  const { classes, ...other } = props;
  return <AppBar {...other} className={classes.hideOnDesktop} />;
});

export const AdminSidebar = withStyles({
  sidebarScrollingIndicator: {
    position: "sticky",
    display: "none",
    alignItems: "center",
    justifyContent: "center",
    color: "#aaaaaa",
    pointerEvents: "none",
    zIndex: 9999,
    transition: "opacity 0.5s ease",
    opacity: 1
  },
  topIndicator: {
    top: 0,
    background: "linear-gradient(to bottom, rgba(0, 0, 0, 1.0) 0%, rgba(34, 34, 34, 0.7) 70%, transparent 100%)"
  },
  bottomIndicator: {
    bottom: 0,
    background: "linear-gradient(to top, rgba(0, 0, 0, 1.0) 0%, rgba(34, 34, 34, 0.7) 70%, transparent 100%)"
  }
})(props => {
  const { classes, ...other } = props;
  return (
    <Sidebar className="adminSidebar">
      <div className={classNames("adminSidebarTopIndicator", classes.sidebarScrollingIndicator, classes.topIndicator)}>
        <KeyboardArrowUpIcon />
      </div>
      {other.children}
      <div
        className={classNames(
          "adminSidebarBottomIndicator",
          classes.sidebarScrollingIndicator,
          classes.bottomIndicator
        )}
      >
        <KeyboardArrowDownIcon />
      </div>
    </Sidebar>
  );
});
