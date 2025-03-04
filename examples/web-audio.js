let audioContext = null;
let activeAnalyser = null;
let activeStream = null;
let isDeviceEnabled = false;

let audioFileContext = null;
let audioBufferSource = null;
let audioBuffer = null;
let filePlaying = false;
let fileSampling = null;

let fftSize = null; // required size of fft
let devSelected = null; // call when device or file is selected
let stopUpdate = null; // call to stop updates

async function initAudio(_fftSize, _devSelected, _stopUpdate) {
    fftSize = _fftSize;
    devSelected = _devSelected;
    stopUpdate = _stopUpdate;

    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioDevices = devices.filter(device => device.kind === "audioinput");
        const swEnabled = document.getElementById("enableInput");
        const select = document.getElementById("inputSelect");
        const fileInput = document.getElementById("file");
        const rangeInput = document.getElementById("rangeInput");
        const rLabel = document.getElementById("rLabel");
        const bRun = document.getElementById("bRun");
        const bPause = document.getElementById("bPause");
        const bStop = document.getElementById("bStop");

        if (audioDevices.length === 0) {
            select.innerHTML = "<option value='' selected>No devices</option>";
        }
        else {
            audioDevices.forEach((device, index) => {
                const option = document.createElement("option");
                option.value = device.deviceId;
                option.textContent = device.label || `Device ${index + 1}`;
                select.appendChild(option);
            });

            swEnabled.onchange = async () => {
                if (swEnabled.checked) {
                    await useDevice(select.value);
                } else {
                    stopDevice();
                }
            };

            select.onchange = () => {
                swEnabled.checked = false;
                stopDevice();
            };

        }

        fileInput.onchange = async (event) => {
            const file = event.target.files[0];
            if (file) {
                swEnabled.checked = false;
                stopDevice();
                stopAudioFile(false);
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const arrayBuffer = e.target.result;
                    let sampleRate = null;
                    if (file.name.endsWith(".wav") || file.type === "audio/wav") {
                        const dataView = new DataView(arrayBuffer);
                        // WAV format: Sample rate is at byte offset 24, stored as a 32-bit little-endian integer
                        sampleRate = dataView.getUint32(24, true);
                        console.log(`WAV File Detected: ${file.name}`);
                        console.log(`Sample Rate: ${sampleRate} Hz`);
                    }
                    fileSampling = sampleRate;
                    audioFileContext = new (window.AudioContext || window.webkitAudioContext)({
                        sampleRate: sampleRate || undefined // keep original sample rate or default when not privided !
                    });
                    updateLabel("Loading audio data ...")
                    audioFileContext.decodeAudioData(arrayBuffer, (buffer) => {
                        audioBuffer = buffer;
                        rangeInput.max = Math.floor(buffer.duration);
                        console.log("duration: " + buffer.duration)
                        rangeInput.value = 0;
                        updateLabel(0);
                        console.log(`Sample Rate from Web Audio API: ${buffer.sampleRate} Hz`);
                        console.log("Audio file loaded:", file.name);
                    });
                };
                reader.readAsArrayBuffer(file);
            }
        };

        bRun.onclick = () => {
            if (audioBuffer && !filePlaying) {
                swEnabled.checked = false;
                stopDevice();
                playAudioFile(parseFloat(rangeInput.value));
                if (audioFileContext) {
                    stopUpdate();
                    devSelected(audioFileContext.sampleRate);
                }
            }
        };

        bStop.onclick = () => {
            stopAudioFile();
        };

        bPause.onclick = () => {
            pauseAudioFile();
        };

        rangeInput.oninput = () => {
            if (!filePlaying) {
                let t = parseFloat(rangeInput.value);
                updateLabel(t);
            }
        };

    } catch (error) {
        console.error("Error getting devices:", error);
    }
}

