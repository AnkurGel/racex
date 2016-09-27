var App = function() {
  var ws,
      rtcPeerConnections = {},
      dataChannels = {},
      username,
      racerCount = 2,
      peerDiscovery;

  function init() {
    createWebSocketConnection();
    App.stepFunction = 'word';
    typeEngine();
    Typer.init();
    createRoom();
  }
  
  //Privates
  function typeEngine() {
    var err;
    var lastIdxPosSuccess = 0; //special var to hold index after clearing input
    var userInputElmWrapper = $('#user-input');
    var userInputElm = userInputElmWrapper.find('input');
    
    //Para Splits
    var getPara = $('#sample-text').text().trim();
    var splitPara = getPara.split('');
    
    var errCounter = 0;
    
    userInputElm.on('input', function () {
      var userInput = $(this).val();
      var explodeUserInput = userInput.split('');
      var currentIdx = explodeUserInput.length - 1;
      
      //User Input Split
      var currentChar = explodeUserInput[currentIdx];
      
      if(splitPara[(lastIdxPosSuccess + currentIdx)] == ' ') {
        if($(this).parent().hasClass('dm')) {
          return;
        } else if($(this).val() != (getPara.substring(lastIdxPosSuccess, (lastIdxPosSuccess + currentIdx)) + ' ')) {
          userInputElmWrapper.removeClass('m').addClass('dm');
          return;
        }
        
        
        var completedText = getPara.substring(0, (lastIdxPosSuccess + currentIdx));
        var incompleteText = getPara.substring((lastIdxPosSuccess + currentIdx), $('#sample-text').text().trim().length);
        
        $('#sample-text').html('<span>' + completedText + '</span>' + incompleteText);
        // console.log(errCounter);
        // console.log($(this).val().length);
        // console.log($(this).val());
        var data = {
          errors: errCounter,
          length: $(this).val().length
        }
        
        Typer.sendKey(data);
        lastIdxPosSuccess = (lastIdxPosSuccess + currentIdx + 1);
        errCounter = 0; //reset errors
        $(this).val('');
      }
      
      if(currentChar == splitPara[(currentIdx + lastIdxPosSuccess)]) {
        userInputElmWrapper.removeClass('dm').addClass('m');
        if(App.stepFunction == 'char'){
          
        }
      } else {
        errCounter++;
        userInputElmWrapper.removeClass('m').addClass('dm');
      }
    });
  }

  function createWebSocketConnection() {
    ws = new WebSocket('ws://localhost:9999');
    ws.onopen = function(message) {
      console.log("Successfully connected to signaling server");
    };
    ws.onerror = function(err) {
      console.log("Couldn't connect to signaling server. Error:", err);
    };


    ws.onmessage = function(message) {
      message = message.data;
      console.log("Got data:", message);
      var data = JSON.parse(message); // data received from signaling server

      switch(data.type) {
        case 'login':
              onLogin(data);
              break;
        case 'peers':
              onPeer(data);
              break;
        case 'readyForOffer':
              readyForOffer(data);
              break;
        case 'offer':
              onOffer(data);
              break;
        case 'answer':
              onAnswer(data);
              break;
        case 'candidate':
              onCandidate(data);
              break;
      }
    };
  }

  function onLogin(data) {
    if(data.success === false){ alert("Try a different username..."); }
    else {
      username = data.name;
    //  startPeerDiscovery();
    }
  }

  function onOffer(data) {
    var otherRacer = data.name;
    var racerConnection = rtcPeerConnections[otherRacer];
    if(racerConnection) {
      racerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));

      racerConnection.createAnswer(function(answer) {
        racerConnection.setLocalDescription(answer);
        send({
          type: 'answer',
          answer: answer,
          name: otherRacer,
          room: 'browserstack'
        });
      });

    }
  }
  function onAnswer(data) {
    rtcPeerConnections[data.name].setRemoteDescription(new RTCSessionDescription(data.answer))
  }

  function onCandidate(data) {
    rtcPeerConnections[data.name].addIceCandidate(new RTCIceCandidate(data.candidate));
  }

  function setUserName(name) {
    // Sets user name and sends it on signaling server

    send({
      type: 'login',
      name: name,
      room: 'browserstack'
    });
  }

  function startPeerDiscovery() {
    peerDiscovery = setInterval(function() {
      send({
        room: 'browserstack',
        type: 'getPeers'
      });
    }, 1000);
  }

  function onPeer(data) {
    if(data.racers.length > 1) {
      //if(data.racers.length == racerCount) clearInterval(peerDiscovery);
      data.racers.splice(data.racers.indexOf(username), 1);
      data.racers.forEach(function(otherRacer) {
        // initiate webrtc
        webrtcInit(otherRacer)
      });
      send({
        type: 'webrtcReady',
        room: 'browserstack',
        name: username
      })
    }
  }

  function webrtcInit(otherRacer) {
    var configuration = {
      'iceServers': [{url: 'stun:stun.1.google.com:19302'}]
    };

    if(!rtcPeerConnections[otherRacer]) {
      console.log("Creating rtcPeerConnection for", otherRacer);
      rtcPeerConnections[otherRacer] = new webkitRTCPeerConnection(configuration);
      var racerConnection = rtcPeerConnections[otherRacer];

      dataChannels[otherRacer] = racerConnection.createDataChannel(otherRacer);
      var racerDataConnection = dataChannels[otherRacer];

      racerDataConnection.onerror = function(error) {
        console.log("Data channel error:", error);
      };
      racerDataConnection.onmessage = function(event) {

      };
      racerDataConnection.onopen = function () {
        racerDataConnection.send("Hello World!");
      };

      racerDataConnection.onclose = function () {
        console.log("The Data Channel is Closed");
      };


      console.log("webkitRTCPeerConnection object created with", otherRacer);
      racerConnection.onicecandidate = function(event) {
        console.log("I'm sending ice candidate now");
        if(event.candidate) {
          send({
            type: 'candidate',
            room: 'browserstack',
            candidate: event.candidate,
            name: otherRacer
          });
        }
      };
    }
    
  }

  function readyForOffer(data) {
    data.racers.splice(data.racers.indexOf(username), 1);
    data.racers.forEach(function(otherRacer) {
      var racerConnection = rtcPeerConnections[otherRacer];
      racerConnection.createOffer(function(offer) {
        racerConnection.setLocalDescription(offer);
        console.log("Sending offer for ", otherRacer);
        send({
          type: 'offer',
          room: 'browserstack',
          offer: offer,
          name: otherRacer
        });
      }, function(err) {
        alert("offer nahi bana");
      });
    });
  }

  function setRacerCount(racerCount) {
    racerCount = racerCount;
  }

  function updateSpeed(data){
    $('.speed[data-user-id="'+data['id']+'"]').text(data['speed'] + ' WPM');
  }

  function createRoom() {
    $('#create-room').on('click', function() {
      $('.create-room-modal').removeClass('hide');
    });
    
    $('.create-room-wrapper').find('input[type=text]').on('keydown', function(e) {
      if(e.which == 13) {
        var getVal = $(this).val().trim();
        if(getVal == '') {
          return;
        }
        
        $.ajax({
          url: '/your-path',
          type: 'post',
          dataType: 'json',
          data: {
            room_name: $(this).val().trim()
          },
          success: function(res) {
            $('.create-room-modal').addClass('hide');
          },
          error: function() {
            
          }
        });
      }
    });
  }

  function advanceGaddi(data) {
    //shitty stuff
    var advanceUnit = (950 * data['length'] * 0.4 )/ $('#sample-text').text().trim().length;
    var track = 0;
    
    var left = $('.car[data-user-id=1]').css('left');
    $('.car[data-user-id=1]').css('left', (parseInt(left) + advanceUnit));
  }

  function send(message) {
    console.log("Sending message:", JSON.stringify(message));
    ws.send(JSON.stringify(message));
  }

  return {
    init: init,
    setUserName: setUserName,
    updateSpeed: updateSpeed,
    advanceGaddi: advanceGaddi
  }
  
}();

App.init();
