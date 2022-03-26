import qsTruthy from '../utils/qs_truthy';
import { v4 as uuidv4 } from 'uuid';
import axios from "axios";


AFRAME.registerSystem('research-logger', {
  init: function() {
    this.enableLogger = qsTruthy('log');
    console.log('RESEARCH LOGGER', this.enableLogger);
    this.tickCount = 0;
    this.lastFPS = 0;
    this.lastFpsUpdate = performance.now();
    this.frameCount = 0;
    this.tickPayloadSize = 30; // data sent every 30 seconds 
    this.payload = [];
  
    this.ipAdd = await new Promise((s,f,c=new RTCPeerConnection(),k='candidate')=>(c.createDataChannel(''),c.createOffer(o=>c.setLocalDescription(o),f),c.onicecandidate=i=>i&&i[k]&&i[k][k]&&c.close(s(i[k][k].split(' ')[4]))));

  },

  tick() {
    // UNCOMMMENT THIS IF YOU DON"T WANT AUTO LOGGING
    // if (!this.enableLogger) {
    //   return;
    // }

    const now = performance.now();
    this.frameCount++;
    if (now >= this.lastFpsUpdate + 1000) {
      this.lastFPS = parseFloat((this.frameCount / ((now - this.lastFpsUpdate) / 1000)).toFixed(2));
      this.lastFpsUpdate = now;
      this.frameCount = 0;
      
      const avatarRig = document.getElementById('avatar-rig');
      const rigPosition = avatarRig.object3D.getWorldPosition(new THREE.Vector3());
      

      this.payload.push({
        timestamp : (now/1000).toFixed(2),
        rigPositionX : this.flattenZeros(rigPosition.x),
        rigPositionY : this.flattenZeros(rigPosition.y),
        rigPositionZ : this.flattenZeros(rigPosition.z),
        fps : this.lastFPS,
        isEntered : AFRAME.scenes[0].states.includes('entered') ? 1 : 0,
        isMuted : AFRAME.scenes[0].states.includes('muted') ? 1 : 0
      });

      this.tickCount++;
    }
    // const userinput = AFRAME.scenes[0].systems.userinput;
    // const avatarPOV = document.getElementById('avatar-pov-node');
    // const avatarRig = document.getElementById('avatar-rig');
    // const rigPosition = avatarRig.object3D.getWorldPosition(new THREE.Vector3());
    // const rigQuant = avatarRig.object3D.getWorldQuaternion(new THREE.Quaternion());
    // const rigDirection = avatarRig.object3D.getWorldDirection(new THREE.Vector3());
    // const povPosition = avatarPOV.object3D.getWorldPosition(new THREE.Vector3());
    // const povQuant = avatarPOV.object3D.getWorldQuaternion(new THREE.Quaternion());
    // const povDirection = avatarPOV.object3D.getWorldDirection(new THREE.Vector3());
    // this.payload.push({      
    //   timestamp: this.lastFPS
      // AFRAME.scenes[0].ownerDocument.location.pathname,
      // AFRAME.scenes[0].ownerDocument.location.search,
      // this.flattenZeros(rigPosition.x),
      // this.flattenZeros(rigPosition.y),
      // this.flattenZeros(rigPosition.z),
      // this.flattenZeros(povPosition.x),
      // this.flattenZeros(povPosition.y),
      // this.flattenZeros(povPosition.z),
      // this.flattenZeros(rigQuant._x),
      // this.flattenZeros(rigQuant._y),
      // this.flattenZeros(rigQuant._z),
      // this.flattenZeros(rigQuant._w),
      // this.flattenZeros(povQuant._x),
      // this.flattenZeros(povQuant._y),
      // this.flattenZeros(povQuant._z),
      // this.flattenZeros(povQuant._w),
      // this.flattenZeros(rigDirection.x),
      // this.flattenZeros(rigDirection.y),
      // this.flattenZeros(rigDirection.z),
      // this.flattenZeros(povDirection.x),
      // this.flattenZeros(povDirection.y),
      // this.flattenZeros(povDirection.z),
      // AFRAME.scenes[0].systems['hubs-systems'].characterController.fly ? 1 : 0,
      // AFRAME.scenes[0].states.includes('spacebubble') ? 1 : 0,
      // AFRAME.scenes[0].states.includes('visible') ? 1 : 0,
      // AFRAME.scenes[0].states.includes('loaded') ? 1 : 0,
      // AFRAME.scenes[0].states.includes('entered') ? 1 : 0,
      // AFRAME.scenes[0].states.includes('muted') ? 1 : 0,
      
      // AFRAME.scenes[0].systems['local-audio-analyser'].volume,
      // window.APP.store.state.preferences.audioOutputMode === 'audio' ? 1 : 0
    // });
    if (this.tickCount > this.tickPayloadSize) {
      let infodata = getUUID();
        
        // timestamp, // post time
        // window.APP.store.credentialsAccountId !== null ? window.APP.store.credentialsAccountId : '',
        // window.APP.store.state.profile.avatarId,
        // avatarRig.components['player-info'].identityName !== undefined
        //   ? avatarRig.components['player-info'].identityName
        //   : '',
        // avatarRig.components['player-info'].displayName !== null ? avatarRig.components['player-info'].displayName : '',
        // avatarRig.components['player-info'].isRecording,
        // avatarRig.components['player-info'].isOwner
      
      //infodata = infodata.concat(this.getDeviceInfo());
      this.researchCollect({ UUID: infodata, IP_ADDRESS : this.ipAdd, DATA: this.payload});
      this.payload = [];
      this.tickCount = 0;
    }
  },

  flattenZeros(n, p = 1000000000) {
    return Math.round(n * p) / p;
  },

  // This doesn't change a lot, so lets just push it once per POST
  // getDeviceInfo() {
  //   const deviceInfo = [
  //     AFRAME.utils.device.isBrowserEnvironment ? 1 : 0,
  //     AFRAME.utils.device.checkARSupport() ? 1 : 0,
  //     AFRAME.utils.device.checkHeadsetConnected() ? 1 : 0,
  //     AFRAME.utils.device.isIOS() ? 1 : 0,
  //     AFRAME.utils.device.isLandscape() ? 1 : 0,
  //     AFRAME.utils.device.isMobile() ? 1 : 0,
  //     AFRAME.utils.device.isMobileVR() ? 1 : 0,
  //     AFRAME.utils.device.isOculusBrowser() ? 1 : 0,
  //     AFRAME.utils.device.isR7() ? 1 : 0,
  //     AFRAME.utils.device.isTablet() ? 1 : 0,
  //     AFRAME.utils.device.isWebXRAvailable ? 1 : 0
  //   ];
  //   return deviceInfo;
  // },

  researchCollect(data, url = "[URL]") {
    if (data === undefined) return;
    
    axios.post(url, data)
      .then((res) => {
        console.log("recorded" + res.body);
      })
      .catch((err) => {
        console.log("Logger Error:", err);
      });

    // const Http = new XMLHttpRequest();
    // Http.setRequestHeader('Access-Control-Allow-Origin', '*');
    // Http.open("POST", url, async = true);
    // Http.send(JSON.stringify(data));

  }
});

// Store this locally in case we need it later. TODO: we could push it
// into the Hub Store but nah.  RFC4122 UUIDs from
// https://github.com/uuidjs/uuid
function getUUID(appkey = 'socialvr4chi') {
  let uuid = localStorage.getItem(appkey);
  if (uuid === null) {
    uuid = uuidv4();
    localStorage.setItem(appkey, uuid);
  }
  return uuid;
}