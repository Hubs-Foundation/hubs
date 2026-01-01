/* eslint-disable react/prop-types */
import React, { Component } from "react";
import classNames from "classnames";
import inflection from "inflection";
import { connect } from "react-redux";
import { getResources } from "react-admin";
import { withRouter, NavLink } from "react-router-dom";
import { withStyles } from "@material-ui/core/styles";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import HomeIcon from "@material-ui/icons/Home";
import LibraryBooksIcon from "@material-ui/icons/LibraryBooks";
import BackupIcon from "@material-ui/icons/Backup";
import ViewIcon from "@material-ui/icons/ViewList";
import SettingsIcon from "@material-ui/icons/Settings";
import Collapse from "@material-ui/core/Collapse";
import { getServiceDisplayName } from "../utils/ita";
import configs from "../utils/configs";
import { hasPaidFeature, isBrandingDisabled } from "../utils/feature_flags";
import HubsLogo from "../assets/images/hubs_logo.png";

const mapStateToProps = state => ({
  resources: getResources(state)
});

const styles = () => ({
  root: {
    width: "100%",
    paddingTop: 0,
    backgroundColor: "#222222",

    "& .active": {
      backgroundColor: "#1700c7 !important"
    },

    "& .active div span": {
      color: "#ffffff !important"
    },

    "& .active svg": {
      color: "#FFFFFF !important"
    },

    active: {
      color: "#ff0000"
    }
  },
  item: {
    padding: "8px 16px"
  },
  logo: {
    margin: 0,
    padding: 0,
    backgroundColor: "#222222 !important",

    "& img": {
      padding: "0 12px 8px 12px",
      width: "200px"
    }
  },
  icon: {
    marginRight: 0,
    color: "#aaaaaa"
  },
  text: {
    paddingLeft: 10,

    "& span": {
      // Used to override typography
      color: "#eeeeee",
      fontSize: 14
    }
  },
  nested: {
    paddingLeft: 40
  }
});

function getResourceDisplayName(resource) {
  if (resource.options && resource.options.label) {
    return resource.options.label;
  } else {
    return inflection.humanize(inflection.pluralize(resource.name));
  }
}

class Menu extends Component {
  constructor(props) {
    super(props);
    this.sidebarScrollArea = null;
    this.containerRef = React.createRef();
    this.rafId = null;
    this.attachAttemptsLeft = 5;
    this.handleSidebarScrolling = this.handleSidebarScrolling.bind(this);
  }

  renderService(service) {
    return (
      <ListItem
        className={classNames(this.props.classes.item, this.props.classes.nested)}
        component={NavLink}
        key={service}
        to={`/services/${service}`}
      >
        <ListItemIcon className={this.props.classes.icon}>
          <ViewIcon />
        </ListItemIcon>
        <ListItemText className={this.props.classes.text} primary={getServiceDisplayName(service)} />
      </ListItem>
    );
  }

  renderResource(resource) {
    if (!resource.hasList) return null;

    const icon = resource.icon ? <resource.icon /> : <ViewIcon />;
    return (
      <ListItem
        className={classNames(this.props.classes.item, this.props.classes.nested)}
        component={NavLink}
        key={resource.name}
        to={`/${resource.name}`}
      >
        {icon && <ListItemIcon className={this.props.classes.icon}>{icon}</ListItemIcon>}
        <ListItemText className={this.props.classes.text} primary={getResourceDisplayName(resource)} />
      </ListItem>
    );
  }

  handleSidebarScrolling() {
    const element = this.sidebarScrollArea;
    if (!element) return;

    const topIndicator = document.querySelector(".adminSidebar .adminSidebarTopIndicator");
    const bottomIndicator = document.querySelector(".adminSidebar .adminSidebarBottomIndicator");

    const elementScrollBottom = element.scrollHeight - element.clientHeight - element.scrollTop;

    if (topIndicator) topIndicator.style.display = element.scrollTop < 22 ? "none" : "flex";
    if (bottomIndicator) bottomIndicator.style.display = elementScrollBottom < 22 ? "none" : "flex";
  }

