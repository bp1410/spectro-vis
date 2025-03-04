# spectro-vis v0.1.0

# Usage:

```javascript
import { SpectrogramThree } from '@bp1410/spectro-vis';

const spectrogram = new SpectrogramThree({
    canvas: canvas,
    fftSize: 16384,
    sampling: 44100,
    fontFace: "Monospace",
    fontSize: "24",
    fontColor: "#777",
    bgColor: "#121212",
    barColor: "#ff1",
    peakColor: "#f11",
    gridColor: "#777",
});

// Update the spectrogram with new data
spectrogram.step(fftRow);

// Reset the spectrogram
spectrogram.reset();

// Set visible rows in the spectrogram
spectrogram.setVisibleRows(200);

// Adjust frequency range
spectrogram.setFreqRange(1000, 5000);

// Set a custom color map (8 colors required)
spectrogram.setBaseColors([0x440154, 0x482777, 0x3F4A8A, 0x31678E, 0x26838F, 0x1F9D88, 0x6CCE5A, 0xFDE725]);

// Adjust the color mapping range (normalized between 0 and 1)
spectrogram.setColorMapRange(0.2, 0.8);

// Dispose of the spectrogram instance when no longer needed
spectrogram.dispose();
```


