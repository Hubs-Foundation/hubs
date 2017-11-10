const AEntity = AFRAME.AEntity;

const AModelEntity = Object.create(AEntity.prototype, {
  attachedCallback: {
    value: function() {
      this.parentNode.addEventListener("object3dset", () => {
        const modelObj = this.parentNode.getObject3D("mesh");
        const modelBinding = this.getAttribute("model-binding");
        this.object3D = modelObj.getObjectByName(modelBinding);
        this.object3D.el = this.el;
        AEntity.prototype.attachedCallback.call(this);
      });
    }
  }
});

AFRAME.registerElement("a-model-entity", { prototype: AModelEntity });
