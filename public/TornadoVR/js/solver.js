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

    particles = [];
    derivatives_particle = [];

    rigidbodies = [];
    derivatives_rigid = [];

    // gravity
    gravity = new THREE.Vector3(0.0, -9.8, 0.0);
    B = new THREE.Vector3(0, 20, 0);
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
        this.particles.push(particle);
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
            const entity = this.entities[idx];
            dp._forceAcc.add(this.gravity);

            // B
            let F = new THREE.Vector3(0, 0, 0);
            F.crossVectors(entity.velocity, this.B);
            dp._forceAcc.add(F);
        });
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
                    while (hi-lo > 1e-2) { // reasonable difference
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
                flip(e.velocity, n, 0.3);
            }
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