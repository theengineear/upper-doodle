import Excalifont from '../vendor/excalifont.js';

/**
 * Font loading utilities for UpperDoodle
 */
export class Font {
  /** @type {boolean} */
  static #loaded = false;

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
  static load() {
    if (!Font.#loaded) {
      Font.#loaded = true;
      const font = new FontFace(
        'Excalifont',
        `url(data:font/woff2;base64,${Excalifont}) format('woff2')`,
        { weight: '400', style: 'normal' }
      );
      font.load().then((loadedFont) => {
        document.fonts.add(loadedFont);
      }).catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Failed to load Excalifont:', error);
      });
    }
  }
}
