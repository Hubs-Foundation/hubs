import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Checkbox from "@material-ui/core/Checkbox";
import CircularProgress from "@material-ui/core/CircularProgress";
import LinearProgress from "@material-ui/core/LinearProgress";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import { Title } from "react-admin";
import Button from "@material-ui/core/Button";
import withCommonStyles from "../utils/with-common-styles";
import { getAdminInfo, getConfig, putConfig } from "../utils/ita";
import Snackbar from "@material-ui/core/Snackbar";
import SnackbarContent from "@material-ui/core/SnackbarContent";
import Icon from "@material-ui/core/Icon";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import clsx from "classnames";
import configs from "../utils/configs";

// NOTE there's a mysterious uncaught exception in a promise when this component is shown, that seems
// to be coupled with the "All 3rd party content" typography block. It's a mystery.

const styles = withCommonStyles(() => ({
  worker: {
    width: "600px",
    height: "200px",
    fontFamily: "monospace",
    marginTop: "8px"
  }
}));

const workerScript = (workerDomain, assetsDomain) => {
  return `  const ALLOWED_ORIGINS = ["${document.location.origin}"];
  const CORS_PROXY_HOST = "https://cors-proxy.${workerDomain}";
  const PROXY_HOST = "https://${workerDomain}";
  const HUB_HOST = "${document.location.origin}";
  const ASSETS_HOST = "https://${assetsDomain}";

  addEventListener("fetch", e => {
    const request = e.request;
    const origin = request.headers.get("Origin");
    // eslint-disable-next-line no-useless-escape
  
    const isCorsProxy = request.url.indexOf(CORS_PROXY_HOST) === 0;
    const proxyUrl = new URL(isCorsProxy ? CORS_PROXY_HOST : PROXY_HOST);
    const targetPath = request.url.substring((isCorsProxy ? CORS_PROXY_HOST : PROXY_HOST).length + 1);
    let targetUrl;
  
    if (targetPath.startsWith("files/") || targetPath.startsWith("thumbnail/")) {
      targetUrl = \`\${HUB_HOST}/\${targetPath}\`;
    } else if (targetPath.startsWith("hubs/") || targetPath.startsWith("spoke/") || targetPath.startsWith("admin/") || targetPath.startsWith("assets/")) {
      targetUrl = \`\${ASSETS_HOST}/\${targetPath}\`;
    } else {
      if (!isCorsProxy) {
        // Do not allow cors proxying from main domain, always require cors-proxy. subdomain to ensure CSP stays sane.
        return;
      }
      // This is a weird workaround that seems to stem from the cloudflare worker receiving the wrong url
      targetUrl = targetPath.replace(/^http(s?):\\/([^/])/, "http$1://$2");
  
      if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
        targetUrl = proxyUrl.protocol + "//" + targetUrl;
      }
    }
    
    const requestHeaders = new Headers(request.headers);
    requestHeaders.delete("Origin"); // Some domains disallow access from improper Origins
  
    e.respondWith((async () => {
      const res = await fetch(targetUrl, { headers: requestHeaders, method: request.method, redirect: "manual", referrer: request.referrer, referrerPolicy: request.referrerPolicy });      
      const responseHeaders = new Headers(res.headers);
      const redirectLocation = responseHeaders.get("Location") || responseHeaders.get("location");
  
      if(redirectLocation) {
        if (!redirectLocation.startsWith("/")) {
          responseHeaders.set("Location",  proxyUrl.protocol + "//" + proxyUrl.host + "/" + redirectLocation);
        } else {
          const tUrl = new URL(targetUrl);
          responseHeaders.set("Location",  proxyUrl.protocol + "//" + proxyUrl.host + "/" + tUrl.origin + redirectLocation);
        }
      }
  
      if (origin && ALLOWED_ORIGINS.indexOf(origin) >= 0) {
        responseHeaders.set("Access-Control-Allow-Origin", origin);
        responseHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
        responseHeaders.set("Access-Control-Allow-Headers", "Range");
        responseHeaders.set("Access-Control-Expose-Headers", "Accept-Ranges, Content-Encoding, Content-Length, Content-Range");
      }
  
      responseHeaders.set("Vary", "Origin");
      responseHeaders.set('X-Content-Type-Options', "nosniff");
  
      return new Response(res.body, { status: res.status, statusText: res.statusText, headers: responseHeaders });  
    })());
  });`;
};

class ContentCDNComponent extends Component {
  state = {
    workerDomain: "",
    assetsDomain: "",
    enableWorker: false,
    saving: false,
    saveError: false,
    loading: false
  };

