import React, { Component } from "react";
import PropTypes from "prop-types";
import { defineMessage, FormattedMessage, injectIntl } from "react-intl";
import classNames from "classnames";
import { faTimes } from "@fortawesome/free-solid-svg-icons/faTimes";
import { faCloudUploadAlt } from "@fortawesome/free-solid-svg-icons/faCloudUploadAlt";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import configs from "../utils/configs";
import IfFeature from "./if-feature";
import { fetchReticulumAuthenticated } from "../utils/phoenix-utils";
import { upload } from "../utils/media-utils";
import { ensureAvatarMaterial } from "../utils/avatar-utils";

import AvatarPreview from "./avatar-preview";
import styles from "../assets/stylesheets/avatar-editor.scss";

const delistAvatarInfoMessage = defineMessage({
  id: "avatar-editor.delist-avatar-info",
  defaultMessage:
    "Other users already using this avatar will still be able to use it, but it will be removed from 'My Avatars' and search results."
});

const AVATARS_API = "/api/v1/avatars";

const defaultEditors = [
  {
    name: "Quilt",
    url: "https://tryquilt.io/?gltf=$AVATAR_GLTF"
  }
];
const useAllowedEditors = true;
const allowedEditors = [
  ...defaultEditors,
  {
    name: "Skindex Editor",
    url: "https://www.minecraftskins.com/skin-editor"
  },
  {
    name: "MinecraftSkins.net Editor",
    url: "https://www.minecraftskins.net/skineditor"
  }
];

const fetchAvatar = async avatarId => {
  const { avatars } = await fetchReticulumAuthenticated(`${AVATARS_API}/${avatarId}`);
  return avatars[0];
};

// GLTFLoader plugin for splitting glTF and bin from glb.
class GLTFBinarySplitterPlugin {
  constructor(parser) {
    this.parser = parser;
    this.gltf = null;
    this.bin = null;
  }

  beforeRoot() {
    const parser = this.parser;
    const { body } = parser.extensions.KHR_binary_glTF;
    const content = JSON.stringify(ensureAvatarMaterial(parser.json));

    this.gltf = new File([content], "file.gltf", {
      type: "model/gltf"
    });
    this.bin = new File([body], "file.bin", {
      type: "application/octet-stream"
    });

    // This plugin just wants to split gltf and bin from glb and
    // doesn't want to start the parse. But glTF loader plugin API
    // doesn't have an ability to cancel the parse. So overriding
    // parser.json with very light glTF data as workaround.
    parser.json = { asset: { version: "2.0" } };
  }

  afterRoot(result) {
    result.files = result.files || {};
    result.files.gltf = this.gltf;
    result.files.bin = this.bin;
  }
}

class AvatarEditor extends Component {
  static propTypes = {
    avatarId: PropTypes.string,
    onSave: PropTypes.func,
    onClose: PropTypes.func,
    hideDelete: PropTypes.bool,
    debug: PropTypes.bool,
    className: PropTypes.string,
    intl: PropTypes.object.isRequired
  };

  state = {
    baseAvatarResults: [],
    editorLinks: defaultEditors,
    previewGltfUrl: null
  };

  constructor(props) {
    super(props);
    this.inputFiles = {};
  }

  componentDidMount = async () => {
    if (this.props.avatarId) {
      const avatar = await fetchAvatar(this.props.avatarId);
      avatar.creatorAttribution = (avatar.attributions && avatar.attributions.creator) || "";
      Object.assign(this.inputFiles, avatar.files);
      this.setState({ avatar, previewGltfUrl: avatar.base_gltf_url });
    } else {
      const { entries } = await fetchReticulumAuthenticated(`/api/v1/media/search?filter=base&source=avatar_listings`);
      const baseAvatarResults = entries.map(e => ({ id: e.id, name: e.name, gltfs: e.gltfs, images: e.images }));
      if (baseAvatarResults.length) {
        const randomAvatarResult = baseAvatarResults[Math.floor(Math.random() * baseAvatarResults.length)];
        this.setState({
          baseAvatarResults,
          avatar: {
            name: "My Avatar",
            files: {},
            base_gltf_url: randomAvatarResult.gltfs.base,
            parent_avatar_listing_id: randomAvatarResult.id
          },
          previewGltfUrl: randomAvatarResult.gltfs.avatar
        });
      } else {
        this.setState({
          avatar: {
            name: "My Avatar",
            files: {}
          }
        });
      }
    }
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
      const gltfLoader = new THREE.GLTFLoader().register(parser => new GLTFBinarySplitterPlugin(parser));
      const gltfUrl = URL.createObjectURL(this.inputFiles.glb);
      const onProgress = console.log;

      await new Promise((resolve, reject) => {
        // GLTFBinarySplitterPlugin saves gltf and bin in gltf.files
        gltfLoader.load(
          gltfUrl,
          result => {
            this.inputFiles.gltf = result.files.gltf;
            this.inputFiles.bin = result.files.bin;
            resolve(result);
          },
          onProgress,
          reject
        );
      });

      URL.revokeObjectURL(gltfUrl);
    }

