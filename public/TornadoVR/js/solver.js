class entity {
    mesh;
    position;
    velocity;
    _forceAcc;
    mass;
    constructor({mesh, mass, position, velocity, _forceAcc}) {
        this.mesh = mesh;
        this.mass = mass;
        this.position = position ? new THREE.Vector3().copy(position) : new THREE.Vector3(0, 0, 0);
        this.velocity = velocity ? new THREE.Vector3().copy(velocity) : new THREE.Vector3(0, 0, 0);
        this._forceAcc = _forceAcc ? new THREE.Vector3().copy(_forceAcc) : new THREE.Vector3(0, 0, 0);
    }
    
    update(derivative, dt) {
        this.subUpdate(dt);
        this.position.add(derivative.position.multiplyScalar(dt));
        this.velocity.add(derivative.velocity.multiplyScalar(dt));
    }
    
    subUpdate(dt) {}; //for each entity to have it own update
}

class Particle extends entity {
    constructor({mass, position, velocity, _forceAcc}){
        super({mass, position, velocity, _forceAcc});
    }
}

class RigidBody extends entity {
    size;
    constructor({mass, position, velocity, _forceAcc, size}){
        super({mass, position, velocity, _forceAcc});
        this.size = size;
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
    entities = [];
    derivatives = [];

    particle = [];
    derivatives_particle = [];

    rigidbodies = [];
    derivatives_rigid = [];

    // gravity
    gravity = new THREE.Vector3(0.0, -9.8, 0.0);

    // tornado

    defaultTimestep = 1/60; // assume 60 FPS

    constructor() {}

    addEntity(entity, deriv) {
        this.entities.push(entity);
        this.derivatives.push(deriv);
    }

    addParticle(particle) {
        let deriv = new Particle({
            ...particle,
        })
        this.particle.push(particle);
        this.derivatives_particle.push(deriv);

        this.addEntity(particle, deriv);
    }

    addRigidBody(rigidbody) {
        let deriv = new rigidbody({
            ...rigidbody,
        })
        this.rigidbodies.push(rigidbody);
        this.derivatives_rigid.push(deriv);

        this.addEntity(rigidbody, deriv);
    }

    clearForces() {
        this.derivatives.forEach(dp => {
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
            let entity = this.entities[idx];
            dp._forceAcc.add(this.gravity);
            addVector(dp._forceAcc, 0, this.gravity, 0);

            // B
            // let F = new THREE.Vector3(0, 0, 0);
            // F.crossVectors(point.velocity, this.B);
            // dp._forceAcc.add(F);
        });

        // calculate rigid body force
        /*
        this.derivatives_rigid.forEach((dp, idx) =>{
            let rigidbody = this.rigidbodies[idx];
            addVector(dp._forceAcc, 0, this.gravity, 0);

            let F = new THREE.Vector3(0, 0, 0);
            
            F.crossVectors(rigidbody.velocity, this.B);
            dp._forceAcc.add(F);
        });
        */

    }

    calcForces_rigid() {

    }


    calcDerivs() {
        this.derivatives.forEach(dp => {
            dp.position = dp.velocity;
            dp.velocity = dp._forceAcc.multiplyScalar(1/dp.mass);
        });
        // this.derivatives_rigid.forEach(dp => {
        //     dp.position = dp.velocity;
        //     dp.velocity = dp._forceAcc.multiplyScalar(1/dp.mass);
        // });
    }
    
    // // It should check with all obstacles
    // intersection(point, otherPoint) {
    //     if (point != )
    // }

    step(dt) { // update derivatives to entities attribute
        dt = dt || this.defaultTimestep;
        this.entities.forEach((entity, idx) => {
            const deriv = this.derivatives[idx];
            entity.update(deriv, dt);
            // this.points.forEach((otherPoint, i) => {
            //     if (intersection(point, otherPoint)) {

            //     }
            // })
        })
    }

    update() {
        this.clearForces(); // clear old sum force
        this.calcForces(); // calculate new sum force
        this.calcDerivs(); // calc Derivatives
        this.step(); // update derivatives to entities
    }

}