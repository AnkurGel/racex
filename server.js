var q = require('q'),
    http = require('http'),
    redis = require('redis'),
    express = require('express');
    path = require('path');
    bodyParser = require('body-parser');

var redisClient = redis.createClient();
var app = express();

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

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
  res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});

console.log("Server listening on 3030");
app.listen(3030);