    this.inputFiles.thumbnail = new File([await this.preview.snapshot()], "thumbnail.png", {
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
    <div className={classNames("file-input-row", { disabled })} key={name} title={title}>
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
          const file = e.target.files[0];
          e.target.value = null;
          this.inputFiles[name] = file;
          URL.revokeObjectURL(this.state.previewGltfUrl);
          const previewGltfUrl = URL.createObjectURL(this.inputFiles.glb);
          this.setState({
            previewGltfUrl,
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
            this.setState(
              {
                avatar: {
                  ...this.state.avatar,
                  files: {
                    ...this.state.avatar.files,
                    [name]: null
                  }
                }
              },
              () => this.setState({ previewGltfUrl: this.getPreviewUrl() })
            );
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
        <div className="img-box">
          {this.state.avatar.files[name] ? (
            <img src={this.state.avatar.files[name]} />
          ) : (
            <FontAwesomeIcon icon={faCloudUploadAlt} />
          )}
        </div>
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
    <div className="text-field-container">
      <label htmlFor={`#avatar-${name}`}>{placeholder}</label>
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

  // Return the gltf for the selected base avatar, the locally modified glb, or the avatar's base_gltf_url
  getPreviewUrl = baseSid => {
    if (baseSid) {
      const avatarResult = this.state.baseAvatarResults.find(a => a.id === baseSid);
      if (avatarResult) return avatarResult.gltfs.avatar;
    }

    return this.inputFiles.glb ? URL.createObjectURL(this.inputFiles.glb) : this.state.avatar.base_gltf_url;
  };

  selectListingField = (propName, placeholder) => (
    <div className="select-container">
      <label htmlFor={`#avatar-${propName}`}>{placeholder}</label>
      <select
        id={`avatar-${propName}`}
        value={this.state.avatar[propName] || ""}
        onChange={async e => {
          const sid = e.target.value;
          this.setState({ avatar: { ...this.state.avatar, [propName]: sid }, previewGltfUrl: this.getPreviewUrl(sid) });
        }}
        placeholder={placeholder}
        className="select"
      >
        {this.state.baseAvatarResults.map(a => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
        <option value="">
          <FormattedMessage id="avatar-editor.custom-avatar-option" defaultMessage="Custom GLB..." />
        </option>
      </select>
      <img
        className="arrow"
        src="../assets/images/dropdown_arrow.png"
        srcSet="../assets/images/dropdown_arrow@2x.png 2x"
      />
    </div>
  );

  selectListingGrid = (propName, placeholder) => (
    <div className="select-grid-container">
      <label htmlFor={`#avatar-${propName}`}>{placeholder}</label>
      <div className="select-grid">
        {this.state.baseAvatarResults.map(a => (
          <div
            onClick={() =>
              this.setState({
                avatar: { ...this.state.avatar, [propName]: a.id },
                previewGltfUrl: this.getPreviewUrl(a.id)
              })
            }
            key={a.id}
            className={classNames("item", { selected: a.id === this.state.avatar[propName] })}
            style={{ paddingBottom: `${(a.images.preview.width / a.images.preview.height) * 100}%` }}
          >
            <img src={a.images.preview.url} />
          </div>
        ))}
      </div>
      <input
        id="avatar-file_glb"
        type="file"
        accept="model/gltf+binary,.glb"
        onChange={e => {
          const file = e.target.files[0];
          e.target.value = null;
          this.inputFiles["glb"] = file;
          URL.revokeObjectURL(this.state.avatar.files["glb"]);
          this.setState({
            avatar: {
              ...this.state.avatar,
              [propName]: "",
              files: {
                ...this.state.avatar.files,
                glb: URL.createObjectURL(file)
              }
            },
            previewGltfUrl: this.getPreviewUrl("")
          });
        }}
      />
      <label
        htmlFor="avatar-file_glb"
        className={classNames("item", "custom", { selected: "" === this.state.avatar[propName] })}
      >
        <FormattedMessage
          id="avatar-editor.upload-custom-avatar-button"
          defaultMessage="{icon} Custom GLB"
          values={{ icon: <FontAwesomeIcon icon={faCloudUploadAlt} /> }}
        />
      </label>
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

  checkbox = (name, title, children, disabled) => (
    <div className="checkbox-container" title={title}>
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

  handleGltfLoaded = gltf => {
    const ext = gltf.parser.json.extensions && gltf.parser.json.extensions["MOZ_hubs_avatar"];
    let editorLinks = (ext && ext.editors) || defaultEditors;
    if (useAllowedEditors) {
      editorLinks = editorLinks.filter(e => allowedEditors.some(w => w.name === e.name && w.url === e.url));
    }
    this.setState({ editorLinks });
  };

  render() {
    const { debug, intl } = this.props;
    const { avatar } = this.state;

    return (
      <div className={classNames(styles.avatarEditor, this.props.className)}>
        {this.props.onClose && (
          <a className="close-button" onClick={this.props.onClose}>
            <i>
              <FontAwesomeIcon icon={faTimes} />
            </i>
          </a>
        )}
        {!this.state.avatar ? (
          <div className="loader">
            <div className="loader-center" />
          </div>
        ) : (
          <form onSubmit={this.uploadAvatar} className="center">
            {this.textField("name", "Name", false, true)}
            <div className="split">
              <div className="form-body">
                {debug &&
                  this.textField(
                    "avatar_id",
                    intl.formatMessage({ id: "avatar-editor.field.avatar-id", defaultMessage: "Avatar ID" }),
                    true
                  )}
                {debug &&
                  this.textField(
                    "parent_avatar_id",
                    intl.formatMessage({
                      id: "avatar-editor.field.parent-avatar-id",
                      defaultMessage: "Parent Avatar ID"
                    })
                  )}
                {debug &&
                  this.textField(
                    "parent_avatar_listing_id",
                    intl.formatMessage({
                      id: "avatar-editor.field.parent-avatar-listing-id",
                      defaultMessage: "Parent Avatar Listing ID"
                    })
                  )}
                {debug &&
                  this.textarea(
                    "description",
                    intl.formatMessage({
                      id: "avatar-editor.field.description",
                      defaultMessage: "Description"
                    })
                  )}
                {!this.props.avatarId &&
                  this.selectListingGrid(
                    "parent_avatar_listing_id",
                    intl.formatMessage({
                      id: "avatar-editor.field.model",
                      defaultMessage: "Model"
                    })
                  )}

                <label>
                  <FormattedMessage id="avatar-editor.skin-section" defaultMessage="Skin" />
                </label>
                {this.mapField(
                  "base_map",
                  intl.formatMessage({
                    id: "avatar-editor.field.base-map",
                    defaultMessage: "Base Map"
                  }),
                  "image/*"
                )}
                <details>
                  <summary>
                    <FormattedMessage id="avatar-editor.advanced-section" defaultMessage="Advanced" />
                  </summary>
                  {this.mapField(
                    "emissive_map",
                    intl.formatMessage({
                      id: "avatar-editor.field.emissive-map",
                      defaultMessage: "Emissive Map"
                    }),
                    "image/*"
                  )}
                  {this.mapField(
                    "normal_map",
                    intl.formatMessage({
                      id: "avatar-editor.field.normal-map",
                      defaultMessage: "Normal Map"
                    }),
                    "image/*"
                  )}
                  {this.mapField(
                    "orm_map",
                    intl.formatMessage({
                      id: "avatar-editor.field.orm-map",
                      defaultMessage: "ORM Map"
                    }),
                    "image/*",
                    false,
                    intl.formatMessage({
                      id: "avatar-editor.field.orm-map-info",
                      defaultMessage: "Occlussion (r), Roughness (g), Metallic (b)"
                    })
                  )}
                </details>

                <label>
                  <FormattedMessage id="avatar-editor.share-settings" defaultMessage="Share Settings" />
                </label>
                {this.checkbox(
                  "allow_promotion",
                  intl.formatMessage(
                    {
                      id: "avatar-editor.field.allow-promotion",
                      defaultMessage: "Allow {companyName} to promote your avatar, and show it in search results."
                    },
                    { companyName: configs.translation("company-name") }
                  ),
                  <span>
                    <FormattedMessage
                      id="avatar-editor.field.allow-promotion-checkbox"
                      defaultMessage="Allow <a>Promotion</a>"
                      values={{
                        a: chunks => (
                          <a
                            href={configs.link("promotion", "https://github.com/mozilla/hubs/blob/master/PROMOTION.md")}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {chunks}
                          </a>
                        )
                      }}
                    />
                  </span>
                )}
                {this.checkbox(
                  "allow_remixing",
                  intl.formatMessage({
                    id: "avatar-editor.field.allow-remixing",
                    defaultMessage: "Allow others to edit and re-publish your avatar as long as they give you credit."
                  }),
                  <span>
                    <FormattedMessage
                      id="avatar-editor.field.allow-remixing-checkbox"
                      defaultMessage="Allow <a>Remixing</a> <license>(under <licenselink>CC-BY 3.0</licenselink>)</license>"
                      values={{
                        a: chunks => (
                          <a
                            href={configs.link("remixing", "https://github.com/mozilla/hubs/blob/master/REMIXING.md")}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {chunks}
                          </a>
                        ),
                        license: chunks => <span className="license">{chunks}</span>,
                        licenselink: chunks => (
                          <a
                            href="https://creativecommons.org/licenses/by/3.0/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {chunks}
                          </a>
                        )
                      }}
                    />
                  </span>
                )}
                {this.textField(
                  "creatorAttribution",
                  intl.formatMessage({
                    id: "avatar-editor.field.creator-attribution",
                    defaultMessage: "Attribution (optional)"
                  }),
                  false,
                  false
                )}
                {/* {this.mapField("ao_map", "AO Map", "images/\*", true)} */}
                {/* {this.mapField("metallic_map", "Metallic Map", "image/\*", true)} */}
                {/* {this.mapField("roughness_map", "Roughness Map", "image/\*", true)} */}
              </div>
              <AvatarPreview
                className="preview"
                avatarGltfUrl={this.state.previewGltfUrl}
                onGltfLoaded={this.handleGltfLoaded}
                {...this.inputFiles}
                ref={p => (this.preview = p)}
              />
            </div>
            <div className="info">
              <IfFeature name="show_avatar_editor_link">
                <p>
                  <FormattedMessage
                    id="avatar-editor.external-editor-info"
                    defaultMessage="Create a custom skin for this avatar:"
                  />{" "}
                  {this.state.editorLinks.map(({ name, url }) => (
                    <a
                      key={name}
                      target="_blank"
                      rel="noopener noreferrer"
                      href={url.replace("$AVATAR_GLTF", encodeURIComponent(this.state.previewGltfUrl))}
                    >
                      {name}
                    </a>
                  ))}
                </p>
              </IfFeature>
              <IfFeature name="show_avatar_pipelines_link">
                <p>
                  <FormattedMessage
                    id="avatar-editor.info"
                    defaultMessage="Find more custom avatar resources <a>here</a>"
                    values={{
                      a: chunks => (
                        <a
                          target="_blank"
                          rel="noopener noreferrer"
                          href="https://github.com/MozillaReality/hubs-avatar-pipelines"
                        >
                          {chunks}
                        </a>
                      )
                    }}
                  />
                </p>
              </IfFeature>
            </div>
            <div>
              <button disabled={this.state.uploading} className="form-submit" type="submit">
                {this.state.uploading ? (
                  <FormattedMessage id="avatar-editor.submit-button.uploading" defaultMessage="Uploading..." />
                ) : (
                  <FormattedMessage id="avatar-editor.submit-button.save" defaultMessage="Save" />
                )}
              </button>
            </div>
            {!this.props.hideDelete && (
              <div className="delete-avatar">
                {this.state.confirmDelete ? (
                  <span>
                    <FormattedMessage
                      id="avatar-editor.delete-avatar.confirmation-prompt"
                      defaultMessage="Are you sure?"
                    />{" "}
                    <a onClick={this.deleteAvatar}>
                      <FormattedMessage id="avatar-editor.delete-avatar.confirm" defaultMessage="yes" />
                    </a>{" "}
                    /{" "}
                    <a onClick={() => this.setState({ confirmDelete: false })}>
                      <FormattedMessage id="avatar-editor.delete-avatar.cancel" defaultMessage="no" />
                    </a>
                  </span>
                ) : (
                  <a
                    onClick={() => this.setState({ confirmDelete: true })}
                    title={avatar.has_listings ? intl.formatMessage(delistAvatarInfoMessage) : ""}
                  >
                    {avatar.has_listings ? (
                      <FormattedMessage id="avatar-editor.delist-avatar-button" defaultMessage="Delist Avatar" />
                    ) : (
                      <FormattedMessage id="avatar-editor.delete-avatar-button" defaultMessage="Delete Avatar" />
                    )}
                  </a>
                )}
              </div>
            )}
          </form>
        )}
      </div>
    );
  }
}

export default injectIntl(AvatarEditor);
