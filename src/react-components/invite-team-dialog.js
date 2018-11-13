import React, { Component } from "react";
import DialogContainer from "./dialog-container.js";
import PropTypes from "prop-types";
import { WithHoverSound } from "./wrap-with-audio";

export default class InviteTeamDialog extends Component {
  static propTypes = {
    hubChannel: PropTypes.object
  };

  state = {
    inviteButtonText: "invite a hubs team member"
  };

  constructor(props) {
    super(props);
  }

  inviteClicked = () => {
    this.setState({ inviteButtonText: "OK! We'll be there shortly." });
    this.props.hubChannel.requestSupport();
  };

  render() {
    return (
      <DialogContainer title="Let's Chat!" {...this.props}>
        <div>
          <div>
            <p>Have an idea for Hubs? Having trouble?</p>
            <p>We&apos;d love to chat. Someone from our team will join you in just a few minutes.</p>
          </div>
          <div className="invite-team-form">
            <div className="invite-team-form__buttons">
              <WithHoverSound>
                <button className="invite-team-form__action-button" onClick={this.inviteClicked}>
                  <span>{this.state.inviteButtonText}</span>
                </button>
              </WithHoverSound>
            </div>
          </div>
        </div>
      </DialogContainer>
    );
  }
}
