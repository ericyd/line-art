import { Parameter } from './parameter';

// DRAWINGS
// ================

class Drawing {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  params: { [s: string]: Parameter }; // TODO: make more descriptive
  radius: number;
  useImageData: boolean;
  imageData: ImageData;
  xScale: (number) => number;
  yScale: (number) => number;
  max: number;
  getLineColor: (number) => string;
  getPixelColor: (number) => Array<number>;
  lineWidth: number;
  increment: number;
  offsetPoint: (number) => number;
  x: number;
  y: number;
  constructor(canvasID) {
    this.canvas = <HTMLCanvasElement>document.getElementById(canvasID);
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
    var index = (y * this.canvas.width + x) * 4;
    this.imageData.data[index + 0] = r;
    this.imageData.data[index + 1] = g;
    this.imageData.data[index + 2] = b;
    this.imageData.data[index + 3] = a;
  }

  // this method has some serious issues:
  // 1. the pixels are aliased
  // 2. the lineWidth is very challenging to modulate
  //     it might require a combination of spreading the x/y and adjusting the alpha
  // 3. testing it's performance would be challenging, and all of these custom
  //     functions may well be slower
  // Therefore putting on hold for now
  drawDotsImageData() {
    // get imageData here to capture background color;
    this.imageData = this.ctx.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );
    for (let t = 0; t <= this.max; t += this.increment) {
      // if x and y are not rounded, the pixel indexing is very inaccurate (why?)
      var x = Math.round(this.xScale(t));
      var y = Math.round(this.yScale(t));
      var [r, g, b] = this.getPixelColor(t);
      var spread = Math.floor(this.lineWidth / 3);
      for (let i = x - spread; i <= x + spread; i++) {
        for (let j = y - spread; j <= y + spread; j++) {
          this.drawPixel(i, j, r, g, b, 255);
        }
      }
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
      // console.log(this.x, this.y);
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
  values: { [s: string]: number };
  constructor(canvasID: string, public mainCanvas: MainCanvas) {
    super(canvasID);
    this.canvas.addEventListener('click', this.onClick.bind(this));
    this.values = {};
  }

  onClick(e) {
    document.getElementById('mainCanvasControls').classList.remove('hide');
    Object.keys(this.params).forEach(key => {
      const param = this.params[key];
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
  setParams(params, generate: boolean) {
    Object.keys(params).forEach(key => {
      const param = params[key];
      if (generate) {
        param.generate();
      }
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
    Object.keys(params).forEach(key => {
      const param = params[key];
      param.on('update', this.update.bind(this));
    });
    this.params = params;
    return this;
  }
}

export class Harmonograph extends MainCanvas {
  p1: number;
  p2: number;
  p3: number;
  p4: number;
  f1: number;
  f2: number;
  f3: number;
  f4: number;
  a1: number;
  a2: number;
  a3: number;
  a4: number;
  d1: number;
  d2: number;
  d3: number;
  d4: number;
  constructor(canvasID) {
    super(canvasID);
  }

  /**
   * Set drawing functions
   * Must set params before calling
   */
  setEquations() {
    this.a1 = this.params.a1.value;
    this.a2 = this.params.a2.value;
    this.a3 = this.params.a3.value;
    this.a4 = this.params.a4.value;
    this.f1 = this.params.f1.value;
    this.f2 = this.params.f2.value;
    this.f3 = this.params.f3.value;
    this.f4 = this.params.f4.value;
    this.p1 = this.params.p1.value;
    this.p2 = this.params.p2.value;
    this.p3 = this.params.p3.value;
    this.p4 = this.params.p4.value;
    this.d1 = this.params.d1.value;
    this.d2 = this.params.d2.value;
    this.d3 = this.params.d3.value;
    this.d4 = this.params.d4.value;

    // equations taken straight from the source
    // https://en.wikipedia.org/wiki/Harmonograph
    this.xScale = t =>
      this.offsetPoint(
        this.a1 * Math.sin(t * this.f1 + this.p1) * Math.pow(Math.E, (-this.d1 * t)) + this.a2 * Math.sin(t * this.f2 + this.p2) * Math.pow(Math.E, (-this.d2 * t))
      );
    this.yScale = t =>
      this.offsetPoint(
      this.a3 * Math.sin(t * this.f3 + this.p3) * Math.pow(Math.E, (-this.d3 * t)) + this.a4 * Math.sin(t * this.f4 + this.p4) * Math.pow(Math.E, (-this.d4 * t))
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
