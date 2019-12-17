class Entity {
    mesh;
    position;
    velocity;
    _forceAcc;
    mass;
    isDestroy = false;
    constructor({mesh, mass, position, velocity, _forceAcc}) {
        this.mesh = mesh;
        this.mass = mass;
        this.position = position ? new THREE.Vector3().copy(position) : new THREE.Vector3(0, 0, 0);
        this.velocity = velocity ? new THREE.Vector3().copy(velocity) : new THREE.Vector3(0, 0, 0);
        this._forceAcc = _forceAcc ? new THREE.Vector3().copy(_forceAcc) : new THREE.Vector3(0, 0, 0);
    }

    destroy() {
        this.isDestroy = true;
    }
    
    update(derivative, dt) {
        this.position.add(derivative.position.multiplyScalar(dt));
        this.velocity.add(derivative.velocity.multiplyScalar(dt));
        this.mesh.position.copy(this.position);
        this.subUpdate(dt);
    }
    
    subUpdate(dt) {}; //for each entity to have it own update
}

class Particle extends Entity {
    constructor({mesh, mass, position, velocity, _forceAcc}){
        super({mesh, mass, position, velocity, _forceAcc});
    }
    subUpdate(dt) {
        if(this.position.y < -500)
            this.destroy();
    }
}

class RigidBody extends Entity {
    size;
    constructor({mesh, mass, position, velocity, _forceAcc, size}){
        super({mesh, mass, position, velocity, _forceAcc});
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

    particles = [];
    derivatives_particle = [];

    rigidbodies = [];
    derivatives_rigid = [];

    // gravity
    gravity = new THREE.Vector3(0.0, -9.8, 0.0);

    // tornado
    tornadoCenter = new THREE.Vector3(0.0, 0.0, 0.0) //tornado high;
    tornadog = 10;
    tornadoB = new THREE.Vector3(0.0, 20, 0.0);

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
        this.particles.push(particle);
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

            const dragConst = -0.001;

            let entity = this.entities[idx];

            // suck by tornado
            let suckForceXZ = (new THREE.Vector3().subVectors(this.tornadoCenter, entity.position)).normalize();
            // lesser by distance
            suckForceXZ.multiplyScalar(5000/Math.pow(this.tornadoCenter.distanceTo(entity.position), 2));
            
            //suckForceXZ.y = 0.0;
            
            let drag = new THREE.Vector3().copy(entity.velocity);
            drag.multiplyScalar(dragConst);

            let suckForceY = (new THREE.Vector3(0, 10, 0));

            let magneticForce = new THREE.Vector3().crossVectors(entity.velocity, this.tornadoB);
            magneticForce.multiplyScalar(-1/5000);

            //if (entity.position.y < this.tornadoCenter.y)
            if (true)
            {
                dp._forceAcc.add(suckForceXZ);
                //dp._forceAcc.add(suckForceY);
                dp._forceAcc.add(magneticForce);
                //dp._forceAcc.add(this.gravity);
                dp._forceAcc.add(drag);
            }
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

    calcDerivs() {
        this.derivatives.forEach((dp, idx) => {
            const entity = this.entities[idx];
            dp.position.copy(entity.velocity);
            dp._forceAcc.multiplyScalar(1/dp.mass);
            dp.velocity.copy(dp._forceAcc);
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

    clearDestroyEntity() {
        for (let i = this.entities.length-1; i >= 0; i--)
        {
            let e = this.entities[i];
            if (e.isDestroy)
            {
                    this.entities.splice(i, 1);
                    this.derivatives.splice(i, 1);
                    scene.remove(e.mesh);
            }
        }

        for (let i = this.particles.length-1; i >= 0; i--)
        {
            let e = this.particles[i];
            if (e.isDestroy)
            {
                    this.particles.splice(i, 1);
                    this.derivatives_particle.splice(i, 1);
            }
        }

        for (let i = this.rigidbodies.length-1; i >= 0; i--)
        {
            let e = this.rigidbodies[i];
            if (e.isDestroy)
            {
                    this.rigidbodies.splice(i, 1);
                    this.derivatives_rigid.splice(i, 1);
            }
        }
    
    }

    update() {
        this.clearForces(); // clear old sum force
        this.calcForces(); // calculate new sum force
        this.calcDerivs(); // calc Derivatives
        this.step(); // update derivatives to entities
        this.clearDestroyEntity();
    }

}