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
var Zombie = require('./class/Zombie');

var personnages = {};
var zombies = [];
for (let i = 0; i < 50; i++) {
    let z = new Zombie();
    zombies.push(z);
}
setInterval(function () {
    for (let z in zombies) {
        let dt;
        for (let s in personnages) {
            if(personnages[s].isAlive){
                let direction = new Segment(personnages[s], zombies[z]);
                if ((direction.getLength() - 5) < 0) {
                    direction.setLengthP2(6)
                    io.to(s).emit('zombie_atack');
                }
                if (!dt) {
                    dt = direction;
                }
                else if (direction.getLength() < dt.getLength()) {
                    dt = direction;
                }
            }
        }
        for (let z2 in zombies) {
            if (z2 != z) {
                var distanceZombies = new Segment(zombies[z2], zombies[z]);
                if (distanceZombies.getLength() - 5 < 0) {
                    distanceZombies.setLengthP2(6);
                }
            }
        }
        if (dt) {
            dt.addLengthP2(-0.7);
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

    personnages[socket.id] = new Personnage(Math.random() * 50, Math.random() * 50, 0, 0, false, color);
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
            type: bullet.type,
            color: bullet.color
        });
        for (let p in personnages) {
            if (p != socket.id) {
                var persoPos = new Point(personnages[p].x, personnages[p].y, 2.5);
                let collision = [];
                collision = persoPos.collisionTo(b);
                if (collision && collision.length > 0) {
                    io.emit('hit_player', collision[0]);
                    io.to(p).emit('player_atack',{
                        damage : bullet.damage
                    });
                }
            }
        }
        let dz;
        for (let z in zombies) {
            let collision = []
            collision = zombies[z].collisionTo(b);
            if (collision && collision.length > 0) {
                let dir_zombie_bullet = new Segment(new Point(bullet._x, bullet._y), zombies[z]);
                if (!dz) {
                    dz = dir_zombie_bullet;
                }
                else if (dir_zombie_bullet.getLength() < dz.getLength()) {
                    dz = dir_zombie_bullet;
                }
            }
        }
        if (dz) {
            io.emit('hit_zombie', dz.p2);
            dz.addLengthP2(2);
            dz.p2.take(bullet.damage);
        }
    });

})