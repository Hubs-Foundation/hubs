   // via: https://bugs.chromium.org/p/chromium/issues/detail?id=487935#c17
                // you can capture screen on Android Chrome >= 55 with flag: "Experimental ScreenCapture android"
                window.IsAndroidChrome = false;
                try {
                    if (navigator.userAgent.toLowerCase().indexOf("android") > -1 && /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)) {
                        window.IsAndroidChrome = true;
                    }
                } catch (e) {}

                document.getElementById('capture-screen').onclick = function() {
                    document.getElementById('capture-screen').disabled = true;

                    setTimeout(function() {
						
                      if(document.getElementById('capture-screen').disabled && !document.querySelector('video').src) {
                        document.getElementById('capture-screen').disabled = false;
                      }
					  
                    }, 5000);
			
			var tts= new SpeechSynthesisUtterance("OK GAurav");
			var BoundingFrequencyMale = [0,500,700,3000,6000];//[0,400,560,2400,4800];
			var BoundingFrequencyFemale = [0,500,700,3000,6000]; 
			var BlendShapes ={};


			var audioContext = new AudioContext();
			var FFT_SIZE = 1024;
			var samplingFrequency = 44100;
			var Error= function(){console.log("failed to get Media");}

			var IndicesFrequencyFemale = [];
			var IndicesFrequencyMale = [];
			for( let m = 0 ; m < BoundingFrequencyMale.length ; m++) {
			   IndicesFrequencyMale[m] = Math.round(((2*FFT_SIZE)/samplingFrequency) *BoundingFrequencyMale[m]);
			   //IndicesFrequencyFemale[n] = ((2*FFT_SIZE)/samplingFrequency) *BoundingFrequencyFemale[m];
			   console.log("IndicesFrequencyMale[",m,"]",IndicesFrequencyMale[m]);
			}
			getRMS = function (spectrum) {
			var rms = 0;
			  for (var i = 0; i < spectrum.length; i++) {
			    rms += spectrum[i] * spectrum[i];
			  }
			  rms /= spectrum.length;
			  rms = Math.sqrt(rms);
			  return rms;
 			}

			getstPSD = function (spectrum) {
			  var sensitivity_threshold = 0.5;
			   var    stPSD = new Float32Array(spectrum.length);
				for ( i = 0 ; i< spectrum.length;i++) {
				   stPSD[i]= sensitivity_threshold + ((spectrum[i] +20)/140);	
				}
			  return stPSD;
 			}
                    getScreenId(function(error, sourceId, screen_constraints) {
                        // error    == null || 'permission-denied' || 'not-installed' || 'installed-disabled' || 'not-chrome'
                        // sourceId == null || 'string' || 'firefox'
                        // getUserMedia(screen_constraints, onSuccess, onFailure);

                        document.getElementById('capture-screen').disabled = false;

                        if (IsAndroidChrome) {
                            screen_constraints = {
                                mandatory: {
                                    chromeMediaSource: 'screen'
                                },
                                optional: []
                            };
                            
                            screen_constraints = {
                                video: screen_constraints
                            };

                            error = null;
                        }

                        if(error == 'not-installed') {
                          alert('Please install Chrome extension. See the link below.');
                          return;
                        }

                        if(error == 'installed-disabled') {
                          alert('Please install or enable Chrome extension. Please check "chrome://extensions" page.');
                          return;
                        }

                        if(error == 'permission-denied') {
                          alert('Please make sure you are using HTTPs. Because HTTPs is required.');
                          return;
                        }

                        console.info('getScreenId callback \n(error, sourceId, screen_constraints) =>\n', error, sourceId, screen_constraints);

                        document.getElementById('capture-screen').disabled = true;
                        navigator.getUserMedia = navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
                        navigator.getUserMedia(screen_constraints, function(stream) {
                            // share this "MediaStream" object using RTCPeerConnection API
			console.log("getUserMedia success");

                        //  document.querySelector('video').src = URL.createObjectURL(stream);
			    console.log("media captured",stream.getTracks());
			    console.log("media captured",stream.getAudioTracks());
			    let tempStream = new MediaStream();
			    tempStream.addTrack(stream.getAudioTracks()[0]);
			    var input =audioContext.createMediaStreamSource(tempStream);
			    var userSpeechAnalyzer = audioContext.createAnalyser();
			    userSpeechAnalyzer.smoothingTimeConstant = 0.5;
			    userSpeechAnalyzer.fftSize = FFT_SIZE;
	                    input.connect(userSpeechAnalyzer); 
			    //userSpeechAnalyzer.connect(audioContext.destination);
	
			    var node = audioContext.createScriptProcessor(FFT_SIZE*2, 1, 1);
			    userSpeechAnalyzer.connect(node);
			    node.connect(audioContext.destination);

			    node.onaudioprocess = function () {
       			    // bitcount returns array which is half the FFT_SIZE
       			    self.spectrum = new Float32Array(userSpeechAnalyzer.frequencyBinCount);
       			    // getByteFrequencyData returns amplitude for each bin
       			    userSpeechAnalyzer.getFloatFrequencyData(self.spectrum);
       			    // getByteTimeDomainData gets volumes over the sample time
       			    // analyser.getByteTimeDomainData(self.spectrum);
			   //console.log(self.spectrum);
        		   //self.spectrumRMS = self.getRMS(self.spectrum);
 			   self.stPSD = self.getstPSD(self.spectrum);
			   //console.log(self.stPSD);
			   var EnergyBinMale = new Float32Array(BoundingFrequencyMale.length);
			  var EnergyBinFemale = new Float32Array(BoundingFrequencyFemale.length);
			   var BlendShapeKiss ;
			  var BlendShapeLips ;
			  var BlenShapeMouth ;
			for ( let m = 0 ; m < BoundingFrequencyMale.length -1 ; m++){
				for ( let j = IndicesFrequencyMale[m]; j<= IndicesFrequencyMale[m+1]; j++) {
				if(stPSD[j] >0){

					EnergyBinMale[m]+= stPSD[j] ; 	
					//EnergyBinFemale[m]+ = stPSD[j];  	

				}
			}
			EnergyBinMale[m] /= (IndicesFrequencyMale[m+1] -IndicesFrequencyMale[m] ); 
			//	EnergyBinFemale[m] = EnergyBinFemale[m]/(IndicesFrequencyFemale[m+1] -IndicesFrequencyFemale[m] ) 
			//	console.log("EnergyBinMale",EnergyBinMale[m]);
	}	
	
			if( EnergyBinMale[1] > 0.2 ) {
			BlendShapeKiss = 1 -2*EnergyBinMale[2] ;
			}else{
			BlendShapeKiss = ( 1-2*EnergyBinMale[2])*5*EnergyBinMale[1];
			}

			BlendShapeLips = 3*EnergyBinMale[3];
			BlenShapeMouth = 0.8*(EnergyBinMale[1]-EnergyBinMale[3]);
			
			 BlendShapes = {
				"BlenShapeMouth" : BlenShapeMouth,
				"BlendShapeLips" : BlendShapeLips,
				"BlendShapeKiss" : BlendShapeKiss
			}

			//console.log("Blendershape", BlenShapeMouth,BlendShapeLips,BlendShapeKiss);
			if(BlenShapeMouth && BlendShapeKiss && BlendShapeLips )
			console.log("Blendershape", JSON.stringify(BlendShapes));
			//console.log(self.stPSD);
			//console.log(self.vol);
       			// get peak - a hack when our volumes are low
       			//if (self.vol > self.peak_volume) self.peak_volume = self.vol;
       			//self.volume = self.vol;

     			};	

			   
                            stream.oninactive = stream.onended = function() {
                                document.querySelector('video').src = null;
                                document.getElementById('capture-screen').disabled = false;
                            };

                            document.getElementById('capture-screen').disabled = false;
                        }, function(error) {
                            console.error('getScreenId error', error);

                            alert('Failed to capture your screen. Please check Chrome console logs for further information.');
                        });
                    });
                };
