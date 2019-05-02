import React, { Component } from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import { fetchReticulumAuthenticated } from "../utils/phoenix-utils";
import { upload } from "../utils/media-utils";
import classNames from "classnames";
import { faTimes } from "@fortawesome/free-solid-svg-icons/faTimes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import AvatarPreview from "./avatar-preview";
import styles from "../assets/stylesheets/avatar-editor.scss";

const AVATARS_API = "/api/v1/avatars";
const BOT_PARENT_AVATAR = "FcjJywg"; // "xf9xkIY"; // "hiwSHgg"; //location.hostname === "hubs.mozilla.com" || location.hostname === "smoke-hubs.mozilla.com" ? "gZ6gPvQ" : "xf9xkIY";

function emitAvatarChanged(avatarId) {
  window.dispatchEvent(new CustomEvent("avatar_editor_avatar_changed", { detail: { avatarId: avatarId } }));
}

function getDefaultAvatarState() {
  return { avatar: { name: "My Avatar", parent_avatar_id: BOT_PARENT_AVATAR, files: {} } };
}

export default class AvatarEditor extends Component {
  static propTypes = {
    avatarId: PropTypes.string,
    onSignIn: PropTypes.func,
    onSignOut: PropTypes.func,
    signedIn: PropTypes.bool,
    debug: PropTypes.bool,
    className: PropTypes.string
  };

  state = getDefaultAvatarState();

  constructor(props) {
    super(props);
    // Blank avatar, used to create base avatar
    // this.state = { avatar: { name: "Base bot avatar", files: {} } };

    this.inputFiles = {};
  }

  componentDidMount = async () => {
    if (this.props.avatarId) {
      const avatar = await this.fetchAvatar(this.props.avatarId);
      Object.assign(this.inputFiles, avatar.files);
      this.setState({ avatar });
    }
  };

  fetchAvatar = avatarId => {
    return fetchReticulumAuthenticated(`${AVATARS_API}/${avatarId}`).then(({ avatars }) => avatars[0]);
  };

  createOrUpdateAvatar = avatar => {
    return fetchReticulumAuthenticated(
      avatar.avatar_id ? `${AVATARS_API}/${avatar.avatar_id}` : AVATARS_API,
      avatar.avatar_id ? "PUT" : "POST",
      { avatar }
    ).then(({ avatars }) => avatars[0]);
  };

  uploadAvatar = async e => {
    e.preventDefault();

    if (this.inputFiles.glb && this.inputFiles.glb instanceof File) {
      const gltfLoader = new THREE.GLTFLoader();
      const gltfUrl = URL.createObjectURL(this.inputFiles.glb);
      const onProgress = console.log;
      const parser = await new Promise((resolve, reject) =>
        gltfLoader.createParser(gltfUrl, resolve, onProgress, reject)
      );
      URL.revokeObjectURL(gltfUrl);

      const { content, body } = parser.extensions.KHR_binary_glTF;

      // Inject hubs components on upload. Used to create base avatar
      // const gltf = parser.json;
      // Object.assign(gltf.scenes[0], {
      //   extensions: {
      //     MOZ_hubs_components: {
      //       "loop-animation": {
      //         clip: "idle_eyes"
      //       }
      //     }
      //   }
      // });
      // Object.assign(gltf.nodes.find(n => n.name === "Head"), {
      //   extensions: {
      //     MOZ_hubs_components: {
      //       "scale-audio-feedback": ""
      //     }
      //   }
      // });
      // content = JSON.stringify(gltf);

      this.inputFiles.gltf = new File([content], "file.gltf", {
        type: "model/gltf"
      });
      this.inputFiles.bin = new File([body], "file.bin", {
        type: "application/octet-stream"
      });
    }

    this.inputFiles.thumbnail = new File([await this.preview.snapshot()], "thumbnail.png", { type: "image/png" });

    const filesToUpload = ["gltf", "bin", "base_map", "emissive_map", "normal_map", "orm_map", "thumbnail"].filter(
      k => this.inputFiles[k] === null || this.inputFiles[k] instanceof File
    );

    this.setState({ uploading: true });

    const fileUploads = await Promise.all(filesToUpload.map(f => this.inputFiles[f] && upload(this.inputFiles[f])));
    const avatar = {
      ...this.state.avatar,
      files: fileUploads
        .map((resp, i) => [filesToUpload[i], resp && [resp.file_id, resp.meta.access_token, resp.meta.promotion_token]])
        .reduce((o, [k, v]) => ({ ...o, [k]: v }), {})
    };

    await this.createOrUpdateAvatar(avatar);

    emitAvatarChanged(avatar.avatar_id);

    this.setState({ uploading: false });
  };

  deleteAvatar = e => {
    e.preventDefault();
    fetchReticulumAuthenticated(`${AVATARS_API}/${this.state.avatar.avatar_id}`, "DELETE");
  };

