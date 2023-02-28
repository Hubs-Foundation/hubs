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
import withCommonStyles from '../../utils/with-common-styles';
import { getAdminInfo, getEditableConfig } from '../../utils/ita';
import configs from '../../utils/configs';
import { ReticulumMetaT, AdminInfoT, RetConfigT } from '../../../types';
import '../../styles/globals.scss';
import { Button, Icon } from '@mozilla/lilypad-ui';
import CardSection from '../shared/CardSection';
import {
  DiscordIcon,
  BookIcon,
  QuestionIcon,
  GithubIcon,
} from '../shared/icons';
import Card from '../shared/Card';

const styles = withCommonStyles(() => ({}));

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
      {reticulumMeta &&
        adminInfo &&
        (needsAvatars ||
          needsScenes ||
          isInSESSandbox ||
          exceededStorageQuota) && (
          <Card>
            <h2 className="heading-lg mb-24">Attention</h2>
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
                        Visitors will not be able to upload new scenes, avatars,
                        or files until you increase the &apos;Storage
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
          </Card>
        )}

      <Card classProp="mb-24">
        <h2 className="heading-lg mb-24">Getting Stared</h2>

        {/* AVATARS / SCENES  */}
        <div className="mb-40">
          <h3 className="heading-sm mb-28">Add avatars and scenes</h3>

          <CardSection
            classProp="mb-20"
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
            classProp="mb-20"
            ctaCallback={() => {}}
            cta="apply my window"
            body="Apply your branding to the hub’s website and lobby."
          />

          <CardSection
            classProp="mb-20"
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
            classProp="mb-20"
            ctaCallback={() => {}}
            cta="Change room settings"
            body="Specify the default room size and how they are accessed and created."
          />
        </section>

        {/* CHANGE ROOM */}
        <section className="">
          <h3 className="heading-sm">Limit who can access your hub</h3>

          <CardSection
            ctaCallback={() => {}}
            cta="Limit access guide"
            body="Learn how to control who can enter your hub’s rooms."
          />
        </section>
      </Card>

      <Card>
        <h2 className="heading-lg mb-24">Getting Help</h2>
        <div className="flex-align-items-center mb-20">
          <div className="mr-20">
            <DiscordIcon />
          </div>
          <p className="body-md">
            The <a className="link">Hubs Discord Community</a> is built by Hubs
            users and administrators, just like you.
          </p>
        </div>

        <div className="flex-align-items-center mb-20">
          <div className="mr-20">
            <BookIcon />
          </div>
          <p className="body-md">
            The{' '}
            <a
              href="https://hubs.mozilla.com/docs/welcome.html"
              target="_blank"
              rel="noopener noreferrer"
              className="link"
            >
              Hubs Documentation
            </a>{' '}
            Contain a Getting Started guide and other resources.
          </p>
        </div>

        <div className="flex-align-items-center mb-20">
          <div className="mr-20">
            <QuestionIcon />
          </div>
          <p className="body-md">
            Visit <a className="link">Mozilla Support</a> to seek help with Hubs
            subscriptions.
          </p>
        </div>

        <div className="flex-align-items-center">
          <div className="mr-20">
            <GithubIcon />
          </div>
          <p className="body-md">
            You can <a className="link">ask questions</a> or{' '}
            <a className="link">file an issue</a> on GitHub.
          </p>
        </div>
      </Card>

      <div className="flex-align-items-center ml-12">
        <a className="link mr-24">What's new</a>
        {!configs.IS_LOCAL_OR_CUSTOM_CLIENT && (
          <p className="body-md">
            {`Hubs version: ${process.env.BUILD_VERSION || '?'}`}
          </p>
        )}
      </div>

      {configs.IS_LOCAL_OR_CUSTOM_CLIENT && (
        <div className="body-md mt-12 ml-12">
          <p>App client: Custom client</p>
          <p>{`Undeploy custom client to run build ${
            process.env.BUILD_VERSION || '?'
          }`}</p>
          <p>
            Remember to regularly pull in upstream changes from the "hubs-cloud"
            branch:{' '}
            <a
              href="https://github.com/mozilla/hubs"
              target="_blank"
              rel="noopener noreferrer"
              className="link"
            >
              Github
            </a>
          </p>
        </div>
      )}
    </div>
  );
};

export const SystemEditor = withStyles(styles)(SystemEditorComponent);
