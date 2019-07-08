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

export default class AvatarEditor extends Component {
  static propTypes = {
    avatarId: PropTypes.string,
    onSignIn: PropTypes.func,
    onSave: PropTypes.func,
    onClose: PropTypes.func,
    signedIn: PropTypes.bool,
    hideDelete: PropTypes.bool,
    debug: PropTypes.bool,
    className: PropTypes.string
  };

  state = {
    avatar: { name: "My Avatar", parent_avatar_listing_id: "basebot", files: {} },
    previewGltfUrl: null
  };

  constructor(props) {
    super(props);
    // Blank avatar, used to create base avatar
    // this.state = { avatar: { name: "Base bot avatar", files: {} } };

    this.inputFiles = {};
  }

  componentDidMount = async () => {
    if (this.props.avatarId) {
      const avatar = await this.fetchAvatar(this.props.avatarId);
      avatar.creatorAttribution = (avatar.attributions && avatar.attributions.creator) || "";
      Object.assign(this.inputFiles, avatar.files);
      this.setState({ avatar, previewGltfUrl: avatar.base_gltf_url });
    } else {
      const { base_gltf_url } = await this.fetchAvatar("basebot");
      this.setState({ previewGltfUrl: base_gltf_url });
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

    this.inputFiles.thumbnail = new File([await this.preview.getWrappedInstance().snapshot()], "thumbnail.png", {
      type: "image/png"
    });

    const filesToUpload = ["gltf", "bin", "base_map", "emissive_map", "normal_map", "orm_map", "thumbnail"].filter(
      k => this.inputFiles[k] === null || this.inputFiles[k] instanceof File
    );

    this.setState({ uploading: true });

    const fileUploads = await Promise.all(filesToUpload.map(f => this.inputFiles[f] && upload(this.inputFiles[f])));
    const avatar = {
      ...this.state.avatar,
      attributions: {
        creator: this.state.avatar.creatorAttribution
      },
      files: fileUploads
        .map((resp, i) => [filesToUpload[i], resp && [resp.file_id, resp.meta.access_token, resp.meta.promotion_token]])
        .reduce((o, [k, v]) => ({ ...o, [k]: v }), {})
    };

    await this.createOrUpdateAvatar(avatar);

    this.setState({ uploading: false });

    if (this.props.onSave) this.props.onSave();
  };

  deleteAvatar = async e => {
    e.preventDefault();
    await fetchReticulumAuthenticated(`${AVATARS_API}/${this.state.avatar.avatar_id}`, "DELETE");
    if (this.props.onSave) this.props.onSave();
  };

  fileField = (name, label, accept, disabled = false, title) => (
    <div className="file-input-row" key={name} title={title}>
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
          this.inputFiles[name] = e.target.files[0];
          e.target.value = null;
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
    <div className="file-input-row" key={name} title={title}>
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

  textField = (name, placeholder, disabled, required) => (
    <div>
      <input
        id={`avatar-${name}`}
        type="text"
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        className="text-field"
        value={this.state.avatar[name] || ""}
        onChange={e => this.setState({ avatar: { ...this.state.avatar, [name]: e.target.value } })}
      />
    </div>
  );

  textarea = (name, placeholder, disabled) => (
    <div>
      <textarea
        id={`avatar-${name}`}
        disabled={disabled}
        placeholder={placeholder}
        className="textarea"
        value={this.state.avatar[name] || ""}
        onChange={e => this.setState({ avatar: { ...this.state.avatar, [name]: e.target.value } })}
      />
    </div>
  );

  checkbox = (name, children, disabled) => (
    <div className="checkbox-container">
      <input
        id={`avatar-${name}`}
        type="checkbox"
        className="checkbox"
        disabled={disabled}
        checked={!!this.state.avatar[name]}
        onChange={e => this.setState({ avatar: { ...this.state.avatar, [name]: e.target.checked } })}
      />
      <label htmlFor={`#avatar-${name}`}>{children}</label>
    </div>
  );

  render() {
    const { debug } = this.props;
    return (
      <div className={classNames(styles.avatarEditor, this.props.className)}>
        {this.props.onClose && (
          <a className="close-button" onClick={this.props.onClose}>
            <i>
              <FontAwesomeIcon icon={faTimes} />
            </i>
          </a>
        )}
        {this.props.signedIn ? (
          <div className="center">
            <div className="split">
              <div className="form-body">
                {debug && this.textField("avatar_id", "Avatar ID", true)}
                {debug && this.textField("parent_avatar_id", "Parent Avatar ID")}
                {debug && this.textField("parent_avatar_listing_id", "Parent Avatar Listing ID")}
                {this.textField("name", "Name", false, true)}
                {debug && this.textarea("description", "Description")}
                {debug && this.fileField("glb", "Avatar GLB", "model/gltf+binary,.glb")}

                {this.mapField("base_map", "Base Map", "image/*")}
                {this.mapField("emissive_map", "Emissive Map", "image/*")}
                {this.mapField("normal_map", "Normal Map", "image/*")}

                {this.mapField("orm_map", "ORM Map", "image/*", false, "Occlussion (r), Roughness (g), Metallic (b)")}

                <hr />

                {this.checkbox(
                  "allow_promotion",
                  <span>
                    Allow{" "}
                    <a
                      href="https://github.com/mozilla/hubs/blob/master/PROMOTION.md"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Promotion
                    </a>
                  </span>
                )}
                {this.checkbox(
                  "allow_remixing",
                  <span>
                    Allow{" "}
                    <a
                      href="https://github.com/mozilla/hubs/blob/master/REMIXING.md"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Remixing
                    </a>{" "}
                    <span className="license">
                      (under{" "}
                      <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener noreferrer">
                        CC-BY 3.0
                      </a>)
                    </span>
                  </span>
                )}
                {this.textField("creatorAttribution", "Attribution (optional)", false, false)}

                {/* {this.mapField("ao_map", "AO Map", "images/\*", true)} */}
                {/* {this.mapField("metallic_map", "Metallic Map", "image/\*", true)} */}
                {/* {this.mapField("roughness_map", "Roughness Map", "image/\*", true)} */}
              </div>
              <AvatarPreview
                className="preview"
                avatarGltfUrl={this.state.previewGltfUrl}
                {...this.inputFiles}
                ref={p => (this.preview = p)}
              />
            </div>
            <div className="info">
              <p>
                <FormattedMessage id="avatar-editor.info" />
                <a target="_blank" rel="noopener noreferrer" href="https://github.com/j-conrad/hubs-avatar-pipelines">
                  <FormattedMessage id="avatar-editor.info-link" />
                </a>
              </p>
            </div>
            <div>
              <input
                disabled={this.state.uploading}
                onClick={this.uploadAvatar}
                className="form-submit"
                type="submit"
                value={this.state.uploading ? "Uploading..." : "Save"}
              />
            </div>
            {!this.props.hideDelete && (
              <div className="delete-avatar">
                {this.state.confirmDelete ? (
                  <span>
                    are you sure? <a onClick={this.deleteAvatar}>yes</a> /{" "}
                    <a onClick={() => this.setState({ confirmDelete: false })}>no</a>
                  </span>
                ) : (
                  <a onClick={() => this.setState({ confirmDelete: true })}>delete avatar</a>
                )}
              </div>
            )}
          </div>
        ) : (
          <a onClick={this.props.onSignIn}>
            <FormattedMessage id="sign-in.in" />
          </a>
        )}
      </div>
    );
  }
}
