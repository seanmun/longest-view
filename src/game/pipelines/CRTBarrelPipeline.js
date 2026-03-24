import Phaser from 'phaser'

const FRAG_SHADER = `
precision mediump float;

uniform sampler2D uMainSampler;
uniform float barrelDistortion;
uniform float vignetteStrength;
uniform float chromatic;

varying vec2 outTexCoord;

void main() {
  // Remap UV from 0..1 to -1..1
  vec2 uv = outTexCoord * 2.0 - 1.0;

  // Barrel distortion — edges curve outward
  uv.x *= 1.0 + barrelDistortion * (uv.y * uv.y);
  uv.y *= 1.0 + barrelDistortion * (uv.x * uv.x);

  // Back to 0..1
  vec2 sampleUv = uv * 0.5 + 0.5;

  // Discard pixels outside the texture (black border from distortion)
  if (sampleUv.x < 0.0 || sampleUv.x > 1.0 || sampleUv.y < 0.0 || sampleUv.y > 1.0) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  // Chromatic aberration — RGB split increases toward edges
  float r = texture2D(uMainSampler, sampleUv + chromatic * uv).r;
  float g = texture2D(uMainSampler, sampleUv).g;
  float b = texture2D(uMainSampler, sampleUv - chromatic * uv).b;

  // Vignette — darken edges
  float dist = length(uv);
  float vignette = smoothstep(1.2, 0.5, dist * vignetteStrength);

  gl_FragColor = vec4(vec3(r, g, b) * vignette, 1.0);
}
`

export class CRTBarrelPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game) {
    super({
      game,
      name: 'CRTBarrelPipeline',
      fragShader: FRAG_SHADER
    })
  }

  onPreRender() {
    this.set1f('barrelDistortion', 0.08)
    this.set1f('vignetteStrength', 0.35)
    this.set1f('chromatic', 0.003)
  }
}
