uniform sampler2D tHistogram;
uniform sampler2D tNewData;
uniform vec2 resolution;
uniform vec3 barColor;
uniform vec3 peakColor;
uniform vec3 bgColor;
uniform vec3 gridColor;
uniform float u_range[2];
varying vec2 v_uv;

// ChatGPT o3-mini-high line shaders:

// Draws a vertical dashed line at x = xCoord.
// Parameters:
//   uv         : the fragment coordinate (e.g. a varying vec2 passed to the fragment shader)
//   xCoord     : x coordinate at which to draw the vertical line
//   dashLength : length of each dash segment along y
//   gapLength  : gap between dashes
//   lineWidth  : half-width of the line (in the same units as uv.x)
float dashedLine(vec2 uv, float xCoord, float dashLength, float gapLength, float lineWidth) {
    // Create a mask for being near the vertical line at x = xCoord.
    float lineMask = step(abs(uv.x - xCoord), lineWidth);
    
    // Create a dash pattern along the y-axis.
    float patternLength = dashLength + gapLength;
    // mod(uv.y, patternLength) gives a value between 0 and (dashLength+gapLength).
    // If this value is less than dashLength, we are in a dash.
    float dashMask = step(mod(uv.y, patternLength), dashLength);
    
    return lineMask * dashMask;
}

// Returns a mask (between 0.0 and 1.0) that is 1.0
// where a dashed line is drawn. The dashed lines are drawn
// vertically at evenly spaced "ticks" along the x axis.
// Parameters:
//   uv         : The fragment coordinate (assumed in [0,1])
//   numTicks   : Number of ticks to distribute along the x axis.
//                For example, if numTicks == 5, then ticks will be centered at
//                0.1, 0.3, 0.5, 0.7, and 0.9.
//   dashLength : Length of each dash segment along y.
//   gapLength  : Length of the gap between dashes.
//   lineWidth  : Half-width of the vertical line (in the same units as uv.x).
float multiDashedLine(vec2 uv, float numTicks, float dashLength, float gapLength, float lineWidth) {
    // Compute the index of the tick based on the current uv.x.
    // Multiply uv.x by numTicks and take the floor so that each tick occupies
    // a region of width 1.0/numTicks.
    float tickIndex = floor(uv.x * numTicks);
    
    // Compute the x coordinate of the center of that tick.
    float tickCenter = (tickIndex + 0.5) / numTicks;
    
    // Create a horizontal mask that is 1.0 if uv.x is within lineWidth of the tick center.
    float lineMask = step(abs(uv.x - tickCenter), lineWidth);
    
    // Create a dashed pattern along the y-axis.
    float patternLength = dashLength + gapLength;
    // For a given uv.y, if mod(uv.y, patternLength) < dashLength then we are in a dash.
    float dashMask = step(mod(uv.y, patternLength), dashLength);
    
    // Combine the x mask and the y dash pattern.
    return lineMask * dashMask;
}

// Draws vertical dashed lines at internal ticks.
// The internal ticks are evenly spaced between 0 and 1
// (with virtual ticks at 0 and 1 that are not rendered).
//
// Parameters:
//   uv         : The fragment coordinate (assumed normalized [0,1])
//   uTicks     : The number of internal ticks to render.
//                (There are uTicks+2 virtual ticks at 0 and 1, but only
//                 the ones in between are rendered.)
//   dashLength : The length of each dash segment along y.
//   gapLength  : The gap length between dashes along y.
//   lineWidth  : The half-width of the vertical line (in uv units).
float multiDashedLineInternal(vec2 uv, float uTicks, float dashLength, float gapLength, float lineWidth) {
    // Compute spacing such that there are (uTicks+2) ticks between 0 and 1,
    // but we only render the ones at indices 1..uTicks.
    float spacing = 1.0 / (uTicks + 1.0);
    
    // Determine the nearest tick index.
    // Adding half spacing will round uv.x to the nearest multiple of spacing.
    float tickIndex = floor((uv.x + spacing * 0.5) / spacing);
    
    // Only consider tick indices in the valid range [1, uTicks].
    float validTick = step(1.0, tickIndex) * step(tickIndex, uTicks);
    
    // Compute the tick center corresponding to this index.
    float tickCenter = tickIndex * spacing;
    
    // Create a horizontal mask that is 1.0 if uv.x is within lineWidth of the tick center.
    float lineMask = step(abs(uv.x - tickCenter), lineWidth);
    
    // Create the vertical dash pattern.
    float patternLength = dashLength + gapLength;
    float dashMask = step(mod(uv.y, patternLength), dashLength);
    
    // Return the final mask.
    return validTick * lineMask * dashMask;
}

// Returns a value near 1.0 if uv is on the line, and 0.0 otherwise.
float line(vec2 uv, vec2 a, vec2 b, float thickness) {
    // Compute the vector from 'a' to the current point and from 'a' to 'b'
    vec2 pa = uv - a;
    vec2 ba = b - a;
    
    // Project pa onto ba and clamp the result to [0,1] so that we handle line segments
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    
    // Compute the distance from uv to the line defined by a and b
    float d = length(pa - ba * h);
    
    // Compute an anti-aliasing factor based on the pixel derivative
    float aa = fwidth(d);
    
    // Use smoothstep to create a smooth edge transition
    return smoothstep(thickness/2.0 + aa, thickness/2.0 - aa, d);
}

void main(){

  // apply range
  float uv_x = mix(u_range[0], u_range[1], v_uv.x);
  vec2 uv_2 = vec2(uv_x, v_uv.y);

  // // thin bar
  // vec2 uv_3 = floor(uv_2 * resolution) / resolution;
  // float f = fract(uv_2.x * resolution.x);
  // float dE = (1.0 - (u_range[1] - u_range[0])) / 8.0;
  // float edge = step(0.0 + dE, f) - step(1.0 - dE, f);
  // // vec3 barColor2 = barColor * 0.5;
  // vec3 barColor2 = mix(bgColor, barColor, edge);

  float uTicks = 9.0;
  float lineWidth = 1.0 / resolution.x;
  float ticks = multiDashedLineInternal(v_uv, uTicks, 0.1, 0.1, lineWidth);

  float newVal = texture2D(tNewData, vec2(uv_2.x, 0.5)).r;
  float currentPeak = texture2D(tHistogram, vec2(uv_2.x, 0.5)).r;
  float peakThickness = (0.075 * resolution.y) / resolution.y;
  float bar = step(v_uv.y, newVal);// - smoothstep(0.0, peakThickness, v_uv.y);
  float peakMarker = step(newVal, v_uv.y) - smoothstep(newVal, currentPeak + peakThickness, v_uv.y);
  peakMarker *= step(newVal, currentPeak + peakThickness);
  peakMarker *= step(1e-6, currentPeak);
  vec3 color = mix(bgColor, gridColor, ticks);
  color = mix(color, peakColor, peakMarker);
  color = mix(color, barColor, bar);

  gl_FragColor = vec4(color, 1.0); 
} 



