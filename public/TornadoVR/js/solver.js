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

    update(derivative, dt) {
        this.position.add(derivative.position.multiplyScalar(dt));
        this.velocity.add(derivative.velocity.multiplyScalar(dt));
    }
}

class RigidBody {
    position;
    velocity;
    _forceAcc;
    mass;
    size;
    constructor({mass, position, velocity, _forceAcc, size}) {
        this.mass = mass;
        this.position = position ? new THREE.Vector3().copy(position) : new THREE.Vector3(0, 0, 0);
        this.velocity = velocity ? new THREE.Vector3().copy(velocity) : new THREE.Vector3(0, 0, 0);
        this._forceAcc = _forceAcc ? new THREE.Vector3().copy(_forceAcc) : new THREE.Vector3(0, 0, 0);
        this.size = size;
    }
    update(derivative, dt) {
        this.position.add(derivative.position.multiplyScalar(dt));
        this.velocity.add(derivative.velocity.multiplyScalar(dt));
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
    rigidbodies = [];
    derivatives_rigid = [];
    derivatives = [];
    gravity = 9.8;
    defaultTimestep = 1/60; // assume 60 FPS
    B = new THREE.Vector3(0, 0.1, 0);

    constructor(gravity) {
        this.gravity = gravity || 9.8;
    }

    addParticle(particle) {
        this.points.push(particle);
        this.derivatives.push(new Particle({
            ...particle,
        }));
    }

    addRigidBody(rigidbody) {
        this.rigidbodies.push(rigidbody);
        this.derivatives_rigid.push(new RigidBody({
            ...rigidbody,
        }));
    }

    clearForces() {
        this.derivatives.forEach(dp => {
            setVector(dp._forceAcc, 0, 0, 0);
        });
        this.derivatives_rigid.forEach(dp => {
            setVector(dp._forceAcc, 0, 0, 0);
        });
    }


    intersection(obj1, obj2) {
        let type1 = Object.prototype.toString.call(obj1);
        let type2 = Object.prototype.toString.call(obj2);


        // TEMP code
        if (obj1.position.distanceTo(obj2.position)) {

        }    
    
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

    calcForces_rigid() {
        this.derivatives_rigid.forEach((dp, idx) =>{
            let rigidbody = this.rigidbodies[idx];
            addVector(dp._forceAcc, 0, this.gravity, 0);

            let F = new THREE.Vector3(0, 0, 0);
            
            F.crossVectors(rigidbody.velocity, this.B);
            dp._forceAcc.add(F);
        });

        

    }


    particleDerivs() {
        this.derivatives.forEach(dp => {
            dp.position = dp.velocity;
            dp.velocity = dp._forceAcc.multiplyScalar(1/dp.mass);
        });

        this.derivatives_rigid.forEach(dp => {
            dp.position = dp.velocity;
            dp.velocity = dp._forceAcc.multiplyScalar(1/dp.mass);
        });
    }
    
    // // It should check with all obstacles
    // intersection(point, otherPoint) {
    //     if (point != )
    // }

    step(dt) {
        dt = dt || this.defaultTimestep;
        this.points.forEach((point, idx) => {
            const deriv = this.derivatives[idx];
            point.update(deriv, dt);
            // this.points.forEach((otherPoint, i) => {
            //     if (intersection(point, otherPoint)) {

            //     }
            // })
        })
    }

    update() {
        this.clearForces();
        this.calcForces();
        this.particleDerivs();
        this.step();
    }

}