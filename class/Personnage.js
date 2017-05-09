var PhysicPoint = require('./PhysicPoint');
class Personnage extends PhysicPoint {

    constructor(x, y, cursorX, cursorY, lightOn, color) {
        super(x, y, 2.5);
        this.x = x;
        this.y = y;
        this.cursorX = cursorX;
        this.cursorY = cursorY;
        this.lightOn = lightOn;
        this.color = color;
    }
    receive(data) {
        this.x = data.x;
        this.y = data.y;
        this.cursorX = data.cursorX;
        this.cursorY = data.cursorY;
        this.lightOn = data.lightOn;
        this.color = data.color;
    }
    getData(){
        return {
                x: this.x,
                y: this.y,
                cursorX: this.cursorX,
                cursorY: this.cursorY,
                lightOn: this.lightOn,
                color: this.color,
        }
    }
}
module.exports = Personnage;