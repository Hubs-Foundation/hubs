/* eslint-disable react/prop-types */
import React, { Component } from "react";
import classNames from "classnames";
import inflection from "inflection";
import { connect } from "react-redux";
import { useResourceDefinitions } from "react-admin";
import { NavLink } from "react-router-dom";
import { withStyles } from 'tss-react/mui';
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import HomeIcon from "@mui/icons-material/Home";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import BackupIcon from "@mui/icons-material/Backup";
import ViewIcon from "@mui/icons-material/ViewList";
import SettingsIcon from "@mui/icons-material/Settings";
import Collapse from "@mui/material/Collapse";
import { getServiceDisplayName } from "../utils/ita";
import configs from "../utils/configs";
import { hasPaidFeature } from "../utils/feature_flags";
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

const Menu = (props) => {
  const resourcesDefinitions = useResourceDefinitions();
  const resources = Object.keys(resourcesDefinitions).map(name => resourcesDefinitions[name]);

  // TO DO - unused function to be removed
  // const renderService = (service) => {
  //   return (
  //     <ListItem
  //       className={classNames(props.classes.item, props.classes.nested)}
  //       component={NavLink}
  //       key={service}
  //       to={`/services/${service}`}
  //     >
  //       <ListItemIcon className={props.classes.icon}>
  //         <ViewIcon />
  //       </ListItemIcon>
  //       <ListItemText className={props.classes.text} primary={getServiceDisplayName(service)} />
  //     </ListItem>
  //   );
  // }

  const renderResource = (resource) => {
    if (!resource.hasList) return null;

    const icon = resource.icon ? <resource.icon /> : <ViewIcon />;
    return (
      <ListItem
        className={classNames(props.classes.item, props.classes.nested)}
        component={NavLink}
        key={resource.name}
        to={`/${resource.name}`}
      >
        {icon && <ListItemIcon className={props.classes.icon}>{icon}</ListItemIcon>}
        <ListItemText className={props.classes.text} primary={getResourceDisplayName(resource)} />
      </ListItem>
    );
  }

    if (configs.ITA_SERVER == "turkey") {
      return (
        <List className={props.classes.root}>
          <ListItem className={props.classes.logo}>
            <img className={props.classes.logo} src={HubsLogo} />
          </ListItem>
          <ListItem
            className={props.classes.item}
            component={NavLink}
            activeStyle={{ backgroundColor: "#D0D0D0" }}
            key="home"
            to="/home"
          >
            <ListItemIcon className={props.classes.icon}>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText className={props.classes.text} primary="Home" />
          </ListItem>
          <ListItem className={props.classes.item}>
            <ListItemIcon className={props.classes.icon}>
              <LibraryBooksIcon />
            </ListItemIcon>
            <ListItemText className={props.classes.text} primary="Content" />
          </ListItem>
          <Collapse in={true} timeout="auto" unmountOnExit>
            <List component="nav" disablePadding>
              <ListItem
                className={classNames(props.classes.item, props.classes.nested)}
                component={NavLink}
                key="import"
                to="/import"
              >
                <ListItemIcon className={props.classes.icon}>
                  <BackupIcon />
                </ListItemIcon>
                <ListItemText className={props.classes.text} primary="Import Content" />
              </ListItem>
              {resources.map(renderResource.bind(this))}
            </List>
          </Collapse>
          <ListItem className={props.classes.item}>
            <ListItemIcon className={props.classes.icon}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText className={props.classes.text} primary="Setup" />
          </ListItem>
          <Collapse in={true} timeout="auto" unmountOnExit>
            <List component="nav" disablePadding>
              <ListItem
                className={classNames(props.classes.item, props.classes.nested)}
                component={NavLink}
                key="app-settings"
                to="/app-settings"
              >
                <ListItemIcon className={props.classes.icon}>
                  <ViewIcon />
                </ListItemIcon>
                <ListItemText className={props.classes.text} primary="App Settings" />
              </ListItem>

              {hasPaidFeature() && (
                <>
                  {/* IMAGE SETTING  */}
                  <ListItem
                    className={classNames(props.classes.item, props.classes.nested)}
                    component={NavLink}
                    key="brand"
                    to="/brand"
                  >
                    <ListItemIcon className={props.classes.icon}>
                      <ViewIcon />
                    </ListItemIcon>
                    <ListItemText className={props.classes.text} primary="Brand" />
                  </ListItem>

                  {/* THEMES  */}
                  <ListItem
                    className={classNames(props.classes.item, props.classes.nested)}
                    component={NavLink}
                    key="themes"
                    to="/themes"
                  >
                    <ListItemIcon className={props.classes.icon}>
                      <ViewIcon />
                    </ListItemIcon>
                    <ListItemText className={props.classes.text} primary="Themes" />
                  </ListItem>
                </>
              )}
            </List>
          </Collapse>
        </List>
      );
    } else {
      return (
        <List className={props.classes.root}>
          <ListItem className={props.classes.logo}>
            <img className={props.classes.logo} src={HubsLogo} />
          </ListItem>
          <ListItem
            className={props.classes.item}
            component={NavLink}
            activeStyle={{ backgroundColor: "#D0D0D0" }}
            key="home"
            to="/home"
          >
            <ListItemIcon className={props.classes.icon}>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText className={props.classes.text} primary="Home" />
          </ListItem>
          <ListItem className={props.classes.item}>
            <ListItemIcon className={props.classes.icon}>
              <LibraryBooksIcon />
            </ListItemIcon>
            <ListItemText className={props.classes.text} primary="Content" />
          </ListItem>
          <Collapse in={true} timeout="auto" unmountOnExit>
            <List component="nav" disablePadding>
              <ListItem
                className={classNames(props.classes.item, props.classes.nested)}
                component={NavLink}
                key="import"
                to="/import"
              >
                <ListItemIcon className={props.classes.icon}>
                  <BackupIcon />
                </ListItemIcon>
                <ListItemText className={props.classes.text} primary="Import Content" />
              </ListItem>
              {resources.map(renderResource.bind(this))}
            </List>
          </Collapse>
          <ListItem className={props.classes.item}>
            <ListItemIcon className={props.classes.icon}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText className={props.classes.text} primary="Setup" />
          </ListItem>
          <Collapse in={true} timeout="auto" unmountOnExit>
            <List component="nav" disablePadding>
              <ListItem
                className={classNames(props.classes.item, props.classes.nested)}
                component={NavLink}
                key="app-settings"
                to="/app-settings"
              >
                <ListItemIcon className={props.classes.icon}>
                  <ViewIcon />
                </ListItemIcon>
                <ListItemText className={props.classes.text} primary="App Settings" />
              </ListItem>

              <ListItem
                className={classNames(props.classes.item, props.classes.nested)}
                component={NavLink}
                key="brand"
                to="/brand"
              >
                <ListItemIcon className={props.classes.icon}>
                  <ViewIcon />
                </ListItemIcon>
                <ListItemText className={props.classes.text} primary="Brand" />
              </ListItem>

              {/* THEMES  */}
              <ListItem
                className={classNames(props.classes.item, props.classes.nested)}
                component={NavLink}
                key="themes"
                to="/themes"
              >
                <ListItemIcon className={props.classes.icon}>
                  <ViewIcon />
                </ListItemIcon>
                <ListItemText className={props.classes.text} primary="Themes" />
              </ListItem>

              <ListItem
                className={classNames(props.classes.item, props.classes.nested)}
                component={NavLink}
                key="server-setup"
                to="/server-setup"
              >
                <ListItemIcon className={props.classes.icon}>
                  <ViewIcon />
                </ListItemIcon>
                <ListItemText className={props.classes.text} primary="Server Settings" />
              </ListItem>
              <ListItem
                className={classNames(props.classes.item, props.classes.nested)}
                component={NavLink}
                key="server-access"
                to="/server-access"
              >
                <ListItemIcon className={props.classes.icon}>
                  <ViewIcon />
                </ListItemIcon>
                <ListItemText className={props.classes.text} primary="Server Access" />
              </ListItem>
              <ListItem
                className={classNames(props.classes.item, props.classes.nested)}
                component={NavLink}
                key="content-cdn"
                to="/content-cdn"
              >
                <ListItemIcon className={props.classes.icon}>
                  <ViewIcon />
                </ListItemIcon>
                <ListItemText className={props.classes.text} primary="Content CDN" />
              </ListItem>
            </List>
          </Collapse>
        </List>
      );
    }

}

export const AdminMenu = connect(mapStateToProps)(withStyles(Menu, styles));
