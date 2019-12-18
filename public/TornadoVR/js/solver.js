class Entity {
    mesh;
    position;
    velocity;
    _forceAcc;
    mass;
    isDestroy = false;
    isRaising = false;

    centerOfRotation;

    constructor({mesh, mass, position, velocity, _forceAcc}) {
        this.centerOfRotation = position.clone();
        this.mesh = mesh;
        this.mass = mass;
        this.position = position ? position.clone() : new THREE.Vector3(0, 0, 0);
        this.velocity = velocity ? velocity.clone() : new THREE.Vector3(0, 0, 0);
        this._forceAcc = _forceAcc ? _forceAcc.clone() : new THREE.Vector3(0, 0, 0);
    }

    destroy() {
        this.isDestroy = true;
    }
    
    update(derivative, dt) {
        this.position.add(derivative.position.multiplyScalar(dt));
        this.velocity.add(derivative.velocity.multiplyScalar(dt));
        // this.position.add(derivative.position);
        // this.velocity.add(derivative.velocity);
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
        // if(this.position.length() > 1000)
        //     this.destroy();
    }
}

class RigidBody extends Entity {
    size;
    constructor({mesh, mass, position, velocity, _forceAcc, size}){
        super({mesh, mass, position, velocity, _forceAcc});
        this.size = size;
        this.mesh.position.copy();
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

// assume elasticity
const collide = (e1, e2) => {
    let u1 = e1.velocity;
    let u2 = e2.velocity;
    let m1 = e1.mass;
    let m2 = e2.mass;
    let v1 = (u1.clone().multiplyScalar(m1-m2)).add(u2.clone().multiplyScalar(2*m2)).multiplyScalar(1/(m1+m2));
    let v2 = (u1.clone().multiplyScalar(2*m2)).add(u2.clone().multiplyScalar(m2-m1)).multiplyScalar(1/(m1+m2));
    e1.velocity.set(v1.x, v1.y, v1.z);
    e2.velocity.set(v2.x, v2.y, v2.z);
}


class Solver {
    entities = [];
    derivatives = [];

    particles = [];
    derivatives_particle = [];

    tails = [];

    rigidbodies = [];
    derivatives_rigid = [];

    // gravity
    gravity = new THREE.Vector3(0.0, -9800, 0.0); // gravity too weak
    
    // assist
    vecUp = new THREE.Vector3(0.0, 1.0, 0.0);
    
    // tornado
    tornadoC = new THREE.Vector3(0.0, 0.0, 0.0); //tornado high;
    tornadoBaseR = 100;
    tornadoH = 200;
    tornadoHChaos = 50; 
    Fup = new THREE.Vector3(0.0, 100, 0.0);

    // tail
    lifeChaos = 100;

    defaultTimestep = 1/120; // assume 60 FPS

    tries = 0;
    MAX_TRIES = 10;

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
            
            //parameter // TODO delete
            const suckMag = 100;
            const initVMag = 500;
            const tornadoFactor = 100;

            // vecotor
            const vecPC = this.tornadoC.clone().sub(entity.position);
            vecPC.y = 0;

            const vecPCNorm = (new THREE.Vector3()).copy(vecPC);
            vecPCNorm.normalize();
            const vecT = (new THREE.Vector3()).crossVectors(vecPC, this.vecUp);
            vecT.y = 0;
            vecT.normalize();
            // force
            const Fg = this.gravity.clone();
            Fg.multiplyScalar(entity.mass); 
            
            if (vecPC.length() < this.tornadoBaseR && entity.position.y <= 50 
            && !entity.isRaising)
            {
                entity.isRaising = true;
                entity.velocity.copy(vecT);
                entity.velocity.multiplyScalar(initVMag);
                entity.velocity.y = 0;
                const t = this.tornadoC;
                // console.log(t);
                entity.centerOfRotation.set(t.x, t.y, t.z);
                // entity.destroy()
            }
            
            if (entity.isRaising)
            {
                const h_hmax = entity.position.y / (this.tornadoH) + 0.05 ;

                const vmag = Math.sqrt(Math.pow(entity.velocity.x,2) + Math.pow(entity.velocity.z,2)); 
                const Vnew = vecT.clone().multiplyScalar(vmag);   

                entity.velocity.x = Vnew.x;
                entity.velocity.z = Vnew.z;
                // console.log(entity.position.y);
                const Fup = this.Fup.clone();
                Fup.multiplyScalar(h_hmax)
                dp._forceAcc.add(Fup);
                
                dp._forceAcc.add(vecT.clone().multiplyScalar(Math.random()*tornadoFactor*h_hmax));
                if (entity.position.y > this.tornadoH - Math.random()*this.tornadoHChaos)
                {
                    entity.isRaising = false;
                }                
            }
            else
            {
                dp._forceAcc.add(Fg);
                // suck to tornado base
                if (entity.position.y <= 50)
                {
                    const Fsuck = new THREE.Vector3();
                    Fsuck.copy(vecPCNorm);
                    Fsuck.multiplyScalar(suckMag);
                    dp._forceAcc.add(Fsuck);
                }
            }

            // console.log(dp._forceAcc);
            //if (Math.abs(entity.position.x-this.tornadoBaseR) < 20 &&
            //    Math.abs(entity.position.y))
        });
    }

    calcDerivs() {
        this.derivatives.forEach((dp, idx) => {
            const entity = this.entities[idx];
            dp._forceAcc.multiplyScalar(1/entity.mass);
            dp.velocity.copy(dp._forceAcc);
            dp.position.copy(entity.velocity);
        });
        // this.derivatives_rigid.forEach(dp => {
        //     dp.position = dp.velocity;
        //     dp.velocity = dp._forceAcc.multiplyScalar(1/dp.mass);
        // });
    }
    
    //  It should check with all obstacles
    // intersection(point, otherPoint) {
    //     if (point != )
    // }

    step(dt) { // update derivatives to entities attribute
        // store info for revert
        let hit = false;
        let minHit = dt;
        let minHitParts = {};
        

        // collide ground

        // collision
        if (this.tries < this.MAX_TRIES) {
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
        }

        this.entities.forEach(e => {
            if (e instanceof RigidBody && e.position.y <= e.size/2) {
                e.position = e.size/2;
                const n = new THREE.Vector3(0, 1, 0);
                flip(e.velocity, n, 0.6);
            } else if (e.position < 1) {
                e.position = 2/2;
            }
        })

        this.rigidbodies.forEach((rb, idx) => {
            if (idx != minHitParts.point && idx != minHitParts.otherPoint) {
                const deriv = this.derivatives_rigid[idx];
                rb.update(deriv, minHit);
            }
        });
        
        this.particles.forEach((p, idx) => {
            const deriv = this.derivatives_particle[idx];
            p.update(deriv, minHit);
        })

        this.entities.forEach(e => {
            if (e.isRaising){
                const centerSuck = this.tornadoC.clone().sub(e.centerOfRotation);
                centerSuck.y = 0;
                centerSuck.normalize().multiplyScalar(this.suckMag);
                if (centerSuck.length() > 0.1)
                    console.log(centerSuck);
                e.position.add(centerSuck.multiplyScalar(minHit * 0.02));
            }
        });

        // colliding
        if (minHitParts.point){
            const x1 = this.rigidbodies[minHitParts.point];
            const x2 = this.rigidbodies[minHitParts.otherPoint];
            collide(x1, x2);
    
            this.particles.forEach((part, idx) => {
                const deriv = this.derivatives_particle[idx];
                part.update(deriv, minHit);
            })
            this._update(dt-minHit);
        } else {
            this.entities.forEach(e => {
                if (e.position.y <= 0 && e.velocity.y < 0){
                    e.position.y = 0;
                    const n = new THREE.Vector3(0, 1, 0); // vector along p1 -- p2
                    flip(e.velocity, n, 0.1);
                }
            })
        }

        

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
        this.tries =0 ;
        this._update();
    }

    _update(dt) {
        dt = dt || this.defaultTimestep;
        this.tries++;
        this.clearForces(); // clear old sum force
        this.calcForces(); // calculate new sum force
        this.calcDerivs(); // calc Derivatives
        this.step(dt); // update derivatives to entities
        this.clearDestroyEntity();
    }

}