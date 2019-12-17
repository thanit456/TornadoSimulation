
/*
	Three.js "TornadoVR"
	Author: Rodolfo Aramayo
	Date: May 2016
 */
const randomVector3 = function(base, spread)
{
	var rand3 = new THREE.Vector3( Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5 );
	return new THREE.Vector3().addVectors( base, new THREE.Vector3().multiplyVectors( spread, rand3 ) );
}

/////////////////
// TWEEN CLASS //
/////////////////

function Tween(timeArray, valueArray)
{
	this.times  = timeArray || [];
	this.values = valueArray || [];
}

Tween.prototype.lerp = function(t)
{
	var i = 0;
	var n = this.times.length;
	while (i < n && t > this.times[i])  
		i++;
	if (i == 0) return this.values[0];
	if (i == n)	return this.values[n-1];
	var p = (t - this.times[i-1]) / (this.times[i] - this.times[i-1]);
	if (this.values[0] instanceof THREE.Vector3)
		return this.values[i-1].clone().lerp( this.values[i], p );
	else // its a float
		return this.values[i-1] + p * (this.values[i] - this.values[i-1]);
}

// MAIN

// graphics variables (Ray casting) 
var mouseCoords = new THREE.Vector2();
var raycaster = new THREE.Raycaster();
var ballMaterial = new THREE.MeshPhongMaterial( {color: 0x202020 })

// standard global variables
var container, scene, camera, renderer, effect, controls, stats;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();

// custom global variables
var lastFrameTime = new Date().getTime() / 1000;
var totalGameTime = 0;
var dt;
var edt; // effective
var currTime;

// global varibles for tail
var lastCreateTailTime = new Date().getTime() / 1000;
var isCreateTailFrame = true;

// tail global constant
var tailSpawnInterval = 0.02;
var tailLifeSpan = 0.5; 
var tailLifeSpanChaos = 3.0;
var tailMaxLifeSpan = tailLifeSpan + tailLifeSpanChaos;
var tailGeometry = new THREE.BoxGeometry( 5, 5, 5 );
var tailMaterial;

var tracersMesh = [];


var particleTails = []; // flap-tail
var particleTailsReuse = [];
var particleTailsAttribute = {};
var particleTailsGeometry = new THREE.BufferGeometry();
var particleTailsMesh = new THREE.Mesh();

var particleArray = [];
var particleAttribute = {};
var particleGeometry = new THREE.BufferGeometry();
var particleMaterial = new THREE.ShaderMaterial();
var particleMesh = new THREE.Mesh();

var mesh;
//global physics properties
var B = new THREE.Vector3(0,.01,0); //magnetic field
var G = new THREE.Vector3(0.0,-.001,0.0);
var Gravity = new THREE.Vector3(0.0, 0.01,0.0);

//particle properties
var S = new THREE.Vector3(100,0,100);	//position
var V = new THREE.Vector3(0.0,0.1,0.1); //velocity
var M = 1;								//mass
var mesh_falling = false;
var mesh_raising = true;
var mesh_height = 5;

//particle tail properties
// var S = new THREE.Vector3(100,0,100);	//position
// var V = new THREE.Vector3(0.0,0.1,0.1); //velocity
// var M = 1;								//mass
// var mesh_height = 5;

var texture;
var geometry;
var material;

var stereo = false;
var deviceOrientation = false;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var shaderSelection = 4;
var uniforms1, uniforms2;


var stereoFieldParam = getUrlVars()["stereo"];
if ( typeof stereoFieldParam !== 'undefined' && stereoFieldParam != 'undefined' )
{
	stereo = true;		
}
var deviceOrientationFieldParam = getUrlVars()["deviceOrientation"];
if ( typeof deviceOrientationFieldParam !== 'undefined' && deviceOrientationFieldParam != 'undefined' )
{
	deviceOrientation = true;
}

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}
window.mobilecheck = function() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
}



init();
initInput()
animate();
$('body').scrollTop(1);

