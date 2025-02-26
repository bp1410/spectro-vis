/**
 * Base class for all spectrogram implementations.
 */
export class Spectrogram {
  /**
   * Creates a new instance of the Spectrogram class.
   *
   * @param options - Configuration options for the spectrogram, including the canvas element.
   */
  constructor(options: SpectrogramOptions);

  /**
   * Processes a single row of data for the spectrogram.
   *
   * @param row - The FFT data row to process.
   */
  step(row: any): void;

  /**
   * Resets the spectrogram to its initial state.
   */
  reset(): void;

  /**
   * Sets the number of visible rows in the spectrogram.
   *
   * @param rows - The number of rows to make visible.
   */
  setVisibleRows(rows: number): void;

  /**
   * Sets the frequency range for the spectrogram.
   *
   * @param min - The minimum frequency in Hz.
   * @param max - The maximum frequency in Hz.
   */
  setFreqRange(min: number, max: number): void;

  /**
   * Disposes of the spectrogram instance and releases any associated resources.
   */
  dispose(): void;
}

/**
* Options for configuring the spectrogram.
*/
export interface SpectrogramOptions {
  /**
   * The HTML canvas element where the spectrogram will be rendered.
   */
  canvas: HTMLCanvasElement;

  /**
   * The FFT size used for spectral analysis.
   * Default: 16384
   */
  fftSize?: number;

  /**
   * The sampling rate in Hz.
   * Default: 44100
   */
  sampling?: number;

  /**
   * The font family for text rendering.
   * Default: "Monospace"
   */
  fontFace?: string;

  /**
   * The font size for text rendering.
   * Default: "24"
   */
  fontSize?: string;

  /**
   * The color of the text.
   * Default: "#777"
   */
  fontColor?: string;

  /**
   * The background color of the spectrogram.
   * Default: "#121212"
   */
  bgColor?: string;
}

/**
* Three.js-based implementation of the Spectrogram.
*/
export class SpectrogramThree extends Spectrogram {}
