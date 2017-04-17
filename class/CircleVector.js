const Circle = require('./Circle');
const Vector = require('./Vector');
class CircleVector {
    constructor(angle, radius) {
        this.angle = angle || 0;
        this.radius = radius || 1;
        this.speed = 0;
        this.center = new Point(0, 0);
        this.tanPoint = new Circle(
            Math.cos(this.angle) * this.radius,
            Math.sin(this.angle) * this.radius
        );
    }
    update() {
        if (this.speed > 0.10) {
            var tan = new Vector();
            tan.setLength(this.speed);
            if (this.speed >= 0) {
                tan.setAngle(this.angle + Math.PI * 0.5);
            } else {
                tan.setAngle(this.angle - Math.PI * 0.5);
            }
            var constraint = new Vector();
            constraint.setLength(this.speed * this.speed / this.radius);
            constraint.setAngle(this.angle + Math.PI);
            var direction = tan.add(constraint);
            this.tanPoint = this.tanPoint.translate(direction);
            this.angle = this.center.angleTo(this.tanPoint);

        }
    }
    add(n) {
        this.speed += n;
        this.update();
        return this;
    }
    subtract(n) {
        this.speed -= n;
        this.update();
        return this;
    }
    divide(n) {
        this.speed /= n;
        this.update();
        return this;
    }
    multiply(n) {
        this.speed *= n;
        this.update();
        return this;
    }
}
module.exports = CircleVector;