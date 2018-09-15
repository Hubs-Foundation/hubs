function registerNetworkSchemas() {
  const vectorRequiresUpdate = epsilon => {
    return (prev, curr) => {
      return !NAF.utils.almostEqualVec3(prev, curr, epsilon);
    };
  };

  NAF.schemas.add({
    template: "#remote-avatar-template",
    components: [
      {
        component: "position",
        requiresNetworkUpdate: vectorRequiresUpdate(0.001)
      },
      {
        component: "rotation",
        requiresNetworkUpdate: vectorRequiresUpdate(0.5)
      },
      "scale",
      "player-info",
      "networked-avatar",
      {
        selector: ".camera",
        component: "position",
        requiresNetworkUpdate: vectorRequiresUpdate(0.001)
      },
      {
        selector: ".camera",
        component: "rotation",
        requiresNetworkUpdate: vectorRequiresUpdate(0.5)
      },
      {
        selector: ".left-controller",
        component: "position",
        requiresNetworkUpdate: vectorRequiresUpdate(0.001)
      },
      {
        selector: ".left-controller",
        component: "rotation",
        requiresNetworkUpdate: vectorRequiresUpdate(0.5)
      },
      {
        selector: ".left-controller",
        component: "visible"
      },
      {
        selector: ".right-controller",
        component: "position",
        requiresNetworkUpdate: vectorRequiresUpdate(0.001)
      },
      {
        selector: ".right-controller",
        component: "rotation",
        requiresNetworkUpdate: vectorRequiresUpdate(0.5)
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
        component: "position",
        requiresNetworkUpdate: vectorRequiresUpdate(0.001)
      },
      {
        component: "rotation",
        requiresNetworkUpdate: vectorRequiresUpdate(0.5)
      },
      "visible"
    ]
  });

  NAF.schemas.add({
    template: "#interactable-media",
    components: [
      {
        component: "position",
        requiresNetworkUpdate: vectorRequiresUpdate(0.001)
      },
      {
        component: "rotation",
        requiresNetworkUpdate: vectorRequiresUpdate(0.5)
      },
      "scale",
      "media-loader",
      {
        component: "media-video",
        property: "time"
      },
      {
        component: "media-video",
        property: "videoPaused"
      }
    ]
  });

  NAF.schemas.add({
    template: "#interactable-drawing",
    components: [
      {
        component: "position",
        requiresNetworkUpdate: vectorRequiresUpdate(0.001)
      },
      {
        component: "rotation",
        requiresNetworkUpdate: vectorRequiresUpdate(0.5)
      },
      "scale",
      "networked-drawing"
    ]
  });

  NAF.schemas.add({
    template: "#pen-interactable",
    components: [
      {
        component: "position",
        requiresNetworkUpdate: vectorRequiresUpdate(0.001)
      },
      {
        component: "rotation",
        requiresNetworkUpdate: vectorRequiresUpdate(0.5)
      },
      "scale",
      "media-loader",
      {
        selector: "#pen",
        component: "pen",
        property: "radius"
      },
      {
        selector: "#pen",
        component: "pen",
        property: "color"
      }
    ]
  });
}

export default registerNetworkSchemas;
