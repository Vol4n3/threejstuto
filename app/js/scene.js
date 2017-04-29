/// <reference path="../../typings/index.d.ts" />
/// <reference path="jcv_physics.js" />
/// <reference path="jcv_sound.js" />
(function () {
    'use strict';
    /**
     * @type {SocketIO} socket
     */
    var socket = io();
    var mouseX = 0,
        mouseY = 0;
    /**
     * Récupere la scene
     *@type {HTMLCanvasElement}
     */
    var canvas = document.getElementById('scene');

    //executer le rendu dans le canvas
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.gammaInput = true;
    renderer.gammaOutput = true;

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
    }
    class Bullet {
        constructor(_x, _y, x, y) {
            this._x = _x;
            this._y = _y;
            this.x = x;
            this.y = y;
            var material = new THREE.MeshBasicMaterial({
                color: 0xffffff,
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
    var akShoot = new jcv_sound.list(
        {
            name: 0,
            url: './sounds/guns/M4A1.1.mp3'
        },
        {
            name: 1,
            url: './sounds/guns/M4A1.2.mp3'
        }
    );
    socket.on('shoot', function (data) {
        new Bullet(data._x, data._y, data.x, data.y);
        var distanceShootX = data._x - joueur.player.position.x;
        var distanceShootY = data._y - joueur.player.position.y;
        var distanceShoot = distanceShootX + distanceShootY;
        var pan = distanceShootX / 70;
        pan = pan > 1 ? 1 : pan;
        pan = pan < -1 ? -1 : pan;
        var gain = 1 / (distanceShoot / 20);
        gain = gain < 0 ? gain * -1 : gain;
        gain = gain < 0.04 ? 0 : gain;
        gain = gain > 1 ? 1 : gain;
        if (gain)
            akShoot.play(Math.round(Math.random()), gain, pan);
    });
    var personnages = {};
    class Personnage {
        constructor(socket, color) {
            this.holdFire = false;
            this.life = 10;
            this.alive = true;
            this.rapidFire = 4;
            this.accurate = 0;
            this.socket = socket;
            this.color = color || 0xffffff;
            this.x = Math.random() * 500;
            this.y = Math.random() * 500;
            var s = new THREE.SphereGeometry(3, 20, 20);
            var wl = new THREE.MeshLambertMaterial({ color: this.color });
            this.player = new THREE.Mesh(s, wl);
            this.player.position.x = this.x;
            this.player.position.y = this.y;
            this.player.position.z = 1.5
            this.player.castShadow = true;
            this.player.receiveShadow = true;
            scene.add(this.player);
            this.cursor = new THREE.Object3D();
            this.cursor.position.x = this.x;
            this.cursor.position.y = this.y;
            scene.add(this.cursor);
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
            scene.remove(this.player);
            delete personnages[this.socket];
        }
        send() {
            socket.emit('personnage_position', {
                x: this.player.position.x,
                y: this.player.position.y,
                cursorX: this.cursor.position.x,
                cursorY: this.cursor.position.y,
                lightOn: this.lightOn,
                color: this.color,
            });
        }
        receive(data) {
            this.player.position.x = data.x;
            this.player.position.y = data.y;
            this.light.position.x = data.x;
            this.light.position.y = data.y;
            this.cursor.position.x = data.cursorX;
            this.cursor.position.y = data.cursorY;
            this.lightOn = data.lightOn;
        }
    }
    //création du joueur
    var joueur;
    socket.on('player_socket', function (data) {
        joueur = new Personnage(data.socketId, data.color);
    })
    socket.on('new_player', function (data) {
        new Personnage(data.socketId, data.color);
    });
    socket.on('player_left', function (data) {
        personnages[data.socketId].remove();
    });
    //reception des données multiplayer
    socket.on('receive_players', function (data) {
        for (var pls in data) {
            if (pls != joueur.socket) {
                personnages[pls].receive(data[pls]);
            }
        }
    });
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

    //HELPERS
    var helper = document.getElementById('helper');
    var helpers = [];

    function AddHelper(label, callback, controller, min, max) {
        this.p = document.createElement('p');
        this.label = label;
        this.callback = callback || function(){return ""};
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
    AddHelper.prototype.update = function () {
        this.p.textContent = this.label + ' : ' + this.callback();
    }
    new AddHelper('x', function () { return Math.round(joueur.player.position.x); });
    new AddHelper('Y', function () {  return Math.round(joueur.player.position.y); });
    new AddHelper('', function () { return !joueur.lightOn ? "Clic droit pour allumer ou éteindre votre torche" : ""; });

    var target = new jcv_physics.Point(0, 0);
    var mouseCursor = new jcv_physics.Point(0, 0);

    var distanceMouse = 0;

    //La boucle d'animation
    var vectorShoot = new jcv_physics.Vector(0, 0);
    var precision = 30;
    function animate() {
        if (joueur) {

            //camera follow
            camera.position.x = joueur.player.position.x * 0.80 + joueur.cursor.position.x / 5;
            //camera.position.x = joueur.player.position.x;
            camera.position.y = joueur.player.position.y * 0.80 + joueur.cursor.position.y / 5;
            //camera.position.y = joueur.player.position.y;
            camera.lookAt(new THREE.Vector3(camera.position.x, camera.position.y, 0));

            //flashLight open effect
            for (var socketP in personnages) {
                if (!personnages[socketP].lightOn) personnages[socketP].light.intensity = 0;
                if (personnages[socketP].lightOn && personnages[socketP].light.intensity < 2) {
                    personnages[socketP].light.intensity += 0.004;
                }
                distanceMouse = new jcv_physics.Point(
                    personnages[socketP].cursor.position.x,
                    personnages[socketP].cursor.position.y
                ).distanceTo(
                    new jcv_physics.Point(
                        personnages[socketP].player.position.x,
                        personnages[socketP].player.position.y
                    ));
                personnages[socketP].light.angle = 1.5 / (1 + distanceMouse / 15);
                personnages[socketP].light.distance = 40 * (1 + distanceMouse / 15);
            }
            //position de la lumiere

            mouseCursor.x = mouseX;
            mouseCursor.y = mouseY;
            var vectorTarget = new jcv_physics.Vector(0, 0);
            vectorTarget.setLength(target.distanceTo(mouseCursor) / precision);
            vectorTarget.setAngle(target.angleTo(mouseCursor));

            if (target.distanceTo(mouseCursor) > 1) target.translate(vectorTarget);

            joueur.cursor.position.x = target.x;
            joueur.cursor.position.y = target.y;

            joueur.light.position.x = joueur.player.position.x;
            joueur.light.position.y = joueur.player.position.y;
            //rendu de la scene et de la camera
            renderer.render(scene, camera);
        }
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate)

    //delay Multiplayer shoot
    var fireDelay = 0;
    //la boucle Multiplayer
    setInterval(function () {
        if (joueur) {
            for (var h in helpers) {
                helpers[h].update();
            }
            joueur.send();
            //activact keys
            k.action(joueur.player, 2);
            joueur.player.position.x = joueur.player.position.x > 1000 ? 1000 : joueur.player.position.x;
            joueur.player.position.x = joueur.player.position.x < -1000 ? -1000 : joueur.player.position.x;
            joueur.player.position.y = joueur.player.position.y > 1000 ? 1000 : joueur.player.position.y;
            joueur.player.position.y = joueur.player.position.y < -1000 ? -1000 : joueur.player.position.y;
            fireDelay++;
            if (joueur.accurate > 1) joueur.accurate -= 0.5;
            if (joueur.holdFire) {
                if (joueur.rapidFire <= fireDelay) {

                    fireDelay = 0;
                    socket.emit('fireshoot', {
                        _x: joueur.player.position.x,
                        _y: joueur.player.position.y,
                        x: joueur.cursor.position.x,
                        y: joueur.cursor.position.y,
                        accurate: joueur.accurate,
                    });
                    joueur.accurate += 10;
                    joueur.accurate = joueur.accurate > 50 ? 50 : joueur.accurate;
                    var sFire = new jcv_physics.Segment(
                        new jcv_physics.Point(joueur.cursor.position.x, joueur.cursor.position.y),
                        new jcv_physics.Point(joueur.player.position.x, joueur.player.position.y)
                    );
                    sFire.addLengthP2(1);
                    joueur.player.position.x = sFire.p2.x;
                    joueur.player.position.y = sFire.p2.y;

                }
            }
        }
    }, 40);
    //CONTROLES
    canvas.addEventListener("mousemove", function (e) {
        var vector = new THREE.Vector3();

        vector.set(
            (e.clientX / window.innerWidth) * 2 - 1,
            - (e.clientY / window.innerHeight) * 2 + 1,
            0.5);

        vector.unproject(camera);

        var dir = vector.sub(camera.position).normalize();

        var distance = - camera.position.z / dir.z;

        var pos = camera.position.clone().add(dir.multiplyScalar(distance));
        mouseX = pos.x;
        mouseY = pos.y;
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
        if (e.keyCode == 38 || e.keyCode == 90) k.keyUp = true
        if (e.keyCode == 40 || e.keyCode == 83) k.keyDown = true
        if (e.keyCode == 37 || e.keyCode == 81) k.keyLeft = true
        if (e.keyCode == 39 || e.keyCode == 68) k.keyRight = true
    });
    window.addEventListener("keyup", function (e) {
        if (e.keyCode == 38 || e.keyCode == 90) k.keyUp = false
        if (e.keyCode == 40 || e.keyCode == 83) k.keyDown = false
        if (e.keyCode == 37 || e.keyCode == 81) k.keyLeft = false
        if (e.keyCode == 39 || e.keyCode == 68) k.keyRight = false
    });
    window.document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        joueur.lightOn = joueur.light.intensity > 0 ? false : true;
    });
    socket.on('touche', function (data) {
        var m = new THREE.MeshLambertMaterial({
            color: 0xff0000
        })
        var s = new THREE.CircleGeometry(1, 6);
        var po = new THREE.Mesh(s, m);
        po.position.x = data.x
        po.position.y = data.y
        po.position.z = 0.1;
        scene.add(po)
        setTimeout(function () {
            scene.remove(po);
        }, 5000)
    });

    window.document.addEventListener('mousedown', function (e) {
        if (e.which == 1)
            joueur.holdFire = true;
    });
    window.document.addEventListener('mouseup', function (e) {
        joueur.holdFire = false;
    });
    window.document.addEventListener('click', function (e) {
        e.preventDefault();


    });

})();