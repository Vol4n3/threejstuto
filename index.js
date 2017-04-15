"use strict";
var express = require('express');
var app = express();
var server = require('http').createServer(app);
app.use(express.static(__dirname + '/app'));
server.listen(8081, function() {
    console.log('server http launched');
});
var io = require('socket.io').listen(server);
io.on('connection',function(socket){
    //connexion du client
})