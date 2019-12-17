class entity {
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
        this.subUpdate(dt);
        let dP = new THREE.Vector3().copy(derivative.position).multiplyScalar(dt);
        let dV = new THREE.Vector3().copy(derivative.velocity).multiplyScalar(dt);
        this.position.add(dP);
        this.velocity.add(dV);
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
        this.size = size || 1;
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

const flip = (v, dir, elasticity = 1) => {
    let d1 = v.dot(dir);
    v.sub(dir.multiplyScalar(d1*(1+elasticity)))
}

const intersection = (obj1, obj2) => {
    // let type1 = Object.prototype.toString.call(obj1);
    // let type2 = Object.prototype.toString.call(obj2);


    // TEMP code
    return obj1.position.distanceTo(obj2.position) < obj1.size + obj2.size; //     

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


    constructor() {
        
    }

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
        let deriv = new RigidBody({
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
    
    calcForces() {
        // temporary remove gravity
        this.derivatives.forEach((dp, idx) =>{
            let entity = this.entities[idx];
            let F = new THREE.Vector3().copy(this.gravity).multiplyScalar(entity.mass);
            dp._forceAcc.add(F); 
        });
    }

    calcForces_rigid() {

    }


    calcDerivs() {
        this.derivatives.forEach((dp, idx) => {
            const entity = this.entities[idx];
            dp.position.copy(entity.velocity);
            dp.velocity.copy(dp._forceAcc.multiplyScalar(1/dp.mass));
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
        // store info for revert
        let hit = false;
        let minHit = dt;
        let minHitParts = {};
        

        // collide ground

        // collision
        this.rigidbodies.forEach((point, idx) => {
            const deriv = this.derivatives[idx];
            point.update(deriv, dt);
            this.rigidbodies.forEach((otherPoint, idx2) => {
                if (idx == idx2) return; // don't match self
                const otherDeriv = this.derivatives_rigid[idx2];
                if (intersection(point, otherPoint)) {

                    let lo=0, hi=dt, mid;
                    while (hi-lo > 1e-3) { // reasonable difference
                        mid = (lo+hi)/2;
                        point.update(deriv, mid-dt);
                        otherPoint.update(otherDeriv, mid);

                        if (intersection(point, otherPoint)) {

                            hi = mid;
                            hit = true;
                            if (mid < minHit) {
                                minHit = mid;
                                minHitParts = {point: idx, otherPoint: idx2};
                            }
                        } else {
                            lo = mid; 
                        }
                        
                        otherPoint.update(otherDeriv, -mid);
                        point.update(deriv, dt-mid);
                    }
                }
            })
            point.update(deriv, -dt);
        }) 

        this.rigidbodies.forEach((rb, idx) => {
            if (idx == minHitParts.point || idx == minHitParts.otherPoint) {
                const otherPointIdx = idx == minHitParts.point ? minHitParts.otherPoint : minHitParts.point;
                const otherPoint = this.rigidbodies[otherPointIdx];
                const deriv = this.derivatives_rigid[idx];
                const n = new THREE.Vector3().copy(rb.position).sub(otherPoint.position).normalize(); // vector along p1 -- p2
                // rb.update(deriv, minHit);
                flip(rb.velocity, n, 1);
                return;
            }
            const deriv = this.derivatives_rigid[idx];
            rb.update(deriv, minHit);
        });

        // if (hit) {
        //     console.log("min Hit distance is ", minHit);
            
        //     return 
        // } else {
        //     console.log("no hit");
        //     this.rigidbodies.forEach((rb, idx) => {
        //         const deriv = this.derivatives_rigid[idx];
        //         rb.update(deriv, dt);
        //     });
        // }
        //

        // REAL CONSTRAINT !!
        this.entities.forEach(e => {
            if (e.position.y <= 0){
                const n = new THREE.Vector3(0, 1, 0); // vector along p1 -- p2
                flip(e.velocity, n, 0.7);
            }
        })
    }

    update() {
        this.clearForces(); // clear old sum force
        this.calcForces(); // calculate new sum force
        this.calcDerivs(); // calc Derivatives
        this.step(); // update derivatives to entities
    }

}