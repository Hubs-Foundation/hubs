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
import Info from "@material-ui/icons/Info";
import { fetchReticulumAuthenticated } from "hubs/src/utils/phoenix-utils";
import withCommonStyles from "../utils/with-common-styles";
import { getAdminInfo, getConfig } from "../utils/ita";

// Send quota to use as heuristic for checking if in SES sandbox
// https://forums.aws.amazon.com/thread.jspa?threadID=61090
const MAX_AWS_SES_QUOTA_FOR_SANDBOX = 200;

const styles = withCommonStyles(() => ({}));

class SystemEditorComponent extends Component {
  state = {
    reticulumMeta: {}
  };

  async componentDidMount() {
    const adminInfo = await getAdminInfo();
    const retConfig = await getConfig("reticulum");

    this.setState({ adminInfo, retConfig });
    this.updateReticulumMeta();
  }

  async updateReticulumMeta() {
    const reticulumMeta = await fetchReticulumAuthenticated(`/api/v1/meta?include_repo`);
    this.setState({ reticulumMeta });
  }

  render() {
    const needsAvatars = this.state.reticulumMeta.repo && !this.state.reticulumMeta.repo.avatar_listings.any;
    const needsScenes = this.state.reticulumMeta.repo && !this.state.reticulumMeta.repo.scene_listings.any;
    const exceededStorageQuota = this.state.reticulumMeta.repo && !this.state.reticulumMeta.repo.storage.in_quota;

    const isInSESSandbox =
      this.state.adminInfo &&
      this.state.adminInfo.using_ses &&
      this.state.adminInfo.ses_max_24_hour_send <= MAX_AWS_SES_QUOTA_FOR_SANDBOX;

    const isUsingCloudflare =
      this.state.adminInfo &&
      this.state.retConfig &&
      this.state.retConfig.phx &&
      this.state.retConfig.phx.cors_proxy_url_host === `cors-proxy.${this.state.adminInfo.worker_domain}`;

    return (
      <Card className={this.props.classes.container}>
        <Title title="Hubs Cloud" />
        <CardContent className={this.props.classes.info}>
          <Typography variant="title" gutterBottom>
            🐣 Hubs Cloud is live
          </Typography>
          <Typography variant="body1" gutterBottom>
            Need help? Check out the{" "}
            <a
              href="https://github.com/mozilla/hubs-cloud/wiki/Getting-Started"
              target="_blank"
              rel="noopener noreferrer"
            >
              Getting Started
            </a>{" "}
            guide.
          </Typography>

          {this.state.reticulumMeta &&
            this.state.adminInfo &&
            (needsAvatars || needsScenes || isInSESSandbox || exceededStorageQuota) && (
              <List>
                {isInSESSandbox && (
                  <ListItem>
                    <ListItemIcon className={this.props.classes.warningIcon}>
                      <Warning />
                    </ListItemIcon>
                    <ListItemText
                      inset
                      primary={
                        <span>
                          Your AWS account is in the{" "}
                          <a
                            href="https://docs.aws.amazon.com/ses/latest/DeveloperGuide/request-production-access.html"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            AWS Simple Email Service Sandbox
                          </a>{" "}
                        </span>
                      }
                      secondary={
                        <span>
                          Users will not be able to log in until the system can send email. You&apos;ll need to either{" "}
                          <a
                            href="https://docs.aws.amazon.com/ses/latest/DeveloperGuide/request-production-access.html"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            follow the instructions
                          </a>{" "}
                          to request a limit increase, or set custom email settings in{" "}
                          <a href="/admin#/server-setup">Server Settings</a>
                        </span>
                      }
                    />
                  </ListItem>
                )}
                {exceededStorageQuota && (
                  <ListItem>
                    <ListItemIcon className={this.props.classes.warningIcon}>
                      <Warning />
                    </ListItemIcon>
                    <ListItemText
                      inset
                      primary={<span>You have exceeded your specified storage limit.</span>}
                      secondary={
                        <span>
                          Visitors will not be able to upload new scenes, avatars, or files until you increase the
                          &apos;Storage Limit&apos; in your stack settings.
                        </span>
                      }
                    />
                  </ListItem>
                )}
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
                {!isUsingCloudflare && (
                  <ListItem>
                    <ListItemIcon className={this.props.classes.infoIcon}>
                      <Info />
                    </ListItemIcon>
                    <ListItemText
                      inset
                      primary={
                        this.state.adminInfo.provider === "arbortect"
                          ? "You are not using a CDN."
                          : "You are using your cloud provider to serve content."
                      }
                      secondary="You can reduce costs and improve performance by using Cloudflare's CDN to serve content. Choose 'Content CDN' on the left for more info."
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
