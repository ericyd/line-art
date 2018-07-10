// DRAWINGS
// ================

class Drawing {
  constructor(canvasID) {
    this.canvas = document.getElementById(canvasID);
    this.ctx = this.canvas.getContext('2d');
    this.params = {};
    this.radius = Math.max(this.canvas.width, this.canvas.height) / 2.1;
    this.offsetPoint = val => val + this.canvas.width / 2;

    // TODO: figure out best way to apply lineWidth to pixels drawnn on imageData
    this.useImageData = false;
    this.imageData = this.ctx.createImageData(
      this.canvas.width,
      this.canvas.height
    );
    // this.canvas.addEventListener('mousemove', this.logDataOnHover.bind(this));

    return this;
  }

  // currently not used, but could be useful for debugging
  logDataOnHover(event) {
    var x = event.layerX;
    var y = event.layerY;
    var pixel = this.ctx.getImageData(x, y, 1, 1);
    var data = pixel.data;
    var rgba1 =
      'rgba(' +
      data[0] +
      ', ' +
      data[1] +
      ', ' +
      data[2] +
      ', ' +
      data[3] +
      ')';
    console.log(rgba1);
  }

  drawPixel(x, y, r, g, b, a) {
    // if x and y are not rounded this returns very inaccurate results (why?)
    var index = (Math.round(y) * this.canvas.width + Math.round(x)) * 4;
    this.imageData.data[index + 0] = r;
    this.imageData.data[index + 1] = g;
    this.imageData.data[index + 2] = b;
    this.imageData.data[index + 3] = a;
  }

  drawDotsImageData() {
    // get imageData here to capture background color;
    this.imageData = this.ctx.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );
    for (let t = 0; t <= this.max; t += this.increment) {
      var x = this.xScale(t);
      var y = this.yScale(t);
      var [r, g, b] = this.getPixelColor(t);
      this.drawPixel(x, y, r, g, b, 255);
    }
    this.ctx.putImageData(this.imageData, 0, 0);
    return this;
  }

  drawDots() {
    for (let t = 0; t <= this.max; t += this.increment) {
      var x = this.xScale(t) /*  * osc(i / xModDepth) */;
      var y = this.yScale(t) /*  * osc(i / yModDepth) */;
      this.ctx.fillStyle = this.getLineColor(t);
      this.ctx.fillRect(x, y, this.lineWidth, this.lineWidth);
    }
    return this;
  }

  drawLines() {
    this.ctx.lineWidth = this.lineWidth;
    for (let t = 0; t <= this.max; t += this.increment) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.x, this.y);
      var xTemp = this.xScale(t);
      var yTemp = this.yScale(t);
      this.ctx.lineTo(xTemp, yTemp);
      this.ctx.strokeStyle = this.getLineColor(t);
      this.ctx.stroke();
      this.ctx.closePath();
      this.x = xTemp;
      this.y = yTemp;
    }
    return this;
  }

  draw() {
    // clear any previous canvas data and fill bg white
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = this.params.bgColor.value;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    // set defaults
    this.ctx.strokeStyle = this.getLineColor(0);
    this.ctx.fillStyle = this.getLineColor(0);

    if (this.params.solid.value) {
      this.x = this.xScale(0);
      this.y = this.yScale(0);
      return this.drawLines();
    } else if (this.useImageData) {
      return this.drawDotsImageData();
    } else {
      return this.drawDots();
    }
  }

  update() {
    this.setEquations().draw();
  }

  /**
   * Set drawing functions
   * Must set params before calling
   */
  setEquations() {
    this.xScale = t =>
      this.offsetPoint(
        Math.sin(t) *
          this.radius *
          this.params.oscillatorY.value(t * this.params.xModDepth.value)
      );
    this.yScale = t =>
      this.offsetPoint(
        Math.cos(t) *
          this.radius *
          this.params.oscillatorX.value(t * this.params.yModDepth.value)
      );
    this.max = Math.PI * this.params.len.value;
    this.getLineColor = this.params.lineColor.value(this.max, 0);
    // pixelColor is used when drawing with imageData because individual channels are required
    // could consider refactoring the factory to return channels by default and then transform as needed
    this.getPixelColor = this.params.lineColor.value(this.max, 0, {
      returnChannels: true
    });
    this.lineWidth = this.params.width.value;
    this.increment = 1 / this.params.resolution.value;
    return this;
  }
}

export class Thumbnail extends Drawing {
  constructor(canvasID, mainCanvas) {
    super(canvasID);
    this.canvas.addEventListener('click', this.onClick.bind(this));
    this.values = {};
    this.mainCanvas = mainCanvas;
  }

  onClick(e) {
    document.getElementById('mainCanvasControls').classList.remove('hide');
    Object.values(this.params).forEach(param => {
      param.setValue(this.values[param.param]);
    });
    this.mainCanvas.setParams(this.params).update();
  }

  /**
   * @param {string} param
   * @param {any} value
   */
  cacheValue(param, value) {
    this.values[param] = value;
  }

  /**
   * @param {Object} params
   */
  setParams(params) {
    Object.values(params).forEach(param => {
      param.generate();
      this.cacheValue(param.param, param.rawValue);
    });
    this.params = params;
    return this;
  }
}

export class MainCanvas extends Drawing {
  constructor(canvasID) {
    super(canvasID);
  }

  /**
   * @param {Object} params
   */
  setParams(params) {
    Object.values(params).forEach(param => {
      param.on('update', this.update.bind(this));
    });
    this.params = params;
    return this;
  }
}
