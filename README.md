# spectro-vis v0.0.1

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
});

// Update the spectrogram with new data
spectrogram.step(fftRow);

// Reset the spectrogram
spectrogram.reset();

// Set visible rows in the spectrogram
spectrogram.setVisibleRows(200);

// Adjust frequency range
spectrogram.setFreqRange(1000, 5000);

// Dispose of the spectrogram instance when no longer needed
spectrogram.dispose();
```


