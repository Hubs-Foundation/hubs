import { TEXTURES_FLIP_Y } from "../loaders/HubsTextureLoader";


export const ACTIONS ={
  MEGAPHONE: "megaphone",
  TELEPORT: "teleport",
  VISIBLE: "visible",
  SWITCH: "switch active",  
  SNAP: "snap",
  AUDIOZONE: "audiozone",
};

AFRAME.registerComponent('trigger', {
  schema: {
    avatar: { default: null },
    physicsSystem: { default: null },
    uuid: { default: 0 },
    bounds: { default: new THREE.Vector3(1, 1, 1) },
    cMask: {type:"number", default: -1},
    channel: {type:"number", default: 0},
    switchActive: { type: "boolean", default: true},
    targetName: { default: "target" },
    triggerType: { default: "none" },
    elementsInTrigger: { default: []},

      },
      init: function () {
        this.initVariables();
        this.setupCollisionGroup();
        this.initState();
        //this.setBorder();
      },  
      tick: function()
      {
        try
        {
          this.CheckCollidingObjects();
        }
        catch(e)
        {
          console.error(e);
        }
      },
      setBorder: function()
      {
        this.el.setObject3D(
          "guide",
          new THREE.Mesh(
            new THREE.BoxGeometry(this.data.bounds.x, this.data.bounds.y, this.data.bounds.z),
            new THREE.ShaderMaterial({
              uniforms: {
                color: { value: new THREE.Color(0x0F0F0F) }
              },
              vertexShader: `
                varying vec2 vUv;
                void main()
                {
                  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
                  vUv = uv;
                }
              `,
              fragmentShader: `
                // adapted from https://www.shadertoy.com/view/Mlt3z8
                float bayerDither2x2( vec2 v ) {
                  return mod( 3.0 * v.y + 2.0 * v.x, 4.0 );
                }
                float bayerDither4x4( vec2 v ) {
                  vec2 P1 = mod( v, 2.0 );
                  vec2 P2 = mod( floor( 0.5  * v ), 2.0 );
                  return 4.0 * bayerDither2x2( P1 ) + bayerDither2x2( P2 );
                }
    
                varying vec2 vUv;
                uniform vec3 color;
                void main() {
                  float alpha = max(step(0.45, abs(vUv.x - 0.5)), step(0.45, abs(vUv.y - 0.5))) - 0.5;
                  if( ( bayerDither4x4( floor( mod( gl_FragCoord.xy, 4.0 ) ) ) ) / 16.0 >= alpha ) discard;
                  gl_FragColor = vec4(color, 0.5);
                }
              `,
              side: THREE.DoubleSide
            })
          )
        );
    /*
        const previewMaterial = new THREE.MeshBasicMaterial();
        previewMaterial.side = THREE.DoubleSide;
        previewMaterial.transparent = true;
        previewMaterial.opacity = 1.0;
    
        const geometry = new THREE.PlaneBufferGeometry(this.data.bounds.x, this.data.bounds.y, 1, 1, TEXTURES_FLIP_Y);
        const previewMesh = new THREE.Mesh(geometry, previewMaterial);
        previewMesh.visible = true;
        this.el.setObject3D("preview", previewMesh);

        const Mesh = this.el.getObject3D("preview");
        Mesh.material.map = null;
        Mesh.material.needsUpdate = true;
        Mesh.visible = true;
        */
      },
      initState: function()
      {
        switch(this.data.triggerType)
        {
          case ACTIONS.TELEPORT:
            break;
          case ACTIONS.VISIBLE:
            break;
          case ACTIONS.MEGAPHONE:
            break;
          case ACTIONS.SWITCH	:
            this.switchVisibility(!(this.data.switchActive));
            break; 
          case ACTIONS.SNAP	:
            break; 
          case ACTIONS.AUDIOZONE	:
            break; 
          }
      },
      initVariables: function()
      {
        this.data.avatar = document.querySelector("#avatar-rig");
        this.data.physicsSystem = this.el.sceneEl.systems["hubs-systems"].physicsSystem;
        this.data.uuid = this.el.components["body-helper"].uuid;
        this.data.elementsInTrigger = [];
      },
      setupCollisionGroup: function()
      {
        let collisionMask = 0;

          switch(this.data.triggerType)
          {
            case ACTIONS.TELEPORT:
              collisionMask = 5;
              break;
            case ACTIONS.VISIBLE:
              collisionMask = 1;
              break;
            case ACTIONS.MEGAPHONE:
              collisionMask = 4;
              break;
            case ACTIONS.SWITCH	:
              collisionMask = 5;
              break; 
            case ACTIONS.SNAP	:
              collisionMask = 1;
              break; 
            case ACTIONS.AUDIOZONE	:
              collisionMask = 4;
              break; 
            }

        console.log("trigger collisionFilterMask", this.data.cMask);

        this.el.setAttribute("body-helper", {collisionFilterMask:collisionMask})
      } ,     
      CheckCollidingObjects: function() {
        
        let collisions = this.data.physicsSystem.getCollisions(this.data.uuid);

        for (let i = 0; i < collisions.length; i++) {
          const bodyData = this.data.physicsSystem.bodyUuidToData.get(collisions[i]);
          const mediaObjectEl = bodyData && bodyData.object3D && bodyData.object3D.el;
          
          if(!this.listContainsElement(this.data.elementsInTrigger, mediaObjectEl))
          {
            this.data.elementsInTrigger.push(mediaObjectEl);

            this.onTriggerEnter(mediaObjectEl);
          }
        }

        for (let i = 0; i < this.data.elementsInTrigger.length; i++) 
        {
          const element = this.data.elementsInTrigger[i];
          let elementFound = false;

          for (let i = 0; i < collisions.length; i++) 
          {
            const bodyData = this.data.physicsSystem.bodyUuidToData.get(collisions[i]);
            const mediaObjectEl = bodyData && bodyData.object3D && bodyData.object3D.el;

            if(mediaObjectEl.object3D.uuid == element.object3D.uuid)
            {
              elementFound = true;
              break;
            }
          }

          if(!elementFound)
          {
            this.onTriggerLeft(element);
            
            this.data.elementsInTrigger.splice(i,1);
          }
        }
      },
      onTriggerEnter: function(element)
      {
        console.log("trigger onTriggerEnter");

        switch(this.data.triggerType)
        {
          case ACTIONS.TELEPORT:
            this.teleportElement(element, this.data.targetName);
            break;
          case ACTIONS.VISIBLE:
            this.changeVisibility(element, false);
            break;
          case ACTIONS.MEGAPHONE:
            this.changeMegaphone(true);
            break;
          case ACTIONS.SWITCH:
            this.switchVisibility(this.data.switchActive);
            break;
            case ACTIONS.SNAP:
              this.snap(element);
              break;          
            case ACTIONS.AUDIOZONE:
              this.setAudioZone(element, this.data.channel);
              break;
        }
      },
      onTriggerLeft: function(element)
      {
        console.log("trigger onTriggerLeft");

        switch(this.data.triggerType)
        {
          case ACTIONS.TELEPORT:
            break;
          case ACTIONS.VISIBLE:
              this.changeVisibility(element, true);
            break;
          case ACTIONS.MEGAPHONE:
            this.changeMegaphone(false);
            break;
          case ACTIONS.SWITCH:
            if(this.data.elementsInTrigger.length<=1)
            {
              this.switchVisibility(!(this.data.switchActive));
            }
            break;
          case ACTIONS.SNAP:
            break;
          case ACTIONS.AUDIOZONE:
            this.setAudioZone(element, 0);
            break;
        }
      },
      setAudioZone: function(element, channelNumber)
      {
        if(!this.data.avatar.components["audio-channel"])
        {
          return;
        }

        if(NAF.utils.isMine(element))
        {
          this.data.avatar.components["audio-channel"].setChannel(channelNumber);
        }
        else
        {
          this.data.avatar.components["audio-channel"].updateChannel();
        }
      },
      switchVisibility: function(isVisible)
      {
        console.log("trigger switchVisibility", this.data.targetName);

        let targetName = document.querySelector("."+this.data.targetName);
        
        console.log("trigger switchVisibility", isVisible);
        
        if(targetName)
        {
          targetName.setAttribute("visible", isVisible);
        }
      },
      changeMegaphone: function(isActivated)
      {
          this.data.avatar.setAttribute("isMegaphone",isActivated);
      },
      teleportElement: function(element, targetClassName)
      {
        if(!NAF.utils.isMine(element))
        {
            return;
        }

        if(element.className=="AvatarRoot" || element.className=="Head")
        {
          element = this.data.avatar;
        }

        const position = document.querySelector("."+targetClassName);
        element.object3D.position.copy(position.object3D.position);
        element.object3D.rotation.copy(position.object3D.rotation);
        element.object3D.matrixNeedsUpdate = true;

        if(element.components["floaty-object"])
        {
          element.components["floaty-object"].setLocked(true); 
        }
      },
      changeVisibility: function(element, isVisible)
      {
        element.setAttribute("visible", isVisible);
      },
      snap: function(element)
      {
        if(element.components["floaty-object"])
        {
          element.components["floaty-object"].setLocked(true); 
        }
        
        element.object3D.rotation.copy(this.el.object3D.rotation);
        element.object3D.matrixNeedsUpdate = true;        
      },
      isColliding: function(entityA, entityB) {
        const bodyAUUID = entityA.components["body-helper"].uuid;
        const bodyBUUID = entityB.components["body-helper"].uuid;
        return (
          this.data.physicsSystem.bodyInitialized(bodyAUUID) &&
          this.data.physicsSystem.bodyInitialized(bodyBUUID) &&
          this.data.physicsSystem.getCollisions(bodyAUUID).indexOf(bodyBUUID) !== -1
        );
      },
      listContainsElement: function(list, element)
      {
        for (let i = 0; i < list.length; i++) 
        {
          if(list[i]==element)
          {
            return true;
          }
        }

        return false;
      }
  });