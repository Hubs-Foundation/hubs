import { NearestFilter } from "three";

AFRAME.registerComponent('audio-channel', {
  schema: {
      channel: {type: "number", default: 0},
      localChannel: {type: "number", default: 0},
      avatarAudioSource: {type: "asset", default: null},
      defaultRef: {type: "number", default: 2},
      audioState: {type: "boolean", default: true},
    },
      init: function () {
      },
      setChannel: function(channelNumber)
      {
        this.data.channel = channelNumber;
      },
      initVariables: function()
      {
        try
        {
          this.data.avatarAudioSource = this.el.querySelector("[avatar-audio-source]").components['avatar-audio-source'];
          this.data.defaultRef = this.el.sceneEl.systems["hubs-systems"].audioSettingsSystem.audioSettings.avatarRefDistance;
        }
        catch(e)
        {
          console.error(e);
        }
      },
      tick: function()
      {   
        if(this.el.id!="avatar-rig" && this.data.avatarAudioSource == null)
        {
          this.initVariables();

          return;
        }

        if(this.data.localChannel != this.data.channel && this.el.id=="avatar-rig")
        {
          this.updateChannel();
        }
      },
      updateChannel: function()
      {        
          let audioChannelsEntities = document.querySelectorAll('a-entity[audio-channel]');

          for (let i = 0; i < audioChannelsEntities.length; i++) 
          {
            var audioChannel = audioChannelsEntities[i].components["audio-channel"];

            if(audioChannel.data.channel == this.data.channel)
            {
              audioChannel.setChannelAudio(true);
            }
            else
            {
              audioChannel.setChannelAudio(false);
            }
          }
      },
      setChannelAudio: function(audioState)
      {
        this.initVariables();
        this.data.localChannel = this.data.channel;
        this.data.audioState = audioState;

        if(this.el.id=="avatar-rig" || !this.data.avatarAudioSource)
        {
          return;
        }
        
        if(audioState)
        {
          this.data.avatarAudioSource.data.refDistance = this.data.defaultRef;
        }
        else
        {
          this.data.avatarAudioSource.data.refDistance = 0.0;
        }

        this.data.avatarAudioSource.remove();
        this.data.avatarAudioSource.createAudio();
      }
     
  });