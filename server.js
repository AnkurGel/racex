var http = require('http'),
    express = require('express');
    path = require('path');
    bodyParser = require('body-parser');

var app = express();

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get('/room/:room_name', function(req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});

console.log("Server listening on 3030");
app.listen(3030);

