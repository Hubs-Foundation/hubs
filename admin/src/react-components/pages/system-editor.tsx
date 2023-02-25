/* eslint-disable react/prop-types */
/* eslint-disable @calm/react-intl/missing-formatted-message*/
import React, { useState, useEffect } from 'react';
// import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import LockIcon from '@material-ui/icons/Lock';
import PaletteIcon from '@material-ui/icons/Palette';
import VpnKeyIcon from '@material-ui/icons/VpnKey';
import CodeIcon from '@material-ui/icons/Code';
import DeveloperModeIcon from '@material-ui/icons/DeveloperMode';
import Warning from '@material-ui/icons/Warning';
import Info from '@material-ui/icons/Info';
import { fetchReticulumAuthenticated } from 'hubs/src/utils/phoenix-utils';
import withUpdatedStyles from '../../utils/with-updated-styles';
import { getAdminInfo, getEditableConfig } from '../../utils/ita';
import configs from '../../utils/configs';
import { ReticulumMetaT, AdminInfoT, RetConfigT } from '../../../types';
import '../../styles/globals.scss';
import { Button, Icon } from '@mozilla/lilypad-ui';
import CardSection from '../shared/CardSection';
import DiscordIcon from '../shared/icons/DiscordIcon';
import Card from '../shared/Card';

const styles = withUpdatedStyles(() => ({}));