  componentDidMount() {
    const getScrollableAncestor = node => {
      let el = node?.parentElement || null;
      while (el) {
        const style = window.getComputedStyle(el);
        const overflowY = style.overflowY;
        const isScrollableY = overflowY === "auto" || overflowY === "scroll" || el.scrollHeight > el.clientHeight + 1;
        if (isScrollableY) return el;
        el = el.parentElement;
      }
      return null;
    };

    // The Drawer that wraps <Sidebar> defers attaching the scrollable `<div>` that actually receives the
    // overflow styles until after the first paint. On the initial frame the ancestor walk returns `null`,
    // so we retry a handful of times via rAF to ensure we subscribe once Material-UI finishes mounting.
    const tryAttach = () => {
      if (this.sidebarScrollArea) return; // already attached
      const container = this.containerRef.current;
      const el = container ? getScrollableAncestor(container) : null;
      if (el) {
        this.sidebarScrollArea = el;
        if (this.sidebarScrollArea.addEventListener) {
          this.sidebarScrollArea.addEventListener("scroll", this.handleSidebarScrolling, { passive: true });
        }
        this.handleSidebarScrolling();
        return;
      }
      if (this.attachAttemptsLeft > 0) {
        this.attachAttemptsLeft -= 1;
        this.rafId = requestAnimationFrame(tryAttach);
      }
    };

    this.attachAttemptsLeft = 5;
    tryAttach();
    window.addEventListener("resize", this.handleSidebarScrolling);
    // Defer initial compute to ensure layout stabilized
    this.rafId = requestAnimationFrame(this.handleSidebarScrolling);
  }

