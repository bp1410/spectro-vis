varying vec3 v_position;  
varying vec2 v_uv;  

uniform vec3 u_colors[8];
uniform sampler2D u_ffts;

uniform float u_range[2];

struct ColorMapRange {
  float min;
  float max;
};

uniform ColorMapRange u_colorMapRange;

void main(){
  // apply range
  float uv_y = mix(0.0, 0.25, v_uv.y);
  vec2 uv_2 = vec2(v_uv.x, uv_y);

  float vf = texture2D(u_ffts, uv_2).r;
  // apply color scale
  float valS = vf * 7.0;
  float index = floor(valS);
  float inter = fract(valS);
  vec3 color1 = u_colors[int(index)];
  vec3 color2 = u_colors[int(index)+1];
  vec3 color3 = mix(color1, color2, inter);
  color3 = pow(color3, vec3(0.5)); // Apply gamma correction

  // range marker
  // float top = 1.0 - smoothstep(0.0, 0.14, v_uv.y) + smoothstep(0.86, 1.0, v_uv.y);
  float top = smoothstep(0.90, 1.0, v_uv.y);
  float marker = (step(u_range[0], v_uv.x) - step(u_range[1], v_uv.x)) * top;
  vec3 colorBG = vec3(0.1, 0.1, 0.6);
  vec3 colorMarker = vec3(0.8, 0.8, 0.8);
  color3 = mix(color3, colorBG, top);
  color3 = mix(color3, colorMarker, marker);

  gl_FragColor = vec4(color3, 1.0); 
} 



