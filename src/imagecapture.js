export let ImageCapture = window.ImageCapture;
export let ImageCaptureError = window.ImageCaptureError;

if (typeof ImageCapture === 'undefined') {
  /**
   * https://www.w3.org/TR/image-capture/#ImageCaptureError
   * @type {{}} TODO
   */
  ImageCaptureError = class {
    constructor(errorDescription) {
      // https://www.w3.org/TR/image-capture/#dom-imagecaptureerror-errordescription
      this._errorDescription = errorDescription;
    }

    /**
     * @return {DOMString} Acceptable values: FRAME_ERROR, OPTIONS_ERROR, PHOTO_ERROR, INVALID_TRACK, and ERROR_UNKNOWN
     */
    get errorDescription() {
      return this._errorDescription;
    }

    toString() {
      return this._errorDescription;
    }
  };

  ImageCapture = class {

    /**
     * TODO https://www.w3.org/TR/image-capture/#constructors
     *
     * @param {MediaStreamTrack} videoStreamTrack - A MediaStreamTrack of the 'video' kind
     */
    constructor(videoStreamTrack) {
      if (videoStreamTrack.kind !== 'video')
        throw new DOMException('NotSupportedError');

      this._videoStreamTrack = videoStreamTrack;
      // MediaStream constructor not available until Chrome 55 - https://www.chromestatus.com/feature/5912172546752512
      this._previewStream = new MediaStream([videoStreamTrack]);
      this.videoElement = document.createElement('video');
      this.videoElement.src = URL.createObjectURL(this._previewStream);
      this.videoElement.muted = true;
      this.videoElement.play();  // required by Firefox

      this.canvasElement = document.createElement('canvas');
      // TODO Firefox has https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas
      this.canvas2dContext = this.canvasElement.getContext('2d');
    }

    /**
     * https://w3c.github.io/mediacapture-image/index.html#dom-imagecapture-videostreamtrack
     * @return {MediaStreamTrack} The MediaStreamTrack passed into the constructor
     */
    get videoStreamTrack() {
      return this._videoStreamTrack;
    }

    /**
     * https://w3c.github.io/mediacapture-image/index.html#dom-imagecapture-previewstream
     * @return {MediaStream} The MediaStream that provides a camera preview
     */
    get previewStream() {
      return this._previewStream;
    }

    /**
     * Implements https://www.w3.org/TR/image-capture/#dom-imagecapture-getphotocapabilities
     * @return {Promise<PhotoCapabilities>} Fulfilled promise with [PhotoCapabilities](https://www.w3.org/TR/image-capture/#idl-def-photocapabilities) object on success, rejected promise on failure
     */
    getPhotoCapabilities() {
      return new Promise(function (resolve, reject) {
        // TODO
        let MediaSettingsRange = {
          current: 0, min: 0, max: 0
        };
        resolve({
          exposureCompensation: MediaSettingsRange,
          exposureMode: 'none',
          fillLightMode: 'none',
          focusMode: 'none',
          imageHeight: MediaSettingsRange,
          imageWidth: MediaSettingsRange,
          iso: MediaSettingsRange,
          redEyeReduction: false,
          whiteBalanceMode: 'none',
          zoom: MediaSettingsRange
        });
        reject(new ImageCaptureError('OPTIONS_ERROR'));
      });
    }

    /**
     * Implements https://www.w3.org/TR/image-capture/#dom-imagecapture-setoptions
     * @param {Object} photoSettings - Photo settings dictionary, https://www.w3.org/TR/image-capture/#idl-def-photosettings
     * @return {Promise<void>} Fulfilled promise on success, rejected promise on failure
     */
    setOptions(photoSettings = {}) {
      return new Promise(function (resolve, reject) {
        // TODO
      });
    }

    /**
     * TODO
     * Implements https://www.w3.org/TR/image-capture/#dom-imagecapture-takephoto
     * @param {Object} photoSettings - Photo settings dictionary, https://www.w3.org/TR/image-capture/#idl-def-photosettings
     * @return {Promise<Blob>} Fulfilled promise with [Blob](https://www.w3.org/TR/FileAPI/#blob) argument on success; rejected promise on failure
     */
    takePhoto(photoSettings = {}) {
      let self = this;
      return new Promise(function (resolve, reject) {
        if (!('readyState' in self._videoStreamTrack)) {
          // Polyfill for Firefox
          self._videoStreamTrack.readyState = 'live';
        }

        // "If the readyState of the MediaStreamTrack provided in the constructor is not 'live',
        // the UA must return a promise rejected with a newly created ImageCaptureError object
        // whose errorDescription is set to INVALID_TRACK."
        if (self._videoStreamTrack.readyState === 'live') {
          // -- however, checking for `live` alone doesn't guarantee the video is ready
          if (self.videoElement.videoWidth) {
            try {
              self.canvasElement.width = self.videoElement.videoWidth;
              self.canvasElement.height = self.videoElement.videoHeight;
              self.canvas2dContext.drawImage(self.videoElement, 0, 0);
              // TODO polyfill photoSettings
              self.canvasElement.toBlob(blob => {
                resolve(blob);
              });
            } catch (error) {
              reject(new ImageCaptureError('PHOTO_ERROR'));
            }
          } else {
            reject(new ImageCaptureError('PHOTO_ERROR'));
          }
        } else {
          reject(new ImageCaptureError('INVALID_TRACK'));
        }
      });
    }

    /**
     * Implements https://www.w3.org/TR/image-capture/#dom-imagecapture-grabframe
     * @return {Promise<ImageBitmap>} Fulfilled promise with [ImageBitmap](https://www.w3.org/TR/html51/webappapis.html#webappapis-images) argument on success; rejected promise on failure
     */
    grabFrame() {
      let self = this;
      return new Promise(function (resolve, reject) {
        if (!('readyState' in self._videoStreamTrack))
          self._videoStreamTrack.readyState = 'live';

        if (self._videoStreamTrack.readyState === 'live') {
          if (self.videoElement.videoWidth) {
            try {
              // videoWidth is available after videoElement.onloadedmetadata fires
              self.canvasElement.width = self.videoElement.videoWidth;
              self.canvasElement.height = self.videoElement.videoHeight;
              // The video has an image after videoElement.oncanplay triggers
              self.canvas2dContext.drawImage(self.videoElement, 0, 0);
              // TODO polyfill https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmapFactories/createImageBitmap for IE
              resolve(window.createImageBitmap(self.canvasElement));
            } catch (error) {
              reject(new ImageCaptureError('FRAME_ERROR'));
            }
          } else {
            reject(new ImageCaptureError('FRAME_ERROR'));
          }
        } else {
          reject(new ImageCaptureError('INVALID_TRACK'));
        }
      });
    }

  };
}
