import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { ObjectActionModalContainer } from "./ObjectActionModalContainer";
import { ReactComponent as PenIcon } from "../icons/Pen.svg";
import { ReactComponent as CameraIcon } from "../icons/Camera.svg";
// import { ReactComponent as TextIcon } from "../icons/Text.svg";
// import { ReactComponent as LinkIcon } from "../icons/Link.svg";
import { ReactComponent as GIFIcon } from "../icons/GIF.svg";
import { ReactComponent as ObjectIcon } from "../icons/Object.svg";
import { ReactComponent as AvatarIcon } from "../icons/Avatar.svg";
import { ReactComponent as SceneIcon } from "../icons/Scene.svg";
import { ReactComponent as UploadIcon } from "../icons/Upload.svg";
import { ReactComponent as DesktopIcon } from "../icons/Desktop.svg";
import { ReactComponent as ChatIcon } from "../icons/Chat.svg";
import { PlacePopoverButton } from "./PlacePopover";
import { ObjectUrlModalContainer } from "./ObjectUrlModalContainer";
import configs from "../../utils/configs";
import { FormattedMessage } from "react-intl";
import { anyEntityWith } from "../../utils/bit-utils";
import { MyCameraTool } from "../../bit-components";

export function PlacePopoverContainer({ scene, mediaSearchStore, showNonHistoriedDialog, hubChannel, disableFullscreen }) {
  const [items, setItems] = useState([]);

  const WebBigModalEvent = () => {
    // モーダル表示用
    // write product info on session
    // localStorage.setItem('modal-name', '神恵内村ホームページ');
    // localStorage.setItem('product-script-src', 'https://www.vill.kamoenai.hokkaido.jp/');

    // showNonHistoriedDialog(ObjectActionModalContainer, { scene: scene });
    window.open('https://www.vill.kamoenai.hokkaido.jp/', '_blank');
  }

  const CommentEvent1 = () => {
    // コメント1
    window.APP.hubChannel.channel.push("message", { body: "おはよう", type: "chat" });
  }

  const CommentEvent2 = () => {
    // コメント2
    window.APP.hubChannel.channel.push("message", { body: "こんにちは", type: "chat" });
  }

  const CommentEvent3 = () => {
    // コメント3
    window.APP.hubChannel.channel.push("message", { body: "こんばんは", type: "chat" });
  }

  const CommentEvent4 = () => {
    // コメント4
    window.APP.hubChannel.channel.push("message", { body: "ありがとう", type: "chat" });
  }

  const CommentEvent5 = () => {
    // コメント5
    window.APP.hubChannel.channel.push("message", { body: "よろしく", type: "chat" });
  }

  useEffect(
    () => {
      function updateItems() {
        const hasActiveCamera = !!anyEntityWith(APP.world, MyCameraTool);
        const hasActivePen = !!scene.systems["pen-tools"].getMyPen();

        let nextItems = [
          // hubChannel.can("spawn_drawing") && {
          //   id: "pen",
          //   icon: PenIcon,
          //   color: "accent5",
          //   label: <FormattedMessage id="place-popover.item-type.pen" defaultMessage="Pen" />,
          //   onSelect: () => scene.emit("penButtonPressed"),
          //   selected: hasActivePen
          // },
          // hubChannel.can("spawn_camera") && {
          //   id: "camera",
          //   icon: CameraIcon,
          //   color: "accent5",
          //   label: <FormattedMessage id="place-popover.item-type.camera" defaultMessage="Camera" />,
          //   onSelect: () => scene.emit("action_toggle_camera"),
          //   selected: hasActiveCamera
          // }
        ];

        if (hubChannel.can("spawn_and_move_media")) {
          nextItems = [
            ...nextItems,
            // TODO: Create text/link dialog
            // { id: "text", icon: TextIcon, color: "blue", label: "Text" },
            // { id: "link", icon: LinkIcon, color: "blue", label: "Link" },
            configs.integration("tenor") && {
              id: "gif",
              icon: GIFIcon,
              color: "accent2",
              label: <FormattedMessage id="place-popover.item-type.gif" defaultMessage="GIF" />,
              onSelect: () => mediaSearchStore.sourceNavigate("gifs")
            },
            {
              id: "webframe",
              icon: DesktopIcon,
              color: "accent2",
              label: <FormattedMessage id="place-popover.item-type.webframe" defaultMessage="WEB" />,
              onSelect: () => WebBigModalEvent()
            },
            {
              id: "webframe",
              icon: ChatIcon,
              color: "accent4",
              label: <FormattedMessage id="place-popover.item-type.commentFrame1" defaultMessage="おはよう" />,
              onSelect: () => CommentEvent1()
            },
            {
              id: "webframe",
              icon: ChatIcon,
              color: "accent4",
              label: <FormattedMessage id="place-popover.item-type.commentFrame2" defaultMessage="こんにちは" />,
              onSelect: () => CommentEvent2()
            },
            {
              id: "webframe",
              icon: ChatIcon,
              color: "accent4",
              label: <FormattedMessage id="place-popover.item-type.commentFrame3" defaultMessage="こんばんは" />,
              onSelect: () => CommentEvent3()
            },
            {
              id: "webframe",
              icon: ChatIcon,
              color: "accent4",
              label: <FormattedMessage id="place-popover.item-type.commentFrame4" defaultMessage="ありがとう" />,
              onSelect: () => CommentEvent4()
            },
            {
              id: "webframe",
              icon: ChatIcon,
              color: "accent4",
              label: <FormattedMessage id="place-popover.item-type.commentFrame5" defaultMessage="よろしく" />,
              onSelect: () => CommentEvent5()
            }
            // configs.integration("sketchfab") && {
            //   id: "model",
            //   icon: ObjectIcon,
            //   color: "accent2",
            //   label: <FormattedMessage id="place-popover.item-type.model" defaultMessage="3D Model" />,
            //   onSelect: () => mediaSearchStore.sourceNavigate("sketchfab")
            // },
            // {
            //   id: "avatar",
            //   icon: AvatarIcon,
            //   color: "accent1",
            //   label: <FormattedMessage id="place-popover.item-type.avatar" defaultMessage="Avatar" />,
            //   onSelect: () => mediaSearchStore.sourceNavigate("avatars")
            // },
            // {
            //   id: "scene",
            //   icon: SceneIcon,
            //   color: "accent1",
            //   label: <FormattedMessage id="place-popover.item-type.scene" defaultMessage="Scene" />,
            //   onSelect: () => mediaSearchStore.sourceNavigate("scenes")
            // },
            // // TODO: Launch system file prompt directly
            // {
            //   id: "upload",
            //   icon: UploadIcon,
            //   color: "accent3",
            //   label: <FormattedMessage id="place-popover.item-type.upload" defaultMessage="Upload" />,
            //   onSelect: () => showNonHistoriedDialog(ObjectUrlModalContainer, { scene })
            // }
          ];
        }

        setItems(nextItems);
      }

      hubChannel.addEventListener("permissions_updated", updateItems);

      updateItems();

      function onSceneStateChange(event) {
        if (event.detail === "camera" || event.detail === "pen") {
          updateItems();
        }
      }

      scene.addEventListener("stateadded", onSceneStateChange);
      scene.addEventListener("stateremoved", onSceneStateChange);

      return () => {
        hubChannel.removeEventListener("permissions_updated", updateItems);
        scene.removeEventListener("stateadded", onSceneStateChange);
        scene.removeEventListener("stateremoved", onSceneStateChange);
      };
    },
    [hubChannel, mediaSearchStore, showNonHistoriedDialog, scene, disableFullscreen]
  );

  return <PlacePopoverButton items={items} />;
}

PlacePopoverContainer.propTypes = {
  hubChannel: PropTypes.object.isRequired,
  scene: PropTypes.object.isRequired,
  mediaSearchStore: PropTypes.object.isRequired,
  showNonHistoriedDialog: PropTypes.func.isRequired,
  disableFullscreen: PropTypes.bool
};