const SystemEditorComponent = ({ classes }) => {
  const [adminInfo, setAdminInfo] = useState<AdminInfoT>({} as AdminInfoT);
  const [retConfig, setRetConfig] = useState<RetConfigT>({} as RetConfigT);
  const [reticulumMeta, setReticulumMeta] = useState<ReticulumMetaT>(
    {} as ReticulumMetaT
  );
  // Send quota to use as heuristic for checking if in SES sandbox
  // https://forums.aws.amazon.com/thread.jspa?threadID=61090
  const MAX_AWS_SES_QUOTA_FOR_SANDBOX = 200;

  /**
   * Init Component
   */
  useEffect(() => {
    const init = async () => {
      try {
        const adminInfo = await getAdminInfo();
        setAdminInfo(adminInfo);
      } catch (error) {
        console.log('error', error);
      }

      try {
        const retConfig = await getEditableConfig('reticulum');
        setRetConfig(retConfig);
      } catch (error) {
        console.log('error', error);
      }

      try {
        updateReticulumMeta();
      } catch (error) {
        console.log('error', error);
      }
    };
    init();
  }, []);

  /**
   * Update Reticulum
   */
  const updateReticulumMeta = async () => {
    const path = `/api/v1/meta?include_repo`;
    const reticulumMeta = await fetchReticulumAuthenticated(path);
    setReticulumMeta(reticulumMeta);
  };

  const needsAvatars =
    reticulumMeta.repo && !reticulumMeta.repo.avatar_listings.any;
  const needsScenes =
    reticulumMeta.repo && !reticulumMeta.repo.scene_listings.any;
  const exceededStorageQuota =
    reticulumMeta.repo && !reticulumMeta.repo.storage.in_quota;

  const isInSESSandbox =
    adminInfo &&
    adminInfo.using_ses &&
    adminInfo.ses_max_24_hour_send <= MAX_AWS_SES_QUOTA_FOR_SANDBOX;

  const isUsingCloudflare =
    adminInfo &&
    retConfig &&
    retConfig.phx &&
    retConfig.phx.cors_proxy_url_host ===
      `cors-proxy.${adminInfo.worker_domain}`;

  return (
    <div className="page_wrapper">
      {/* WARNING  */}
      {/* <Card className={classes.container}>
        <CardContent className={classes.info}>
          {reticulumMeta &&
            adminInfo &&
            (needsAvatars ||
              needsScenes ||
              isInSESSandbox ||
              exceededStorageQuota) && (
              <List>
                {isInSESSandbox && (
                  <ListItem>
                    <ListItemIcon className={classes.warningIcon}>
                      <Warning />
                    </ListItemIcon>
                    <ListItemText
                      inset
                      primary={
                        <span>
                          Your AWS account is in the{' '}
                          <a
                            href="https://docs.aws.amazon.com/ses/latest/DeveloperGuide/request-production-access.html"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            AWS Simple Email Service Sandbox.
                          </a>{' '}
                          Follow instructions in{' '}
                          <a
                            href="https://hubs.mozilla.com/docs/hubs-cloud-aws-troubleshooting.html#youre-in-the-aws-sandbox-and-people-dont-receive-magic-link-emails"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {' '}
                            You&apos;re in the AWS SES Sandbox and people
                            don&apos;t receive magic link emails:
                          </a>
                          Solution #1, #2, #3, or{' '}
                          <a
                            href="https://hubs.mozilla.com/docs/hubs-cloud-aws-existing-email-provider.html"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Using an Existing Email Provider
                          </a>
                        </span>
                      }
                      secondary={
                        <span>
                          Users will not be able to log in until the system can
                          send email. You&apos;ll need to either{' '}
                          <a
                            href="https://docs.aws.amazon.com/ses/latest/DeveloperGuide/request-production-access.html"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            follow the instructions
                          </a>{' '}
                          to request a limit increase, or set custom email
                          settings in{' '}
                          <a href="/admin#/server-setup">Server Settings</a>
                        </span>
                      }
                    />
                  </ListItem>
                )}
                {exceededStorageQuota && (
                  <ListItem>
                    <ListItemIcon className={classes.warningIcon}>
                      <Warning />
                    </ListItemIcon>
                    <ListItemText
                      inset
                      primary={
                        <span>
                          You have exceeded your specified storage limit.
                        </span>
                      }
                      secondary={
                        <span>
                          Visitors will not be able to upload new scenes,
                          avatars, or files until you increase the &apos;Storage
                          Limit&apos; in your stack settings.
                        </span>
                      }
                    />
                  </ListItem>
                )}
                {needsAvatars && (
                  <ListItem>
                    <ListItemIcon className={classes.warningIcon}>
                      <Warning />
                    </ListItemIcon>
                    <ListItemText
                      inset
                      primary="Your system has no avatars."
                      secondary="Choose 'Import Content' on the left to load avatars."
                    />
                    <p></p>
                  </ListItem>
                )}
                {needsScenes && (
                  <ListItem>
                    <ListItemIcon className={classes.warningIcon}>
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
                    <ListItemIcon className={classes.infoIcon}>
                      <Info />
                    </ListItemIcon>
                    <ListItemText
                      inset
                      primary={
                        adminInfo.provider === 'arbortect'
                          ? 'You are not using a CDN.'
                          : 'You are using your cloud provider to serve content.'
                      }
                      secondary="You can reduce costs and improve performance by using Cloudflare's CDN to serve content. Choose 'Content CDN' on the left for more info."
                    />
                  </ListItem>
                )}
              </List>
            )}
        </CardContent>
      </Card> */}

      <Card classProp="mb-24">
        <h2 className="heading-lg mb-12">Getting Stared</h2>

        {/* AVATARS / SCENES  */}
        <div className="mb-40">
          <h3 className="heading-sm mb-28">Add avatars and scenes</h3>

          <CardSection
            ctaCallback={() => {}}
            cta="get more avatars and scenes"
            body="Give your hub visitors more scenes to explore and a wider
              selection of avatars to choose from. Install your new assets
              on the Import Content page."
          />
        </div>

        {/* CUSTOMIZE HUB */}
        <section className="mb-40">
          <h3 className="heading-sm mb-28">Customize the look of your hub</h3>

          <CardSection
            ctaCallback={() => {}}
            cta="apply my window"
            body="Apply your branding to the hub’s website and lobby."
          />

          <CardSection
            ctaCallback={() => {}}
            cta="Edit hub’s text and details"
            body="Edit your hub’s name, description and other text content for
                  improved search engines results."
          />
        </section>

        {/* CHANGE ROOM */}
        <section className="mb-40">
          <h3 className="heading-sm mb-28">Change room settings</h3>

          <CardSection
            ctaCallback={() => {}}
            cta="Change room settings"
            body="Specify the default room size and how they are accessed and created."
          />
        </section>

        {/* CHANGE ROOM */}
        <section className="">
          <h3 className="heading-sm mb-28">Limit whoe can access your hub</h3>

          <CardSection
            ctaCallback={() => {}}
            cta="Limit access guide"
            body="Learn how to control who can enter your hub’s rooms."
          />
        </section>
      </Card>

      <Card>
        <h2 className="heading-lg mb-12">Getting Help</h2>
        <div className="flex-align-items-center mb-20">
          <div className="mr-10">
            <DiscordIcon />
          </div>
          <p className="body-md">
            The <a>Hubs Discord Community</a> is built by Hubs users and
            administrators, just like you.
          </p>
        </div>

        <div className="flex-align-items-center mb-20">
          <div className="mr-10">
            <DiscordIcon />
          </div>
          <p className="body-md">
            The <a>Hubs Discord Community</a> is built by Hubs users and
            administrators, just like you.
          </p>
        </div>

        <div className="flex-align-items-center">
          <div className="mr-10">
            <DiscordIcon />
          </div>
          <p className="body-md">
            The <a>Hubs Discord Community</a> is built by Hubs users and
            administrators, just like you.
          </p>
        </div>
      </Card>

      {/* <Card className={classes.container}>
        <CardContent className={classes.info}>
          <h2>🐣 Hubs Cloud is live</h2>
          <p>
            Need help? Check out the{' '}
            <a
              href="https://hubs.mozilla.com/docs/hubs-cloud-getting-started.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              Getting Started
            </a>{' '}
            guide.
          </p>
          <Typography variant="body1" gutterBottom>
            Hubs Cloud updates automatically, see the{' '}
            <a
              href="https://github.com/mozilla/hubs-cloud/blob/master/CHANGELOG.md"
              target="_blank"
              rel="noopener noreferrer"
            >
              Hubs Cloud Changelog
            </a>
            .
          </Typography>
          <Typography variant="body1" gutterBottom>
            <b>Questions or issues?</b> Visit the{' '}
            <a
              href="https://hubs.mozilla.com/docs/welcome.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              Hubs Docs
            </a>{' '}
            or create a{' '}
            <a
              href="https://github.com/mozilla/hubs/discussions"
              target="_blank"
              rel="noopener noreferrer"
            >
              question in discussions
            </a>{' '}
            or{' '}
            <a
              href="https://github.com/mozilla/hubs"
              target="_blank"
              rel="noopener noreferrer"
            >
              issue in github
            </a>
            .
          </Typography>
        </CardContent>
      </Card>

      <Card className={classes.container}>
        <Typography variant="title" gutterBottom>
          In the Admin Panel, you can:
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <PaletteIcon />
            </ListItemIcon>
            <ListItemText
              primary={
                <span>
                  Customize the{' '}
                  <a
                    href="https://hubs.mozilla.com/docs/hubs-cloud-customizing-look-and-feel.html"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    look and feel of your hub
                  </a>{' '}
                  in the <i>App Settings menu</i>
                </span>
              }
            />
          </ListItem>
          <ListItem style={{ paddingLeft: '100px', paddingTop: '0px' }}>
            <ListItemText
              primary={
                <span>
                  Change images, favicon, and logos - <i>Images tab</i>
                </span>
              }
            />
          </ListItem>
          <ListItem style={{ paddingLeft: '100px', paddingTop: '0px' }}>
            <ListItemText
              primary={
                <span>
                  Set the theme colors - <i>Themes tab</i>
                </span>
              }
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <LockIcon />
            </ListItemIcon>
            <ListItemText
              primary={
                <span>
                  Lockdown your instance to specific users via the&nbsp;
                  <a
                    href="https://hubs.mozilla.com/docs/hubs-cloud-limiting-user-access.html"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Limiting Access Guide
                  </a>
                </span>
              }
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <VpnKeyIcon />
            </ListItemIcon>
            <ListItemText
              primary={
                <span>
                  Add your API keys for Google Analytics, Sketchfab, Discord,
                  etc. - &nbsp;
                  <i>Server Settings menu &nbsp;&gt;&nbsp;API Keys tab</i>
                </span>
              }
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <DeveloperModeIcon />
            </ListItemIcon>

            <ListItemText
              primary={
                <span>
                  Add extra Javascript, CSS, Headers, HTML, Cors origins -
                  &nbsp;
                  <i>Server Settings menu &nbsp;&gt;&nbsp;Advanced tab</i>
                </span>
              }
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CodeIcon />
            </ListItemIcon>
            <ListItemText
              primary={
                <span>
                  Not enough customizations? You can modify the client code
                  directly by&nbsp;
                  <a
                    href="https://hubs.mozilla.com/docs/hubs-cloud-custom-clients.html"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    deploying a custom client
                  </a>
                </span>
              }
            />
          </ListItem>
        </List>
      </Card>
      <Card className={classes.container}>
        <CardContent className={classes.info}>
          <Typography variant="title" gutterBottom>
            Your hub version:
          </Typography>
          {configs.IS_LOCAL_OR_CUSTOM_CLIENT ? (
            <>
              <Typography variant="body1" gutterBottom>
                App client: Custom client
              </Typography>
              <Typography variant="body1" gutterBottom>
                {`(Undeploy custom client to run build ${
                  process.env.BUILD_VERSION || '?'
                })`}
              </Typography>
              <Typography variant="body1" gutterBottom>
                {`(Remember to regularly pull in upstream changes from the "hubs-cloud" branch: https://github.com/mozilla/hubs)`}
              </Typography>
            </>
          ) : (
            <Typography variant="body1" gutterBottom>
              {`App client: ${process.env.BUILD_VERSION || '?'}`}
            </Typography>
          )}
        </CardContent>
      </Card> */}
    </div>
  );
};

export const SystemEditor = withStyles(styles)(SystemEditorComponent);
