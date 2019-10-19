import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Checkbox from "@material-ui/core/Checkbox";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import { Title } from "react-admin";
import Button from "@material-ui/core/Button";
import withCommonStyles from "../utils/with-common-styles";
import { getAdminInfo } from "../utils/ita";

const styles = withCommonStyles(() => ({
  worker: {
    width: "600px",
    height: "200px",
    fontFace: "monospaced",
    marginTop: "8px"
  }
}));

const workerScript = externalCorsProxyDomain => {
  return `  const ALLOWED_ORIGINS = ["${document.location.origin}"];
  const PROXY_HOST = "https://${externalCorsProxyDomain}";

  addEventListener("fetch", e => {
    const request = e.request;
    const origin = request.headers.get("Origin");
    const proxyUrl = new URL(PROXY_HOST);
    // eslint-disable-next-line no-useless-escape
    let targetUrl = request.url.substring(PROXY_HOST.length + 1).replace(/^http(s?):\/([^/])/, "http$1://$2");
    
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = proxyUrl.protocol + "//" + targetUrl;
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

class CDNBandwidthComponent extends Component {
  state = {
    externalCorsProxyDomain: "",
    externalStorageDomain: "",
    enableExternalCorsDomain: false,
    enableExternalStorageDomain: false
  };

  async componentDidMount() {
    const adminInfo = await getAdminInfo();
    this.setState({
      externalCorsProxyDomain: adminInfo.external_cors_proxy_domain,
      externalStorageDomain: adminInfo.external_storage_domain
    });
  }

  render() {
    return (
      <Card className={this.props.classes.container}>
        <Title title="CDN Bandwidth" />
        <CardContent className={this.props.classes.info}>
          <Typography variant="subheading" gutterBottom>
            Bandwidth in Hubs Cloud
          </Typography>
          <Typography variant="body1" gutterBottom>
            Hubs Cloud uses bandwidth from your cloud provider to deliver content. You can potentially reduce your
            bandwidth costs by switching the CDN for CORS proxying and stored files to Cloudflare, which does not charge
            for data transfer costs to your users.
          </Typography>
          <p />
          <Typography variant="subheading" gutterBottom>
            CORS Proxy
          </Typography>
          <Typography variant="body1" gutterBottom>
            All 3rd party content (videos, images, models) in Hubs Cloud requires CORS proxying due to the{" "}
            <a href="https://www.codecademy.com/articles/what-is-cors" rel="noopener noreferrer" target="_blank">
              browser security model
            </a>
            . As such, you will be using data transfer to send all 3rd party content to your users.
          </Typography>
          <Typography variant="body1" gutterBottom>
            You can avoid this data transfer cost by using a Cloudflare Worker for CORS proxying:
          </Typography>
          <Typography variant="body1" gutterBottom>
            <ol>
              <li>
                Register and set up this domain name on{" "}
                <a href="https://cloudflare.com" target="_blank" rel="noopener noreferrer">
                  Cloudflare
                </a>
                :<pre>{this.state.externalCorsProxyDomain}</pre>
              </li>
              <li>
                Enable{" "}
                <a href="https://workers.cloudflare.com" target="_blank" rel="noopener noreferrer">
                  Cloudflare Workers
                </a>{" "}
                on your domain.
              </li>
              <li>
                In the Workers section of your Cloudflare domain, launch the editor, paste the following worker script
                to run on your domain, and click Deploy:
                <br />
                <textarea
                  className={this.props.classes.worker}
                  value={workerScript(this.state.externalCorsProxyDomain)}
                  onFocus={e => e.target.select()}
                />
              </li>
              <li>
                Verify your worker is working.{" "}
                <a
                  href={`https://${this.state.externalCorsProxyDomain}/https://www.mozilla.org`}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  This link
                </a>{" "}
                should show the Mozilla homepage.
              </li>
              <li>
                Once working, enable the &apos;Use Cloudflare CORS Proxy&apos; setting below and click &apos;Save&apos;.
              </li>
            </ol>
            <FormControlLabel
              control={
                <Checkbox
                  checked={this.state.enableExternalCorsDomain}
                  onChange={e => this.setState({ enableExternalCorsDomain: e.target.checked })}
                  value="enableExternalCorsDomain"
                />
              }
              label="Use Cloudflare CORS Proxy"
            />
          </Typography>
          <Typography variant="subheading" gutterBottom>
            Stored Files
          </Typography>
          <Typography variant="body1" gutterBottom>
            Uploaded avatars, scenes, and files will use data transfer to serve your users.
          </Typography>
          <Typography variant="body1" gutterBottom>
            You can avoid this data transfer cost by switching the stored files CDN to Cloudflare.
          </Typography>
          <Typography variant="body1" gutterBottom>
            <ol>
              <li>
                Register and set up this domain name on{" "}
                <a href="https://cloudflare.com" target="_blank" rel="noopener noreferrer">
                  Cloudflare
                </a>
                :<pre>{this.state.externalStorageDomain}</pre>
              </li>
              <li>
                In the &apos;DNS&apos; section of your Cloudflare domain settings, add a CNAME record for:
                <pre>{document.location.hostname}</pre>
              </li>
              <li>
                In the &apos;SSL/TLS section&apos; of your Cloudflare domain settings, set the encryption mode to
                &apos;Full&apos;.
              </li>
              <li>Enable the &apos;Use Cloudflare Storage CDN&apos; setting below and click &apos;Save&apos;.</li>
              <li>Verify your new CDN is working by uploading a file into a room.</li>
            </ol>
            <FormControlLabel
              control={
                <Checkbox
                  checked={this.state.enableExternalStorageDomain}
                  onChange={e => this.setState({ enableExternalStorageDomain: e.target.checked })}
                  value="enableExternalStorageDomain"
                />
              }
              label="Use Cloudflare Storage CDN"
            />
          </Typography>
        </CardContent>
      </Card>
    );
  }
}

export const CDNBandwidth = withStyles(styles)(CDNBandwidthComponent);
