var q = require('q');
var redis = require('redis');
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({
    port: 9999
});

var redisClient = redis.createClient();

var racers = {};
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
        connection.send(JSON.stringify(msg));
    },

    onclose: (connection) => {
        if(connection.name) {
            console.log("Removing racer", connection.name);
            delete racers[connection.name];
        }
    }
};

var handleMessage = (data, connection) => {
    switch(data.type) {
        case 'login':
            registerRacer(data.name, data.room, connection);
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

function registerRacer(name, room, connection) {
    if(racers[room] && racers[room][name]){
        wsEvents.send({type: 'login', success: false}, connection);
    } else {
        // allot ws connection to racer
        if(!racers[room]) racers[room] = {};
        connection.name = name;
        racers[room][name] = connection;
        wsEvents.send({
            type: 'login', 
            success: true,
            name: name,
            racers: Object.keys(racers[room])
        }, connection);
    }
}

function prepareOffer(data, connection) {
    console.log("Sending offer to:", data.name);
    var conn = racers[data.room] && racers[data.room][data.name];
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
    var conn = racers[data.room] && racers[data.room][data.name];
    if(conn != null) {
        wsEvents.send({
            type: 'answer',
            answer: data.answer
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
    var conn = racers[data.room] && racers[data.room][data.name];
    if(conn != null) {
        wsEvents.send({
            type: 'candidate',
            candidate: data.candidate,
            name: data.name
        }, conn);
    }
}

function leave(data, connection) {

}

wss.on('connection', (connection) => {
   console.log("New connection");
    //connection.send("hello");

    connection.otherRacers = [];
    connection.on('message', (msg) => {
        wsEvents.onmessage(msg, connection);
    });

    connection.on('close', () => {
        wsEvents.onclose(connection);
    });

});
