var PhysicPoint = require('./PhysicPoint');
class Zombie extends PhysicPoint {
    constructor() {
        super(0, 0, 2.5);
        this.pv = 2;
         this.pvMax = 2;
        this.setNewSpawn();
    }
    checkIsAlive() {
        if (this.pv <= 0) {
            this.pv = this.pvMax;
            this.setNewSpawn();
        }
    }
    take(damage){
        this.pv -= damage;
        this.checkIsAlive();
    }
    setNewSpawn() {
        let rSX = Math.round(Math.random());
        if (rSX == 0) rSX = -1;
        let rSY = Math.round(Math.random());
        if (rSY == 0) rSY = -1;
        this.x = (Math.random() * 1000 + 1000) * rSX;
        this.y = (Math.random() * 1000 + 1000) * rSY;
    }
}
module.exports = Zombie;