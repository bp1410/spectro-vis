import { Spectrogram } from "./common";

import { Color, DataTexture, FloatType, Group, Mesh, MeshBasicMaterial, OrthographicCamera, PlaneGeometry, RedFormat, Scene, ShaderMaterial, Vector2, WebGLRenderer, WebGLRenderTarget } from "three";

import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js" // Implements render phases (post-processing phases)
import { RenderPass } from "three/addons/postprocessing/RenderPass.js" 
import { ClearPass } from "three/addons/postprocessing/ClearPass.js" 

import vertex from './glsl/vertex1.glsl'
import fragment from './glsl/fragment-spec.glsl'
import fragmentRange from './glsl/fragment-spec-range.glsl'
import { randFloat } from "three/src/math/MathUtils.js";
import SpriteText from "three-spritetext";
import { HistEffect } from "./HistEffect";

export class SpectrogramThree extends Spectrogram {

    constructor(options) {
        options.childName = "SpectrogramThree";
        super(options);

        // Structure with dimensions
        this.dims = {
            renderer: { width: 0, height: 0 },
            camera: { width: 0, height: 0 },
            plane1: { width: 0, height: 0, x: 0, y: 0 },    // spectrogram
            plane2: { width: 0, height: 0, x: 0, y: 0 },    // aux1
            plane3: { width: 0, height: 0, x: 0, y: 0 },    // aux2
            xAxis1: { width: 0, height: 0, x: 0, y: 0 }
        }

        // Adjust to client resolution and aspect ratio
        this.log(this.vars.display);
        this.reset();
        this.log(this.dims);

        // Camera
        const camera = new OrthographicCamera(
            (-1) * this.dims.camera.width * 0.5, this.dims.camera.width * 0.5,
            this.dims.camera.height * 0.5, (-1) * this.dims.camera.height * 0.5,
            0.1, 100);
        camera.position.z = 4;

        // Renderer
        const renderer = new WebGLRenderer({
            canvas: this.options.canvas,
            antialias: true 
        });
        renderer.setClearColor(this.vars.look.bgColor);
        renderer.setSize(this.dims.renderer.width, this.dims.renderer.height);
        renderer.setPixelRatio(this.vars.dpr);
        this.log(`Renderer adjusted to: ${this.dims.renderer.width}x${this.dims.renderer.height} (DPR: ${this.vars.dpr})`);

        // Get size in camera space from number of pixel
        this.pxToCamera = (pxSize) => {
            return new Vector2(pxSize * this.dims.camera.width / (this.dims.renderer.width * this.vars.dpr),
                pxSize * this.dims.camera.height / (this.dims.renderer.height * this.vars.dpr));
        }

        // Get size in pixels from camera space
        this.cameraToPx = (camSize) => {
            return new Vector2(camSize * (this.dims.renderer.width * this.vars.dpr) / this.dims.camera.width, 
            camSize * (this.dims.renderer.height * this.vars.dpr) / this.dims.camera.height);
        }

        // Init float texture
        const bins = this.vars.signal.bins;
        const numRows = 200;
        this.vars.ffts = {
            tex: null,
            data: new Float32Array(bins * numRows),
            width: bins,
            height: numRows
        }
        this.vars.ffts.tex = new DataTexture(
            this.vars.ffts.data,
            this.vars.ffts.width,
            this.vars.ffts.height,
            RedFormat,
            FloatType
        );
        this.vars.ffts.tex.needsUpdate = true;

        // Init uniforms
        const uniforms = {
            u_mouse: { value: { x: 0.0, y: 0.0 } },
            u_resolution: { value: { x: 0.0, y: 0.0 } },
            u_color: { value: new Color(0x00ffff) },
            u_tex_spec: { value: null },
            u_tex_palette: { value: null },
            u_marker_y: { value: 0.05 },

            u_colors: {
                value: [
                    new Color(0x2f0087), // {r: 47, g: 0, b: 135}
                    new Color(0x6200a4), // {r: 98, g: 0, b: 164}
                    new Color(0x9200a6), // {r: 146, g: 0, b: 166}
                    new Color(0xba2f8a), // {r: 186, g: 47, b: 138}
                    new Color(0xd85b69), // {r: 216, g: 91, b: 105}
                    new Color(0xee8949), // {r: 238, g: 137, b: 73}
                    new Color(0xf6bd27), // {r: 246, g: 189, b: 39}
                    new Color(0xe4fa15)  // {r: 228, g: 250, b: 21}             
                ]
            },
            u_ffts: { value: this.vars.ffts.tex },
            u_range: { value: [0.0, 1.0] }
        };
        this.uniforms = uniforms;

        // Scene
        const scene = new Scene();

        const histResolution = {width: this.cameraToPx(this.dims.plane2.width).x , height: this.cameraToPx(this.dims.plane2.height).y};
        const histTarget = new WebGLRenderTarget(histResolution.width, histResolution.height);

        const planeGeom1 = new PlaneGeometry(this.dims.plane1.width, this.dims.plane1.height);
        const matShader1 = new ShaderMaterial({
            uniforms: uniforms, vertexShader: vertex, fragmentShader: fragment
        });
        const mesh1 = new Mesh(planeGeom1, matShader1);
        mesh1.translateX(this.dims.plane1.x);
        mesh1.translateY(this.dims.plane1.y);
        scene.add(mesh1);

        const planeGeom2 = new PlaneGeometry(this.dims.plane2.width, this.dims.plane2.height);
        const matShader2 = new ShaderMaterial({
            uniforms: uniforms, vertexShader: vertex, fragmentShader: fragment
        });
        const matHist = new MeshBasicMaterial({map: histTarget.texture});
        const mesh2 = new Mesh(planeGeom2, matHist);
        mesh2.translateX(this.dims.plane2.x);
        mesh2.translateY(this.dims.plane2.y);
        scene.add(mesh2);

        const planeGeom3 = new PlaneGeometry(this.dims.plane3.width, this.dims.plane3.height);
        const matShader3 = new ShaderMaterial({
            uniforms: uniforms, vertexShader: vertex, fragmentShader: fragmentRange
        });
        const mesh3 = new Mesh(planeGeom3, matShader3);
        mesh3.translateX(this.dims.plane3.x);
        mesh3.translateY(this.dims.plane3.y);
        scene.add(mesh3);

        scene.add(this.xAxisCreate(9));

        // Most dependant init code
        this.setFreqRange(0, this.vars.signal.sampling / 2);

        // Simple rendering extended with EffectComposer (Post-processing)
        // this.render = () => renderer.render(scene, camera);
        const composer = new EffectComposer(renderer);
        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);

