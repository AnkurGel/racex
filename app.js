var App = function() {
  var ws,
      rtcPeerConnections = {},
      dataChannels = {},
      username,
      racerCount = 2,
      peerDiscovery;

  function init() {
    createWebSocketConnection();
    typeEngine();
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
    
    userInputElm.on('input', function () {
      var userInput = $(this).val();
      var explodeUserInput = userInput.split('');
      var currentIdx = explodeUserInput.length - 1;
      
      //User Input Split
      var currentChar = explodeUserInput[currentIdx];
      
      if(splitPara[(lastIdxPosSuccess + currentIdx)] == ' ') {
        if($(this).parent().hasClass('dm')) {
          return;
        }
        lastIdxPosSuccess = (lastIdxPosSuccess + currentIdx + 1);
        $(this).val('');
      }
      
      if(currentChar == splitPara[(currentIdx + lastIdxPosSuccess)]) {
        userInputElmWrapper.removeClass('dm').addClass('m');
      } else {
        userInputElmWrapper.removeClass('m').addClass('dm');
      }
    });
  }

  function createWebSocketConnection() {
    ws = new WebSocket('ws://10.100.101.131:9999');
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
        case 'offer':
              onOffer(data);
              break;
        case 'answer':
              onAnswer(data);
              break;
        case 'candidate':
              onCandidate(data);
        case 'peers':
              onPeer(data);
              break;
      }
    };
  }

  function onLogin(data) {
    if(data.success === false){ alert("Try a different username..."); }
    else {
      username = data.name;
      startPeerDiscovery();
    }
  }

  function onOffer(data) {
    var otherRacer = data.name;
    var racerConnection = rtcPeerConnections[otherRacer];
    if(racerConnection) {
      racerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));

      racerConnection.createAnswer(function(answer) {
        racerConnection.setLocalDescription(answer);
        ws.send(JSON.stringify({
          type: 'answer', 
          answer: answer,
          name: otherRacer, 
          room: 'browserstack'})
        );
      });

    }
  }
  function onAnswer(data) {
    rtcPeerConnections[data.name].setRemoteDescription(new RTCSessionDescription(data.answer))
  }

  function onCandidate(data) {

  }

  function setUserName(name) {
    // Sets user name and sends it on signaling server
    ws.send(JSON.stringify({type: 'login', name: name, room: 'browserstack'}))
  }

  function startPeerDiscovery() {
    peerDiscovery = setInterval(function() {
      ws.send(JSON.stringify({room: 'browserstack', type: 'getPeers'}));
    }, 1000);
  }

  function onPeer(data) {
    if(data.racers.length > 1) {
      if(data.racers.length == racerCount) clearInterval(peerDiscovery);
      data.racers.splice(data.racers.indexOf(username), 1);
      data.racers.forEach(function(otherRacer) {
        // initiate webrtc
        webrtcInit(otherRacer)
      });
    }
  }

  function webrtcInit(otherRacer) {
    var configuration = {
      'iceServers': [{url: 'stun:stun.1.google.com:19302'}]
    };

    if(!rtcPeerConnections[otherRacer]) {
      rtcPeerConnections[otherRacer] = new webkitRTCPeerConnection(configuration);
      var racerConnection = rtcPeerConnections[otherRacer]

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
        if(event.candidate) {
          ws.send(JSON.stringify({
            type: 'candidate',
            room: 'browserstack',
            candidate: event.candidate,
            name: otherRacer
          }));
        }
      };
      
      racerConnection.createOffer(function(offer) {
        console.log("Sending offer for ", otherRacer);
        ws.send(JSON.stringify({
          type: 'offer',
          room: 'browserstack',
          offer: offer,
          name: otherRacer
        }));
      }, function(err) {
        alert("offer nahi bana");
      });
    }
    
  }

  function setRacerCount(racerCount) {
    racerCount = racerCount;
  }
  return {
    init: init,
    setUserName: setUserName
  }
}();

App.init();