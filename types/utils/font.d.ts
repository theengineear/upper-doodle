/**
 * Font loading utilities for UpperDoodle
 */
export class Font {
    /** @type {boolean} */
    static "__#private@#loaded": boolean;
    /**
     * Load Excalifont if not already loaded
     *
     * Uses the FontFace API to load fonts globally since Shadow DOM @font-face
     * doesn't work reliably. This is a singleton pattern - the font is only
     * loaded once regardless of how many times this method is called.
     *
     * TODO: Is there a way to _not_ inject this into the global document?
     *
     * @returns {void}
     */
    static load(): void;
}
