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
   * Processes a single row of FFT data for the spectrogram.
   *
   * @param row - A Float32Array containing FFT data values.
   */
  step(row: Float32Array): void;

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
   * Sets a custom color map for the spectrogram.
   * The color map must contain exactly 8 color values.
   * Colors can be in hexadecimal format (e.g., `0xff0000`) or as CSS color strings (e.g., `"#ff0000"`).
   *
   * @param baseColors - An array of 8 colors as hex numbers or CSS strings.
   */
  setBaseColors(baseColors: (number | string)[]): void;

  /**
   * Adjusts the color mapping range for the spectrogram.
   * The values must be normalized between 0.0 and 1.0.
   *
   * @param min - The minimum value of the color range (0.0 - 1.0).
   * @param max - The maximum value of the color range (0.0 - 1.0).
   */
  setColorMapRange(min: number, max: number): void;

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

  /**
   * The color of the spectrogram bars.
   * Default: "#ff1"
   */
  barColor?: string;

  /**
   * The color of the peak intensity indicators.
   * Default: "#f11"
   */
  peakColor?: string;

  /**
   * The color of the grid lines in the spectrogram.
   * Default: "#777"
   */
  gridColor?: string;

  /**
   * The base color map used for visualizing intensity.
   * Must contain exactly 8 color values.
   * Colors can be hex numbers (`0xff0000`) or CSS strings (`"#ff0000"`).
   * Default: Viridis colormap.
   */
  baseColors?: (number | string)[];

  /**
   * The color mapping range, normalized between 0 and 1.
   * Default: { min: 0, max: 1 }
   */
  colorMapRange?: { min: number; max: number };
}

/**
 * Three.js-based implementation of the Spectrogram.
 */
export class SpectrogramThree extends Spectrogram {}
