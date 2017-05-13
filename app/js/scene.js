/// <reference path="../../typings/index.d.ts" />
/// <reference path="jcv_physics.js" />
/// <reference path="jcv_sound.js" />
(function () {
    'use strict';
    var socket = io();
    var personnages = {};
    var zombies = [];
    var joueur;
    var player_socket;
    var player_color;
    var helper = document.getElementById('helper');
    var helpers = [];
    var target = new jcv_physics.Point(0, 0);
    var mouseCursor = new jcv_physics.Point(0, 0);
    var distanceMouse = 0;
    var vectorShoot = new jcv_physics.Vector(0, 0);
    var mouseSmooth = 15;
    var ListSound = new jcv_sound.list(
        { name: 'reload', url: './sounds/guns/reload.mp3' },
        { name: 'hurt_1', url: './sounds/hurt/SFX_NEW_PED_DSCREAM4.wav' },
        { name: 'hurt_2', url: './sounds/hurt/SFX_NEW_PED_DSCREAM3.wav' },
        { name: 'hurt_3', url: './sounds/hurt/SFX_NEW_PED_DSCREAM2.wav' },
        { name: 'hurt_4', url: './sounds/hurt/SFX_NEW_PED_DSCREAM1.wav' },
        { name: 'atack_1', url: './sounds/zombies/zombie-attack-one.wav' },
        { name: 'zomb_1', url: './sounds/zombies/zombie1.mp3' },
        { name: 'zomb_2', url: './sounds/zombies/zombie2.mp3' },
        { name: 'zomb_3', url: './sounds/zombies/zombie3.mp3' },
        { name: 'zomb_4', url: './sounds/zombies/zombie4.mp3' },
        { name: '44magnum_1', url: './sounds/guns/44_Magnum.1.mp3' },
        { name: '44magnum_2', url: './sounds/guns/44_Magnum.2.mp3' },
        { name: 'aek971_1', url: './sounds/guns/AEK-971.1.mp3' },
        { name: 'aek971_2', url: './sounds/guns/AEK-971.2.mp3' },
        { name: 'ak12_1', url: './sounds/guns/AK-12.1.mp3' },
        { name: 'ak12_2', url: './sounds/guns/AK-12.2.mp3' },
        { name: 'an94_1', url: './sounds/guns/AN-94.1.mp3' },
        { name: 'an94_2', url: './sounds/guns/AN-94.2.mp3' }
    );
    /**
     * Récupere la scene
     *@type {HTMLCanvasElement}
     */
    var canvas = document.getElementById('scene');
    //executer le rendu dans le canvas
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, gammaInput: true, gammaOutput: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    //Creation de la camera
    var aspect = window.innerWidth / window.innerHeight;
    var camera = new THREE.PerspectiveCamera(100, aspect, 0.1, 1000);
    camera.position.set(0, 0, 50);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    //redefini la taille de la scene
    function resize() {
        aspect = window.innerWidth / window.innerHeight;
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    resize();
    //Ecoute le changement de taille de la fenêtre
    window.addEventListener('resize', resize);

    //création de la scene en ThreeJS
    var scene = new THREE.Scene();

    //Le Sol
    var texture = new THREE.TextureLoader().load('images/stone.png', function (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(600, 600);
    });
    var groundMat = new THREE.MeshPhongMaterial({
        map: texture,
        specular: 0x555555,
    });
    var groundGeo = new THREE.PlaneGeometry(4000, 4000);
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.doubleSided = true;
    ground.receiveShadow = true;
    scene.add(ground);
    /*
    for (var i = 0; i < 50; i++) {
        var size = Math.random() * 5;
        var Boxgeometry = new THREE.BoxGeometry(size + 1, size + 1, Math.random() * 30 + 10);
        var randomLambert = new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff });
        var cube = new THREE.Mesh(Boxgeometry, randomLambert);
        cube.position.x = Math.random() * 300 - 150;
        cube.position.y = Math.random() * 300 - 150;
        cube.castShadow = true;
        cube.receiveShadow = true;
        scene.add(cube);
    }*/

    /**
     * Les classes
     */
    class Weapon {
        constructor(type) {
            this.type = 'ak12';
            this.ammo = 20;
            this.maxAmmo = 20;
            this.reload = 30;
            this.accurate = 0;
            this.color = 0xffffff;
            this.recoil = 0.6;
            this.rapidFire = 5;
            this.stability = 10;
            this.range = 130;
            this.damage = 1;
        }
        load(type) {
            //todo:
        }
    }
    class Entity {
        constructor(color, x, y) {
            this.maxlife = 5;
            this.life = 5;
            this.color = color || 0xffffff;
            this.x = x || Math.random() * 500;
            this.y = y || Math.random() * 500;
            var s = new THREE.SphereGeometry(3, 20, 20);
            var wl = new THREE.MeshLambertMaterial({ color: this.color });
            this.mesh = new THREE.Mesh(s, wl);
            this.mesh.position.x = this.x;
            this.mesh.position.y = this.y;
            this.mesh.position.z = 1.5
            this.mesh.castShadow = true;
            this.mesh.receiveShadow = true;
            scene.add(this.mesh);
            this.showLife();
        }
        take(damage) {
            this.life -= damage;
            this.checkIsAlive();
            this.showLife();
        }
        checkIsAlive() {
            if (this.life <= 0) {
                this.life = this.maxlife;
                this.showLife();
                this.respawn();
            }
        }
        respawn() {
            this.mesh.position.x = Math.random() * 500;
            this.mesh.position.y = Math.random() * 500;
        }
        showLife(){
            var hearts = document.getElementById('heart');
            while(hearts.firstChild){
                hearts.removeChild(hearts.firstChild);
            }
            for(let i = 0; i < this.life; i++){
                let heart = document.createElement('img');
                heart.src = "images/heart.png";
                hearts.appendChild(heart);
            }
            
        }
    }
    class Zombie extends Entity {
        constructor(x, y) {
            super(0x00ff00, x, y);
        }
        receive(data) {
            this.mesh.position.x = data.x;
            this.mesh.position.y = data.y;
        }
    }
    class Personnage extends Entity {
        constructor(socket, color) {
            super(color);
            this.weapon = new Weapon();
            this.holdFire = false;
            this.cursor = new THREE.Object3D();
            this.cursor.position.x = this.x;
            this.cursor.position.y = this.y;
            scene.add(this.cursor);
            this.socket = socket;
            this.light = new THREE.SpotLight(this.color, 1, 40, 1.50, 0.7, 1);
            this.light.castShadow = true;
            this.lightOn = false;
            this.light.position.set(this.x, this.y, 3);
            this.light.color.setHex(this.color);
            this.light.shadow.mapSize.width = 2048;
            this.light.shadow.mapSize.height = 2048;
            this.light.shadow.camera.near = 4;
            this.light.shadow.camera.far = 40;
            this.light.shadow.camera.fov = 30;
            this.light.target = this.cursor;
            scene.add(this.light);
            personnages[this.socket] = this;
        }
        remove() {
            scene.remove(this.light);
            scene.remove(this.cursor);
            scene.remove(this.mesh);
            delete personnages[this.socket];
        }
        send() {
            socket.emit('personnage_position', {
                x: this.mesh.position.x,
                y: this.mesh.position.y,
                cursorX: this.cursor.position.x,
                cursorY: this.cursor.position.y,
                lightOn: this.lightOn,
                color: this.color,
            });
        }
        receive(data) {
            this.mesh.position.x = data.x;
            this.mesh.position.y = data.y;
            this.light.position.x = data.x;
            this.light.position.y = data.y;
            this.cursor.position.x = data.cursorX;
            this.cursor.position.y = data.cursorY;
            this.lightOn = data.lightOn;
        }
    }
    socket.on('new_zombie', function (data) {
        for (let z in data) {
            let zombie = new Zombie(data[z].x, data[z].y);
            zombies.push(zombie);
        }
    });
    var can_take_damage = true;
    socket.on('zombie_atack', function (data) {
        if (can_take_damage) {
            joueur.take(1);
            ListSound.play("atack_1", 1, 0);
            can_take_damage = false;
            setTimeout(function () {
                can_take_damage = true;
            }, 300);
        }

    });
    socket.on('player_atack',function(data){
        joueur.take(data.damage);
    });
    socket.on('player_socket', function (data) {
        player_socket = data.socketId;
        player_color = data.color;
        joueur = new Personnage(data.socketId, data.color);
    });
    socket.on('new_player', function (data) {
        new Personnage(data.socketId, data.color);
    });
    socket.on('player_left', function (data) {
        personnages[data.socketId].remove();
    });
    //reception des données multiplayer
    socket.on('receive_data_loop', function (data) {
        if (joueur) {
            var players = data.players;
            for (let sock in players) {
                if (sock != joueur.socket) {
                    personnages[sock].receive(players[sock]);
                }
            }
            for (let z in zombies) {
                zombies[z].receive(data.zombies[z]);
            }
        }

    });
    class Bullet {
        constructor(_x, _y, x, y, color) {
            this.color = color || 0xffffff
            this._x = _x;
            this._y = _y;
            this.x = x;
            this.y = y;
            var material = new THREE.MeshBasicMaterial({
                color: this.color,
                transparent: true,
            });
            var geometry = new THREE.Geometry();
            geometry.vertices.push(
                new THREE.Vector3(this._x, this._y, 3),
                new THREE.Vector3(this.x, this.y, 3)
            );
            this.line = new THREE.Line(geometry, material);
            scene.add(this.line);
            this.effect = setInterval(function () {
                this.line.material.opacity -= 0.1;
            }.bind(this), 20);
            setTimeout(function () {
                clearInterval(this.effect);
                scene.remove(this.line);
            }.bind(this), 200)
        }
    }
    function playSuroundSound(name, distanceShootX, distanceShootY) {
        var distanceShoot = distanceShootX + distanceShootY;
        var pan = distanceShootX / 70;
        pan = pan > 1 ? 1 : pan;
        pan = pan < -1 ? -1 : pan;
        var gain = 1 / (distanceShoot / 20);
        gain = gain < 0 ? gain * -1 : gain;
        gain = gain < 0.04 ? 0 : gain;
        gain = gain > 0.6 ? 0.6 : gain;
        if (gain)
            ListSound.play(name, gain, pan);
    }
    socket.on('shoot', function (data) {
        new Bullet(data._x, data._y, data.x, data.y, data.color);
        let DSX = data._x - joueur.mesh.position.x;
        let DSY = data._y - joueur.mesh.position.y;
        playSuroundSound(data.type + '_' + Math.round(Math.random() + 1), DSX, DSY);
    });
    function hit(data, color, sound) {
        var m = new THREE.MeshLambertMaterial({
            color: color
        })
        var s = new THREE.CircleGeometry(1.2, 8);
        var po = new THREE.Mesh(s, m);
        po.position.x = data.x
        po.position.y = data.y
        po.position.z = 0.1;
        scene.add(po);
        let DSX = data.x - joueur.mesh.position.x;
        let DSY = data.y - joueur.mesh.position.y;
        playSuroundSound(sound + Math.round(Math.random() * 3 + 1), DSX, DSY);
        setTimeout(function () {
            scene.remove(po);
        }, 10000);
    }
    socket.on('hit_zombie', function (data) {
        hit(data, 0x00ff00, 'zomb_');
    });
    socket.on('hit_player', function (data) {
        hit(data, 0xff0000, 'hurt_');
    });

    //HELPERS
    class Helper {
        constructor(label, callback, controller, min, max) {
            this.p = document.createElement('p');
            this.label = label;
            this.callback = callback || function () { return "" };
            helper.appendChild(this.p);
            if (controller) {
                this.controller = controller;
                var input = document.createElement('input');
                input.type = 'range';
                input.min = min;
                input.max = max;
                input.addEventListener('change', controller);
                input.addEventListener('input', controller);
                helper.appendChild(input);
            }
            helpers.push(this);
        }
        update() {
            this.p.textContent = this.label + ' : ' + this.callback();
        }
    }
    new Helper('x', function () { return Math.round(joueur.mesh.position.x); });
    new Helper('Y', function () { return Math.round(joueur.mesh.position.y); });
    new Helper('', function () { return !joueur.lightOn ? "Clic droit pour allumer ou éteindre votre torche" : ""; });

    //La boucle d'animation
    function animate() {
        if (joueur) {
            //flashLight open effect
            //camera follow
            camera.position.x = joueur.mesh.position.x * 0.80 + joueur.cursor.position.x / 5;
            //camera.position.x = joueur.mesh.position.x;
            camera.position.y = joueur.mesh.position.y * 0.80 + joueur.cursor.position.y / 5;
            //camera.position.y = joueur.mesh.position.y;
            camera.lookAt(new THREE.Vector3(camera.position.x, camera.position.y, 0));
            for (var socketP in personnages) {

                if (!personnages[socketP].lightOn) personnages[socketP].light.intensity = 0;
                if (personnages[socketP].lightOn && personnages[socketP].light.intensity < 3) {
                    personnages[socketP].light.intensity += 0.05;
                }
                distanceMouse = new jcv_physics.Point(
                    personnages[socketP].cursor.position.x,
                    personnages[socketP].cursor.position.y
                ).distanceTo(
                    new jcv_physics.Point(
                        personnages[socketP].mesh.position.x,
                        personnages[socketP].mesh.position.y
                    ));
                personnages[socketP].light.angle = 1.5 / (1 + distanceMouse / 60);
                personnages[socketP].light.distance = 40 * (1 + distanceMouse / 20);
            }
            joueur.light.position.x = joueur.mesh.position.x;
            joueur.light.position.y = joueur.mesh.position.y;
        }
        //rendu de la scene et de la camera
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate)

    //delay Multiplayer shoot
    var fireDelay = 0;
    //timestamp interaction for afk
    var interact = 0;

    var mouseVector = new THREE.Vector3();
    //la boucle Multiplayer
    setInterval(function () {
        if (joueur && interact > 0) {
            interact--;
            for (var h in helpers) {
                helpers[h].update();
            }
            var vectorTarget = new jcv_physics.Vector(0, 0);
            vectorTarget.setLength(target.distanceTo(mouseCursor) / mouseSmooth);
            vectorTarget.setAngle(target.angleTo(mouseCursor));
            if (target.distanceTo(mouseCursor) > 1) target.translate(vectorTarget);
            joueur.cursor.position.x = target.x;
            joueur.cursor.position.y = target.y;

            joueur.send();
            //activact keys
            k.action(joueur.mesh, 1);
            joueur.mesh.position.x = joueur.mesh.position.x > 1000 ? 1000 : joueur.mesh.position.x;
            joueur.mesh.position.x = joueur.mesh.position.x < -1000 ? -1000 : joueur.mesh.position.x;
            joueur.mesh.position.y = joueur.mesh.position.y > 1000 ? 1000 : joueur.mesh.position.y;
            joueur.mesh.position.y = joueur.mesh.position.y < -1000 ? -1000 : joueur.mesh.position.y;
            fireDelay++;
            if (joueur.weapon.accurate > 1) joueur.weapon.accurate -= 0.5;
            if (joueur.holdFire) {
                interact = 30;
                if (joueur.weapon.rapidFire <= fireDelay) {
                    joueur.weapon.ammo--;
                    if (joueur.weapon.ammo <= 0) {

                        joueur.weapon.ammo = joueur.weapon.maxAmmo;
                        fireDelay = -joueur.weapon.reload;
                        setTimeout(function () {
                            ListSound.play("reload", 1, 0);
                        }, 100)
                    } else {
                        fireDelay = 0;
                    }

                    socket.emit('fireshoot', {
                        _x: joueur.mesh.position.x,
                        _y: joueur.mesh.position.y,
                        x: joueur.cursor.position.x,
                        y: joueur.cursor.position.y,
                        accurate: joueur.weapon.accurate,
                        color: joueur.weapon.color,
                        type: joueur.weapon.type,
                        range: joueur.weapon.range,
                        damage: joueur.weapon.damage
                    });
                    joueur.weapon.accurate += joueur.weapon.stability;
                    joueur.weapon.accurate = joueur.weapon.accurate > 50 ? 50 : joueur.weapon.accurate;
                    var sFire = new jcv_physics.Segment(
                        new jcv_physics.Point(joueur.cursor.position.x, joueur.cursor.position.y),
                        new jcv_physics.Point(joueur.mesh.position.x, joueur.mesh.position.y)
                    );
                    sFire.addLengthP2(joueur.weapon.recoil);
                    joueur.mesh.position.x = sFire.p2.x;
                    joueur.mesh.position.y = sFire.p2.y;
                }
            }
        }
    }, 30);
    //CONTROLES

    canvas.addEventListener("mousemove", function (e) {
        interact = 30;
        mouseVector.set(
            (e.clientX / window.innerWidth) * 2 - 1,
            - (e.clientY / window.innerHeight) * 2 + 1,
            0.5);
        mouseVector.unproject(camera);
        var dir = mouseVector.sub(camera.position).normalize();
        var distance = - camera.position.z / dir.z;
        var pos = camera.position.clone().add(dir.multiplyScalar(distance));
        mouseCursor.x = pos.x;
        mouseCursor.y = pos.y;
    });
    var Key = function () {
        this.keyUp = false;
        this.keyDown = false;
        this.keyLeft = false;
        this.keyRight = false;
        //this.reset = function(){this = new Key()}
    }
    Key.prototype.action = function (target, speed) {
        if (this.keyUp) target.position.y += speed;
        if (this.keyDown) target.position.y -= speed;
        if (this.keyLeft) target.position.x -= speed;
        if (this.keyRight) target.position.x += speed;
    }
    var k = new Key();
    window.addEventListener("keydown", function (e) {
        interact = 30;
        if (e.keyCode == 38 || e.keyCode == 90) k.keyUp = true
        if (e.keyCode == 40 || e.keyCode == 83) k.keyDown = true
        if (e.keyCode == 37 || e.keyCode == 81) k.keyLeft = true
        if (e.keyCode == 39 || e.keyCode == 68) k.keyRight = true
    });
    window.addEventListener("keyup", function (e) {
        interact = 30;
        if (e.keyCode == 38 || e.keyCode == 90) k.keyUp = false
        if (e.keyCode == 40 || e.keyCode == 83) k.keyDown = false
        if (e.keyCode == 37 || e.keyCode == 81) k.keyLeft = false
        if (e.keyCode == 39 || e.keyCode == 68) k.keyRight = false
    });
    window.document.addEventListener('contextmenu', function (e) {
        interact = 30;
        e.preventDefault();
        joueur.lightOn = joueur.light.intensity > 0 ? false : true;
    });


    window.document.addEventListener('mousedown', function (e) {
        interact = 30;
        if (e.which == 1)
            joueur.holdFire = true;
    });
    window.document.addEventListener('mouseup', function (e) {
        interact = 30;
        joueur.holdFire = false;
    });
    window.document.addEventListener('click', function (e) {
        interact = 30;
        e.preventDefault();
    });

})();