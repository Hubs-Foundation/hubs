import React from "react";
import PropTypes from "prop-types";
import { IntlProvider } from "react-intl";
import { getLocale, getMessages } from "../utils/i18n";

export class WrappedIntlProvider extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired
  };

  state = {
    locale: getLocale(),
    messages: getMessages()
  };

  updateLocale = () => {
    this.setState({ locale: getLocale(), messages: getMessages() });
  };

  componentDidMount() {
    this.updateLocale();
    document.body.addEventListener("locale-updated", this.updateLocale);
  }

  componentWillUnmount() {
    document.body.removeEventListener("locale-updated", this.updateLocale);
  }

  render() {
    return (
      <IntlProvider locale={this.state.locale} messages={this.state.messages}>
        {this.props.children}
      </IntlProvider>
    );
  }
}
