
/*
	Three.js "TornadoVR"
	Author: Rodolfo Aramayo
	Date: May 2016
 */

// MAIN

// standard global variables
var container, scene, camera, renderer, effect, controls, stats;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();

// custom global variables
var lastFrameTime = new Date().getTime() / 1000;
var totalGameTime = 0;
var dt;
var currTime;

var tracersMesh = [];
var particles = [];
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

var texture;
var geometry;
var material;

var stereo = false;
var deviceOrientation = false;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var shaderSelection = 0;
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
	var origin = new THREE.Vector3(0+100,0,0+100);
	var terminus  = new THREE.Vector3(B.x+100, B.y+100, B.z+100);
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
		deltaTime:500,
		betaX:0.0,
		betaY:0.01,
		betaZ:0.0,
		GX:0.0,
		GY:0.001,
		GZ:0.0,
		gravity:0.01,
		betaLiftChaos:10,
		height:750,
		heightChaos:250,
		tornadoFactor:25,
		instantRespawn:false,
		tracer:false

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

	rebuildParticles();

	var gui = new dat.GUI();

	// material (attributes)

	h = gui.addFolder( "Particle Options" );

	h.add( particleOptions, "particleCount", 1, 10000, 1 ).name( "#particles" ).onChange( rebuildParticles );
	h.add( particleOptions, "deltaTime", 100, 1000, 1 ).name( "dt" ).onChange( rebuildParticles );
	h.add( particleOptions, "gravity", 0, 0.1, 0.01 ).name( "Gravity" ).onChange( rebuildParticles );
	h.add( particleOptions, "height", 0, 5000, 1 ).name( "height" ).onChange( rebuildParticles );
	h.add( particleOptions, "heightChaos", 0, 2500, 1 ).name( "heightChaos" ).onChange( rebuildParticles );
	h.add( particleOptions, "instantRespawn" ).name( "instant respawn" ).onChange( rebuildParticles );
	h.add( particleOptions, "tracer" ).name( "show tracer" ).onChange( rebuildParticles );

	h = gui.addFolder( "Magnetic Field Options" );
	h.add( particleOptions, "betaX", 0, 0.1, 0.01 ).name( "betaX" ).onChange( rebuildParticles );
	h.add( particleOptions, "betaY", 0, 0.1, 0.01 ).name( "betaY" ).onChange( rebuildParticles );
	h.add( particleOptions, "betaZ", 0, 0.1, 0.01 ).name( "betaZ" ).onChange( rebuildParticles );

	h.add( particleOptions, "GX", 0, 0.1, 0.001 ).name( "beta Lift X" ).onChange( rebuildParticles );
	h.add( particleOptions, "GY", 0, 0.1, 0.001 ).name( "beta Lift Y" ).onChange( rebuildParticles );
	h.add( particleOptions, "GZ", 0, 0.1, 0.001 ).name( "beta Lift Z" ).onChange( rebuildParticles );

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
			shader5:function(){ shaderSelection = 4; rebuildParticles();}																														
		};

		h.add(shaderSelectionController,'shader1').name("Monjori Shader");
		h.add(shaderSelectionController,'shader2').name("Shader 2");
		h.add(shaderSelectionController,'shader3').name("Shader 3");
		h.add(shaderSelectionController,'shader4').name("Shader 4");	
		h.add(shaderSelectionController,'shader5').name("Cell shader");			
	
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

	//-----
	//create particles

	//Crate
	//THREE.TextureLoader.crossOrigin = '';
	//THREE.ImageUtils.crossOrigin = '';
	texture = new THREE.TextureLoader().load( 'img/crate.gif' );
	geometry = new THREE.BoxGeometry( 10, 10, 10 );

	//------
	//We can't uyse the cross origin image file on the file:/// during development... 
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
			'vertexShaderCell'
		];
		var params = [
			[ 'fragment_shader1', uniforms1 ],
			[ 'fragment_shader2', uniforms2 ],
			[ 'fragment_shader3', uniforms1 ],
			[ 'fragment_shader4', uniforms1 ],
			[ 'fragment_shaderCell', uniforms3 ],
		];

		material = new THREE.ShaderMaterial( {
			uniforms: params[ shaderSelection ][ 1 ],
			vertexShader: document.getElementById( paramsVertex[ shaderSelection ] ).textContent,
			fragmentShader: document.getElementById( params[ shaderSelection ][ 0 ] ).textContent
		} );
	
	}
	
	
	//Sphere
	//geometry = new THREE.SphereGeometry( 1, 32, 16 );
	//material = new THREE.MeshLambertMaterial( { color: 0x000088 } );

	//remove all particles meshes from the scene
	
	var children = scene.children;
    for(var i = children.length-1;i>=0;i--){
        var child = children[i];
        if (child.isParticle)
        {
        	scene.remove(child);	
        }
        
    };   

	particles = [];

	for (var i = 0; i < particleOptions.particleCount; i++)
	{
		mesh = new THREE.Mesh( geometry, material );//THREEx.Crates.createCrate1();   //
		mesh.position.set(-500 + Math.floor((Math.random() * 1000) + 1), 5,  -500 + Math.floor((Math.random() * 1000) + 1));
		scene.add(mesh);

		mesh.S = new THREE.Vector3(mesh.position.x, mesh.position.y, mesh.position.z);	//position
		mesh.V = new THREE.Vector3(0.0,0.1,0.1);//Math.floor((Math.random() * 1))-0.5,Math.floor((Math.random() * 1))-0.5); //velocity
		mesh.M = 1;								//mass
		mesh.mesh_falling = true;
		mesh.mesh_raising = false;
		mesh.isParticle = true;
		mesh.topCutOff = particleOptions.height + Math.floor((Math.random() * particleOptions.heightChaos) + 1)
		//G is the raising velocity and makes a great tornado when its randomness is varied
		//tempG just holds individual values for each particle
		mesh.tempG = new THREE.Vector3(G.x,G.y - Math.floor((Math.random()*particleOptions.betaLiftChaos) - particleOptions.betaLiftChaos/2.0) * .0001, G.z);// -.001
		
		particles.push(mesh);
	}
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

	currTime = new Date().getTime() / 1000;
    dt = currTime - (lastFrameTime || currTime);
    //console.log(dt);
    totalGameTime += dt;
	lastFrameTime = currTime;
	

	for (particle of particles)
	{
		var F = new THREE.Vector3(0,0,0);
		var A = new THREE.Vector3(0,0,0);
		var Vnew = new THREE.Vector3(0,0,0); //Velocity at t+dt
		var Snew = new THREE.Vector3(0,0,0); //Position at t+dt

		if (Math.abs(particle.S.x-100) < 10 && Math.abs(particle.S.y-5) < 10 && Math.abs(particle.S.z-100) < 10 && particle.mesh_falling == true)
		{
			A.x = 0;
			A.y = 0;
			A.z = 0;
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
				F.addVectors(F, Gravity)
			}
			else
			{
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
		//F.multiplyScalar(M); //just 1
		A.copy(F) 	// A = F/M
		
		A.multiplyScalar(dt*particleOptions.deltaTime)

		Vnew.addVectors(particle.V, A);
		//Vnew.multiplyScalar(dt*80)
		particle.S.add(Vnew);
		
		Snew.copy(particle.S);
		particle.V.copy(Vnew);   	

	   	particle.position.x = Snew.x;
	   	particle.position.y = Snew.y;
	   	particle.position.z = Snew.z;
		
	}
	
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
	
	if ( keyboard.pressed("z") ) 
	{	// do something   
		V = new THREE.Vector3(0,0.1,0.1);
		S.x = 100;
		S.y = 0;
		S.z = 100;
		Snew.x = 100;
		Snew.y = 100;
		Snew.z = 100;
		A.x = 0;
		A.y = 0;
		A.z = 0;
		lastFrameTime = new Date().getTime() / 1000;
	}
	
	//console.log('(' + Snew.x + "," + Snew.y + "," + Snew.z );

	controls.update();
	stats.update();
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

