/*
	This code was taken from https://github.com/cbrandolino/camvas and modified to suit our needs
*/
/*
Copyright (c) 2012 Claudio Brandolino

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
// The function takes a canvas context and a `drawFunc` function.
// `drawFunc` receives two parameters, the video and the time since
// the last time it was called.
export class Camvas {
  constructor(ctx,callback) {
    this.ctx = ctx;
    this.callback = callback;

    // We can't `new Video()` yet, so we'll resort to the vintage
    // "hidden div" hack for dynamic loading.
    let streamContainer = document.createElement('div');
    this.video = document.createElement('video');
  
    // If we don't do this, the stream will not be played.
    // By the way, the play and pause controls work as usual 
    // for streamed videos.
    this.video.setAttribute('autoplay', '1');
    this.video.setAttribute('playsinline', '1'); // important for iPhones
  
    // The video should fill out all of the canvas
    this.video.setAttribute('width', 1);
    this.video.setAttribute('height', 1);
  
    streamContainer.appendChild(this.video);
    document.body.appendChild(streamContainer);
  
    // The callback happens when we are starting to stream the video.
    navigator.mediaDevices.getUserMedia({video: true, audio: false}).then((stream) => {
      // Yay, now our webcam input is treated as a normal video and
      // we can start having fun
      this.video.srcObject = stream;
      // Let's start drawing the canvas!
      this.update();
    }, (err) => {
      throw err;
    });
  }
  update = () => {
    let last = Date.now()
    const loop = () => {
      // For some effects, you might want to know how much time is passed
      // since the last frame; that's why we pass along a Delta time `dt`
      // variable (expressed in milliseconds)
      var dt = Date.now() - last
      this.callback(this.video, dt)
      last = Date.now()
      requestAnimationFrame(loop) 
    }
    loop();
  } 
}