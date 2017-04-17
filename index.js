"use strict";
var express = require('express');
var app = express();
var server = require('http').createServer(app);
app.use(express.static(__dirname + '/app'));
server.listen(8081, function () {
    console.log('server http launched');
});
var io = require('socket.io').listen(server);

var Point = require('./class/Point');
var Vector = require('./class/Vector');
var Segment = require('./class/Segment');

var personnages = {};
var bullets = [];
setInterval(function () {
    io.emit('receive_players', personnages);
}, 50)
io.on('connection', function (socket) {
    //connexion du client
    var color = Math.random() * 0x777777 + 0x999999;
    socket.emit('player_socket', {
        socketId: socket.id,
        color: color,
    });
    for (var i in personnages) {
        socket.emit('new_player', {
            socketId: i,
            color: personnages[i].color
        });
    }
    personnages[socket.id] = {};
    socket.on('personnage_position', function (data) {
        personnages[socket.id] = data;
    })
    socket.broadcast.emit('new_player', {
        socketId: socket.id,
        color: color
    });
    socket.on('disconnect', function () {
        socket.broadcast.emit('player_left', {
            socketId: socket.id
        });
        delete personnages[socket.id];
    });
    socket.on('fireshoot', function (bullet) {
        var b = new Segment(new Point(bullet._x, bullet._y), new Point(bullet.x, bullet.y));
        b.setLengthP2(100);
        io.emit('shoot',{
            _x : b.p1.x,
            _y : b.p1.y,
            x : b.p2.x,
            y : b.p2.y,
        })
        for (let p in personnages) {
            if (p != socket.id) {
                var persoPos = new Point(personnages[p].x, personnages[p].y, 3);
                var colli = [];
                colli = persoPos.collisionTo(b);
                if (colli && colli.length > 0) {
                    io.emit('touche', colli[0]);
                }
            }
        }
    });

})