  componentWillUnmount() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.sidebarScrollArea && this.sidebarScrollArea.removeEventListener) {
      this.sidebarScrollArea.removeEventListener("scroll", this.handleSidebarScrolling);
    }
    window.removeEventListener("resize", this.handleSidebarScrolling);
  }

  render() {
    if (configs.ITA_SERVER == "turkey") {
      return (
        <List className={this.props.classes.root} ref={this.containerRef}>
          <ListItem className={this.props.classes.logo}>
            <img className={this.props.classes.logo} src={HubsLogo} />
          </ListItem>
          <ListItem
            className={this.props.classes.item}
            component={NavLink}
            activeStyle={{ backgroundColor: "#D0D0D0" }}
            key="home"
            to="/home"
          >
            <ListItemIcon className={this.props.classes.icon}>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText className={this.props.classes.text} primary="Home" />
          </ListItem>
          <ListItem className={this.props.classes.item}>
            <ListItemIcon className={this.props.classes.icon}>
              <LibraryBooksIcon />
            </ListItemIcon>
            <ListItemText className={this.props.classes.text} primary="Content" />
          </ListItem>
          <Collapse in={true} timeout="auto" unmountOnExit>
            <List component="nav" disablePadding>
              <ListItem
                className={classNames(this.props.classes.item, this.props.classes.nested)}
                component={NavLink}
                key="import"
                to="/import"
              >
                <ListItemIcon className={this.props.classes.icon}>
                  <BackupIcon />
                </ListItemIcon>
                <ListItemText className={this.props.classes.text} primary="Import Content" />
              </ListItem>
              {this.props.resources.map(this.renderResource.bind(this))}
            </List>
          </Collapse>
          <ListItem className={this.props.classes.item}>
            <ListItemIcon className={this.props.classes.icon}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText className={this.props.classes.text} primary="Setup" />
          </ListItem>
          <Collapse in={true} timeout="auto" unmountOnExit>
            <List component="nav" disablePadding>
              <ListItem
                className={classNames(this.props.classes.item, this.props.classes.nested)}
                component={NavLink}
                key="app-settings"
                to="/app-settings"
              >
                <ListItemIcon className={this.props.classes.icon}>
                  <ViewIcon />
                </ListItemIcon>
                <ListItemText className={this.props.classes.text} primary="App Settings" />
              </ListItem>

              {hasPaidFeature() && !isBrandingDisabled() && (
                <>
                  {/* IMAGE SETTING  */}
                  <ListItem
                    className={classNames(this.props.classes.item, this.props.classes.nested)}
                    component={NavLink}
                    key="brand"
                    to="/brand"
                  >
                    <ListItemIcon className={this.props.classes.icon}>
                      <ViewIcon />
                    </ListItemIcon>
                    <ListItemText className={this.props.classes.text} primary="Brand" />
                  </ListItem>

                  {/* THEMES  */}
                  <ListItem
                    className={classNames(this.props.classes.item, this.props.classes.nested)}
                    component={NavLink}
                    key="themes"
                    to="/themes"
                  >
                    <ListItemIcon className={this.props.classes.icon}>
                      <ViewIcon />
                    </ListItemIcon>
                    <ListItemText className={this.props.classes.text} primary="Themes" />
                  </ListItem>
                </>
              )}
            </List>
          </Collapse>
        </List>
      );
    } else {
      return (
        <List className={this.props.classes.root} ref={this.containerRef}>
          <ListItem className={this.props.classes.logo}>
            <img className={this.props.classes.logo} src={HubsLogo} />
          </ListItem>
          <ListItem
            className={this.props.classes.item}
            component={NavLink}
            activeStyle={{ backgroundColor: "#D0D0D0" }}
            key="home"
            to="/home"
          >
            <ListItemIcon className={this.props.classes.icon}>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText className={this.props.classes.text} primary="Home" />
          </ListItem>
          <ListItem className={this.props.classes.item}>
            <ListItemIcon className={this.props.classes.icon}>
              <LibraryBooksIcon />
            </ListItemIcon>
            <ListItemText className={this.props.classes.text} primary="Content" />
          </ListItem>
          <Collapse in={true} timeout="auto" unmountOnExit>
            <List component="nav" disablePadding>
              <ListItem
                className={classNames(this.props.classes.item, this.props.classes.nested)}
                component={NavLink}
                key="import"
                to="/import"
              >
                <ListItemIcon className={this.props.classes.icon}>
                  <BackupIcon />
                </ListItemIcon>
                <ListItemText className={this.props.classes.text} primary="Import Content" />
              </ListItem>
              {this.props.resources.map(this.renderResource.bind(this))}
            </List>
          </Collapse>
          <ListItem className={this.props.classes.item}>
            <ListItemIcon className={this.props.classes.icon}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText className={this.props.classes.text} primary="Setup" />
          </ListItem>
          <Collapse in={true} timeout="auto" unmountOnExit>
            <List component="nav" disablePadding>
              <ListItem
                className={classNames(this.props.classes.item, this.props.classes.nested)}
                component={NavLink}
                key="app-settings"
                to="/app-settings"
              >
                <ListItemIcon className={this.props.classes.icon}>
                  <ViewIcon />
                </ListItemIcon>
                <ListItemText className={this.props.classes.text} primary="App Settings" />
              </ListItem>

              <ListItem
                className={classNames(this.props.classes.item, this.props.classes.nested)}
                component={NavLink}
                key="brand"
                to="/brand"
              >
                <ListItemIcon className={this.props.classes.icon}>
                  <ViewIcon />
                </ListItemIcon>
                <ListItemText className={this.props.classes.text} primary="Brand" />
              </ListItem>

              {/* THEMES  */}
              <ListItem
                className={classNames(this.props.classes.item, this.props.classes.nested)}
                component={NavLink}
                key="themes"
                to="/themes"
              >
                <ListItemIcon className={this.props.classes.icon}>
                  <ViewIcon />
                </ListItemIcon>
                <ListItemText className={this.props.classes.text} primary="Themes" />
              </ListItem>

              <ListItem
                className={classNames(this.props.classes.item, this.props.classes.nested)}
                component={NavLink}
                key="server-setup"
                to="/server-setup"
              >
                <ListItemIcon className={this.props.classes.icon}>
                  <ViewIcon />
                </ListItemIcon>
                <ListItemText className={this.props.classes.text} primary="Server Settings" />
              </ListItem>
              <ListItem
                className={classNames(this.props.classes.item, this.props.classes.nested)}
                component={NavLink}
                key="server-access"
                to="/server-access"
              >
                <ListItemIcon className={this.props.classes.icon}>
                  <ViewIcon />
                </ListItemIcon>
                <ListItemText className={this.props.classes.text} primary="Server Access" />
              </ListItem>
              <ListItem
                className={classNames(this.props.classes.item, this.props.classes.nested)}
                component={NavLink}
                key="content-cdn"
                to="/content-cdn"
              >
                <ListItemIcon className={this.props.classes.icon}>
                  <ViewIcon />
                </ListItemIcon>
                <ListItemText className={this.props.classes.text} primary="Content CDN" />
              </ListItem>
            </List>
          </Collapse>
        </List>
      );
    }
  }
}

export const AdminMenu = withRouter(connect(mapStateToProps)(withStyles(styles)(Menu)));
