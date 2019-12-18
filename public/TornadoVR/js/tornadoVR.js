// MAIN

// graphics variables (Ray casting) 
var mouseCoords = new THREE.Vector2();
var raycaster = new THREE.Raycaster();

// standard global variables
var container, scene, camera, renderer, effect, controls, stats;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();

// custom global variables
var totalGameTime = 0.0;
var currFrameTime = 0.0;
var lastFrameTime = 0.0;
var dt = 1/60;

// solver
let solver = new Solver();

// global variable for particle
let particleMassChaos = 0.010;
let particleGenerateRate = 1; // per frame

// particle generate
let lastParticleGenerateTime = 0;

// global varibles for tail
var lastCreateTailTime = new Date().getTime() / 1000;
var isCreateTailFrame = true;

// tail global constant
var tailSpawnInterval = 0.02;
var tailLifeSpan = 0.5; 
var tailLifeSpanChaos = 3.0;
var tailMaxLifeSpan = tailLifeSpan + tailLifeSpanChaos;
var tailGeometry = new THREE.BoxGeometry( 9, 9, 9 );
var tailMaterial;

var tracersMesh = [];
var particles = [];
var particleTails = []; // flap-tail

var mesh;
//global physics properties
var B = new THREE.Vector3(0,.01,0); //magnetic field
var G = new THREE.Vector3(0.0,-.001,0.0);
var Gravity = new THREE.Vector3(0.0, 0.01,0.0);

//particle properties
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

// END MAIN

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
 

	// Ground floor

	let ground_size_x = 500;
	let ground_size_y = 100;

	var gridXZ = new THREE.GridHelper(ground_size_x, ground_size_y);
	gridXZ.setColors( new THREE.Color(0x006600), new THREE.Color(0x006600) );
	gridXZ.position.set( 0,0,0 );
	scene.add(gridXZ);

	var planeGeo = new THREE.PlaneBufferGeometry( ground_size_x * 2, ground_size_y * 10 );
	var planeBottom = new THREE.Mesh( planeGeo, new THREE.MeshPhongMaterial( { color: 0xffffff } ) );
	planeBottom.rotateX( - Math.PI / 2 );
	scene.add( planeBottom );
	
	// var gridXY = new THREE.GridHelper(100, 10);
	// gridXY.position.set( 100,100,0 );
	// gridXY.rotation.x = Math.PI/2;
	// gridXY.setColors( new THREE.Color(0x000066), new THREE.Color(0x000066) );
	// scene.add(gridXY);

	// var gridYZ = new THREE.GridHelper(100, 10);
	// gridYZ.position.set( 0,100,100 );
	// gridYZ.rotation.z = Math.PI/2;
	// gridYZ.setColors( new THREE.Color(0x660000), new THREE.Color(0x660000) );
	// scene.add(gridYZ);
	
	

	// direction (normalized), origin, length, color(hex)
	var origin = new THREE.Vector3(0,0,0);
	var terminus  = new THREE.Vector3(B.x, B.y, B.z);
	var direction = new THREE.Vector3().subVectors(terminus, origin).normalize();
	var arrow = new THREE.ArrowHelper(direction, origin, 100, 0x884400);
	scene.add(arrow);
	
	
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

		tailSpawnInterval:0.02,
		tailLifeSpan:0.5,
		tailLifeSpanChaos:3.0

	};

	uniforms1 = {
		time: { type: "f", value: 1.0 },
		resolution: { type: "v2", value: new THREE.Vector2() }
	};
	uniforms2 = {
		time: { type: "f", value: 1.0 },
		resolution: { type: "v2", value: new THREE.Vector2() },
		texture: { type: "t", value: new THREE.TextureLoader().load( "img/disturb.jpg" ) }
	};
	uniforms2.texture.value.wrapS = uniforms2.texture.value.wrapT = THREE.RepeatWrapping;
	uniforms3 = {
		"uDirLightPos"		: { type: "v3", value: new THREE.Vector3(1,0,0) },
		"uDirLightColor"		: { type: "c" , value: new THREE.Color( 0xeeeeee ) },
		"uAmbientLightColor"	: { type: "c" , value: new THREE.Color( 0x050505 ) },
		"uBaseColor"		: { type: "c" , value: new THREE.Color( 0xff0000 ) }
	};
	uniforms4 = {
		"uDirLightPos"		: { type: "v3", value: new THREE.Vector3(1,0,0) },
		"uDirLightColor"		: { type: "c" , value: new THREE.Color( 0xeeeeee ) },
		"uAmbientLightColor"	: { type: "c" , value: new THREE.Color( 0x050505 ) },
		"uBaseColor"		: { type: "c" , value: new THREE.Color( 0xffffff ) }
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

	if (!window.mobilecheck())
	{
		h = gui.addFolder( "Shader Options" );

		var shaderSelectionController = {
			shader1:function(){ shaderSelection = 0; rebuildParticles();},
			shader2:function(){ shaderSelection = 1; rebuildParticles();},
			shader3:function(){ shaderSelection = 2; rebuildParticles();},
			shader4:function(){ shaderSelection = 3; rebuildParticles();},																														
			shader5:function(){ shaderSelection = 4; rebuildParticles();},
			shader6:function(){ shaderSelection = 5; rebuildParticles();}																														
		};

		h.add(shaderSelectionController,'shader1').name("Monjori Shader");
		h.add(shaderSelectionController,'shader2').name("Shader 2");
		h.add(shaderSelectionController,'shader3').name("Shader 3");
		h.add(shaderSelectionController,'shader4').name("Shader 4");	
		h.add(shaderSelectionController,'shader5').name("Cell shader");	
		h.add(shaderSelectionController,'shader6').name("Flap shader");		
	
	}
	
	window.addEventListener( 'resize', onWindowResize, false );
}

