
class Segment {
    constructor(p1, p2) {
        this.type = "Segment";
        this.p1 = p1;
        this.p2 = p2;
    }
    getLength() {
        return this.p1.distanceTo(this.p2);
    }
    getAngleToP2() {
        return this.p1.angleTo(this.p2);
    }
    addAngletoP2(angle) {
        var length = this.getLength();
        var newAngle = this.getAngleToP2() + angle;
        this.p2.x = this.p1.x + Math.cos(newAngle) * length;
        this.p2.y = this.p1.y + Math.sin(newAngle) * length;
    }
    getAngleToP1() {
        return this.p2.angleTo(this.p1);
    }
    setLengthP2(length) {
        var angle = this.getAngleToP2();
        this.p2.x = this.p1.x + Math.cos(angle) * length;
        this.p2.y = this.p1.y + Math.sin(angle) * length;
    }
    addLengthP2(length) {
        var angle = this.getAngleToP2();
        var newLength = this.getLength() + length;
        this.p2.x = this.p1.x + Math.cos(angle) * newLength;
        this.p2.y = this.p1.y + Math.sin(angle) * newLength;
    }
    intersectTo(segment) {
        if (segment && segment.type == "Segment") {
            var A1 = this.p2.y - this.p1.y,
                B1 = this.p1.x - this.p2.x,
                C1 = A1 * this.p1.x + B1 * this.p1.y,
                A2 = segment.p2.y - segment.p1.y,
                B2 = segment.p1.x - segment.p2.x,
                C2 = A2 * segment.p1.x + B2 * segment.p1.y,
                denominator = A1 * B2 - A2 * B1;

            if (denominator != 0) {
                var x = (B2 * C1 - B1 * C2) / denominator,
                    y = (A1 * C2 - A2 * C1) / denominator,
                    rx0 = (x - this.p1.x) / (this.p2.x - this.p1.x),
                    ry0 = (y - this.p1.y) / (this.p2.y - this.p1.y),
                    rx1 = (x - segment.p1.x) / (segment.p2.x - segment.p1.x),
                    ry1 = (y - segment.p1.y) / (segment.p2.y - segment.p1.y);
                if (((rx0 >= 0 && rx0 <= 1) || (ry0 >= 0 && ry0 <= 1)) &&
                    ((rx1 >= 0 && rx1 <= 1) || (ry1 >= 0 && ry1 <= 1))) {
                    var Point = require('./Point');
                    return new Point(x, y);
                } else {
                    return false;
                }

            } else {
                return false;
            }
        }
    }
    intersectLineTo(segment) {
        if (segment && segment.type == "Segment") {
            var A1 = this.p2.y - this.p1.y,
                B1 = this.p1.x - this.p2.x,
                C1 = A1 * this.p1.x + B1 * this.p1.y,
                A2 = segment.p2.y - segment.p1.y,
                B2 = segment.p1.x - segment.p2.x,
                C2 = A2 * segment.p1.x + B2 * segment.p1.y,
                denominator = A1 * B2 - A2 * B1;
            if (denominator != 0) {
                var x = (B2 * C1 - B1 * C2) / denominator;
                var y = (A1 * C2 - A2 * C1) / denominator;
                return new Point(x, y);
            } else {
                return false;
            }

        } else {
            return false;
        }
    }
}
module.exports = Segment;