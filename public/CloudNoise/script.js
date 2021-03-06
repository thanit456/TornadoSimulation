"use strict";
var vertexShaderSource = `
	#version 300 es

	varying vec2 vUv;

	void main() {
		vUv = uv;

	    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0 );
	    gl_Position = projectionMatrix * mvPosition;
	}
`;
var fracmentShaderSource = `
	#version 300 es

	out vec4 fragColor;

	uniform vec3      iResolution;           // viewport resolution (in pixels)
	uniform float     iTime;                 // shader playback time (in seconds)
	uniform vec4      iMouse;                // mouse pixel coords. xy: current (if MLB down), zw: click
	uniform sampler2D iChannel0;          // input channel. XX = 2D/Cube

	varying vec2 vUv;
float noise( in vec3 x )
    {
        vec3 p = floor(x);
        vec3 f = fract(x);
    	f = f*f*(3.0-2.0*f);
        
    #if 1
    	vec2 uv = (p.xy+vec2(37.0,17.0)*p.z) + f.xy;
        vec2 rg = textureLod( iChannel0, (uv+ 0.5)/256.0, 0. ).yx;
    #else
        ivec3 q = ivec3(p);
    	ivec2 uv = q.xy + ivec2(37,17)*q.z;

    	vec2 rg = mix( mix( texelFetch( iChannel0, (uv           )&255, 0 ),
    				        texelFetch( iChannel0, (uv+ivec2(1,0))&255, 0 ), f.x ),
    				   mix( texelFetch( iChannel0, (uv+ivec2(0,1))&255, 0 ),
    				        texelFetch( iChannel0, (uv+ivec2(1,1))&255, 0 ), f.x ), f.y ).yx;
    #endif    
        
    	return -1.0+2.0*mix( rg.x, rg.y, f.z );
    }

    float map5( in vec3 p )
    {
    	vec3 q = p - vec3(0.0,0.1,1.0)*iTime;
    	float f;
        f  = 0.50000*noise( q ); q = q*2.02;
        f += 0.25000*noise( q ); q = q*2.03;
        f += 0.12500*noise( q ); q = q*2.01;
        f += 0.06250*noise( q ); q = q*2.02;
        f += 0.03125*noise( q );
    	return clamp( 1.5 - p.y - 2.0 + 1.75*f, 0.0, 1.0 );
    }

    float map4( in vec3 p )
    {
    	vec3 q = p - vec3(0.0,0.1,1.0)*iTime;
    	float f;
        f  = 0.50000*noise( q ); q = q*2.02;
        f += 0.25000*noise( q ); q = q*2.03;
        f += 0.12500*noise( q ); q = q*2.01;
        f += 0.06250*noise( q );
    	return clamp( 1.5 - p.y - 2.0 + 1.75*f, 0.0, 1.0 );
    }
    float map3( in vec3 p )
    {
    	vec3 q = p - vec3(0.0,0.1,1.0)*iTime;
    	float f;
        f  = 0.50000*noise( q ); q = q*2.02;
        f += 0.25000*noise( q ); q = q*2.03;
        f += 0.12500*noise( q );
    	return clamp( 1.5 - p.y - 2.0 + 1.75*f, 0.0, 1.0 );
    }
    float map2( in vec3 p )
    {
    	vec3 q = p - vec3(0.0,0.1,1.0)*iTime;
    	float f;
        f  = 0.50000*noise( q ); q = q*2.02;
        f += 0.25000*noise( q );;
    	return clamp( 1.5 - p.y - 2.0 + 1.75*f, 0.0, 1.0 );
    }

    vec3 sundir = normalize( vec3(-1.0,0.0,-1.0) );

    vec4 integrate( in vec4 sum, in float dif, in float den, in vec3 bgcol, in float t )
    {
        // lighting
        vec3 lin = vec3(0.65,0.7,0.75)*1.4 + vec3(1.0, 0.6, 0.3)*dif;        
        vec4 col = vec4( mix( vec3(1.0,0.95,0.8), vec3(0.25,0.3,0.35), den ), den );
        col.xyz *= lin;
        col.xyz = mix( col.xyz, bgcol, 1.0-exp(-0.003*t*t) );
        // front to back blending    
        col.a *= 0.4;
        col.rgb *= col.a;
        return sum + col*(1.0-sum.a);
    }

    #define MARCH(STEPS,MAPLOD) for(int i=0; i<STEPS; i++) { vec3  pos = ro + t*rd; if( pos.y<-3.0 || pos.y>2.0 || sum.a > 0.99 ) break; float den = MAPLOD( pos ); if( den>0.01 ) { float dif =  clamp((den - MAPLOD(pos+0.3*sundir))/0.6, 0.0, 1.0 ); sum = integrate( sum, dif, den, bgcol, t ); } t += max(0.05,0.02*t); }

    vec4 raymarch( in vec3 ro, in vec3 rd, in vec3 bgcol, in ivec2 px )
    {
    	vec4 sum = vec4(0.0);

    	float t = 0.0;//0.05*texelFetch( iChannel0, px&255, 0 ).x;

        MARCH(30,map5);
        MARCH(30,map4);
        MARCH(30,map3);
        MARCH(30,map2);

        return clamp( sum, 0.0, 1.0 );
    }

    mat3 setCamera( in vec3 ro, in vec3 ta, float cr )
    {
    	vec3 cw = normalize(ta-ro);
    	vec3 cp = vec3(sin(cr), cos(cr),0.0);
    	vec3 cu = normalize( cross(cw,cp) );
    	vec3 cv = normalize( cross(cu,cw) );
        return mat3( cu, cv, cw );
    }

    vec4 render( in vec3 ro, in vec3 rd, in ivec2 px )
    {
        // background sky     
    	float sun = clamp( dot(sundir,rd), 0.0, 1.0 );
    	vec3 col = vec3(0.6,0.71,0.75) - rd.y*0.2*vec3(1.0,0.5,1.0) + 0.15*0.5;
    	col += 0.2*vec3(1.0,.6,0.1)*pow( sun, 8.0 );

        // clouds    
        vec4 res = raymarch( ro, rd, col, px );
        col = col*(1.0-res.w) + res.xyz;
        
        // sun glare    
    	col += 0.2*vec3(1.0,0.4,0.2)*pow( sun, 3.0 );

        return vec4( col, 1.0 );
    }

    void mainImage( out vec4 fragColor, in vec2 fragCoord )
    {
        vec2 p = (-iResolution.xy + 2.0*fragCoord.xy)/ iResolution.y;

        vec2 m = iMouse.xy/iResolution.xy;
        
        // camera
        vec3 ro = 4.0*normalize(vec3(sin(3.0*m.x), 0.4*m.y, cos(3.0*m.x)));
    	vec3 ta = vec3(0.0, -1.0, 0.0);
        mat3 ca = setCamera( ro, ta, 0.0 );
        // ray
        vec3 rd = ca * normalize( vec3(p.xy,1.5));
        
        fragColor = render( ro, rd, ivec2(fragCoord-0.5) );
    }

	void main() {
		vec2 p = gl_FragCoord.xy / iResolution.xy;
	    mainImage(fragColor, vUv * iResolution.xy);
	}
`;

