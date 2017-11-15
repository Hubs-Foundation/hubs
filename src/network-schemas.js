function registerNetworkSchemas() {
  NAF.schemas.add({
    template: "#nametag-template",
    components: [
      {
        selector: ".nametag",
        component: "text",
        property: "value"
      }
    ]
  });

  NAF.schemas.add({
    template: "#right-hand-template",
    components: ["position", "rotation", "visible"]
  });

  NAF.schemas.add({
    template: "#left-hand-template",
    components: ["position", "rotation", "visible"]
  });
}

export default registerNetworkSchemas;
