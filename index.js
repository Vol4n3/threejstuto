"use strict";
var express = require('express');
var app = express();
var server = require('http').createServer(app);
app.use(express.static(__dirname + '/app'));
server.listen(8081, function() {
    console.log('server http launched');
});
var io = require('socket.io').listen(server);
var personnages = {};
setInterval(function(){
    io.emit('receive_players',personnages);
},50)
io.on('connection',function(socket){
    //connexion du client
    socket.emit('player_socket',socket.id);
    for(var i in personnages){
        socket.emit('new_player',{
            socketId: i
        });
    }
    personnages[socket.id] = {};
    socket.on('personnage_position',function(data){
        personnages[socket.id] = data;
    })
    socket.broadcast.emit('new_player',{
        socketId: socket.id
    });
    socket.on('disconnect',function(){
        socket.broadcast.emit('player_left',{
            socketId: socket.id
        });
        delete personnages[socket.id];
    })
})