// init camera, scene, renderer
var scene, camera, renderer, time;
var uniforms;
function init() {
	scene = new THREE.Scene();
	var fov = 75, aspect = window.innerWidth / window.innerHeight;

	camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000);
	camera.position.z = 100;
	camera.lookAt(scene.position);

	var canvas = document.createElement( 'canvas' );
	var context = canvas.getContext( 'webgl2', { alpha: false } );
	renderer = new THREE.WebGLRenderer( { canvas: canvas, context: context } );

	// renderer = new THREE.WebGLRenderer();
	renderer.setClearColor(0xc4c4c4);
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);


	const texture_loader = new THREE.TextureLoader();
	const iChannel0 = texture_loader.load('rgba_noise.png');
	iChannel0.minFilter = THREE.LinearFilter;
	iChannel0.magFilter = THREE.LinearFilter;
	iChannel0.wrapS = THREE.RepeatWrapping;
	iChannel0.wrapT = THREE.RepeatWrapping;

	uniforms = {
		iTime: { value: 0 },
		iResolution:  { value: new THREE.Vector3(1, 1, 1) },
		iMouse: new THREE.Uniform(new THREE.Vector3()),
		iChannel0: { value: iChannel0 },
	};
	
	// Create Plane
	var material = new THREE.ShaderMaterial({
		uniforms: uniforms,
		vertexShader: vertexShaderSource,
		fragmentShader: fracmentShaderSource,
	});

	var mesh = new THREE.Mesh(
		new THREE.PlaneBufferGeometry(window.innerWidth, window.innerHeight, 40), material
	);

	scene.add(mesh);

	render();

	window.addEventListener('resize', resize, false);
}

function resizeRendererToDisplaySize(renderer) {
	const canvas = renderer.domElement;
	const width = window.innerWidth;
	const height = window.innerHeight;
	const needResize = canvas.width !== width || canvas.height !== height;
	if (needResize) {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize(window.innerWidth, window.innerHeight, false);
	  	// renderer.setSize(width, height, false);
	}
	
	uniforms.iResolution.value.set(width, height, 1);
	
	return needResize;
}

function resize() {
	resizeRendererToDisplaySize(renderer);
}

// draw animation
function render(time) {
	time *= 0.001;  // convert to seconds

	// resizeRendererToDisplaySize(renderer);

	resize();
    
    uniforms.iTime.value = time;

    renderer.render(scene, camera);

    requestAnimationFrame(render);
}


init();

// Mouse position in - 1 to 1
// renderer.domElement.addEventListener('mousedown', function(e) {
// 	var canvas = renderer.domElement;
// 	var rect = canvas.getBoundingClientRect();
// 	tuniform.mouse.value.x = (e.clientX - rect.left) / window.innerWidth * 2 - 1;
// 	tuniform.mouse.value.y = (e.clientY - rect.top) / window.innerHeight * -2 + 1; 
// });
// renderer.domElement.addEventListener('mouseup', function(e) {
// 	var canvas = renderer.domElement;
// 	var rect = canvas.getBoundingClientRect();
// 	tuniform.mouse.value.z = (e.clientX - rect.left) / window.innerWidth * 2 - 1;
// 	tuniform.mouse.value.w = (e.clientY - rect.top) / window.innerHeight * -2 + 1;
// });
