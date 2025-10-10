import React from "react"; // Required by eslint react/react-in-jsx-scope
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
  const { classes, className, ...appBarProps } = props;
  return <AppBar {...appBarProps} className={classNames(classes.hideOnDesktop, className)} />;
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
  const { classes, className, children, ...sidebarProps } = props;
  return (
    <Sidebar {...sidebarProps} className={classNames("adminSidebar", className)}>
      <div className={classNames("adminSidebarTopIndicator", classes.sidebarScrollingIndicator, classes.topIndicator)}>
        <KeyboardArrowUpIcon />
      </div>
      {children}
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
