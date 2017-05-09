
class Point {
    constructor(x, y, radius) {
        this.type = "Point";
        this.x = x || 0;
        this.y = y || 0;
        this.radius = radius || 1;
    }
    inteceptLineSeg(line) {
        var a, b, c, d, u1, u2, ret, retP1, retP2, v1, v2;
        v1 = {};
        v2 = {};
        v1.x = line.p2.x - line.p1.x;
        v1.y = line.p2.y - line.p1.y;
        v2.x = line.p1.x - this.x;
        v2.y = line.p1.y - this.y;
        b = (v1.x * v2.x + v1.y * v2.y);
        c = 2 * (v1.x * v1.x + v1.y * v1.y);
        b *= -2;
        d = Math.sqrt(b * b - 2 * c * (v2.x * v2.x + v2.y * v2.y - this.radius * this.radius));
        if (isNaN(d)) { // no intercept
            return false;
        }
        u1 = (b - d) / c;  // these represent the unit distance of point one and two on the line
        u2 = (b + d) / c;
        retP1 = {};   // return points
        retP2 = {}
        ret = []; // return array
        if (u1 <= 1 && u1 >= 0) {  // add point if on the line segment
            retP1.x = line.p1.x + v1.x * u1;
            retP1.y = line.p1.y + v1.y * u1;
            ret[0] = retP1;
        }
        if (u2 <= 1 && u2 >= 0) {  // second add point if on the line segment
            retP2.x = line.p1.x + v1.x * u2;
            retP2.y = line.p1.y + v1.y * u2;
            ret[ret.length] = retP2;
        }
        return ret;
    }
    collisionTo(object) {
        if (object.type == "Point") {
            return this.distanceTo(object) <= this.radius + object.radius;
        } else if (object.type == "Segment") {
            return this.inteceptLineSeg(object);
        }
    }
    translate(vector) {
        this.x = this.x + vector.x;
        this.y = this.y + vector.y;
        return this;
    }
    angleTo(point) {
        return Math.atan2(point.y - this.y, point.x - this.x);
    }

    distanceTo(point) {
        var dx = point.x - this.x,
            dy = point.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
module.exports = Point;