  fileField = (name, label, accept, disabled = false, title) => (
    <div className={styles.fileInputRow} key={name} title={title}>
      <label htmlFor={`avatar-file_${name}`}>
        <div className="img-box" />
        <span>{label}</span>
      </label>
      <input
        id={`avatar-file_${name}`}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={e => {
          // e.target.value = null;
          this.inputFiles[name] = e.target.files[0];
        }}
      />
      {this.state.avatar.files[name] && (
        <a
          onClick={() => {
            this.inputFiles[name] = null;
          }}
        >
          <i>
            <FontAwesomeIcon icon={faTimes} />
          </i>
        </a>
      )}
    </div>
  );

  mapField = (name, label, accept, disabled = false, title) => (
    <div className={styles.fileInputRow} key={name} title={title}>
      <label htmlFor={`avatar-file_${name}`}>
        <div className="img-box">{this.state.avatar.files[name] && <img src={this.state.avatar.files[name]} />}</div>
        <span>{label}</span>
      </label>
      <input
        id={`avatar-file_${name}`}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={e => {
          const file = e.target.files[0];
          e.target.value = null;
          this.inputFiles[name] = file;
          URL.revokeObjectURL(this.state.avatar.files[name]);
          this.setState({
            avatar: {
              ...this.state.avatar,
              files: {
                ...this.state.avatar.files,
                [name]: URL.createObjectURL(file)
              }
            }
          });
        }}
      />
      {this.state.avatar.files[name] && (
        <a
          onClick={() => {
            this.inputFiles[name] = null;
            URL.revokeObjectURL(this.state.avatar.files[name]);
            this.setState({
              avatar: {
                ...this.state.avatar,
                files: {
                  ...this.state.avatar.files,
                  [name]: null
                }
              }
            });
          }}
        >
          <i>
            <FontAwesomeIcon icon={faTimes} />
          </i>
        </a>
      )}
    </div>
  );

  textField = (name, label, disabled) => (
    <div>
      <label htmlFor={`#avatar-${name}`}>{label}</label>
      <input
        id={`avatar-${name}`}
        type="text"
        disabled={disabled}
        value={this.state.avatar[name] || ""}
        onChange={e => this.setState({ avatar: { ...this.state.avatar, [name]: e.target.value } })}
      />
    </div>
  );

  checkbox = (name, label, disabled) => (
    <div>
      <label htmlFor={`#avatar-${name}`}>{label}</label>
      <input
        id={`avatar-${name}`}
        type="checkbox"
        disabled={disabled}
        value={this.state.avatar[name]}
        onChange={e => this.setState({ avatar: { ...this.state.avatar, [name]: e.target.value } })}
      />
    </div>
  );

  render() {
    if (!this.props.signedIn) {
      return (
        <div className={classNames(this.props.className)}>
          <a onClick={this.props.onSignIn}>
            <FormattedMessage id="sign-in.in" />
          </a>
        </div>
      );
    }

    const { debug } = this.props;

    return (
      <div className={classNames(this.props.className)}>
        <div className="split">
          <div className="form-body">
            {debug && this.textField("avatar_id", "Avatar ID", true)}
            {debug && this.textField("parent_avatar_id", "Parent Avatar ID")}
            {debug && this.textField("name", "Name")}
            {debug && this.textField("description", "Description")}
            {debug && this.checkbox("allow_remixing", "Allow Remixing")}
            {debug && this.checkbox("allow_promotion", "Allow Promotion")}
            {debug && this.fileField("glb", "Avatar GLB", "model/gltf+binary,.glb")}

            {this.mapField("base_map", "Base Map", "image/*")}
            {this.mapField("emissive_map", "Emissive Map", "image/*")}
            {this.mapField("normal_map", "Normal Map", "image/*")}

            {this.mapField("orm_map", "ORM Map", "image/*", false, "Occlussion (r), Roughness (g), Metallic (b)")}

            {/* {this.mapField("ao_map", "AO Map", "images/\*", true)} */}
            {/* {this.mapField("metallic_map", "Metallic Map", "image/\*", true)} */}
            {/* {this.mapField("roughness_map", "Roughness Map", "image/\*", true)} */}
          </div>
          <AvatarPreview
            avatarGltfUrl={this.state.avatar.base_gltf_url}
            {...this.inputFiles}
            ref={p => (this.preview = p)}
          />
        </div>
        <div className={styles.info}>
          <FormattedMessage id="avatar-editor.info" />
          <a target="_blank" rel="noopener noreferrer" href="https://github.com/j-conrad/hubs-avatar-pipelines">
            <FormattedMessage id="avatar-editor.info-link" />
          </a>
        </div>
        <div>
          <input
            disabled={this.state.uploading}
            onClick={this.uploadAvatar}
            className={styles.formSubmit}
            type="submit"
            value={this.state.uploading ? "Uploading..." : "Save"}
          />
        </div>
        <a onClick={this.deleteAvatar}>delete avatar</a>
      </div>
    );
  }
}
