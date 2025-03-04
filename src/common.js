export const Display = Object.freeze({
    WIDE: { aspectRatio: "16:9", minRes: { width: 1024, height: 576 } },
    STANDARD: { aspectRatio: "4:3", minRes: { width: 1024, height: 768 } },
})

export class Spectrogram {

    constructor(options) {
        // Process options
        this.options = options;
        const canvas = options.canvas;
        const {
            display = Display.WIDE, childName = "spectro-vis", direction = "top",   // TODO Implement Display related resize
            fftSize = 16384, sampling = 44100,
            fontFace = "Monospace", fontSize = "24", fontColor = "#777", bgColor = "#121212",
            barColor = "#ff1", peakColor = "#f11", gridColor = "#777",
            minRangeBins = 200,  // no less visible bins on highest zoom
            baseColors = [0x2f0087, 0x6200a4, 0x9200a6, 0xba2f8a, 0xd85b69, 0xee8949, 0xf6bd27, 0xe4fa15]
        } = options;

        // Resolution check
        const resOK = (canvas.clientWidth >= display.minRes.width && canvas.clientHeight >= display.minRes.height) ? true : false;

        // Adjust canvas resolution
        const dpr = window.devicePixelRatio || 1;
        // canvas.width = canvas.clientWidth * dpr;
        // canvas.height = canvas.clientHeight * dpr;
        // const ctx = canvas.getContext('2d');
        // ctx.scale(dpr, dpr);

        // Text and colors
        const look = {
            fontColor: fontColor,
            fontFace: fontFace,
            fontSize: fontSize,
            bgColor: bgColor,
            barColor: barColor,
            peakColor: peakColor,
            gridColor: gridColor,
            baseColors: baseColors,
            colorMapRange: { min: 0, max: 1 }
        }

        // Signal info
        const signal = {
            fftSize: fftSize,
            sampling: sampling,
            bins: fftSize / 2,
            fftRes: sampling / fftSize,
        }

        // Mouse events
        this.updateRange = () => { };

        // Scrolling
        canvas.addEventListener("wheel", (event) => {
            this.scaleFreqRange(event.deltaY);
        });

        // Dragging chart
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };

        canvas.addEventListener("mousedown", (event) => {
            isDragging = true;
            previousMousePosition = { x: event.clientX, y: event.clientY };
        });

        canvas.addEventListener("mousemove", (event) => {
            if (!isDragging) return;

            const deltaMove = {
                x: event.clientX - previousMousePosition.x,
                y: event.clientY - previousMousePosition.y
            };

            this.moveFreqRange(deltaMove.x * 5 + 0.5 * Math.pow(deltaMove.x, 2) * Math.sign(deltaMove.x));
            previousMousePosition = { x: event.clientX, y: event.clientY };
        });

        canvas.addEventListener("mouseup", () => {
            isDragging = false;
        });
        canvas.addEventListener("mouseleave", () => {
            isDragging = false;
        });

        this.removeListeners = ()=>{
            const c = canvas.cloneNode(true);
            canvas.parentNode.replaceChild(c, canvas);
            this.options.canvas = c;
        }

        // Store variables
        this.vars = {};
        this.vars.logPrefix = `[${childName}]`;
        this.vars.resOK = resOK;
        this.vars.dpr = dpr;
        this.vars.aspectRatio = (display.aspectRatio === "16:9") ? 16 / 9 : (display.aspectRatio === "4:3") ? 4 / 3 : 1;
        this.vars.clientRatio = canvas.clientWidth / canvas.clientHeight;
        this.vars.clientWidth = canvas.clientWidth;
        this.vars.clientHeight = canvas.clientHeight;
        this.vars.display = display;
        this.vars.directionTop = direction === "top";
        this.vars.signal = signal;
        this.vars.zoom = {
            min: 0,
            max: signal.bins
        }
        this.vars.minRangeBins = minRangeBins;
        this.vars.look = look;

        this.needsUpdate = true;

