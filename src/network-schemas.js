function registerNetworkSchemas() {
  const positionRequiresUpdate = (oldData, newData) => {
    return !NAF.utils.almostEqualVec3(oldData, newData, 0.001);
  };

  const rotationRequiresUpdate = (oldData, newData) => {
    return !NAF.utils.almostEqualVec3(oldData, newData, 0.5);
  };

  NAF.schemas.add({
    template: "#remote-avatar-template",
    components: [
      {
        component: "position",
        requiresNetworkUpdate: positionRequiresUpdate
      },
      {
        component: "rotation",
        lerp: false,
        requiresNetworkUpdate: rotationRequiresUpdate
      },
      "scale",
      "player-info",
      "networked-avatar",
      {
        selector: ".camera",
        component: "position",
        requiresNetworkUpdate: positionRequiresUpdate
      },
      {
        selector: ".camera",
        component: "rotation",
        requiresNetworkUpdate: rotationRequiresUpdate
      },
      {
        selector: ".left-controller",
        component: "position",
        requiresNetworkUpdate: positionRequiresUpdate
      },
      {
        selector: ".left-controller",
        component: "rotation",
        requiresNetworkUpdate: rotationRequiresUpdate
      },
      {
        selector: ".left-controller",
        component: "visible"
      },
      {
        selector: ".right-controller",
        component: "position",
        requiresNetworkUpdate: positionRequiresUpdate
      },
      {
        selector: ".right-controller",
        component: "rotation",
        requiresNetworkUpdate: rotationRequiresUpdate
      },
      {
        selector: ".right-controller",
        component: "visible"
      }
    ]
  });

  NAF.schemas.add({
    template: "#video-template",
    components: [
      {
        component: "position"
      },
      {
        component: "rotation"
      },
      "visible"
    ]
  });

  NAF.schemas.add({
    template: "#interactable-template",
    components: [
      {
        component: "position",
        requiresNetworkUpdate: positionRequiresUpdate
      },
      {
        component: "rotation",
        requiresNetworkUpdate: rotationRequiresUpdate
      },
      "scale"
    ]
  });

  NAF.schemas.add({
    template: "#interactable-image",
    components: ["position", "rotation", "image-plus"]
  });
}

export default registerNetworkSchemas;
