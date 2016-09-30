var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({
    port: 9999
});


var racers = {}, rooms = {};
var wsEvents = {
    onmessage: (msg, connection) => {
        console.log("Got message", msg);
        var data;
        try {
            data = JSON.parse(msg);
        } catch(e) {
            console.log("Invalid json", msg);
            data = {}
        }
        handleMessage(data, connection);
    },

    send: (msg, connection) => {
        console.log("Sending", msg);
        connection.send(JSON.stringify(msg));
    },

    onclose: (connection) => {
        if(connection.name) {
            console.log("Removing racer", connection.name);
            if(connection && connection.name && connection.room &&
                racers[connection.room] && racers[connection.room][connection.name]) {
                delete racers[connection.room][connection.name];
                // Informing other racers that one of them betrayed'em and left
                Object.keys(racers[connection.room]).forEach(function(racer) {
                    wsEvents.send({
                        type: 'otherRacerLeft',
                        name: connection.name
                    }, racers[connection.room][racer].connection);
                });
            }
        }
    }
};

var handleMessage = (data, connection) => {
    switch(data.type) {
        case 'registerRoom':
            registerRoom(data.room, data.racerCount);
            break;
        case 'login':
            registerRacer(data.name, data.room, connection);
            break;
        case 'webrtcReady':
            webrtcReady(data, connection);
            break;
        case 'offer':
            prepareOffer(data, connection);
            break;
        case 'answer':
            prepareAnswer(data, connection);
            break;
        case 'getPeers':
            getPeers(data, connection);
            break;
        case 'candidate':
            prepareCandidate(data, connection);
            break;
        case 'leave':
            leave(data, connection);
            break;
        default:
            break;
    }
};

function registerRoom(roomName, racerCount) {
    rooms[roomName] = +racerCount;
}

function registerRacer(name, room, connection) {
    if(racers[room] && racers[room][name]){
        wsEvents.send({type: 'login', success: false}, connection);
    } else {
        // allot ws connection to racer
        if(!racers[room]) racers[room] = {};
        connection.name = name;
        connection.room = room;
        if(!racers[room][name]) racers[room][name] = {};
        racers[room][name]['connection'] = connection;
        racers[room][name]['rtcReady'] = false;
        wsEvents.send({
            type: 'login', 
            success: true,
            name: name,
            racers: Object.keys(racers[room])
        }, connection);
        if(Object.keys(racers[room]).length == rooms[room]) {
            // Now, all racers are registered, inform them to about their peers
            Object.keys(racers[room]).forEach(function(racer) {
                wsEvents.send({
                    type: 'peers',
                    racers: Object.keys(racers[room])
                }, racers[room][racer]['connection']);
            });
        }
    }
}

function webrtcReady(data, connection) {
    // This registers that racer has initiated his RTC and is ready to send offers
    racers[data.room][data.name]['rtcReady'] = true;
    if(allRacersReady(data.room)) {
        askForOffers(data.room);
    }
}

function allRacersReady(room) {
    return Object.keys(racers[room]).reduce(function(val, racer) {
        return val && racers[room][racer].rtcReady;
    }, true);
}

function askForOffers(room) {

    var racersInRoom = Object.keys(racers[room]);
    var mesh = racersInRoom.reduce(function(arr, racer) {
        var connection = racers[room][racer].connection;
        arr.push([connection, racersInRoom.slice(racersInRoom.indexOf(racer) + 1, racersInRoom.length)]);
        return arr;
    }, []);

    mesh.pop();

    mesh.forEach(function(network){
        wsEvents.send({
            type: 'readyForOffer',
            racers: network[1]
        }, network[0]);
    });
}

function prepareOffer(data, connection) {
    console.log("Sending offer to:", data.name);
    var conn = racers[data.room] && racers[data.room][data.name]['connection'];
    if(conn != null) {
        connection.otherRacer = data.name;
        wsEvents.send({
            type: 'offer',
            offer: data.offer,
            name: connection.name
        }, conn);
    }
}

function prepareAnswer(data, connection) {
    console.log("Sending answer to", data.name);
    var conn = racers[data.room] && racers[data.room][data.name]['connection'];
    if(conn != null) {
        wsEvents.send({
            type: 'answer',
            answer: data.answer,
            name: connection.name
        }, conn);
    }
}

function getPeers(data, connection) {
    if(racers[data.room]) {
        wsEvents.send({
            type: 'peers',
            racers: Object.keys(racers[data.room])
        }, connection);
    }
}

function prepareCandidate(data, connection) {
    console.log("Sending candidate to", data.name);
    var conn = racers[data.room] && racers[data.room][data.name]['connection'];
    if(conn != null) {
        wsEvents.send({
            type: 'candidate',
            candidate: data.candidate,
            name: connection.name
        }, conn);
    }
}

function leave(data, connection) {

}

wss.on('connection', (connection) => {
   console.log("New connection");

    connection.otherRacers = [];
    connection.on('message', (msg) => {
        wsEvents.onmessage(msg, connection);
    });

    connection.on('close', () => {
        wsEvents.onclose(connection);
    });

});