function rebuildParticles() {
	console.log('rebuildParticles' + scene.children);
	
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

	//-----
	//create particles

	//Create
	//THREE.TextureLoader.crossOrigin = '';
	//THREE.ImageUtils.crossOrigin = '';
	texture = new THREE.TextureLoader().load( 'img/crate.gif' );
	geometry = new THREE.BoxGeometry( 10, 10, 10 );

	//------
	//We can't use the cross origin image file on the file:/// during development... 
	if (document.location.href.indexOf("file:///") > -1)
	{
		material = new THREE.MeshLambertMaterial( { color:0xffff00 } );
	}	
	else
	{
		material = new THREE.MeshLambertMaterial( { map:texture, color:0xffff00 } );
	}
	//------
	
	if (!window.mobilecheck())
	{
		//Mobile safari can't handle shader1, shader3, and shader4... shader2 is motionless
		var paramsVertex = [
			'vertexShader',
			'vertexShader',
			'vertexShader',
			'vertexShader',
			'vertexShaderCell',
			'vertexShaderCell'
		];
		var params = [
			[ 'fragment_shader1', uniforms1 ],
			[ 'fragment_shader2', uniforms2 ],
			[ 'fragment_shader3', uniforms1 ],
			[ 'fragment_shader4', uniforms1 ],
			[ 'fragment_shaderCell', uniforms3 ],
			[ 'fragment_shaderTail', uniforms4 ]
		];

		const loadMaterial = ( selection ) => new THREE.ShaderMaterial({
			uniforms: params[ selection ][ 1 ],
			vertexShader: document.getElementById( paramsVertex[ selection ] ).textContent,
			fragmentShader: document.getElementById( params[ selection ][ 0 ] ).textContent
		});
		material = loadMaterial( shaderSelection );
		material2 = loadMaterial ( 1 );
		material3 = loadMaterial ( 2 );

		tailMaterial = loadMaterial(5); 
	}
	
	
	//Sphere
	//geometry = new THREE.SphereGeometry( 1, 32, 16 );
	//material = new THREE.MeshLambertMaterial( { color: 0x000088 } );

	//remove all particles meshes from the scene
	
	
	// clear entity
	for (const entity of solver.entities)
	{
		scene.remove(entity.mesh);
	}

	// set new solver
	solver = new Solver();  
	
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
		console.log("Nearest point : ",nearestPoint);
		// Creates a ball and throws it
		let cube_size = 20;
		var cubeGeometry = new THREE.CubeGeometry( cube_size, cube_size, cube_size );
		var cubeMaterial = new THREE.MeshBasicMaterial( { color: 0x2222ff } );
		var cube = new THREE.Mesh( cubeGeometry, cubeMaterial );
		
		// cube.position.x = ( raycaster.ray.direction.x + raycaster.ray.origin.x );
		// cube.position.y = ( raycaster.ray.direction.y + raycaster.ray.origin.y );
		// cube.position.z = ( raycaster.ray.direction.z + raycaster.ray.origin.z );

		cube.position.x = nearestPoint.x;
		cube.position.y = nearestPoint.y + cube_size / 2;
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

	if (deviceOrientation)
	{

	}
	else
	{
		// *** OTHER CONTROLS WILL NEED THIS!!! ***
		//controls.handleResize(); OrbitControls do not have this function 
	}

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
	// update time 
	lastFrameTime = currFrameTime;
	currFrameTime = lastFrameTime + dt;

	generateGroundParticle();
	
	if ( keyboard.pressed("z") ) 
	{	// do something   
		console.log("pressed Z");
		mesh = new THREE.Mesh( new THREE.BoxGeometry(20, 5, 20), material3 );//THREEx.Crates.createCrate1();   //
		mesh.position.set(-500 + Math.floor((Math.random() * 1000) + 1), 5,  -500 + Math.floor((Math.random() * 1000) + 1));
		scene.add(mesh);

		mesh.S = new THREE.Vector3(mesh.position.x, mesh.position.y, mesh.position.z);	//position
		mesh.V = new THREE.Vector3(0.0,0.1,0.1);//Math.floor((Math.random() * 1))-0.5,Math.floor((Math.random() * 1))-0.5); //velocity
		mesh.M = 3;								//mass
		mesh.mesh_falling = true;
		mesh.mesh_raising = false;
		mesh.isParticle = true;
		mesh.topCutOff = particleOptions.height + Math.floor((Math.random() * particleOptions.heightChaos) + 1)
		//G is the raising velocity and makes a great tornado when its randomness is varied
		//tempG just holds individual values for each particle
		mesh.tempG = new THREE.Vector3(G.x,G.y - Math.floor((Math.random()*particleOptions.betaLiftChaos) - particleOptions.betaLiftChaos/2.0) * .0001, G.z);// -.001
		
		particles.push(mesh);
	}
	
	// updates
	solver.update();
	controls.update();
	stats.update();
}

