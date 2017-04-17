class Vector {

    constructor(x, y) {
        this.type = "Vector";
        this.x = x || 0;
        this.y = y || 0;
        this.length = 0;
        this.angle = 0;
        this.update();
    }
    update() {
        this.getLength();
        this.getAngle();
    }
    setLength(length) {
        this.x = Math.cos(this.angle) * length;
        this.y = Math.sin(this.angle) * length;
        this.update();
    }
    getLength() {
        this.length = Math.sqrt(this.x * this.x + this.y * this.y);
        return this.length;
    }
    setAngle(angle) {
        this.x = Math.cos(angle) * this.length;
        this.y = Math.sin(angle) * this.length;
        this.update();
    }
    getAngle() {
        this.angle = Math.atan2(this.y, this.x);
        return this.angle;
    }
    getSegment(point) {
        var Point = require('./Point');
        var Segment = require('./Segment');
        return new Segment(point, new Point(point.x + this.x, point.y + this.y,1));
    }
    /**
     * 
     * @param {Vector} vector 
     */
    add(vector) {
        this.x = this.x + vector.x;
        this.y = this.y + vector.y;
        this.update();
    }
    /**
     * 
     * @param {Vector} vector 
     */
    subtract(vector) {
        this.x = this.x - vector.x;
        this.y = this.y - vector.y;
        this.update();
    }
    /**
     * 
     * @param {Vector} vector 
     */
    multiply(vector) {
        this.x = this.x * vector.x;
        this.y = this.y * vector.y;
        this.update();
    }
    /**
     * 
     * @param {Vector} vector 
     */
    divide(vector) {
        this.x = this.x / vector.x;
        this.y = this.y / vector.y;
        this.update();
    }
}
module.exports = Vector;