// FUNCTIONS 		
function init() 
{
	// SCENE
	scene = new THREE.Scene();
	// CAMERA
	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
	var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
	camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
	camera.zoom = 1;
	scene.add(camera);
	if (deviceOrientation)
	{
		camera.position.set(100,20,400);
	}
	else
	{
		camera.position.set(400,200,400);
	}
	camera.lookAt(scene.position);	
	// RENDERER
	if ( Detector.webgl )
		renderer = new THREE.WebGLRenderer( {antialias:true} );
	else
		renderer = new THREE.CanvasRenderer(); 
	
	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
	
	container = document.getElementById( 'ThreeJS' );
	container.appendChild( renderer.domElement );
	// EVENTS
	THREEx.WindowResize(renderer, camera);
	THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });
	// CONTROLS

	if (deviceOrientation)
	{
		controls = new THREE.DeviceOrientationControls( camera );		
	}
	else
	{
		controls = new THREE.OrbitControls( camera, renderer.domElement );	
	}

	
	// STATS
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.bottom = '0px';
	stats.domElement.style.zIndex = 100;
	container.appendChild( stats.domElement );
	// LIGHT
	var light = new THREE.PointLight(0xffffff);
	light.position.set(100,250,100);
	scene.add(light);
	
	// SKYBOX
	var skyBoxGeometry = new THREE.CubeGeometry( 10000, 10000, 10000 );
	var skyBoxMaterial = new THREE.MeshBasicMaterial( { color: 0x9999ff, side: THREE.BackSide } );
	var skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );
	scene.add(skyBox);
	
	////////////
	// CUSTOM //
	////////////
	var gridXZ = new THREE.GridHelper(100, 10);
	gridXZ.setColors( new THREE.Color(0x006600), new THREE.Color(0x006600) );
	gridXZ.position.set( 100,0,100 );
	scene.add(gridXZ);	

	// direction (normalized), origin, length, color(hex)
	var origin = new THREE.Vector3(0+100,0,0+100);
	var terminus  = new THREE.Vector3(B.x+100, B.y+100, B.z+100);
	var direction = new THREE.Vector3().subVectors(terminus, origin).normalize();
	var arrow = new THREE.ArrowHelper(direction, origin, 100, 0x884400);
	scene.add(arrow);

	// particle
	particleGeometry = new THREE.BufferGeometry();
	particleMaterial = new THREE.ShaderMaterial( 
	{
		uniforms: 
		{
			texture:   { type: "t", value: new THREE.TextureLoader().load( 'img/smokeparticle.png' ), },
		},
		vertexShader:   document.getElementById( 'particleVertexShader' ).textContent,
		fragmentShader: document.getElementById( 'particleFragmentShader' ).textContent,
		transparent: true,  alphaTest: 0.5, // if having transparency issues, try including: alphaTest: 0.5, 
		blending: THREE.NormalBlending, depthTest: false
	});
	particleAttribute = {		
		size:  [],
		color: [],
		opacity: [],
		visible: [],
	}
	particleMesh = new THREE.Points();
	
	particleTailsAttribute = {
		position: [],
		size:  [],
		color: [],
		opacity: [],
		visible: [],
	}
	particleTailsMesh = new THREE.Points();
	
	if (stereo)
	{
		effect = new THREE.StereoEffect( renderer, deviceOrientation );
		effect.eyeSeparation = 2;
		effect.setSize( window.innerWidth, window.innerHeight );
	}

	particleOptions = {
		particleCount: 1000,
		deltaTime:20,
		betaX:0.0,
		betaY:0.015,
		betaZ:0.0,
		GX:0.0,
		GY:0.0015,
		GZ:0.0,
		gravity:0.01,
		betaLiftChaos:10,
		height:750,
		heightChaos:250,
		tornadoFactor:15,
		instantRespawn:false,
		tracer:false,

		tailParticleCount: 1000,
		tailSpawnInterval:0.02,
		tailLifeSpan:0.5,
		tailLifeSpanChaos:3.0

	};

	rebuildParticles();

	var gui = new dat.GUI();

	// material (attributes)

	h = gui.addFolder( "Particle Options" );

	h.add( particleOptions, "particleCount", 1, 10000, 1 ).name( "#particles" ).onChange( rebuildParticles );
	h.add( particleOptions, "deltaTime", 1, 1000, 1 ).name( "dt" ).onChange( rebuildParticles );
	h.add( particleOptions, "gravity", 0, 0.1, 0.01 ).name( "Gravity" ).onChange( rebuildParticles );
	h.add( particleOptions, "height", 0, 5000, 1 ).name( "height" ).onChange( rebuildParticles );
	h.add( particleOptions, "heightChaos", 0, 2500, 1 ).name( "heightChaos" ).onChange( rebuildParticles );
	h.add( particleOptions, "instantRespawn" ).name( "instant respawn" ).onChange( rebuildParticles );
	h.add( particleOptions, "tracer" ).name( "show tracer" ).onChange( rebuildParticles );
	// tail
	h.add( particleOptions, "tailParticleCount", 0, 1000, 50 ).name( "tail particle count").onChange( rebuildParticles );
	h.add( particleOptions, "tailSpawnInterval", 0, 1, 0.001 ).name( "tail spawn interval" ).onChange( rebuildParticles );
	h.add( particleOptions, "tailLifeSpan", 0, 20, 0.05 ).name( "tail life span" ).onChange( rebuildParticles );
	h.add( particleOptions, "tailLifeSpanChaos", 0, 20, 0.05 ).name( "tail life span chaos").onChange( rebuildParticles );

	h = gui.addFolder( "Magnetic Field Options" );
	h.add( particleOptions, "betaX", 0, 0.1, 0.01 ).name( "betaX" ).onChange( rebuildParticles );
	h.add( particleOptions, "betaY", 0, 0.1, 0.01 ).name( "betaY" ).onChange( rebuildParticles );
	h.add( particleOptions, "betaZ", 0, 0.1, 0.01 ).name( "betaZ" ).onChange( rebuildParticles );

	h.add( particleOptions, "GX", 0, 0.01, 0.0005 ).name( "beta Lift X" ).onChange( rebuildParticles );
	h.add( particleOptions, "GY", 0, 0.01, 0.0005 ).name( "beta Lift Y" ).onChange( rebuildParticles );
	h.add( particleOptions, "GZ", 0, 0.01, 0.0005 ).name( "beta Lift Z" ).onChange( rebuildParticles );

	h.add( particleOptions, "tornadoFactor", 0, 100, 25 ).name( "Tornado Factor" ).onChange( rebuildParticles );

	h.add( particleOptions, "betaLiftChaos", 1, 50, 1 ).name( "beta Lift Chaos" ).onChange( rebuildParticles );
	
	window.addEventListener( 'resize', onWindowResize, false );
}

