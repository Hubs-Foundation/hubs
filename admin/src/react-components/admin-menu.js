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

const mapStateToProps = state => ({
  resources: getResources(state)
});

const styles = () => ({
  root: {
    width: "100%",
    paddingTop: 0
  },
  item: {
    padding: "8px 16px"
  },
  icon: {
    marginRight: 0
  },
  text: {
    paddingLeft: 10
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
        activeStyle={{ backgroundColor: "#D0D0D0" }}
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
    const icon = resource.icon ? <resource.icon /> : <ViewIcon />;
    return (
      <ListItem
        className={classNames(this.props.classes.item, this.props.classes.nested)}
        component={NavLink}
        activeStyle={{ backgroundColor: "#D0D0D0" }}
        key={resource.name}
        to={`/${resource.name}`}
      >
        {icon && <ListItemIcon className={this.props.classes.icon}>{icon}</ListItemIcon>}
        <ListItemText className={this.props.classes.text} primary={getResourceDisplayName(resource)} />
      </ListItem>
    );
  }

  render() {
    return (
      <List className={this.props.classes.root}>
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
              activeStyle={{ backgroundColor: "#D0D0D0" }}
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
              activeStyle={{ backgroundColor: "#D0D0D0" }}
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
              activeStyle={{ backgroundColor: "#D0D0D0" }}
              key="server-access"
              to="/server-access"
            >
              <ListItemIcon className={this.props.classes.icon}>
                <ViewIcon />
              </ListItemIcon>
              <ListItemText className={this.props.classes.text} primary="SSH Access" />
            </ListItem>
            <ListItem
              className={classNames(this.props.classes.item, this.props.classes.nested)}
              component={NavLink}
              activeStyle={{ backgroundColor: "#D0D0D0" }}
              key="data-transfer"
              to="/data-transfer"
            >
              <ListItemIcon className={this.props.classes.icon}>
                <ViewIcon />
              </ListItemIcon>
              <ListItemText className={this.props.classes.text} primary="Data Transfer" />
            </ListItem>
          </List>
        </Collapse>
      </List>
    );
  }
}

export const AdminMenu = withRouter(connect(mapStateToProps)(withStyles(styles)(Menu)));
