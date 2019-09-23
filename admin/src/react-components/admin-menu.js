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
    width: "100%",
  },
  nested: {
    paddingLeft: 4,
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

  state = {
    expanded: null
  }

  onClick(category) {
    if (this.state.expanded === category) {
      this.setState({ expanded: null });
    } else {
      this.setState({ expanded: category });
    }
  }

  renderService(service) {
    const icon = <SettingsIcon />;
    return (
      <ListItem
        component={NavLink}
        activeStyle={{ "backgroundColor": "#D0D0D0" }}
        key={service}
        to={`/services/${service}`}>
        <ListItemIcon>{icon}</ListItemIcon>
        <ListItemText primary={getServiceDisplayName(service)} />
      </ListItem>
    );
  }

  renderResource(resource) {
    const icon = resource.icon ? <resource.icon /> : <ViewIcon />;
    return (
      <ListItem
        component={NavLink}
        activeStyle={{ "backgroundColor": "#D0D0D0" }}
        key={resource.name}
        to={`/${resource.name}`}>
        {icon && <ListItemIcon>{icon}</ListItemIcon>}
        <ListItemText primary={getResourceDisplayName(resource)} />
      </ListItem>
    );
  }

  render() {
    const { expanded } = this.state;
    return (
      <List className={this.props.classes.root}>
        <ListItem component={NavLink} activeStyle={{ "backgroundColor": "#D0D0D0" }} key="system" to="/system">
          <ListItemText primary="System" />
        </ListItem>
        <ListItem button onClick={() => this.onClick("content")}>
          <ListItemText primary="Content" />
          {expanded === "content" ? <ExpandLess /> : <ExpandMore />}
        </ListItem>
        <Collapse in={true} timeout="auto" unmountOnExit>
          <List component="nav" disablePadding>
            {this.props.resources.map(this.renderResource.bind(this))}
          </List>
        </Collapse>
        <ListItem button onClick={() => this.onClick("services")}>
          <ListItemText primary="Services" />
          {expanded === "config" ? <ExpandLess /> : <ExpandMore />}
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