function rebuildParticles() {
	// console.log('rebuildParticles' + scene.children);
	
	B.x = particleOptions.betaX;
	B.y = particleOptions.betaY;
	B.z = particleOptions.betaZ;

	G.x = -particleOptions.GX;
	G.y = -particleOptions.GY;
	G.z = -particleOptions.GZ;

	tailLifeSpan = particleOptions.tailLifeSpan;
	tailLifeSpanChaos = particleOptions.tailLifeSpanChaos;
	tailMaxLifeSpan = particleOptions.tailLifeSpan + particleOptions.tailLifeSpanChaos;

	tailSpawnInterval = particleOptions.tailSpawnInterval;
	
	// if (!window.mobilecheck())
	// {

	// }
	
	//remove all particles meshes from the scene
	var children = scene.children;
    for(var i = children.length-1;i>=0;i--){
        var child = children[i];
        if (child.isParticle)
        {
        	scene.remove(child);	
        }        
    };
    for (m of tracersMesh) {
    	scene.remove(m);
    	delete m;
    }
    scene.remove(particleMesh);
    scene.remove(particleTailsMesh);

	initialParticle();	
	initialTail();

}

function initialParticle() {
	let positions = [];
	for (var i = 0; i < particleOptions.particleCount; i++) {
		let position = new THREE.Vector3(-500 + Math.floor((Math.random() * 1000) + 1), 5,  -500 + Math.floor((Math.random() * 1000) + 1));
		positions.push(position.x);
		positions.push(position.y);
		positions.push(position.z);

		particleArray[i] = {
			position: position,
			S: new THREE.Vector3(position.x, position.y, position.z),
			V: new THREE.Vector3(.0, .1, .1),
			M: 1,
			mesh_falling: true,
			mesh_raising: false,
			isParticle: true,
			topCutOff: particleOptions.height + Math.floor((Math.random() * particleOptions.heightChaos) + 1),
			tempG:  new THREE.Vector3(G.x,G.y - Math.floor((Math.random()*particleOptions.betaLiftChaos) - particleOptions.betaLiftChaos/2.0) * .00001, G.z),// -.001

			size: 80 + 100 * (Math.random() - 0.5),
			opacity: 1.0,
		};
		
		particleAttribute.size[i] = particleArray[i].size;
		particleAttribute.opacity[i] = particleArray[i].opacity;
	}

	particleGeometry = new THREE.BufferGeometry();
	particleGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
	particleGeometry.setAttribute( 'size', new THREE.Float32BufferAttribute( particleAttribute.size, 1 ).setUsage( THREE.DynamicDrawUsage ) );
	particleGeometry.setAttribute( 'opacity', new THREE.Float32BufferAttribute( particleAttribute.opacity, 1 ).setUsage( THREE.DynamicDrawUsage ) );

	particleMesh = new THREE.Points( particleGeometry, particleMaterial );
	particleMesh.dynamic = true;
	particleMesh.sortParticles = true;

	// console.log(particleMesh);
	
	scene.add(particleMesh);
}

