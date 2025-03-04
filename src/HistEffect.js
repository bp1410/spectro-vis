import { Color, DataTexture, FloatType, LinearFilter, LinearMipmapLinearFilter, NearestFilter, RedFormat, RenderTarget, Vector2 } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { ClearPass } from "three/addons/postprocessing/ClearPass.js"
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js"
import { CopyShader } from "three/addons/shaders/CopyShader.js"

import vertex from './glsl/vertex1.glsl'
import fragment2 from './glsl/frag-hist.glsl'

export class HistEffect {

    constructor(options) {
        const renderer = options.renderer;
        const resolution = options.resolution;
        const renderTarget = options.renderTarget;
        const dataLength = options.dataLength;
        const { bgColor = "#222", barColor = "#ff1", peakColor = "#f11", gridColor = "#777" } = options;
        this.renderer = options.renderer;
        this.dataLength = options.dataLength;

        // Init texture for new data
        this.newDataBuffer = new Float32Array(dataLength);

        this.newDataTexture = new DataTexture(
            this.newDataBuffer,
            dataLength,
            1,
            RedFormat,
            FloatType
            // def: format: RGBAFormat, type: UnsignedByteType
        );
        const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();
        this.newDataTexture.generateMipmaps = true;
        this.newDataTexture.minFilter = NearestFilter;//LinearMipmapLinearFilter;
        this.newDataTexture.magFilter = LinearFilter;
        this.newDataTexture.anisotropy = maxAnisotropy;

        this.newDataTexture.needsUpdate = true;

        // Init textures for update
        this.tex1 = new RenderTarget(resolution.width, resolution.height);
        this.tex2 = new RenderTarget(resolution.width, resolution.height);

        const composer = new EffectComposer(renderer, renderTarget);
        this.composer = composer;

        const clearPass = new ClearPass(0xcc1111, 1.0);
        composer.addPass(clearPass);

        const updateFragment = `
        uniform sampler2D tOldData;
        uniform sampler2D tNewData;
        uniform float cFall;
        varying vec2 v_uv;
        void main(){
            float oldPeak = texture2D(tOldData, vec2(v_uv.x, 0.5)).r;
            float newData = texture2D(tNewData, vec2(v_uv.x, 0.5)).r;
            float current = max(newData, oldPeak - cFall);
            gl_FragColor = vec4(current, current, current, 1.0);
        }
        `;

        const updateShader = {
            uniforms: {
                tOldData: { value: null },
                tNewData: { value: this.newDataTexture },
                cFall: { value: 0.01 }
            },
            vertexShader: vertex,
            fragmentShader: updateFragment
        }

        const updatePass = new ShaderPass(updateShader);
        this.updatePass = updatePass;

        const drawShader = {
            uniforms: {
                tHistogram: { value: null },
                tNewData: { value: this.newDataTexture },
                resolution: { value: new Vector2(renderTarget.width, renderTarget.height) },
                barColor: { value: new Color(barColor) },
                peakColor: { value: new Color(peakColor) },
                bgColor: { value: new Color(bgColor) },
                gridColor: { value: new Color(gridColor) },
                u_range: { value: [0.0, 1.0] }
            },
            vertexShader: vertex,
            fragmentShader: fragment2
        }

        const drawPass = new ShaderPass(drawShader);
        composer.addPass(drawPass);
        this.drawPass = drawPass;

        const copyPass = new ShaderPass(CopyShader);
        composer.addPass(copyPass);

    }

    // newData: float {0-1}
    update(newData) {
        let buffer = this.newDataBuffer;
        for (let i = 0; i < this.dataLength; i++) {
            buffer[i] = newData[i];
        }

        this.newDataTexture.needsUpdate = true;

        this.composer.passes.forEach(pass => {
            if (pass.uniforms?.tNewData) {
                pass.uniforms.tNewData.value = this.newDataTexture;
            }
        });
    }

    updateRange(range) {
        this.drawPass.uniforms.u_range.value = range;
    }

    render() {
        this.updatePass.uniforms.tOldData.value = this.tex1.texture;
        this.updatePass.render(this.renderer, this.tex2, this.tex1);
        let tmp = this.tex1;
        this.tex1 = this.tex2;
        this.tex2 = tmp;
        this.drawPass.uniforms.tHistogram.value = this.tex1.texture;
        this.composer.render();
    }

    dispose() {
        this.composer.passes.forEach(pass => {
            if (pass.dispose) {
                pass.dispose();
            }
            if (pass.material) {
                pass.material.dispose();
            }
        });
        this.composer.dispose();
        this.newDataTexture.dispose();
        this.tex1.dispose();
        this.tex2.dispose();
    }

}