function generateGroundParticle()
{	

	//if (currFrameTime - lastParticleGenerateTime >= 1/particleGenerateRate)
	for (let i=0; i<particleGenerateRate; i++)
	{
		lastParticleGenerateTime = currFrameTime;
		let mesh = new THREE.Mesh(geometry, material);
		let pos = new THREE.Vector3(1000*Math.random() - 500, 100, 1000*Math.random() - 500);
		mesh.position.copy(pos);
		let particle = new Particle({
			mesh: mesh,
			mass: 0.001 + Math.random()*particleMassChaos,
			position: new THREE.Vector3().copy(pos),
			velocity: new THREE.Vector3()
		});
		solver.addParticle(particle);
		scene.add(mesh);
	}
}


// for debug
function _createParticleParticle() 
{	
	let mesh = new THREE.Mesh(geometry, material);
	let pos = new THREE.Vector3(10*Math.random(), 10*Math.random(), 10*Math.random());
	mesh.position.copy(pos);
	let particle = new Particle({
		mesh: mesh,
		mass: 0.001 + Math.random()*particleMassChaos,
		position: new THREE.Vector3().copy(pos),
		velocity: new THREE.Vector3(Math.random(), Math.random(), Math.random())
	});
	solver.addParticle(particle);
	scene.add(mesh);		
}

function createParticleTail( pos ) // flap - create tail for particle
{
	mesh = new THREE.Mesh( tailGeometry, tailMaterial );//THREEx.Crates.createCrate1();   //
	mesh.position.set(pos.x, pos.y, pos.z);
	scene.add(mesh);

	mesh.life = tailLifeSpan + (Math.random() * tailLifeSpanChaos);
	mesh.isParticle = true;
	
	particleTails.push(mesh);
}

function updateParticleTail()
{
	for (var i = particleTails.length-1; i >= 0; i--)
	{
		var particle = particleTails[i];
		particle.life -= dt;

		// remove
		if( particle.life < 0 )
		{
			particleTails.splice(i, 1);
			scene.remove(particle);
		}

		var ms = (particle.life)/tailMaxLifeSpan;
		particle.scale.set(ms,ms,ms);
	}
}

if (window.mobilecheck())
	performance = null;

function render() 
{
	if (!window.mobilecheck())
	{

		//This function does not work on iOS safari as of Three.js-r76
		var delta = clock.getDelta();

		uniforms1.time.value += delta * 5;
		uniforms2.time.value = clock.elapsedTime;
	
	}
	else
	{
		uniforms1.time.value += dt * 5;
		uniforms2.time.value = clock.elapsedTime;

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