function initialTail() {
	for (let i=0;i<particleOptions.tailParticleCount;i++) {
		particleTailsReuse[i] = i;

		particleTails[i] = {
			position: new THREE.Vector3(.1, .1, .1),
			size: 0.0,
			opacity: 0.0,
		}
		particleTailsAttribute.position[(i * 3) + 0] = particleTails[i].position.x;
		particleTailsAttribute.position[(i * 3) + 1] = particleTails[i].position.y;
		particleTailsAttribute.position[(i * 3) + 2] = particleTails[i].position.z;
		particleTailsAttribute.size[i] = particleTails[i].size;
		particleTailsAttribute.opacity[i] = particleTails[i].opacity;
	}

	particleTailsGeometry = new THREE.BufferGeometry();
	particleTailsGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( particleTailsAttribute.position, 3 ) );
	particleTailsGeometry.setAttribute( 'size', new THREE.Float32BufferAttribute( particleAttribute.size, 1 ).setUsage( THREE.DynamicDrawUsage ) );
	particleTailsGeometry.setAttribute( 'opacity', new THREE.Float32BufferAttribute( particleAttribute.opacity, 1 ).setUsage( THREE.DynamicDrawUsage ) );

	particleTailsMesh = new THREE.Points( particleTailsGeometry, particleMaterial );
	particleTailsMesh.dynamic = true;
	particleTailsMesh.sortParticles = true;
	scene.add(particleTailsMesh);
}

