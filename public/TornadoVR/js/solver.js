class Particle {
    position;
    velocity;
    _forceAcc;
    mass;
    constructor({mass, position, velocity, _forceAcc}) {
        this.mass = mass;
        this.position = position ? new THREE.Vector3().copy(position) : new THREE.Vector3(0, 0, 0);
        this.velocity = velocity ? new THREE.Vector3().copy(velocity) : new THREE.Vector3(0, 0, 0);
        this._forceAcc = _forceAcc ? new THREE.Vector3().copy(_forceAcc) : new THREE.Vector3(0, 0, 0);
    }

    update(derivative, deltaT) {
        this.position.add(derivative.position.multiplyScalar(deltaT));
        this.velocity.add(derivative.velocity.multiplyScalar(deltaT));
    }
}

const setVector = (v, x, y, z) => {
    v.x = x;
    v.y = y;
    v.z = z;
}

const addVector = (v, x, y, z) => {
    v.x += x;
    v.y += y;
    v.z += z;
}



class Solver {
    points = [];
    derivatives = [];
    gravity = 9.8;
    defaultTimestep = 1/60; // assume 60 FPS
    B = new THREE.Vector3(0, 1, 0);

    constructor(gravity) {
        this.gravity = gravity || 9.8;
    }

    addParticle(particle) {
        this.points.push(particle);
        this.derivatives.push(new Particle({
            ...particle,
        }));
    }

    clearForces() {
        this.derivatives.forEach(dp => {
            setVector(dp._forceAcc, 0, 0, 0);
        });
    }

    calcForces() {
        this.derivatives.forEach((dp, idx) =>{
            let point = this.points[idx];
            addVector(dp._forceAcc, 0, this.gravity, 0);

            let F = new THREE.Vector3(0, 0, 0);
            
            F.crossVectors(point.velocity, this.B);
            dp._forceAcc.add(F);
        });
    }

    particleDerivs() {
        this.derivatives.forEach(dp => {
            dp.position = dp.velocity;
            dp.velocity = dp._forceAcc.multiplyScalar(1/dp.mass);
        });
    }

    step(deltaT) {
        this.points.forEach((point, idx) => {
            const deriv = this.derivatives[idx];
            point.update(deriv, deltaT || this.defaultTimestep);
        })
    }

    update() {
        this.clearForces();
        this.calcForces();
        this.particleDerivs();
        this.step();
    }

}