  async componentDidMount() {
    const adminInfo = await getAdminInfo();
    const retConfig = await getConfig("reticulum");

    this.setState({
      workerDomain: adminInfo.worker_domain,
      assetsDomain: adminInfo.assets_domain,
      provider: adminInfo.provider,
      enableWorker:
        !!retConfig && !!retConfig.phx && retConfig.phx.cors_proxy_url_host === `cors-proxy.${adminInfo.worker_domain}`,
      loading: false
    });
  }

  async onSubmit(e) {
    e.preventDefault();

    // Sanity check
    if (this.state.enableWorker) {
      const abort = () => {
        this.setState({
          saveError: "Your worker isn't working. Check that you've performed all of the above steps."
        });
      };

      try {
        // Need to CORS-proxy the CORS-proxy because CSP will block us otherwise!
        const res = await fetch(
          `https://${configs.CORS_PROXY_SERVER}/https://${this.state.workerDomain}/hubs/pages/latest/whats-new.html`
        );

        if (!res.ok) {
          abort();
          return;
        }
      } catch (e) {
        abort();
        return;
      }
    }

    this.setState({ saving: true }, async () => {
      const workerDomain = this.state.enableWorker ? this.state.workerDomain : "";

      // For arbortect, we enable thumbnail CDN proxying
      const useWorkerForThumbnails = this.state.provider === "arbortect";

      const configs = {
        reticulum: {
          phx: {
            cors_proxy_url_host: workerDomain ? `cors-proxy.${workerDomain}` : ""
          },
          uploads: {
            host: workerDomain ? `https://${workerDomain}` : ""
          }
        },
        hubs: {
          general: {
            cors_proxy_server: workerDomain ? `cors-proxy.${workerDomain}` : "",
            base_assets_path: workerDomain ? `https://${workerDomain}/hubs/` : "",
            thumbnail_server: workerDomain && useWorkerForThumbnails ? workerDomain : ""
          }
        },
        spoke: {
          general: {
            cors_proxy_server: workerDomain ? `cors-proxy.${workerDomain}` : "",
            base_assets_path: workerDomain ? `https://${workerDomain}/spoke/` : "",
            thumbnail_server: workerDomain && useWorkerForThumbnails ? workerDomain : ""
          }
        }
      };

      try {
        for (const [service, config] of Object.entries(configs)) {
          const res = await putConfig(service, config);

          if (res.error) {
            this.setState({ saveError: `Error saving: ${res.error}` });
            break;
          }
        }
      } catch (e) {
        this.setState({ saveError: e.toString() });
      }

      this.setState({ saving: false, saved: true, saveError: null });
    });
  }

