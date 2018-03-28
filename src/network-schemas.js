function registerNetworkSchemas() {
  NAF.schemas.add({
    template: "#remote-avatar-template",
    components: [
      "position",
      "rotation",
      "scale",
      "player-info",
      {
        component: "hand-poses",
        property: "leftPose"
      },
      {
        component: "hand-poses",
        property: "rightPose"
      },
      {
        selector: ".camera",
        component: "position"
      },
      {
        selector: ".camera",
        component: "rotation"
      },
      {
        selector: ".left-controller",
        component: "position"
      },
      {
        selector: ".left-controller",
        component: "rotation"
      },
      {
        selector: ".left-controller",
        component: "visible"
      },
      {
        selector: ".right-controller",
        component: "position"
      },
      {
        selector: ".right-controller",
        component: "rotation"
      },
      {
        selector: ".right-controller",
        component: "visible"
      }
    ]
  });

  NAF.schemas.add({
    template: "#video-template",
    components: ["position", "rotation", "visible"]
  });

  NAF.schemas.add({
    template: "#interactable-template",
    components: ["position", "rotation", "scale"]
  });
}

export default registerNetworkSchemas;
