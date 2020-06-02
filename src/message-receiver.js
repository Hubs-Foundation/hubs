export function processRPC(command) {
    
    var rpcMsgTag = "[RPC COMMAND] ";

    console.log(rpcMsgTag + command);

    switch (command) {
        case "$toggleIntercomAudio":
            toggleIntercomAudio();
          break;
    }
  }

  function toggleIntercomAudio(){

    const shouldEnablePositionalAudio = window.APP.store.state.preferences.audioOutputMode === "audio";
    window.APP.store.update({
        preferences: { audioOutputMode: shouldEnablePositionalAudio ? "panner" : "audio" }
    });

  }