var App = function() {
  var ws,
      rtcPeerConnections = {},
      dataChannels = {},
      username,
      roomName = 'browserstack',
      racerCount = 2,
      peerDiscovery, roomDefer;

  function init() {
    createWebSocketConnection();
    App.stepFunction = 'word';
    typeEngine();
    Typer.init();
    createRoom();
    showUsernameModal();
  }
  
  function showUsernameModal() {
    if(window.location.href.indexOf('room') > -1) {
      $('#create-room').addClass('hide');
      $('#set-username').removeClass('hide');
      
      $('.after-room').removeClass('hide');
    }
    
    $('#set-username').on('click', function() {
      $('.set-username-modal').removeClass('hide');
    });
    
    $('.set-username-wrapper').on('submit', function(e) {
      e.preventDefault();
      var username = $(this).find('input[name=username]').val().trim();
      
      setUserName(username);
      
      $('.set-username-modal').addClass('hide');
    });
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
        case 'roomRegistered':
              onRoomRegistered(data);
              break;
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
        case 'otherRacerLeft':
              otherRacerLeft(data);
              break;
      }
    };
  }

  function onRoomRegistered(data) {
    if(roomDefer) {
      if(data.success) {
        roomDefer.resolve();
      }  else {
        roomDefer.reject();
      }
    }
  }

  function onLogin(data) {
    if(!data.roomRegistered) {
      alert("This room is not registered. Register a new room");
      window.location = '/'; return;
    }
    if(data.success === false){ alert("Try a different username..."); }
    else {
      username = data.name;
      // @vaibhav: Add logic to populate cars with data.racersCount
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
          room: roomName
        });
      }, function() {  });

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
    roomName = window.location.pathname.split('/')[2];
    send({
      type: 'login',
      name: name,
      room: roomName
    });
  }

  function startPeerDiscovery() {
    peerDiscovery = setInterval(function() {
      send({
        room: roomName,
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
        room: roomName,
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
      rtcPeerConnections[otherRacer] = new webkitRTCPeerConnection(configuration, { optional: [{RTPDataChannels: true}] });
      var racerConnection = rtcPeerConnections[otherRacer];


      racerConnection.ondatachannel = function(event) {
        dataChannels[otherRacer] = event.channel;
        handleDataChannel(event.channel);
      };


      console.log("webkitRTCPeerConnection object created with", otherRacer);
      racerConnection.onicecandidate = function(event) {
        console.log("I'm sending ice candidate now");
        if(event.candidate) {
          send({
            type: 'candidate',
            room: roomName,
            candidate: event.candidate,
            name: otherRacer
          });
        }
      };
      //var dataChannel = racerConnection.createDataChannel('myDataChannel', {reliable: true});

    }
    
  }

  function readyForOffer(data) {
    // data.racers.splice(data.racers.indexOf(username), 1);
    data.racers.forEach(function(otherRacer) {
      var racerConnection = rtcPeerConnections[otherRacer];
      createDataChannel(racerConnection, otherRacer);
      racerConnection.createOffer(function(offer) {
        racerConnection.setLocalDescription(offer);
        console.log("Sending offer for ", otherRacer);
        send({
          type: 'offer',
          room: roomName,
          offer: offer,
          name: otherRacer
        });
      }, function(err) {
        alert("offer nahi bana");
      });
    });
  }
  
  function createRoom() {
    $('#create-room').on('click', function() {
      $('.create-room-modal').removeClass('hide');
    });
    
    $('.create-room-wrapper').on('submit', function(e) {
      e.preventDefault();
      
      var getRoomName = $(this).find('input[name=room_name]').val().trim();
      var memberCount = $(this).find('input[name=member_count]').val().trim();
      
      if(getRoomName == '' || memberCount == '') {
        return;
      }
      
      setRoom(getRoomName, memberCount).then(function() {
        window.location = 'room/' + getRoomName;
      }, function() {
        alert("Room is already registered.")
      });
    });
  }

  function otherRacerLeft(data) {
    // remove racerConnection for that racer if present,
    delete rtcPeerConnections[data.name];
    // remove his gaadi from UI, decrease racerCount by 1
    racerCount -= 1;
  }
  function setRoom(name, count) {
    roomName = name;
    racerCount = count;
    roomDefer = Q.defer();
    send({
      type: 'registerRoom',
      room: roomName,
      racerCount: racerCount
    });
    return roomDefer.promise;
  }

  function updateSpeed(data){
    $('.speed[data-user-id="'+data['id']+'"]').text(data['speed'] + ' WPM');
  }

  function advanceGaddi(data) {
    //shitty stuff
    var advanceUnit = (950 * data['length'] * 0.4 )/ $('#sample-text').text().trim().length;
    var track = 0;
    
    var left = $('.car[data-user-id=1]').css('left');
    $('.car[data-user-id=1]').css('left', (parseInt(left) + advanceUnit));
  }

  function createDataChannel(racerConnection, otherRacer) {
    dataChannels[otherRacer] = racerConnection.createDataChannel(roomName, {reliable: true});
    handleDataChannel(dataChannels[otherRacer]);
  }

  function handleDataChannel(channel) {
    channel.onopen = function() {
      console.log("HELLO");
    };
    channel.onclose = function() {
      console.log("Screw you guys, I'm going home");
    };
    channel.onmessage = function(event) {
      console.log("Data Channel received:", event);
    };
    channel.onerror = function(error) {
      console.log("Data channel error:", error);
    };

  }

  function send(message) {
    console.log("Sending message:", JSON.stringify(message));
    ws.send(JSON.stringify(message));
  }

  return {
    init: init,
    setUserName: setUserName,
    updateSpeed: updateSpeed,
    setRoom: setRoom,
    dataChannels: dataChannels,
    advanceGaddi: advanceGaddi
  }
  
}();

App.init();