        this.log(`Client CSS size: ${canvas.clientWidth}x${canvas.clientHeight} (DPR: ${dpr})`);
        this.log(signal)
    }

    setBaseColors(baseColors) {
        try {
            if (!Array.isArray(baseColors)) {
                throw new Error("baseColors must be an array");
            }
            if (baseColors.length !== 8) {
                throw new Error("baseColors must contain exactly 8 color values");
            }
            this.vars.look.baseColors = baseColors;
        } catch (error) {
            console.error("Error in setBaseColors:", error.message);
        }
    }

    setColorMapRange(min = 0.0, max = 1.0) {
        try {
            if (typeof min !== 'number' || typeof max !== 'number') {
                throw new Error("min and max must be numbers");
            }
            if (min < 0 || min > 1 || max < 0 || max > 1) {
                throw new Error("min and max must be between 0 and 1");
            }
            if (min > max) {
                throw new Error("min should be less than or equal to max");
            }
            this.vars.look.colorMapRange = { min: min, max: max };
        } catch (error) {
            console.error("Error in setColorMapRange:", error.message);
        }
    }

    setSampling(sps) {
        this.vars.signal.sampling = sps;
        this.vars.signal.fftRes = sps / this.vars.signal.fftSize;
        this.log(this.vars.signal);
    }

    step(row) {

    }

    reset() {

    }

    setVisibleRows(rows) {

    }

    setFreqRange(fmin, fmax) {
        // this.log(`${fmin} , ${this.vars.signal.fftRes}`)
        const min = Math.floor(fmin / this.vars.signal.fftRes);
        const max = Math.ceil(fmax / this.vars.signal.fftRes);
        if (min >= 0 && fmin < fmax && min < this.vars.signal.bins && max > 0 && max <= this.vars.signal.bins) {
            this.vars.zoom = { min: min, max: max };
            this.needsUpdate = true;
        }
        else {
            this.log(`Wrong freq. range parameters (${min},${max})`, "\u{26A0}");
        }
    }

    scaleFreqRange(delta) {
        const scale = (delta < 0) ? 0.5 : 2;
        const z0 = this.vars.zoom;
        const d = (z0.max - z0.min) * scale;
        const p0 = (z0.max + z0.min) / 2;
        const min = p0 - d / 2;
        const max = p0 + d / 2;
        if (max - min < this.vars.minRangeBins) {
            this.vars.zoom.min = p0 - this.vars.minRangeBins / 2;
            this.vars.zoom.max = p0 + this.vars.minRangeBins / 2;
            this.needsUpdate = true;
        }
        else if (max > this.vars.signal.bins && min >= 0) {
            this.vars.zoom.min = min;
            this.vars.zoom.max = this.vars.signal.bins;
            this.needsUpdate = true;
        }
        else if (max <= this.vars.signal.bins && min < 0) {
            this.vars.zoom.min = 0;
            this.vars.zoom.max = max;
            this.needsUpdate = true;
        }
        else if (max > this.vars.signal.bins && min < 0) {
            this.vars.zoom.min = 0;
            this.vars.zoom.max = this.vars.signal.bins;
            this.needsUpdate = true;
        }
        else if (max <= this.vars.signal.bins && min >= 0) {
            this.vars.zoom.min = min;
            this.vars.zoom.max = max;
            this.needsUpdate = true;
        }
        // this.log(`${min}, ${max}, ${scale}`)
    }

    moveFreqRange(delta) {
        const range = this.vars.zoom.max - this.vars.zoom.min;
        // this.log(`${delta}, ${range}`)
        if (delta < 0) {
            this.vars.zoom.max = (this.vars.zoom.max - delta <= this.vars.signal.bins) ? this.vars.zoom.max - delta : this.vars.signal.bins;
            this.vars.zoom.min = this.vars.zoom.max - range;
            this.needsUpdate = true;
        }
        else if (delta > 0) {
            this.vars.zoom.min = (this.vars.zoom.min - delta >= 0) ? this.vars.zoom.min - delta : 0;
            this.vars.zoom.max = this.vars.zoom.min + range;
            this.needsUpdate = true;
        }
    }

    dispose() {
        this.removeListeners();
    }

    log(msg, symbol = "\u{1F6E0}") {    // TODO: allow multiple objects
        if (typeof msg === "object") {
            console.log(`${symbol} ${this.vars.logPrefix}`, msg);
        }
        else console.log(`${symbol} ${this.vars.logPrefix} ${msg}`);
    }

}