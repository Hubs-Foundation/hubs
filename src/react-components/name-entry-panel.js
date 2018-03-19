import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { SCHEMA } from "../storage/store";

export default class NameEntryPanel extends Component {
  static propTypes = {
    store: PropTypes.object
  }

  constructor(props) {
    super(props);
    window.store = this.props.store;
    this.state = {name: this.props.store.state.profile.display_name};
    this.props.store.subscribe(() => {
      this.setState({name: this.props.store.state.profile.display_name});
    });
  }

  saveName = (e) => {
    e.preventDefault();
    this.props.store.update({ profile: { display_name: this.nameInput.value } });
  }

  componentDidMount() {
    // stop propagation so that avatar doesn't move when wasd'ing during text input.
    this.nameInput.addEventListener('keydown', e => e.stopPropagation());
    this.nameInput.addEventListener('keypress', e => e.stopPropagation());
    this.nameInput.addEventListener('keyup', e => e.stopPropagation());
  }

  render () {
    return (
      <div class="name-entry">
        <div class="name-entry__box name-entry__box--darkened">
          <div class="name-entry__subtitle">
            Set your identity
          </div>
          <div class="name-entry__form">
            <form onSubmit={this.saveName}>
              <div class="name-entry__form-fields">
                <input
                  class="name-entry__form-field-text"
                  value={this.state.name} onChange={(e) => this.setState({name: e.target.value})}
                  required pattern={SCHEMA.definitions.profile.properties.display_name.pattern}
                  title="Alphanumerics and hyphens. At least 3 characters, no more than 32"
                  ref={inp => this.nameInput = inp}/>
                <div class="name-entry__form-submit">
                  <input type="submit" value="Save" />
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
}
