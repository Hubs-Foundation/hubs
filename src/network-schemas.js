function registerNetworkSchemas() {
  NAF.schemas.add({
    template: "#remote-avatar-template",
    components: [
      "position",
      "rotation",
      {
        selector: ".Head",
        component: "position"
      },
      {
        selector: ".Head",
        component: "rotation"
      },
      {
        selector: ".LeftHand",
        component: "position"
      },
      {
        selector: ".LeftHand",
        component: "rotation"
      },
      {
        selector: ".LeftHand",
        component: "visible"
      },
      {
        selector: ".RightHand",
        component: "position"
      },
      {
        selector: ".RightHand",
        component: "rotation"
      },
      {
        selector: ".RightHand",
        component: "visible"
      },
      {
        selector: ".nametag",
        component: "text",
        property: "value"
      }
    ]
  });

  NAF.schemas.add({
    template: "#video-template",
    components: ["position", "rotation", "visible"]
  });
}

export default registerNetworkSchemas;
