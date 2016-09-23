var q = require('q'),
    http = require('http'),
    redis = require('redis'),
    express = require('express');

var redisClient = redis.createClient();
var app = express();

app.get('/register_room/:room_name', (req, res) => {
    redisClient.sadd('racers_rooms', req.params.room_name, (error, response) => {
        if(response) {
            res.send({room_registered: true})
        } else {
            res.send(500, {room_registered: false})
        }
    });
});

app.get('/room/:room_name', function(req, res) {
    res.send();
});
console.log("Server listening on 3030");
app.listen(3030);

