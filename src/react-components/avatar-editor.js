import React, { Component } from "react";
import PropTypes from "prop-types";
import configs from "../utils/configs";
import { fetchReticulumAuthenticated } from "../utils/phoenix-utils";
import { upload } from "../utils/media-utils";
import { ensureAvatarMaterial } from "../utils/avatar-utils";
import AvatarPreview from "./avatar-preview";
import { AvatarEditor } from "./room/AvatarEditor";

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

export default class AvatarEditorContainer extends Component {
  static propTypes = {
    avatarId: PropTypes.string,
    onSave: PropTypes.func,
    onClose: PropTypes.func,
    hideDelete: PropTypes.bool,
    debug: PropTypes.bool,
    className: PropTypes.string
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
      const gltfLoader = new THREE.GLTFLoader();
      const gltfUrl = URL.createObjectURL(this.inputFiles.glb);
      const onProgress = console.log;
      const parser = await new Promise((resolve, reject) =>
        gltfLoader.createParser(gltfUrl, resolve, onProgress, reject)
      );
      URL.revokeObjectURL(gltfUrl);

      const { body } = parser.extensions.KHR_binary_glTF;
      const content = JSON.stringify(ensureAvatarMaterial(parser.json));
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

  // Return the gltf for the selected base avatar, the locally modified glb, or the avatar's base_gltf_url
  getPreviewUrl = baseSid => {
    if (baseSid) {
      const avatarResult = this.state.baseAvatarResults.find(a => a.id === baseSid);
      if (avatarResult) return avatarResult.gltfs.avatar;
    }

    return this.inputFiles.glb ? URL.createObjectURL(this.inputFiles.glb) : this.state.avatar.base_gltf_url;
  };

  handleGltfLoaded = gltf => {
    const ext = gltf.parser.json.extensions && gltf.parser.json.extensions["MOZ_hubs_avatar"];
    let editorLinks = (ext && ext.editors) || defaultEditors;
    if (useAllowedEditors) {
      editorLinks = editorLinks.filter(e => allowedEditors.some(w => w.name === e.name && w.url === e.url));
    }
    this.setState({ editorLinks });
  };

  onSubmit = e => {
    console.log(e);
  };

  render() {
    const { debug, onClose } = this.props;
    const { avatar, editorLinks, baseAvatarResults, previewGltfUrl } = this.state;

    const loading = !avatar;

    return (
      <AvatarEditor
        debug={debug}
        defaultValues={avatar}
        onSubmit={this.onSubmit}
        onClose={onClose}
        loading={loading}
        avatarPreview={
          !loading && (
            <AvatarPreview
              avatarGltfUrl={previewGltfUrl}
              onGltfLoaded={this.handleGltfLoaded}
              {...this.inputFiles}
              ref={p => (this.preview = p)}
            />
          )
        }
        avatarModels={baseAvatarResults.map(entry => ({
          id: entry.id,
          value: entry.id,
          label: entry.name,
          thumbnailUrl: entry.images.preview.url
        }))}
        canDelete={!this.props.hideDelete}
        onDelete={() => {
          /* TODO */
        }}
        showAvatarEditorLink={configs.feature("show_avatar_editor_link")}
        showAvatarPipelinesLink={configs.feature("show_avatar_pipelines_link")}
        editorLinks={editorLinks.map(({ name, url }) => ({
          name,
          url: url.replace("$AVATAR_GLTF", encodeURIComponent(previewGltfUrl))
        }))}
      />
    );
  }
}
