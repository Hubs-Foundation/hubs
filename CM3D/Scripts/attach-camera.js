let attachCamInterval;
class attachCamera
{
    constructor(){

    }
    attach() {
        var yCamOffset = 1.6;
        var camHash = "vide";

        var camEl = getFirstElementFromHash(camHash);

        if (camEl){
            attachCamInterval = setInterval(attachCam, 10)
        } else {
            console.warn("You need to active your webcam first")
        }

        camEl.object3D.scale.setScalar(0.2);
        var selfEl = AFRAME.scenes[0].querySelector("#avatar-rig");
        var povCam = selfEl.querySelector("#avatar-pov-node");

        function attachCam(){ attachObjToAvatar(camEl, selfEl) }

        function attachObjToAvatar(obj, avatar){
            NAF.utils.getNetworkedEntity(obj).then(networkedEl => {
                const mine = NAF.utils.isMine(networkedEl);
                if (!mine) var owned = NAF.utils.takeOwnership(networkedEl);
                networkedEl.object3D.position.copy( avatar.object3D.position );
                networkedEl.object3D.rotation.y = povCam.object3D.rotation.y + yCamOffset;
                networkedEl.object3D.rotation.x = 0;
                networkedEl.object3D.rotation.z = 0;
                networkedEl.object3D.position.y += 1.32;
            })
        }

        function getFirstElementFromHash(hash){
            var g = AFRAME.scenes[0].querySelectorAll("[media-loader]");
            var matches = [];
            for (let e of g){
                var m = e.components["media-loader"].attrValue.src.match(hash);
                if (m && m.length) matches.push(e)
            }
            return matches[0]
        }
    };

    detach() {
        attachCamInterval = clearInterval();
    }

}

export default attachCamera;