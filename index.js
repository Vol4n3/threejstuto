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
var PhysicPoint = require('./class/PhysicPoint');
var Vector = require('./class/Vector');
var Segment = require('./class/Segment');
var Personnage = require('./class/Personnage');

var personnages = {};
var zombies = [];
for (let i = 0; i < 20; i++) {
    let rx = Math.random() * 1000 - 500;
    let ry = Math.random() * 1000 - 500;
    let z = new PhysicPoint(rx, ry, 2.5)
    zombies.push(z);
}
setInterval(function () {
    //todo
    for(let z in zombies){
        let targets = [];
        for(let s in personnages){
            let direction = new Segment(personnages[s],zombies[z]);
            direction.addLengthP2(-0.5);
        }
    }
    io.emit('receive_data_loop', { players: personnages, zombies: zombies });
}, 30)
io.on('connection', function (socket) {
    //connexion du client
    var color = 0xffffff;
    socket.emit('player_socket', {
        socketId: socket.id,
        color: color,
    });
    for (let i in personnages) {
        socket.emit('new_player', {
            socketId: i,
            color: personnages[i].color
        });
    }
    socket.emit('new_zombie', zombies);

    personnages[socket.id] = new Personnage(Math.random()*50,Math.random()*50,0,0,false,color);
    socket.on('personnage_position', function (data) {
        personnages[socket.id].receive(data);
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
        var preci = bullet.accurate / 100;
        b.setLengthP2(bullet.range);
        b.addAngletoP2(Math.random() * preci - preci * 0.5);        
        io.emit('shoot', {
            _x: b.p1.x,
            _y: b.p1.y,
            x: b.p2.x,
            y: b.p2.y,
            type : bullet.type,
            color : bullet.color
        });
        for (let p in personnages) {
            if (p != socket.id) {
                var persoPos = new Point(personnages[p].x, personnages[p].y, 2.5);
                var colli = [];
                colli = persoPos.collisionTo(b);
                if (colli && colli.length > 0) {
                    io.emit('touche', colli[0]);
                }
            }
        }
    });

})