/// <reference path="../../typings/index.d.ts" />
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
    //var profo = 10;
    var camera = new THREE.PerspectiveCamera(100, aspect, 0.1, 1000);
    //var camera = new THREE.OrthographicCamera(window.innerWidth / - profo, window.innerWidth / profo, window.innerHeight / profo, window.innerHeight / - profo, 1, 1000);
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
    var personnages = {};
    class Personnage {
        constructor(socket) {
            this.socket = socket;
            this.color = Math.random()* 0x777777 + 0x999999;
            this.x = Math.random() * 100;
            this.y = Math.random() * 100;
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
            this.lightOn = true;
            this.light.position.set(this.x, this.y, 10);
            this.light.color.setHex(this.color);
            this.light.shadow.mapSize.width = 2048;
            this.light.shadow.mapSize.height = 2048;
            this.light.shadow.camera.near = 10;
            this.light.shadow.camera.far = 40;
            this.light.shadow.camera.fov = 30;
            this.light.target = this.cursor;
            scene.add(this.light);
            personnages[this.socket] = this;
        }
        remove(){
            scene.remove(this.light);
            scene.remove(this.cursor);
            scene.remove(this.player);
            delete personnages[this.socket];
        }
        send(){
            socket.emit('personnage_position',{
                x : this.player.position.x,
                y : this.player.position.y,
                cursorX: this.cursor.position.x,
                cursorY: this.cursor.position.y,
                lightOn: this.lightOn
            });
        }
        receive(data){
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
    socket.on('player_socket',function(socket){
        joueur = new Personnage(socket);
    })
    socket.on('new_player',function(data){
        new Personnage(data.socketId);
    });
    socket.on('player_left',function(data){
        personnages[data.socketId].remove();
    });
    //reception des données multiplayer
    socket.on('receive_players',function(data){
        for(var pls in data){
            if(pls != joueur.socket){
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
        this.callback = callback;
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
    if(joueur){
        new AddHelper('player X', function () { return joueur.cursor.position.x; });
        new AddHelper('player Y', function () { return joueur.cursor.position.y; });

    }
    new AddHelper('distancemouse', function () { return distanceMouse; });

    var target = new jcv_physics.Point(0, 0);
    var mouseCursor = new jcv_physics.Point(0, 0);
    var vectorTarget = new jcv_physics.Vector(0, 0);
    var distanceMouse = 0;

    //La boucle d'animation
    var vectorShoot = new jcv_physics.Vector(0, 0);
    function animate() {
        for (var h in helpers) {
            helpers[h].update();
        }
        if(joueur){
            //activact keys
            k.action();
            //camera follow
            camera.position.x = joueur.player.position.x * 0.96 + joueur.cursor.position.x / 25;
            camera.position.y = joueur.player.position.y * 0.96 + joueur.cursor.position.y / 25;
            camera.lookAt(new THREE.Vector3(camera.position.x, camera.position.y, 0));

            distanceMouse = new jcv_physics.Point(
                joueur.cursor.position.x,
                joueur.cursor.position.y
            ).distanceTo(
                new jcv_physics.Point(
                    joueur.player.position.x,
                    joueur.player.position.y
                ));
            joueur.light.angle = 1.5 / (1 + distanceMouse / 300);
            joueur.light.distance = 40 * (1 + distanceMouse / 300);
            //flashLight open effect
            for(var socketP in personnages){
            
                if (personnages[socketP].lightOn && personnages[socketP].light.intensity < 1) {
                    personnages[socketP].light.intensity += 0.002;
                }
            }
            //position de la lumiere
            mouseCursor.x = joueur.player.position.x + mouseX - (window.innerWidth * 0.5);
            mouseCursor.y = joueur.player.position.y - mouseY + (window.innerHeight * 0.5);

            vectorTarget.setLength(target.distanceTo(mouseCursor) / 40);
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
    //la boucle Multiplayer
    setInterval(function(){
        if(joueur)joueur.send();
    },50)
    //CONTROLES
    canvas.addEventListener("mousemove", function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    var Key = function () {
        this.keyUp = false;
        this.keyDown = false;
        this.keyLeft = false;
        this.keyRight = false;
        //this.reset = function(){this = new Key()}
    }
    Key.prototype.action = function () {
        if (this.keyUp) joueur.player.position.y += 1.5;
        if (this.keyDown) joueur.player.position.y -= 1.5;
        if (this.keyLeft) joueur.player.position.x -= 1.5;
        if (this.keyRight) joueur.player.position.x += 1.5;
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
        if (joueur.light.intensity > 0) {
            joueur.light.intensity = 0;
            joueur.lightOn = false;
        } else joueur.lightOn = true;
    });

    window.document.addEventListener('click', function (e) {
        e.preventDefault();
        vectorShoot = new jcv_physics.Vector(
            joueur.player.position.x * 0.96 + joueur.cursor.position.x / 25,
            joueur.player.position.y * 0.96 + joueur.cursor.position.y / 25
        );
        var p = new Personnage("test");
        setTimeout(function(){
            var data = {
                x : 0,
                y : 0,
                cursorX: 20,
                cursorY: 20,
            }
            p.receive(data);
            p.remove();
        },5000)
    });
})();