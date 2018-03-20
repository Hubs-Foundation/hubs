import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { injectIntl, FormattedMessage } from 'react-intl';
import { SCHEMA } from "../storage/store";

class NameEntryPanel extends Component {
  static propTypes = {
    store: PropTypes.object,
    messages: PropTypes.object,
    finished: PropTypes.func
  }

  constructor(props) {
    super(props);
    window.store = this.props.store;
    this.state = {name: this.props.store.state.profile.display_name};
    this.props.store.subscribe(this.storeUpdated);
  }

  storeUpdated = () => {
    this.setState({name: this.props.store.state.profile.display_name});
  }

  saveName = (e) => {
    e.preventDefault();
    this.props.store.update({ profile: { display_name: this.nameInput.value } });
    this.props.finished();
  }

  componentDidMount() {
    // stop propagation so that avatar doesn't move when wasd'ing during text input.
    this.nameInput.addEventListener('keydown', e => e.stopPropagation());
    this.nameInput.addEventListener('keypress', e => e.stopPropagation());
    this.nameInput.addEventListener('keyup', e => e.stopPropagation());
  }
  
  componentWillUnmount() {
    this.props.store.unsubscribe(this.storeUpdated);
  }

  render () {
    const { formatMessage } = this.props.intl;

    return (
      <div className="name-entry">
        <form onSubmit={this.saveName}>
        <div className="name-entry__box name-entry__box--darkened">
          <div className="name-entry__subtitle">
            <FormattedMessage id="profile.header"/>
          </div>
          <input
            className="name-entry__form-field-text"
            value={this.state.name} onChange={(e) => this.setState({name: e.target.value})}
            required pattern={SCHEMA.definitions.profile.properties.display_name.pattern}
            title={formatMessage({ id: "profile.display_name.validation_warning" })}
            ref={inp => this.nameInput = inp}/>
          <input className="name-entry__form-submit" type="submit" value={formatMessage({ id: "profile.save" }) }/>
          </div>
        </form>
      </div>
    );
  }
}

export default injectIntl(NameEntryPanel);