function initInput() {
	window.addEventListener('mousedown', function(event) {
		mouseCoords.set(
			// ! fix ray casting to pointing to ground
			( event.clientX / window.innerWidth ) * 2 - 1,
			- ( event.clientY / window.innerHeight ) * 2 + 1
		)

		raycaster.setFromCamera( mouseCoords, camera);

		var intersects = raycaster.intersectObjects( scene.children );

		this.console.log("Object : ");
		var minDistance = Number.MAX_VALUE;
		var nearestPoint = THREE.Vector3(0, 0, 0);
		for ( var i = 0; i < intersects.length; i++ ) {
			if (intersects[i].distance < minDistance) {
				minDistance = intersects[i].distance;
				nearestPoint = intersects[i].point;
			} 
			// console.log('Data : ', intersects[i].point);
			// console.log("Nearest point : ",nearestPoint);

			/*
				An intersection has the following properties :
					- object : intersected object (THREE.Mesh)
					- distance : distance from camera to intersection (number)
					- face : intersected face (THREE.Face3)
					- faceIndex : intersected face index (number)
					- point : intersection point (THREE.Vector3)
					- uv : intersection point in the object's UV coordinates (THREE.Vector2)
			*/
		}
		// console.log("Nearest point : ",nearestPoint);
		// Creates a ball and throws it
		var cubeGeometry = new THREE.CubeGeometry( 20, 20, 20 );
		var cubeMaterial = new THREE.MeshBasicMaterial( { color: 0x2222ff } );
		var cube = new THREE.Mesh( cubeGeometry, cubeMaterial );
		
		// cube.position.x = ( raycaster.ray.direction.x + raycaster.ray.origin.x );
		// cube.position.y = ( raycaster.ray.direction.y + raycaster.ray.origin.y );
		// cube.position.z = ( raycaster.ray.direction.z + raycaster.ray.origin.z );

		cube.position.x = nearestPoint.x;
		cube.position.y = nearestPoint.y;
		cube.position.z = nearestPoint.z;

		

		cube.S = new THREE.Vector3(cube.position);	//position
		// this.console.log(raycaster.ray.origin);
		// this.console.log(raycaster.ray.direction);
		
		
		cube.V = new THREE.Vector3(0.0,0.1,0.1);//Math.floor((Math.random() * 1))-0.5,Math.floor((Math.random() * 1))-0.5); //velocity
		cube.M = 10;								//mass
		cube.mesh_falling = true;
		cube.mesh_raising = false;
		cube.isParticle = true;
		cube.topCutOff = particleOptions.height + Math.floor((Math.random() * particleOptions.heightChaos) + 1)
		//G is the raising velocity and makes a great tornado when its randomness is varied
		//tempG just holds individual values for each particle
		cube.tempG = new THREE.Vector3(G.x,G.y - Math.floor((Math.random()*particleOptions.betaLiftChaos) - particleOptions.betaLiftChaos/2.0) * .0001, G.z);// -.001
		scene.add(cube);

	// scene.add(cube);o.btVector3( pos.x, pos.y, pos.z ) );

	})
}

function onWindowResize() {

	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	// if (deviceOrientation)
	// {

	// }
	// else
	// {
	// 	// *** OTHER CONTROLS WILL NEED THIS!!! ***
	// 	//controls.handleResize(); OrbitControls do not have this function 
	// }

	if (stereo)
	{
		effect.setSize( window.innerWidth, window.innerHeight );
		renderer.setSize( window.innerWidth, window.innerHeight );
	}
	else
	{
		renderer.setSize( window.innerWidth, window.innerHeight );
	}
}

function animate() 
{
    requestAnimationFrame( animate );
	render();		
	update();
}

