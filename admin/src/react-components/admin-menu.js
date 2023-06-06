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

    "& .active": {
      background: "#1700c7!important"
    },

    "& .active div span": {
      color: "#ffffff!important"
    },

    "& .active svg": {
      color: "#FFFFFF"
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
    background: "#222222;!important",

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
    },

    "@media (max-width: 599.95px) and (min-width: 0px)": {
      // Used to override typography on mobile
      "& span ": {
        color: "#333333"
      }
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

  render() {
    if (configs.ITA_SERVER == "turkey") {
      return (
        <List className={this.props.classes.root}>
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
        <List className={this.props.classes.root}>
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
