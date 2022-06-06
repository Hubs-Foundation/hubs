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

var avatar_url = null;
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

  getPreviewUrl = gltfUrl => {
    return gltfUrl ? gltfUrl : this.state.avatar.base_gltf_url;
  };

  uploadAvatar = async e => {
    this.setState({ uploading: true });
    if (true) {
      console.log(avatar_url);
      let gltfUrl;
      const url = avatar_url; 
      await fetch(url)
      .then(res => res.blob()) // Gets the response and returns it as a blob
      .then(blob => {
        gltfUrl = URL.createObjectURL(blob);
      });
      
      const gltfLoader = new THREE.GLTFLoader().register(parser => new GLTFBinarySplitterPlugin(parser));
      const onProgress = console.log;

      URL.revokeObjectURL(this.state.avatar.files["glb"]);
      this.setState({
        avatar: {
          ...this.state.avatar,
          ['parent_avatar_listing_id']: "",
          files: {
            ...this.state.avatar.files,
            glb: gltfUrl
          }
        },
        previewGltfUrl: this.getPreviewUrl(gltfUrl)
      });

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
        URL.revokeObjectURL(gltfUrl);
      });
      this.inputFiles.thumbnail = new File([await this.preview.snapshot()], "thumbnail.png", {
        type: "image/png"
      });
    }
    this.inputFiles.thumbnail = new File([await this.preview.snapshot()], "thumbnail.png", {
      type: "image/png"
    });

    const filesToUpload = ["gltf", "bin", "base_map", "emissive_map", "normal_map", "orm_map", "thumbnail"].filter(
      k => this.inputFiles[k] === null || this.inputFiles[k] instanceof File
    );

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

  iframeField = () => (
    <div>
       <iframe src="https://larchiveum.readyplayer.me/avatar?frameApi" width="1280px" height="720px"/>
     </div>
  );

  subscribe = (event) => {
   
    console.log(event.data);
    avatar_url = event.data;
    //this.uploadAvatar();
    if (event.origin.startsWith('https://larchiveum.ready') && event.data.toString().includes('.glb')) {
      this.uploadAvatar();
    }
  }

  parse = (event) => {
    try {
      return JSON.parse(event.data);
    } catch (error) {
      return null;
    }
  }

  render() {
    window.addEventListener('message', this.subscribe);
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
            <div className="split">
              <div className="form-body">
                {this.iframeField()}
                <div className="split">
                  <AvatarPreview
                    className="preview"
                    avatarGltfUrl={this.state.previewGltfUrl}
                    onGltfLoaded={this.handleGltfLoaded}
                    {...this.inputFiles}
                    ref={p => (this.preview = p)}
                  />
                </div>
                {this.state.uploading ? (
                  <div className="loading-page"></div>
                ) : (
                  <></>
                )}
              </div>
            </div>
          </form>
        )}
      </div>
    );
  }
}

export default injectIntl(AvatarEditor);