function update()
{

	currTime = new Date().getTime() / 1000;
	dt = currTime - (lastFrameTime || currTime);
	edt = dt*particleOptions.deltaTime;
    //console.log(dt);
    totalGameTime += dt;
	lastFrameTime = currTime;

	if((currTime - lastCreateTailTime) > tailSpawnInterval)
	{
		lastCreateTailTime = lastFrameTime;
		isCreateTailFrame = true;
	}
	else
	{
		isCreateTailFrame = false;
	}
	
	updateParticle();
	updateParticleTail();

	
	//------
	// Enable these 3 lines to show a tracer of the last particle stored into mesh
	if (particleOptions.tracer)
	{
		mesh = new THREE.Mesh( geometry, material );
		mesh.position.set(Snew.x, Snew.y, Snew.z);
		tracersMesh.push(mesh);
		scene.add(mesh);
	}
	else {
		for(mesh of tracersMesh) {
			scene.remove(mesh);
			delete mesh;
		}
	}
	//------
	
	// if ( keyboard.pressed("z") ) 
	// {	// do something   
	// 	console.log("pressed Z");
	// 	mesh = new THREE.Mesh( new THREE.BoxGeometry(20, 5, 20), material3 );//THREEx.Crates.createCrate1();   //
	// 	mesh.position.set(-500 + Math.floor((Math.random() * 1000) + 1), 5,  -500 + Math.floor((Math.random() * 1000) + 1));
	// 	scene.add(mesh);

	// 	mesh.S = new THREE.Vector3(mesh.position.x, mesh.position.y, mesh.position.z);	//position
	// 	mesh.V = new THREE.Vector3(0.0,0.1,0.1);//Math.floor((Math.random() * 1))-0.5,Math.floor((Math.random() * 1))-0.5); //velocity
	// 	mesh.M = 3;								//mass
	// 	mesh.mesh_falling = true;
	// 	mesh.mesh_raising = false;
	// 	mesh.isParticle = true;
	// 	mesh.topCutOff = particleOptions.height + Math.floor((Math.random() * particleOptions.heightChaos) + 1)
	// 	//G is the raising velocity and makes a great tornado when its randomness is varied
	// 	//tempG just holds individual values for each particle
	// 	mesh.tempG = new THREE.Vector3(G.x,G.y - Math.floor((Math.random()*particleOptions.betaLiftChaos) - particleOptions.betaLiftChaos/2.0) * .0001, G.z);// -.001
		
	// 	particles.push(mesh);
	// }
	
	//console.log('(' + Snew.x + "," + Snew.y + "," + Snew.z );

	controls.update();
	stats.update();
}

function createParticleTail( particle_cloud ) // flap - create tail for particle
{
	function min(a, b) {
		return (a> b)? b : a;
	}
	function max(a, b) {
		return (a < b)? b : a;
	}
	let positions = particleTailsMesh.geometry.attributes.position.array;
	let opacitys = particleTailsMesh.geometry.attributes.opacity.array;
	let sizes = particleTailsMesh.geometry.attributes.size.array;

	let i = particleTailsReuse[0];
	let particle = particleTails[i];

	// console.log (particle);
	if (particle) {
		particle.position.x = particle_cloud.position.x;
		particle.position.y = particle_cloud.position.y;
		particle.position.z = particle_cloud.position.z;

		particle.size = particle_cloud.size;
		particle.opacity = 1.0;
		particle.alive = tailLifeSpan + (Math.random() * tailLifeSpanChaos);

		positions[ (i * 3) + 0 ] = particle.position.x;
	    positions[ (i * 3) + 1 ] = particle.position.y;
	    positions[ (i * 3) + 2 ] = particle.position.z;

		opacitys[i] = particle.opacity;
		sizes[i] = particle.size;

		particleTailsReuse.splice(0, 1);
		particleTailsMesh.geometry.attributes.position.needsUpdate = true;
		particleTailsMesh.geometry.attributes.opacity.needsUpdate = true;
		particleTailsMesh.geometry.attributes.size.needsUpdate = true;
	  	particleTailsMesh.geometry.setDrawRange(0, particleTails.length);
	}
}