async function useDevice(deviceId) {
    try {
        stopAudioFile();
        stopDevice();

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: deviceId ? { exact: deviceId } : undefined }
        });

        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const sampling = audioContext.sampleRate;
        stopUpdate();
        devSelected(sampling);

        const source = audioContext.createMediaStreamSource(stream);

        activeAnalyser = audioContext.createAnalyser();
        activeAnalyser.fftSize = fftSize;
        activeAnalyser.smoothingTimeConstant = 0;

        source.connect(activeAnalyser);
        activeStream = stream;

        isDeviceEnabled = true;

        if (activeAnalyser) {
            let analyser = activeAnalyser;
            const maxdB = analyser.maxDecibels;
            const mindB = analyser.minDecibels;
            const bufferLength = analyser.frequencyBinCount;
            window.freqData = new Float32Array(bufferLength);

            function update() {
                if (!isDeviceEnabled) return;
                requestAnimationFrame(update);
                analyser.getFloatFrequencyData(window.freqData);
                for (let i = 0; i < window.freqData.length; i++) {
                    window.freqData[i] = (window.freqData[i] - mindB) / (maxdB - mindB);
                }
                window.freqData = window.freqData.map(v => Math.max(0, Math.min(1, v)));
            }

            update();
        }

        console.log("Microphone Enabled");
    } catch (error) {
        console.error("Error enabling microphone:", error);
    }
}

function stopDevice() {
    if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
        activeStream = null;
    }

    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }

    activeAnalyser = null;
    isDeviceEnabled = false;

    if (stopUpdate) {
        stopUpdate();
    }

    console.log("Microphone Disabled");
}

function playAudioFile(startTime = 0) {
    if (!audioBuffer || !audioFileContext) return;

    if (audioFileContext.state === "suspended") {
        audioFileContext.resume().then(() => {
            filePlaying = true;
            console.log("Audio resumed.");
            updateRange();
        });
    }

    if (audioFileContext) {
        audioFileContext.close();
    }
    audioFileContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: fileSampling
    });

    audioBufferSource = audioFileContext.createBufferSource();
    audioBufferSource.buffer = audioBuffer;

    activeAnalyser = audioFileContext.createAnalyser();
    activeAnalyser.fftSize = fftSize;
    activeAnalyser.smoothingTimeConstant = 0;

    audioBufferSource.connect(activeAnalyser);
    activeAnalyser.connect(audioFileContext.destination);
    audioBufferSource.start(0, startTime);
    filePlaying = true;

    function updateRange() {
        if (!filePlaying) return;

        const duration = audioBuffer.duration;
        const rangeInput = document.getElementById("rangeInput");

        requestAnimationFrame(updateRange);
        const currentTime = audioFileContext.currentTime + startTime;
        rangeInput.value = Math.floor(currentTime);
        updateLabel(currentTime);

        if (activeAnalyser) {
            let analyser = activeAnalyser;
            const maxdB = analyser.maxDecibels;
            const mindB = analyser.minDecibels;
            const bufferLength = analyser.frequencyBinCount;
            window.freqData = new Float32Array(bufferLength);
            analyser.getFloatFrequencyData(window.freqData);
            for (let i = 0; i < window.freqData.length; i++) {
                window.freqData[i] = (window.freqData[i] - mindB) / (maxdB - mindB);
            }
            window.freqData = window.freqData.map(v => Math.max(0, Math.min(1, v)));
        }

        if (currentTime >= duration) {
            stopAudioFile();
        }
    }

    updateRange();

    audioBufferSource.onended = () => {
        stopAudioFile();
    };
}

function stopAudioFile(clear = true) {
    if (audioBufferSource) {
        audioBufferSource.stop();
        audioBufferSource.disconnect();
        audioBufferSource = null;
    }

    filePlaying = false;

    if (audioFileContext) {
        stopUpdate();
        audioFileContext.close();
        audioFileContext = null;
    }
    if (clear === true) {
        document.getElementById("file").value = "";
    }
    document.getElementById("rangeInput").value = 0;
    updateLabel(0);
    console.log("Audio file stopped.");
}

function pauseAudioFile() {
    if (audioFileContext && filePlaying) {
        audioFileContext.suspend().then(() => {
            stopUpdate();
            filePlaying = false;
            console.log("Audio paused.");
        });
    }
}

function updateLabel(seconds) {
    const rLabel = document.getElementById("rLabel");
    if (typeof seconds === 'string') {
        rLabel.innerHTML = seconds;
    } else {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        rLabel.innerHTML = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

}

function stopAudio(){
    const swEnabled = document.getElementById("enableInput");
    if (swEnabled) {
        swEnabled.checked = false;
    }
    stopAudioFile(true);
}
