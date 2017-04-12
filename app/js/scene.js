/// <reference path="../../typings/index.d.ts" />
(function() {
    'use strict';
    /**
     * @type {WebSocket}
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
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    //Creation de la camera
    var aspect = window.innerWidth / window.innerHeight;
    var camera = new THREE.PerspectiveCamera(100, aspect, 0.1, 1000);
    camera.position.set(0, 0, 40);
    camera.lookAt(new THREE.Vector3(0, 0, 0))

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

    //Création du joueur
    var sphere = new THREE.SphereGeometry(1.5, 20, 20);
    var material = new THREE.MeshLambertMaterial({ color: 0xffffff });
    var player = new THREE.Mesh(sphere, material);
    player.castShadow = true;
    player.receiveShadow = true;
    scene.add(player);

    for (var i = 0; i < 50; i++) {
        var size = Math.random() * 4
        var geometry = new THREE.BoxGeometry(size + 1, size + 1, Math.random() * 10 + 3);
        var material = new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff });
        var cube = new THREE.Mesh(geometry, material);
        cube.position.x = Math.random() * 150 - 75;
        cube.position.y = Math.random() * 150 - 75;
        cube.castShadow = true;
        cube.receiveShadow = true;
        scene.add(cube);

    }


    var cursor = new THREE.Object3D();
    cursor.position.set()
    scene.add(cursor);
    //Création de la lumiere
    var light = new THREE.SpotLight(0xffffff, 1, 40, 1.50, 0.7, 1);
    var lightOn = true;
    light.castShadow = true; // default false
    //Set up shadow properties for the light
    light.position.set(0, 0, 10);
    light.target = cursor;
    light.color.setHex(0xffffff);
    light.shadow.mapSize.width = 4048;
    light.shadow.mapSize.height = 4048;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 40;
    light.shadow.camera.fov = 1;
    scene.add(light);

    //Le Sol
    var texture = new THREE.TextureLoader().load('images/stone.png', function(texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.offset.set(0, 0);
        texture.repeat.set(5, 5);
    });

    var groundMat = new THREE.MeshPhongMaterial({
        map: texture,
        specular: 0x000000,
        shininess: 1
    });
    var groundGeo = new THREE.PlaneGeometry(600, 600);
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.doubleSided = true;
    ground.receiveShadow = true;
    scene.add(ground);

    var size = 500,
        step = 30;
    var grid = new THREE.Geometry();
    for (var i = -size; i <= size; i += step) {
        grid.vertices.push(new THREE.Vector3(-size, i, 0.1));
        grid.vertices.push(new THREE.Vector3(size, i, 0.1));
        grid.vertices.push(new THREE.Vector3(i, -size, 0.1));
        grid.vertices.push(new THREE.Vector3(i, size, 0.1));
    }
    var white_mat = new THREE.LineBasicMaterial({ color: 0x101010 });
    white_mat.opacity = 0.01;
    var line = new THREE.LineSegments(grid, white_mat);
    scene.add(line);

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
    AddHelper.prototype.update = function() {
        this.p.textContent = this.label + ' : ' + this.callback();
    }
    new AddHelper('player X', function() { return player.position.x; });
    new AddHelper('player Y', function() { return player.position.y; });
    new AddHelper('cursor', function() { return target.distanceTo(mouseCursor); });



    var target = new jcv_physics.Point(0, 0);
    var mouseCursor = new jcv_physics.Point();
    var vectorTarget = new jcv_physics.Vector(0, 0);

    cursor.position.x = 0;
    cursor.position.y = 0;
    cursor.position.z = 0;

    //La boucle
    function animate() {
        for (var h in helpers) {
            helpers[h].update();
        }
        //activact keys
        k.action();
        //camera follow
        camera.position.x = 0 + player.position.x;
        camera.position.y = 0 + player.position.y;
        //flashLight open effect
        if (lightOn && light.intensity < 1) {
            light.intensity += 0.002;
        }
        //position de la lumiere
        mouseCursor.x = player.position.x + mouseX - (window.innerWidth * 0.5);
        mouseCursor.y = player.position.y - mouseY + (window.innerHeight * 0.5);
        vectorTarget.setLength(target.distanceTo(mouseCursor) / 100);
        vectorTarget.setAngle(target.angleTo(mouseCursor));
        if (target.distanceTo(mouseCursor) > 1) target.translate(vectorTarget);

        cursor.position.x = target.x;
        cursor.position.y = target.y;
        //cursor.position.set( player.position.x + mouseX - (window.innerWidth * 0.5),
        //player.position.y - mouseY + (window.innerHeight * 0.5),
        //0);
        light.position.x = player.position.x;
        light.position.y = player.position.y;
        //rendu de la scene et de la camera
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate)

    //Les Controles
    var Zoom = function() {
        this.x = 0;
        this.y = 0;
    }

    canvas.addEventListener("mousemove", function(e) {
        mouseCursor.x = mouseX = e.clientX;
        mouseCursor.y = mouseY = e.clientY;
    });
    var Key = function() {
        this.keyUp = false;
        this.keyDown = false;
        this.keyLeft = false;
        this.keyRight = false;
        //this.reset = function(){this = new Key()}
    }
    Key.prototype.action = function() {
        if (this.keyUp) player.position.y += 0.5;
        if (this.keyDown) player.position.y -= 0.5;
        if (this.keyLeft) player.position.x -= 0.5;
        if (this.keyRight) player.position.x += 0.5;
    }
    var k = new Key();
    window.addEventListener("keydown", function(e) {
        if (e.keyCode == 38 || e.keyCode == 90) k.keyUp = true
        if (e.keyCode == 40 || e.keyCode == 83) k.keyDown = true
        if (e.keyCode == 37 || e.keyCode == 81) k.keyLeft = true
        if (e.keyCode == 39 || e.keyCode == 68) k.keyRight = true
    });
    window.addEventListener("keyup", function(e) {
        if (e.keyCode == 40 || e.keyCode == 90) k.keyUp = false
        if (e.keyCode == 38 || e.keyCode == 83) k.keyDown = false
        if (e.keyCode == 37 || e.keyCode == 81) k.keyLeft = false
        if (e.keyCode == 39 || e.keyCode == 68) k.keyRight = false
    });
    window.document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        if (light.intensity > 0) {
            light.intensity = 0;
            player.geometry.colors = new THREE.Color(0x555555)
            lightOn = false;
        } else lightOn = true;
    });
})();