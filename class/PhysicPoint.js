var Point = require('./Point');
var Vector = require('./Vector');
var CircleVector = require('./CircleVector');
class PhysicPoint extends Point {

    constructor(x, y, r) {
        super(x, y, r);
        this.velocity = new Vector(0, 0);
        this.friction = new Vector(1, 1);
        this.bounce = 1;
        this.mass = 1;
        this.rotation = 0;
        this.color = "black";
        this.circleMovement = new CircleVector(this.rotation, this.radius);
        this.rotateFriction = 1;
    }
    update() {
        this.circleMovement.multiply(this.rotateFriction);
        this.rotation = this.circleMovement.angle;
        this.velocity.multiply(this.friction);
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
    gravitateTo(p2) {
        //todo
        var grav = new Vector(0, 0),
            dist = this.distanceTo(p2);
        grav.setLength(p2.mass / (dist * dist));
        grav.setAngle(this.angleTo(p2));
        this.velocity.add(grav);
    }
    draw(ctx) {
        this.update();
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fill();
    }

}
module.exports = PhysicPoint;