function updateParticle() {
	let positions = particleMesh.geometry.attributes.position.array;
	let opacitys = particleMesh.geometry.attributes.opacity.array;

	for (let i=0; i<particleArray.length; i++)
	{
		let particle = particleArray[i];
		var F = new THREE.Vector3(0,0,0);
		var A = new THREE.Vector3(0,0,0);
		var Vnew = new THREE.Vector3(0,0,0); //Velocity at t+dt
		var Snew = new THREE.Vector3(0,0,0); //Position at t+dt

		// (100, 0, 100) is center
		if (Math.abs(particle.S.x-100) < 10 && Math.abs(particle.S.y-5) < 10 && Math.abs(particle.S.z-100) < 10 && particle.mesh_falling == true)
		{
			opacitys[i] = 1.0;

			// A.x = 0;
			// A.y = 0;
			// A.z = 0;
			particle.mesh_falling = false;
			particle.mesh_raising = true;
			//Controlling the Vx when raising gives us a cool variable magnetic function 
			//50 = tornado level 5 
			//10 = tornado level 1
			particle.V.x = 0.01 + Math.floor((Math.random() * particleOptions.tornadoFactor) + 1) * 0.1;
			particle.V.y = 0.0;
			particle.V.z = 0.01 + Math.floor((Math.random() * particleOptions.tornadoFactor) + 1) * 0.1;
		
		}

	   	if (particle.S.y > particle.topCutOff && particle.mesh_falling == false)
	   	{
	   		particle.mesh_falling = true;
	   		particle.mesh_raising = false;

	   		opacitys[i] = 0.0;
	   	}
	   	

		if (particle.mesh_raising)
		{
			F.crossVectors( particle.V , B); 			// F = (VxB)
			F.addVectors(F, particle.tempG);
		}	
		else
		{
			if (particle.position.y > mesh_height && particle.mesh_falling)
			{
				F.addVectors(F, Gravity);
			}
			else
			{
				// suck to tornado base
				particle.V = new THREE.Vector3(80-particle.position.x+Math.floor((Math.random() * 40) + 1), 0, 80-particle.position.z+Math.floor((Math.random() * 40) + 1));
				particle.V.normalize();
				particle.V.multiplyScalar(1);
				particle.S.y = mesh_height;
				particle.position.y = mesh_height;

				//----------
				//Use these two lines to make the tornado infinite without suction
				if (particleOptions.instantRespawn)
				{
					particle.S.set(60 + Math.floor((Math.random() * 80) + 1), 5,  60 + Math.floor((Math.random() * 80) + 1));
					particle.position.set(60 + Math.floor((Math.random() * 80) + 1), 5,  60 + Math.floor((Math.random() * 80) + 1));
				}
				//----------

			}
		}

		F.multiplyScalar(-1); //negative charge
		F.multiplyScalar(1/particle.M); //just 1
		A.copy(F); 	// A = F/M
		
		A.multiplyScalar(edt);
		 
		Vnew.addVectors(particle.V, A);
		particle.V.copy(Vnew);  

		particle.S.add(new THREE.Vector3(Vnew.x*edt, Vnew.y*edt, Vnew.z*edt));
		
		Snew.copy(particle.S); 	

	   	particle.position.x = Snew.x;
	   	particle.position.y = Snew.y;
	   	particle.position.z = Snew.z;

	   	positions[ (i * 3) + 0 ] = Snew.x;
	    positions[ (i * 3) + 1 ] = Snew.y;
	    positions[ (i * 3) + 2 ] = Snew.z;
		
		//create tail
		if (isCreateTailFrame && particle.mesh_raising)
		{
			let a = (Math.random() * 5);
			if (a > 4.5)
				createParticleTail(particle);
		}

	}

	particleMesh.geometry.attributes.position.needsUpdate = true;
	particleMesh.geometry.attributes.opacity.needsUpdate = true;
  	particleMesh.geometry.setDrawRange( 0, positions.length ); 
}

function updateParticleTail()
{
	let opacitys = particleTailsMesh.geometry.attributes.opacity.array;
	let sizes = particleTailsMesh.geometry.attributes.size.array;

	for(let i=0;i<particleTails.length;i++) {
		var particle = particleTails[i];
		particle.alive -= dt;
		// remove
		if( particle.alive < 0 )
		{
			particle.opacity = 0.0;
			particleTailsReuse.push(i);
		}
		else {
			var ms = (particle.alive) / tailMaxLifeSpan;
			particle.opacity = ms;
			particle.size = particle.size * ms;

		}

		opacitys[i] = particle.opacity;
		// sizes[i] = particle.size;
	}

	particleTailsMesh.geometry.attributes.opacity.needsUpdate = true;
	// particleTailsMesh.geometry.attributes.size.needsUpdate = true;
  	particleTailsMesh.geometry.setDrawRange( 0,  particleTails.length); 
}

if (window.mobilecheck())
	performance = null;

function render() 
{
	if (!window.mobilecheck())
	{

		//This function does not work on iOS safari as of Three.js-r76
		var delta = clock.getDelta();

	
	}
	else
	{


	}
	

	
	if (stereo)
	{
		effect.render( scene, camera );
	}
	else
	{
		renderer.render( scene, camera );
	}
}



