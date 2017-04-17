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
    var ctx = canvas.getContext('2d');


//redefini la taille de la scene
    function resize() {
        canvas.width =  window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    //Ecoute le changement de taille de la fenêtre
    window.addEventListener('resize', resize);
    //var jcv_physics = require('./jcv_physics');
    var p = new jcv_physics.Point(20,20,20);
    var p2 = new jcv_physics.Point(200,200,20);
    var s = new jcv_physics.Segment(
        new jcv_physics.Point(300,100),
        new jcv_physics.Point(200,150)
    );
    function animate() {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        p.x = mouseX;
        p.y = mouseY;
        p.draw(ctx);
        p2.draw(ctx);
        s.draw(ctx);
        if(p.collisionTo(p2) ){
            p.color = "red";
        }else{
            p.color = "grey";  
        }
        var intersect =p.collisionTo(s,ctx)
        var testinter = p.inteceptLineSeg(s);
        if(testinter.length > 0){
        console.log(testinter);
            for(var index in testinter){
                var pinter = new jcv_physics.Point(testinter[index].x,testinter[index].y,5);
                pinter.draw(ctx);
            }
        }
        if(intersect){
            p.color = "red";  
        }
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
    //controle

    window.addEventListener('mousemove',function(e){
        mouseX = e.clientX;
        mouseY = e.clientY;
    })
})();