import React, { Component } from "react";
import PropTypes from "prop-types";
import { fetchAvatar } from "../utils/avatar-utils";
import { replaceHistoryState } from "../utils/history";
import { AvatarSettingsSidebar } from "./room/AvatarSettingsSidebar";
import { AvatarSetupModal } from "./room/AvatarSetupModal";
import AvatarPreview from "./avatar-preview";

export default class ProfileEntryPanel extends Component {
  static propTypes = {
    containerType: PropTypes.oneOf(["sidebar", "modal"]),
    displayNameOverride: PropTypes.string,
    store: PropTypes.object,
    mediaSearchStore: PropTypes.object,
    messages: PropTypes.object,
    finished: PropTypes.func,
    history: PropTypes.object,
    avatarId: PropTypes.string,
    onClose: PropTypes.func,
    onBack: PropTypes.func,
    showBackButton: PropTypes.bool
  };

  static defaultProps = {
    containerType: "modal"
  };

  state = {
    avatarId: null,
    displayName: null,
    avatar: null,
    pronouns: null
  };

  constructor(props) {
    super(props);
    this.state = this.getStateFromProfile();
    if (props.avatarId) {
      this.state.avatarId = props.avatarId;
    }
    this.props.store.addEventListener("statechanged", this.storeUpdated);
    this.scene = document.querySelector("a-scene");
  }

  getStateFromProfile = () => {
    const { displayName, avatarId, pronouns } = this.props.store.state.profile;
    return { displayName, avatarId, pronouns };
  };

  storeUpdated = () => this.setState(this.getStateFromProfile());

  saveStateAndFinish = e => {
    e && e.preventDefault();

    const { displayName, pronouns } = this.props.store.state.profile;
    const { hasChangedNameOrPronouns } = this.props.store.state.activity;

    const hasChangedNowOrPreviously =
      hasChangedNameOrPronouns || this.state.displayName !== displayName || this.state.pronouns !== pronouns;
    this.props.store.update({
      activity: {
        hasChangedNameOrPronouns: hasChangedNowOrPreviously,
        hasAcceptedProfile: true
      },
      profile: {
        displayName: this.state.displayName,
        avatarId: this.state.avatarId,
        pronouns: this.state.pronouns
      }
    });
    this.props.finished();
    this.scene.emit("avatar_updated");
  };

  stopPropagation = e => {
    e.stopPropagation();
  };

  setAvatarFromMediaResult = ({ detail: { entry, selectAction } }) => {
    if ((entry.type !== "avatar" && entry.type !== "avatar_listing") || selectAction !== "use") return;

    this.setState({ avatarId: entry.id });
    // Replace history state with the current avatar id since this component gets destroyed when we open the
    // avatar editor and we want the back button to work. We read the history state back via the avatarId prop.
    // We read the current state key from history since it could be "overlay" or "entry_step".
    replaceHistoryState(this.props.history, this.props.history.location.state.key, "profile", { avatarId: entry.id });
  };

  componentDidMount() {
    if (this.nameInput || this.pronounsInput) {
      // stop propagation so that avatar doesn't move when wasd'ing during text input.
      this.nameInput.addEventListener("keydown", this.stopPropagation);
      this.nameInput.addEventListener("keypress", this.stopPropagation);
      this.nameInput.addEventListener("keyup", this.stopPropagation);
    }
    this.scene.addEventListener("action_selected_media_result_entry", this.setAvatarFromMediaResult);
    // This handles editing avatars in the entry_step, since this component remains mounted with the same avatarId
    this.scene.addEventListener("action_avatar_saved", this.refetchAvatar);

    this.refetchAvatar();
  }

  componentDidUpdate(_prevProps, prevState) {
    if (prevState.avatarId !== this.state.avatarId) {
      this.refetchAvatar();
    }
  }

  componentWillUnmount() {
    this.props.store.removeEventListener("statechanged", this.storeUpdated);
    if (this.nameInput || this.pronounsInput) {
      this.nameInput.removeEventListener("keydown", this.stopPropagation);
      this.nameInput.removeEventListener("keypress", this.stopPropagation);
      this.nameInput.removeEventListener("keyup", this.stopPropagation);
    }
    this.scene.removeEventListener("action_selected_media_result_entry", this.setAvatarFromMediaResult);
    this.scene.removeEventListener("action_avatar_saved", this.refetchAvatar);
  }

  refetchAvatar = async () => {
    const avatar = await fetchAvatar(this.state.avatarId);
    if (this.state.avatarId !== avatar.avatar_id) return; // This is an old result, ignore it
    this.setState({ avatar });
  };

  render() {
    const avatarSettingsProps = {
      displayNameInputRef: inp => (this.nameInput = inp),
      pronounsInputRef: inp => (this.pronounsInput = inp),
      disableDisplayNameInput: !!this.props.displayNameOverride,
      displayName: this.props.displayNameOverride ? this.props.displayNameOverride : this.state.displayName,
      pronouns: this.state.pronouns,
      displayNamePattern: this.props.store.schema.definitions.profile.properties.displayName.pattern,
      pronounsPattern: this.props.store.schema.definitions.profile.properties.pronouns.pattern,
      onChangeDisplayName: e => this.setState({ displayName: e.target.value }),
      onChangePronouns: e => this.setState({ pronouns: e.target.value }),
      avatarPreview: <AvatarPreview avatarGltfUrl={this.state.avatar && this.state.avatar.gltf_url} />,
      onChangeAvatar: e => {
        e.preventDefault();
        this.props.mediaSearchStore.sourceNavigateWithNoNav("avatars", "use");
      },
      onSubmit: this.saveStateAndFinish,
      onClose: this.props.onClose,
      onBack: this.props.onBack
    };

    if (this.props.containerType === "sidebar") {
      return <AvatarSettingsSidebar {...avatarSettingsProps} showBackButton={this.props.showBackButton} />;
    }

    return <AvatarSetupModal {...avatarSettingsProps} />;
  }
}
