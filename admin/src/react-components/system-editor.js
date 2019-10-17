import React, { Component } from "react";
import { Title } from "react-admin";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import { withStyles } from "@material-ui/core/styles";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import Warning from "@material-ui/icons/Warning";
import { fetchReticulumAuthenticated } from "hubs/src/utils/phoenix-utils";
import withCommonStyles from "../utils/with-common-styles";

const styles = withCommonStyles(() => ({}));

class SystemEditorComponent extends Component {
  state = {
    reticulumMeta: {}
  };

  componentDidMount() {
    this.updateReticulumMeta();
  }

  async updateReticulumMeta() {
    const reticulumMeta = await fetchReticulumAuthenticated(`/api/v1/meta?include_repo`);
    this.setState({ reticulumMeta });
  }

  render() {
    const needsAvatars = this.state.reticulumMeta.repo && !this.state.reticulumMeta.repo.avatar_listings.any;
    const needsScenes = this.state.reticulumMeta.repo && !this.state.reticulumMeta.repo.scene_listings.any;

    return (
      <Card className={this.props.classes.container}>
        <Title title="Hubs Cloud" />
        <CardContent className={this.props.classes.info}>
          <Typography component="p">
            Welcome to Hubs Cloud. Need help? Check out the{" "}
            <a
              href="https://github.com/mozilla/hubs-cloud/wiki/Getting-Started"
              target="_blank"
              rel="noopener noreferrer"
            >
              Getting Started
            </a>{" "}
            guide.
          </Typography>

          {(needsAvatars || needsScenes) && (
            <List>
              {needsAvatars && (
                <ListItem>
                  <ListItemIcon className={this.props.classes.warningIcon}>
                    <Warning />
                  </ListItemIcon>
                  <ListItemText
                    inset
                    primary="Your system has no avatars."
                    secondary="Choose 'Import Content' on the left to load avatars."
                  />
                </ListItem>
              )}
              {needsScenes && (
                <ListItem>
                  <ListItemIcon className={this.props.classes.warningIcon}>
                    <Warning />
                  </ListItemIcon>
                  <ListItemText
                    inset
                    primary="Your system has no scenes."
                    secondary="Choose 'Import Content' on the left to load scenes."
                  />
                </ListItem>
              )}
            </List>
          )}
        </CardContent>
      </Card>
    );
  }
}

export const SystemEditor = withStyles(styles)(SystemEditorComponent);
