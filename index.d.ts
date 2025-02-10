// index.d.ts

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
     * @param row - The data row to process (type can be defined based on your data structure).
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
     * @param min - The minimum frequency.
     * @param max - The maximum frequency.
     */
    setFreqRange(min: number, max: number): void;
  
    /**
     * Destroys the spectrogram instance and releases any associated resources.
     */
    destroy(): void;
  
    /**
     * Options for the spectrogram instance.
     */
    protected options: SpectrogramOptions;
  
    /**
     * Internal state variables for the spectrogram.
     */
    protected vars: { [key: string]: any };
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
     * Additional options for customization.
     */
    [key: string]: any;
  }
  
  /**
   * Three.js-based implementation of the Spectrogram.
   */
  export class SpectrogramThree extends Spectrogram {}
  