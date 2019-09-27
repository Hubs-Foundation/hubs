import React, { Component } from 'react';
import inflection from 'inflection';
import { connect } from 'react-redux';
import { getResources } from 'react-admin';
import { withRouter, NavLink } from 'react-router-dom';
import { withStyles, createStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ComputerIcon from '@material-ui/icons/Computer';
import LibraryBooksIcon from '@material-ui/icons/LibraryBooks';
import ViewIcon from '@material-ui/icons/ViewList';
import SettingsIcon from '@material-ui/icons/Settings';
import Collapse from '@material-ui/core/Collapse';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import { getServiceDisplayName } from "../utils/ita";

const mapStateToProps = state => ({
  resources: getResources(state),
});

const styles = theme => ({
  root: {
    width: "100%"
  },
  icon: {
    marginRight: 0
  },
  text: {
    paddingLeft: 10
  },
  nested: {
    paddingLeft: 40
  },
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
    const icon = <SettingsIcon />;
    return (
      <ListItem
        className={this.props.classes.nested}
        component={NavLink}
        activeStyle={{ "backgroundColor": "#D0D0D0" }}
        key={service}
        to={`/services/${service}`}>
        <ListItemIcon className={this.props.classes.icon}><ViewIcon /></ListItemIcon>
        <ListItemText className={this.props.classes.text} primary={getServiceDisplayName(service)} />
      </ListItem>
    );
  }

  renderResource(resource) {
    const icon = resource.icon ? <resource.icon /> : <ViewIcon />;
    return (
      <ListItem
        className={this.props.classes.nested}
        component={NavLink}
        activeStyle={{ "backgroundColor": "#D0D0D0" }}
        key={resource.name}
        to={`/${resource.name}`}>
        {icon && <ListItemIcon className={this.props.classes.icon}>{icon}</ListItemIcon>}
        <ListItemText className={this.props.classes.text} primary={getResourceDisplayName(resource)} />
      </ListItem>
    );
  }

  render() {
    return (
      <List className={this.props.classes.root}>
        <ListItem component={NavLink} activeStyle={{ "backgroundColor": "#D0D0D0" }} key="system" to="/system">
          <ListItemIcon className={this.props.classes.icon}><ComputerIcon /></ListItemIcon>
          <ListItemText className={this.props.classes.text} primary="System" />
        </ListItem>
        <ListItem>
          <ListItemIcon className={this.props.classes.icon}><LibraryBooksIcon /></ListItemIcon>
          <ListItemText className={this.props.classes.text} primary="Content" />
        </ListItem>
        <Collapse in={true} timeout="auto" unmountOnExit>
          <List component="nav" disablePadding>
            {this.props.resources.map(this.renderResource.bind(this))}
          </List>
        </Collapse>
        <ListItem>
          <ListItemIcon className={this.props.classes.icon}><SettingsIcon /></ListItemIcon>
          <ListItemText className={this.props.classes.text} primary="Services" />
        </ListItem>
        <Collapse in={true} timeout="auto" unmountOnExit>
          <List component="nav" disablePadding>
            {this.props.services.map(this.renderService.bind(this))}
          </List>
        </Collapse>
      </List>
    );
  }
}

export const AdminMenu = withRouter(connect(mapStateToProps)(withStyles(styles)(Menu)));
