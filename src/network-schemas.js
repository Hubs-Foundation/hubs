function registerNetworkSchemas() {
  NAF.schemas.add({
    template: "#remote-avatar-template",
    components: [
      "position",
      "rotation",
      "scale",
      "player-info",
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
}

export default registerNetworkSchemas;