  render() {
    if (this.state.loading) {
      return <LinearProgress />;
    }

    return (
      <Card className={this.props.classes.container}>
        <Title title="Content CDN" />
        <form onSubmit={this.onSubmit.bind(this)}>
          <CardContent className={this.props.classes.info}>
            {this.state.provider === "arbortect" && (
              <Typography variant="body2" gutterBottom>
                You can greatly reduce load on your server and improve loading times by setting up Cloudflare as your
                CDN.
                <br />
                Once enabled, Cloudflare will cache content, reduce latency, and reduce bandwidth used by your server.
              </Typography>
            )}
            {this.state.provider && this.state.provider !== "arbortect" && (
              <Typography variant="body2" gutterBottom>
                Hubs Cloud uses bandwidth from your cloud provider to deliver content.
                <br />
                You can reduce your data transfer costs by switching your CDN to Cloudflare, which does not charge for
                data transfer costs to your users.
              </Typography>
            )}
            <Typography variant="subheading" gutterBottom className={this.props.classes.section}>
              Worker Setup
            </Typography>
            <Typography variant="body1" gutterBottom>
              All 3rd party content (videos, images, models) in Hubs Cloud requires CORS proxying due to the{" "}
              <a href="https://www.codecademy.com/articles/what-is-cors" rel="noopener noreferrer" target="_blank">
                browser security model
              </a>
              . As such, you will be using data transfer to send all 3rd party content to your users.
            </Typography>
            {this.state.provider && this.state.provider !== "arbortect" && (
              <Typography variant="body1" gutterBottom>
                Additionally, you will incur data transfer costs for serving avatars, scenes, and other assets.
              </Typography>
            )}
            {this.state.provider && this.state.provider !== "arbortect" && (
              <Typography variant="body1" gutterBottom>
                You can minimize this data transfer cost by using a Cloudflare Worker to serve this content:
              </Typography>
            )}
            <Typography variant="body1" component="div" gutterBottom>
              <ol className={this.props.classes.steps}>
                <li>
                  Register this domain and set it up on{" "}
                  <a href="https://cloudflare.com" target="_blank" rel="noopener noreferrer">
                    Cloudflare
                  </a>
                  :<div className={this.props.classes.command}>{this.state.workerDomain}</div>
                </li>
                <li>
                  In the &apos;DNS&apos; section of your Cloudflare domain settings, add new CNAME record with Name set
                  to
                  <div className={this.props.classes.command}>@</div>
                  and Domain Name set to:
                  <div className={this.props.classes.command}>{document.location.hostname}</div>
                </li>
                <li>
                  In the &apos;DNS&apos; section of your Cloudflare domain settings, add a second CNAME record with Name
                  set to
                  <div className={this.props.classes.command}>cors-proxy</div>
                  and Domain Name set to:
                  <div className={this.props.classes.command}>{document.location.hostname}</div>
                </li>
                <li>
                  In the &apos;SSL/TLS&apos; section of your Cloudflare domain settings, set the encryption mode to{" "}
                  <b>Full</b>.
                </li>
                <li>
                  In the &apos;Caching&apos; section of your Cloudflare domain settings, turn <b>off</b> Always Online.
                </li>
                <li>
                  In the Workers section of your Cloudflare domain, launch the editor, click &quot;Add Script&quot; on
                  the left and name it <pre>hubs-worker</pre>
                </li>
                <li>
                  Paste and save the following worker script.
                  <br />
                  <textarea
                    className={this.props.classes.worker}
                    value={workerScript(this.state.workerDomain, this.state.assetsDomain)}
                    readOnly
                    onFocus={e => e.target.select()}
                  />
                  <br />
                </li>
                <li>
                  Once your script is saved, go back to the Workers panel. Choose &apos;Add Route&apos;, choose the
                  script <pre>hubs-worker</pre> set the route to:
                  <div className={this.props.classes.command}>{`*${this.state.workerDomain}/*`}</div>
                  <b>Note the leading asterisk!</b>
                </li>
                <li>
                  Verify your worker is working.{" "}
                  <a
                    href={`https://cors-proxy.${this.state.workerDomain}/https://www.mozilla.org`}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    This link
                  </a>{" "}
                  should show the Mozilla homepage, and&nbsp;
                  <a
                    href={`https://${this.state.workerDomain}/hubs/pages/latest/whats-new.html`}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    this link
                  </a>{" "}
                  should should the Hubs &quot;What&apos;s New&quot; page.
                </li>
                <li>
                  Once <b>both</b> links above are working, enable the &apos;Use Cloudflare Worker&apos; setting below
                  and click &apos;Save&apos; on this page.
                </li>
                <li>
                  If you need more than 100,000 requests per day for content, you&apos;ll need to add a Worker Unlimited
                  Subscription for an additional $5/mo.
                </li>
              </ol>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={this.state.enableWorker}
                    onChange={e => this.setState({ enableWorker: e.target.checked })}
                    value="enableWorker"
                  />
                }
                label="Use Cloudflare Worker"
              />
            </Typography>
            {this.state.saving ? (
              <CircularProgress />
            ) : (
              <Button
                onClick={this.onSubmit.bind(this)}
                className={this.props.classes.button}
                variant="contained"
                color="primary"
              >
                Save
              </Button>
            )}
          </CardContent>
        </form>
        <Snackbar
          anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
          open={this.state.saved || !!this.state.saveError}
          autoHideDuration={10000}
          onClose={() => this.setState({ saved: false, saveError: null })}
        >
          <SnackbarContent
            className={clsx({
              [this.props.classes.success]: !this.state.saveError,
              [this.props.classes.warning]: !!this.state.saveError
            })}
            message={
              <span id="import-snackbar" className={this.props.classes.message}>
                <Icon className={clsx(this.props.classes.icon, this.props.classes.iconVariant)} />
                {this.state.saveError || "Settings saved."}
              </span>
            }
            action={[
              <IconButton key="close" color="inherit" onClick={() => this.setState({ saved: false })}>
                <CloseIcon className={this.props.classes.icon} />
              </IconButton>
            ]}
          />
        </Snackbar>
      </Card>
    );
  }
}

export const ContentCDN = withStyles(styles)(ContentCDNComponent);
