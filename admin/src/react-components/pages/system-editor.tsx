import React, { useState, useEffect } from "react";
import { withStyles } from "@material-ui/core/styles";
import { fetchReticulumAuthenticated } from "hubs/src/utils/phoenix-utils";
import withCommonStyles from "../../utils/with-common-styles";
import { getAdminInfo, getEditableConfig } from "../../utils/ita";
import configs from "../../utils/configs";
import { ReticulumMetaT, AdminInfoT, RetConfigT, ErrorT } from "../../../types";
import "../../styles/globals.scss";
import CardSection from "../shared/CardSection";
import { Icon } from "@mozilla/lilypad-ui";
import { DiscordIcon, BookIcon, QuestionIcon, GithubIcon } from "../shared/icons";
import Card from "../shared/Card";
import { hasPaidFeature, isBrandingDisabled } from "../../utils/feature_flags";

const styles = withCommonStyles(() => ({}));

const SystemEditorComponent = ({ classes }) => {
  const [adminInfo, setAdminInfo] = useState<AdminInfoT | null>(null);
  const [retConfig, setRetConfig] = useState<RetConfigT>({} as RetConfigT);
  const [reticulumMeta, setReticulumMeta] = useState<ReticulumMetaT>({} as ReticulumMetaT);
  const [needsAvatars, setNeedsAvatars] = useState<boolean>(false);
  const [needsScenes, setNeedsScenes] = useState<boolean>(false);
  const [exceededStorageQuota, setExceededStorageQuota] = useState<boolean>(false);
  const [isInSESSandbox, setIsInSESSandbox] = useState<boolean>(false);
  const [isUsingCloudflare, setIsUsingCloudflare] = useState<boolean>(false);

  /**
   * Init Component
   */
  useEffect(() => {
    const init = async () => {
      try {
        const service = "reticulum";
        const retResp: RetConfigT | ErrorT = await getEditableConfig(service);
        const adminResp: AdminInfoT | ErrorT = await getAdminInfo();

        if (adminResp.code === 200 && retResp.code === 200) {
          const adminData = adminResp as AdminInfoT;
          const { using_ses, ses_max_24_hour_send } = adminData;
          const retData = retResp as RetConfigT;
          const maxQuotaForSandbox = 200;
          // Send quota to use as heuristic for checking if in SES sandbox
          // https://forums.aws.amazon.com/thread.jspa?threadID=61090

          /**
           * CHECK USER STATUS
           * - Is in a Sandbox
           * - is Using cloud flate
           */
          setRetConfig(retData);
          setAdminInfo(adminData);
          setIsInSESSandbox(using_ses && ses_max_24_hour_send <= maxQuotaForSandbox);
          setIsUsingCloudflare(retConfig.phx.cors_proxy_url_host === `cors-proxy.${adminData.worker_domain}`);
        }

        updateReticulumMeta();
      } catch (error) {
        // TODO impliment an error state in the UI
        // also if any of the above come back error - we need
        // a ui for that as well.
        console.error(error);
      }
    };
    init();
  }, []);

  /**
   * Update Reticulum
   */
  const updateReticulumMeta = async () => {
    const path = `/api/v1/meta?include_repo`;
    const reticulumMeta: ReticulumMetaT = await fetchReticulumAuthenticated(path);

    /**
     * CHECK USER STATUS
     * - Needs Avatars
     * - Needs Scenes
     */
    const { avatar_listings, scene_listings, storage } = reticulumMeta.repo;
    setReticulumMeta(reticulumMeta);
    setNeedsAvatars(!avatar_listings.any);
    setNeedsScenes(!scene_listings.any);
    setExceededStorageQuota(!storage.in_quota);
  };

  return (
    <div className="page_wrapper">
      <Card className="mb-24">
        <h2 className="heading-lg mb-24">Getting Started</h2>

        {/* AVATARS / SCENES  */}
        <div className="mb-40">
          <h3 className="heading-sm mb-28">Add avatars and scenes</h3>

          <CardSection
            className="mb-20"
            ctaCallback={() => {
              window.open(`https://docs.hubsfoundation.org/hubs-cloud-asset-packs.html`);
            }}
            cta="get more avatars and scenes"
            body="Give your hub visitors more scenes to explore and a wider
              selection of avatars to choose from. Install your new assets
              on the Import Content page."
          />
        </div>

        {/* CUSTOMIZE HUB */}
        <section className="mb-40">
          <h3 className="heading-sm mb-28">Customize the look of your hub</h3>

          {hasPaidFeature() && !isBrandingDisabled() && (
            <CardSection
              className="mb-20"
              ctaCallback={() => {
                window.location.href = "#/brand";
              }}
              cta="Add my Logo"
              body="Apply your branding to the hub’s website and lobby."
            />
          )}

          <CardSection
            className="mb-20"
            ctaCallback={() => {
              window.location.href = "#/app-settings";
            }}
            cta="Edit hub’s text and details"
            body="Edit your hub’s name, description and other text content for
                  improved search engines results."
          />
        </section>

        {/* CHANGE ROOM */}
        <section className="mb-40">
          <h3 className="heading-sm mb-28">Change room settings</h3>

          <CardSection
            className="mb-20"
            ctaCallback={() => {
              window.location.href = "#/app-settings";
            }}
            cta="Change room settings"
            body="Specify the default room size and how they are accessed and created."
          />
        </section>

        {/* CHANGE ROOM */}
        <section className="">
          <h3 className="heading-sm">Limit who can access your hub</h3>

          <CardSection
            ctaCallback={() => {
              window.open("https://docs.hubsfoundation.org/hubs-cloud-limiting-user-access.html");
            }}
            cta="Limit access guide"
            body="Learn how to control who can enter your hub’s rooms."
          />
        </section>
      </Card>

      {/* WARNING  */}
      {reticulumMeta && adminInfo && (needsAvatars || needsScenes || isInSESSandbox || exceededStorageQuota) && (
        <Card>
          <h2 className="heading-lg mb-12">Status</h2>
          {isInSESSandbox && (
            <div className="flex mb-12">
              <div className="mr-20">
                <Icon name="alert-triangle" />
              </div>
              <div className="flex-box">
                <div className="body-md">
                  Your AWS account is in the{" "}
                  <a
                    href="https://docs.aws.amazon.com/ses/latest/DeveloperGuide/request-production-access.html"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    AWS Simple Email Service Sandbox.
                  </a>{" "}
                  Follow instructions in{" "}
                  <a
                    href="https://docs.hubsfoundation.org/hubs-cloud-aws-troubleshooting.html#youre-in-the-aws-sandbox-and-people-dont-receive-magic-link-emails"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    You&apos;re in the AWS SES Sandbox and people don&apos;t receive magic link emails:
                  </a>
                  Solution #1, #2, #3, or{" "}
                  <a
                    href="https://docs.hubsfoundation.org/hubs-cloud-aws-existing-email-provider.html"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Using an Existing Email Provider
                  </a>
                </div>
                <div className="body-sm">
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
                </div>
              </div>
            </div>
          )}
          {exceededStorageQuota && (
            <div className="flex mb-12">
              <div className="mr-20">
                <Icon name="alert-triangle" />
              </div>
              <div className="flex-box">
                <div className="body-md">You have exceeded your specified storage limit.</div>
                <div className="body-sm">
                  Visitors will not be able to upload new scenes, avatars, or files until you increase the &apos;Storage
                  Limit&apos; in your stack settings.
                </div>
              </div>
            </div>
          )}
          {needsAvatars && (
            <div className="flex mb-12">
              <div className="mr-20">
                <Icon name="alert-triangle" />
              </div>
              <div className="flex-box">
                <div className="body-md">Your system has no avatars.</div>
                <div className="body-sm">Choose 'Import Content' on the left to load avatars.</div>
              </div>
            </div>
          )}
          {needsScenes && (
            <div className="flex mb-12">
              <div className="mr-20">
                <Icon name="alert-triangle" />
              </div>
              <div className="flex-box">
                <div className="body-md">Your system has no scenes.</div>
                <div className="body-sm">Choose 'Import Content' on the left to load scenes.</div>
              </div>
            </div>
          )}
          {!isUsingCloudflare && (
            <div className="flex">
              <div className="mr-20">
                <Icon name="info" />
              </div>
              <div className="flex-box">
                <div className="body-md">
                  {adminInfo.provider === "arbortect"
                    ? "You are not using a CDN."
                    : "You are using your cloud provider to serve content."}
                </div>
                <div className="body-sm">
                  You can reduce costs and improve performance by using Cloudflare's CDN to serve content. Choose
                  'Content CDN' on the left for more info.
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      <Card>
        <h2 className="heading-lg mb-24">Getting Help</h2>
        <div className="flex-align-items-center mb-20">
          <div className="mr-20">
            <DiscordIcon />
          </div>
          <p className="body-md">
            The{" "}
            <a className="link" rel="noopener noreferrer" href="https://discord.com/invite/sBMqSjCndj" target="_blank">
              Hubs Discord Community
            </a>{" "}
            is built by Hubs users and administrators, just like you.
          </p>
        </div>

        <div className="flex-align-items-center mb-20">
          <div className="mr-20">
            <BookIcon />
          </div>
          <p className="body-md">
            The{" "}
            <a
              href="https://docs.hubsfoundation.org/welcome.html"
              target="_blank"
              rel="noopener noreferrer"
              className="link"
            >
              Hubs Documentation
            </a>{" "}
            contains a Getting Started guide and other resources.
          </p>
        </div>

        <div className="flex-align-items-center mb-20">
          <div className="mr-20">
            <QuestionIcon />
          </div>
          <p className="body-md">
            Visit{" "}
            <a
              href="https://discord.gg/hubs-498741086295031808"
              target="_blank"
              rel="noopener noreferrer"
              className="link"
            >
              Hubs Support
            </a>{" "}
            to seek help with Hubs problems.
          </p>
        </div>

        <div className="flex-align-items-center">
          <div className="mr-20">
            <GithubIcon />
          </div>
          <p className="body-md">
            You can{" "}
            <a
              rel="noopener noreferrer"
              href="https://github.com/Hubs-Foundation/hubs/discussions"
              target="_blank"
              className="link"
            >
              ask questions
            </a>{" "}
            or{" "}
            <a className="link" href="https://github.com/Hubs-Foundation/hubs" target="_blank" rel="noopener noreferrer">
              file an issue
            </a>{" "}
            on GitHub.
          </p>
        </div>
      </Card>

      <div className="flex-align-items-center ml-12">
        <a href="https://demo.hubsfoundation.org/whats-new" target="_blank" rel="noopener noreferrer" className="link mr-24">
          What's new
        </a>
        {!configs.IS_LOCAL_OR_CUSTOM_CLIENT && (
          <p className="body-md">{`Hubs version: ${process.env.BUILD_VERSION || "?"}`}</p>
        )}
      </div>

      {configs.IS_LOCAL_OR_CUSTOM_CLIENT && (
        <div className="body-md mt-12 ml-12">
          <p>App client: Custom client</p>
          <p>{`Undeploy custom client to run build ${process.env.BUILD_VERSION || "?"}`}</p>
          <p>
            Remember to regularly pull in upstream changes from the "hubs-cloud" branch:{" "}
            <a href="https://github.com/Hubs-Foundation/hubs" target="_blank" rel="noopener noreferrer" className="link">
              Github
            </a>
          </p>
        </div>
      )}
    </div>
  );
};

export const SystemEditor = withStyles(styles)(SystemEditorComponent);
