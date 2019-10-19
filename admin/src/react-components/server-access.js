import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import { Title } from "react-admin";
import Button from "@material-ui/core/Button";
import withCommonStyles from "../utils/with-common-styles";
import { getAdminInfo } from "../utils/ita";

const styles = withCommonStyles(() => ({}));

class ServerAccessComponent extends Component {
  state = {
    qrCodeData: null,
    serverDomain: "",
    showQrCode: false
  };

  async componentDidMount() {
    const adminInfo = await getAdminInfo();
    this.setState({ qrCodeData: adminInfo.ssh_totp_qr_data, serverDomain: adminInfo.server_domain });
  }

  render() {
    return (
      <Card className={this.props.classes.container}>
        <Title title="SSH Access" />
        <CardContent className={this.props.classes.info}>
          <Typography variant="subheading" gutterBottom>
            Connecting to Servers
          </Typography>
          <Typography variant="body1" gutterBottom>
            To SSH into your server(s), you will use the SSH private key file you generated before deploying Hubs Cloud.
          </Typography>
          <Typography variant="body1" gutterBottom>
            Each of your servers has a name. The name can be found in your cloud provider&apos;s console in the server
            list. (For example, on AWS Console, go to EC2 -&gt; Instances.)
          </Typography>
          <Typography variant="body1" gutterBottom>
            To connect to a server, run the following command:
          </Typography>
          <blockquote>
            <pre>ssh -i &lt;key file&gt; ubuntu@&lt;server name&gt;.{this.state.serverDomain}</pre>
          </blockquote>
          <Typography variant="subheading" gutterBottom>
            Two-Factor Verification
          </Typography>
          <Typography variant="body1" gutterBottom>
            Upon connecting, you&apos;ll need a one-time Verification Code. This is a two-factor security measure and is
            a rotating six digit number.
          </Typography>
          <Typography variant="body1" gutterBottom>
            To generate a verification code, you will need to set up a 2fa device such a phone with the Google
            Authenticator app by scanning the QR code below.
          </Typography>
          {this.state.showQrCode ? (
            <img src={this.state.qrCodeData} />
          ) : (
            <Button
              className={this.props.classes.button}
              variant="outlined"
              onClick={() => this.setState({ showQrCode: true })}
            >
              Show QR Code
            </Button>
          )}
          <p />
          <Typography variant="subheading" gutterBottom>
            More Information
          </Typography>
          <Typography variant="body1" gutterBottom>
            Documentation about server setup and tips for common tasks can be found in the{" "}
            <a href="https://github.com/mozilla/hubs-cloud/wiki/Server-Guide" rel="noopener noreferrer" target="_blank">
              Server Guide
            </a>
            .
          </Typography>
        </CardContent>
      </Card>
    );
  }
}

export const ServerAccess = withStyles(styles)(ServerAccessComponent);
