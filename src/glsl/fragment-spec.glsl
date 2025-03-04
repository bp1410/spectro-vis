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
  float uv_x = mix(u_range[0], u_range[1], v_uv.x);
  vec2 uv_2 = vec2(uv_x, v_uv.y);
  float vf = texture2D(u_ffts, uv_2).r;

  // mask values outside colorMapRange
  float below = step(u_colorMapRange.min, vf); // 0.0 if vf < min, 1.0 otherwise
  float above = step(vf, u_colorMapRange.max); // 0.0 if vf > max, 1.0 otherwise
  float t = clamp((vf - u_colorMapRange.min) / (u_colorMapRange.max - u_colorMapRange.min), 0.0, 1.0);
  t = mix(0.0, t, below);  // if vf < min then t becomes 0
  t = mix(t, 1.0, 1.0 - above); // if vf > max then t becomes 1

  // apply color scale
  float valS = t * 7.0;
  float index = floor(valS);
  float inter = fract(valS);
  vec3 color1 = u_colors[int(index)];
  vec3 color2 = u_colors[int(index)+1];
  vec3 color3 = mix(color1, color2, inter);
  
  gl_FragColor = vec4(color3, 1.0); 
} 



