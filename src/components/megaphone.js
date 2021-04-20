AFRAME.registerComponent('megaphone', {
  schema: {
        isActive: {type: "boolean", default: false},
        isLocked: {type: "boolean", default: false},
        avatarAudioSource: {type: "asset", default: null},
        defaultRef: {type: "number", default: 2},
      },
      init: function () {
        this.data.isActive = this.el.getAttribute("isMegaphone")=="true";
        this.data.defaultRef = this.el.sceneEl.systems["hubs-systems"].audioSettingsSystem.audioSettings.avatarRefDistance;

        if(this.el.id == "avatar-rig")
        {
          this.data.isLocked = true;
        }
      },

    set: function(isMegaphoneActive)
    {  
      if(isMegaphoneActive == this.data.isActive)
      {
        return;
      }

      if(!this.data.avatarAudioSource)
      {
        this.initVariables();

        if(!this.data.avatarAudioSource)
        {
          return;
        }
      }
      
      if(isMegaphoneActive==true)
      {               
        this.data.avatarAudioSource.data.refDistance = 1000;
        this.data.avatarAudioSource.data.positional = false;
      }
      else if(this.el.components["audio-channel"].data.audioState == true)
      {       
        this.data.avatarAudioSource.data.refDistance = this.data.defaultRef;
        this.data.avatarAudioSource.data.positional = true;
      }
      else if(this.el.components["audio-channel"].data.audioState == false)
      {       
        this.data.avatarAudioSource.data.refDistance = 0;
        this.data.avatarAudioSource.data.positional = true;
      }
      
      this.data.avatarAudioSource.remove();
      this.data.avatarAudioSource.createAudio();
      
      this.data.isActive = isMegaphoneActive;
    },
    initVariables: function()
    {
      try
      {
        this.data.avatarAudioSource = this.el.querySelector("[avatar-audio-source]").components['avatar-audio-source'];
      }
      catch(e)
      {
        //console.error(e);
      }
    },
    block: function()
    {
      this.data.isLocked = true;
    },
    tick: function()
    {
      if(this.data.isLocked)
      {
        return;
      }

      this.set(this.el.getAttribute("isMegaphone")=="true");
    },     
  });