window.blockUser = function(id) {
  NAF.connection.adapter.publisher.handle.sendMessage({ kind: "block", whom: id });
  NAF.connection.entities.removeEntitiesOfClient(id);
};

window.unblockUser = function(id) {
  NAF.connection.adapter.publisher.handle.sendMessage({ kind: "unblock", whom: id });
  window.setTimeout(() => {
    // Wait enough time for the unblock to be processed
    NAF.connection.entities.completeSync(id);
  }, 1000);
};

AFRAME.registerComponent("block-button", {
  init() {
    this.el.addEventListener("click", this.onClick);
    const owner = (function getOwner(el) {
      if (el.firstUpdateData) {
        return el.firstUpdateData.owner;
      }
      if (el.parentEl) {
        return getOwner(el.parentEl);
      }
      return null;
    })(this.el);

    this.onClick = () => {
      window.blockUser(owner);
    };
  }
});