        // const clearPass = new ClearPass(0xcc1111, 1.0); clearPass.renderToScreen = true;
        // composer.addPass(clearPass);

        const histEff = new HistEffect({renderer: renderer, resolution: histResolution, renderTarget: histTarget, dataLength: this.vars.ffts.width,
            bgColor: this.vars.look.bgColor
        });
        this.vars.histEff = histEff;
        this.updateRange = ()=>{this.vars.histEff.updateRange(this.uniforms.u_range.value);}

        this.render = () => {
            histEff.render();

            composer.render(); 
        }

        // Render loop
        this.mainLoop = setInterval(() => {
            if (this.needsUpdate) {
                this.render();
                this.needsUpdate = false;
            }

        }, 50);        

        // const animate = function (time_ms) {
        //     renderer.render(scene, camera);
        //     requestAnimationFrame(animate.bind(this));
        // }
        // requestAnimationFrame(animate.bind(this));

    }

    reset() {
        // TODO: clear all

        // init dimensions (resize)
        if (this.vars.resOK) {
            if (this.options.canvas.clientWidth / this.vars.aspectRatio <= this.vars.display.minRes.height) {
                this.dims.renderer = {
                    width: this.options.canvas.clientWidth,
                    height: this.options.canvas.clientWidth / this.vars.aspectRatio
                }
                this.dims.camera = { width: 4, height: 4 / this.vars.aspectRatio }
            }
            else {
                this.dims.renderer = {
                    width: this.options.canvas.clientHeight * this.vars.aspectRatio,
                    height: this.options.canvas.clientHeight
                }
                this.dims.camera = { width: 4, height: 4 / this.vars.aspectRatio }
            }

            // Scene
            this.dims.xAxis1.width = this.dims.camera.width;
            this.dims.xAxis1.height = 40 * this.dims.camera.height / (this.dims.renderer.height * this.vars.dpr);
            this.dims.xAxis1.x = 0;

            this.dims.plane1.width = this.dims.camera.width;
            this.dims.plane1.height = this.dims.camera.height * 3 / 4 - this.dims.xAxis1.height;
            this.dims.plane1.x = 0;
            this.dims.plane1.y = (this.dims.camera.height - this.dims.plane1.height) * 0.5;

            this.dims.xAxis1.y = this.dims.plane1.y - (this.dims.plane1.height + this.dims.xAxis1.height) * 0.5;

            this.dims.plane2.width = this.dims.camera.width;
            this.dims.plane2.height = (this.dims.camera.height - this.dims.plane1.height - this.dims.xAxis1.height)/2;
            this.dims.plane2.x = 0;
            this.dims.plane2.y = this.dims.xAxis1.y - (this.dims.xAxis1.height + this.dims.plane2.height) * 0.5;

            this.dims.plane3.width = this.dims.camera.width;
            this.dims.plane3.height = (this.dims.camera.height - this.dims.plane1.height - this.dims.xAxis1.height)/2;
            this.dims.plane3.x = 0;
            this.dims.plane3.y = this.dims.plane2.y - (this.dims.plane2.height + this.dims.plane3.height) * 0.5;

        }
        else {  // TODO min size not met
            this.dims.renderer = {
                width: this.options.canvas.clientWidth,
                height: this.options.canvas.clientHeight
            }
            this.dims.camera = { width: 1, height: 1 / this.vars.clientRatio };
        }

    }

    step(row) {
        this.vars.histEff.update(row);

        let tex = this.vars.ffts.tex;
        let data = this.vars.ffts.data;

        if (!this.vars.directionTop) {
            for (let row = 0; row < tex.image.height - 1; row++) {
                for (let col = 0; col < tex.image.width; col++) {
                    data[row * tex.image.width + col] = data[(row + 1) * tex.image.width + col];
                }
            }

            for (let col = 0; col < tex.image.width; col++) {
                data[(tex.image.height - 1) * tex.image.width + col] = row[col];
            }
        }
        else {
            for (let row = tex.image.height - 1; row > 0; row--) {
                for (let col = 0; col < tex.image.width; col++) {
                    data[row * tex.image.width + col] = data[(row - 1) * tex.image.width + col];
                }
            }

            for (let col = 0; col < tex.image.width; col++) {
                data[col] = row[col];
            }
        }



        tex.needsUpdate = true;
        this.needsUpdate = true;
    }

    setVisibleRows(rows) {
        // resize data, recreate texture and dispose old one
        const data = new Float32Array(this.vars.ffts.width * rows);
        for (let r = 0; r < Math.min(this.vars.ffts.height, rows); r++) {
            for (let c = 0; c < this.vars.ffts.width; c++) {
                data[r * this.vars.ffts.width + c] = this.vars.ffts.data[r * this.vars.ffts.width + c];
            }
        }
        this.vars.ffts.data = data;
        this.vars.ffts.height = rows;
        this.vars.ffts.tex.dispose();
        this.vars.ffts.tex = new DataTexture(
            this.vars.ffts.data,
            this.vars.ffts.width,
            this.vars.ffts.height,
            RedFormat,
            FloatType
        );
        this.vars.ffts.tex.needsUpdate = true;
        // update uniforms
        this.uniforms.u_ffts.value = this.vars.ffts.tex;
        this.needsUpdate = true;
    }

    setFreqRange(fmin, fmax) {
        super.setFreqRange(fmin, fmax);
        this.uniforms.u_range.value = [this.vars.zoom.min / this.vars.signal.bins, this.vars.zoom.max / this.vars.signal.bins];
        this.xAxisUpdate();
        this.updateRange();
    }

    scaleFreqRange(delta) {
        super.scaleFreqRange(delta);
        this.uniforms.u_range.value = [this.vars.zoom.min / this.vars.signal.bins, this.vars.zoom.max / this.vars.signal.bins];
        this.updateRange();
        this.xAxisUpdate();
    }

    moveFreqRange(delta){
        super.moveFreqRange(delta);
        this.uniforms.u_range.value = [this.vars.zoom.min / this.vars.signal.bins, this.vars.zoom.max / this.vars.signal.bins];
        this.updateRange();
        this.xAxisUpdate();
    }

    dispose() {
        super.dispose();
        clearInterval(this.mainLoop);
        // TODO dispose everything
    }

    // TODO make sliding values
    xAxisCreate(numTicks) {
        this.vars.xAxis1 = [];
        const dX = this.dims.camera.width / (numTicks + 1);
        const x0 = -this.dims.camera.width / 2;
        const op = {
            text: "",
            textHeight: this.pxToCamera(this.vars.look.fontSize).y,
            color: this.vars.look.fontColor
        }
        for (let t = 1; t <= numTicks; t++) {
            const label = new SpriteText(t, op.textHeight, op.color);
            label.position.set(x0 + t * dX, this.dims.xAxis1.y, 1);
            // more params https://vasturiano.github.io/three-spritetext/
            label.fontFace = this.vars.look.fontFace;
            // label.fontSize = 90;

            this.vars.xAxis1.push(label);
        }
        const g = new Group(); g.add(...this.vars.xAxis1);
        return g;
    }

    xAxisUpdate() {
        const range = this.vars.zoom;
        const df = ((range.max - range.min) / this.vars.xAxis1.length + 1) * this.vars.signal.fftRes;
        const d0 = range.min * this.vars.signal.fftRes;
        const prec = (df<1)?3:(df<10)?2:0;
        for(let l=0;l<this.vars.xAxis1.length;l++){
            const f = d0 + (l+1) * df;
            this.vars.xAxis1[l].text = f.toFixed(prec);
        }
    }

    setSampling(sps){
        super.setSampling(sps); // sampling and fftRes update
        this.xAxisUpdate();
        this.needsUpdate = true;
    }

}