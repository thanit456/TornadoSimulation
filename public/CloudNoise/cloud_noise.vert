// Created by inigo quilez - iq/2013
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

// Volumetric clouds. It performs level of detail (LOD) for faster rendering
#version 300 es

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
    
#if 0
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

void main() {
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}