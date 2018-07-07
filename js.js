// HELPER FUNCTIONS
// ================
var mainCanvas;

const id = x => x;

const roundN = decimals => {
  return val => {
    if (isNaN(val)) return val;
    try {
      return Math.round(val * Math.pow(10, decimals)) / Math.pow(10, decimals);
    } catch (e) {
      return val;
    }
  };
};

const round2 = roundN(2);

const round3 = roundN(3);

function toHex(value) {
  if (value > 255 || value < 0) {
    throw new Error('Please use an 8-bit value');
  }
  return Math.round(value).toString(16);
}

/**
 * Convert numeric value to an rgb hue
 *
 * There are six phases that describe the RGB range of hues.
 * All changes occur from a set "min" to a set "max" based on the desired saturation
 * 1. Blue increases
 * 2. Red decreases
 * 3. Green increases
 * 4. Blue decreases
 * 5. Red increases
 * 6. Green decreases
 * These phases can be approximated with a clipped sin function offset to different sections of its period
 *
 * @param {number} n must satisfy: nMin <= n <= nMax
 * @returns {string} `rgb(num,num,num)`
 */
function valToRGBFactory(nMax = 100, nMin = 0, {
  fixEdges = false, // show black @ nMin and white @ nMax
  useHex = false // return 6-digit hex value in form #000000
} = {}) {
  return function (n) {
    if (n < nMin || n > nMax) {
      throw new Error("n must satisfy " + nMin + " <= n <= " + nMax);
    }
    if (fixEdges) {
      if (n == nMax) {
        return "#FFFFFF";
      }
      if (n == nMin) {
        return "#000000";
      }
    }
    var n6th = (nMax - nMin) / 6;
    var n12th = n6th / 2;

    // set min/max based on desired saturation
    var min = 90;
    var max = 212;
    var range = max - min;
    var period = offset => (2 * Math.PI * offset) / nMax;
    var clip = x => (x < min ? min : x > max ? max : x);
    var rangeAdjust = x => x * range + min + range / 2;
    var channel = offset => x =>
      clip(rangeAdjust(Math.sin(x * period(1) + period(offset))));
    // the offset math is a bit opaque to me, but it works
    var r = channel(n6th * 2 - n12th);
    var g = channel(n6th * 6 - n12th);
    var b = channel(n6th * 4 - n12th);

    if (useHex) {
      return `#${toHex(r(n))}${toHex(g(n))}${toHex(b(n))}`
    }

    return `rgb(${r(n)},${g(n)},${b(n)})`;
  };
}

function download(e) {
  e.target.download = "image.png";
  e.target.href = document
    .getElementById("mainCanvas")
    .toDataURL("image/png")
    .replace(/^data:image\/[^;]/, "data:application/octet-stream");
}

function refresh(params) {
  return () => {
    document.querySelectorAll(".sidebar__thumb").forEach((el, i) => {
      new Thumbnail(el.id).setParams(params).update();
    });
  };
}

function toggleSidebar(e) {
  document.getElementById('sidebar').classList.toggle('collapsed');
  document.getElementById('sidebar').classList.toggle('expanded');
}

function toggleNextBlock(e) {
  var listener = e.currentTarget;
  listener.parentElement.classList.toggle('is-expanded');
}

// COLLECTIONS FOR OPTIONPARAMETERS
// ================

// keeping for possible future experimentation
var oldOscillators = [
  t => (Math.cos(t) + 1) / 2,
  t => Math.cos(Math.pow(t, 0.35)),
  t => (Math.sin(Math.cos(t) * Math.sin(t))) * 2,
];

// values must be functions that return a number
var oscillatorsX = [{
    id: "osc0",
    value: t => Math.sin(t),
    display: "sine"
  },
  {
    id: "osc1",
    value: t => Math.cos(t),
    display: "cosine"
  },
  {
    id: "osc2",
    value: t => (Math.sin(t) + 1) / 2,
    display: "half-sine"
  },
  {
    id: "osc3",
    value: t => Math.sin(t) * Math.pow(t, -0.35),
    display: "collapse"
  },
  {
    // based on https://en.wikipedia.org/wiki/Trochoid
    id: "osc4",
    value: t => {
      var a = 0.5;
      var b = 0.5;
      // var lambda = a / b;
      return a - b * Math.sin(t);
    },
    display: "trochoid"
  },
  {
    id: "osc5",
    // based on: https://en.wikipedia.org/wiki/Epicycloid
    value: t => {
      var r = 0.2;
      var k = 3; // number of cusps
      var R = k * r;
      // supposedly either of these two functions should work
      // return ( (r + R)*Math.cos(t) - r*Math.cos((r + R) / r * t) )
      return r * (k + 1) * Math.cos(t) - r * Math.cos((k + 1) * t);
    },
    display: "epicycloid"
  },
  {
    id: "osc6",
    value: t => Math.sin(Math.cos(Math.log10(t))),
    display: "log periodic"
  },
  {
    id: "osc7",
    value: t => Math.abs(Math.sin(t / 10)),
    display: "absolute"
  },
  {
    id: "osc8",
    value: t => {
      var start = Math.sin(t);
      if (start > 0.5) {
        return start;
      }
      return start / -3;
    },
    display: "experimental!"
  }
];

var oscillatorsY = [{
    id: "osc10",
    value: t => Math.sin(t),
    display: "sine"
  },
  {
    id: "osc11",
    value: t => Math.cos(t),
    display: "cosine"
  },
  {
    id: "osc12",
    value: t => (Math.sin(t) + 1) / 2,
    display: "half-sine"
  },
  {
    id: "osc13",
    value: t => Math.sin(t) * Math.pow(t, -0.35),
    display: "collapse"
  },
  {
    // based on https://en.wikipedia.org/wiki/Trochoid
    id: "osc14",
    value: t => {
      var a = 0.5;
      var b = 0.5;
      // var lambda = a / b;
      return a - b * Math.cos(t);
    },
    display: "trochoid"
  },
  {
    id: "osc15",
    // based on: https://en.wikipedia.org/wiki/Epicycloid
    value: t => {
      var r = 0.2;
      var k = 3; // number of cusps
      var R = k * r;
      // supposedly either of these two functions should work
      // return ( (r + R)*Math.cos(t) - r*Math.cos((r + R) / r * t) )
      return r * (k + 1) * Math.sin(t) - r * Math.sin((k + 1) * t);
    },
    display: "epicycloid"
  },
  {
    id: "osc16",
    value: t => Math.sin(Math.cos(Math.log10(t))),
    display: "log periodic"
  },
  {
    id: "osc17",
    value: t => Math.abs(Math.sin(t / 10)),
    display: "absolute"
  },
  {
    id: "osc18",
    value: t => {
      var start = Math.sin(t);
      if (start > 0.5) {
        return start;
      }
      return start / -3;
    },
    display: "experimental!"
  }];

// values must be functions that return functions that return a color
var lineColors = [{
    id: "colorize",
    value: valToRGBFactory,
    display: "colorize"
  },

  {
    id: "white",
    value: max => t => "#FFFFFF",
    display: "white"
  },
  {
    id: "black",
    value: max => t => "#000000",
    display: "black"
  }
];

// PARAMETERS
// ================

/**
 * Parameters control all the variables used in the Drawings to generate an image
 * Different kinds of parameters manage their data differently, but they share a common interface:
 *   this.controls is an array of controls that affect the parameter
 *   this.controlValue is an element to display the current value to the end user
 *   this.rawValue correlates to the current value in this.controls
 *   this.value is managed internally and correlates to the actual value used in the Drawing
 */
class Parameter {
  constructor(param, ids, rawValueType) {
    this.rawValueType = rawValueType;
    this.events = {};
    this.controls = ids.map(id => document.getElementById(id));
    try {
      this.controlValue = document.getElementById(`${param}-value`);
    } catch (e) {
      this.controlValue = null;
    }
    return this;
  }

  chance() {
    return Math.random() > 0.5;
  }

  addEventListeners() {
    this.controls.forEach(control => {
      control.addEventListener("input", this.onInput.bind(this));
    });
    return this;
  }

  on(eventName, callback) {
    this.events[eventName] = callback;
    return this;
  }

  emit(eventName, data) {
    this.events[eventName](data);
    return this;
  }

  onInput(e) {
    this.rawValue = this.rawValueType === 'number' ? Number(e.target.value) : e.target.value;
    this.update(this.rawValue);
    return this;
  }

  updateDisplay(value) {
    if (this.controlValue) {
      this.controlValue.innerText = value;
    }
    return this;
  }

  setValue(value) {
    this.rawValue = value;
    this.update(this.rawValue, false);
    if (this.setAttributes) this.setAttributes();
    return this;
  }
}

class SliderParameter extends Parameter {
  // TODO: document transformer - purpose and implementation
  constructor(
    param, {
      min,
      max,
      step,
      transformer = {
        value: id,
        position: id
      },
      generateIntegers = false,
      generate1 = false,
      animationController = false
    } = {}
  ) {
    super(param, [param], 'number');
    this.param = param;
    this.max = max;
    this.min = min;
    this.step = step;
    this.transformer = transformer;
    this.generateIntegers = generateIntegers;
    this.generate1 = generate1;
    if (animationController) {
      const range = (this.max - this.min);
      const animationContainer = document.getElementById(animationController);
      this.animation = {
        isActive: false,
        isIncrementing: true,
        now: Date.now(),
        lastRun: Date.now(),
        fps: 1000 / 30,
        step: range / 50000,
        controller: {
          run: animationContainer.querySelector('.animation-run-toggle'),
          direction: animationContainer.querySelector('.animation-direction-toggle'),
          step: animationContainer.querySelector('.animation-step')
        }
      };
      this.animate = this.animate.bind(this);
      this.animation.controller.run.addEventListener('input', this.toggleAnimation.bind(this));
      this.animation.controller.direction.addEventListener('click', this.toggleAnimationDirection.bind(this));
      this.animation.controller.step.addEventListener('input', this.updateAnimationStep.bind(this));
      this.animation.controller.step.setAttribute('max', range / 10000);
      this.animation.controller.step.setAttribute('min', range / 500000);
      this.animation.controller.step.setAttribute('step', range / 1000000);
      this.animation.controller.step.setAttribute('value', this.animation.step);
    }

    this.generate()
      .addEventListeners()
      .setAttributes()
      .updateDisplay(round2(this.value));
    return this;
  }

  setAttributes() {
    this.controls[0].setAttribute("value", this.rawValue);
    this.controls[0].setAttribute("step", this.step);
    this.controls[0].setAttribute("max", this.max);
    this.controls[0].setAttribute("min", this.min);
    return this;
  }

  update(value, emit = true) {
    this.value = this.transformer.value(Number(value));
    this.updateDisplay(round2(this.value));
    if (emit) {
      this.emit("update");
    }
    return this;
  }

  generate() {
    if (this.generateIntegers) {
      // have to call this.transformerposition here because this is
      // what we want the final result to be;
      // internally, this.value is stored as the transformed value
      var generated = this.transformer.position(
        Math.pow(
          // Math.ceil(Math.random() * 10) + (this.chance() ? 1 : -1) * Math.random() / 20, // base
          Math.ceil(Math.random() * 10) + (this.chance() ? 0.01 : -0.01), // base
          this.chance() ? -1 : 1 // exponent
        )
      );
    } else if (this.generate1) {
      var generated = 1;
    } else {
      var generated = Math.random() * (this.max - this.min) + this.min;
    }
    this.rawValue = generated;
    this.value = this.transformer.value(this.rawValue);
    return this;
  }

  toggleAnimation() {
    this.animation.isActive = !this.animation.isActive;
    this.animate();
  }

  // these don't need to be handled synchronously - effects are non-critical
  async toggleAnimationDirection() {
    this.animation.isIncrementing = !this.animation.isIncrementing;
  }

  async updateAnimationStep(e) {
    this.animation.step = Number(e.target.value);
  }

  animate() {
    if (this.animation.isActive) {
      // has enough time elapsed to update?
      this.animation.now = Date.now();
      this.animation.elapsed = this.animation.now - this.animation.lastRun;

      // if more time has elapsed than our desired framerate, then draw
      if (this.animation.elapsed > this.animation.fps) {
        // are we incrementing or decrementing?
        if (this.animation.isIncrementing && this.rawValue >= this.max) {
          this.animation.isIncrementing = false;
        } else if (!this.animation.isIncrementing && this.rawValue <= this.min) {
          this.animation.isIncrementing = true;
        }
        this.rawValue = this.animation.isIncrementing ? this.rawValue + this.animation.step : this.rawValue - this.animation.step;
        this.update(this.rawValue).setAttributes();

        // set "last run" to "now" minus any additional time that elapsed beyond the desired frame rate
        this.animation.lastRun = this.animation.now - (this.animation.elapsed % this.animation.fps);
      }
      requestAnimationFrame(this.animate);
    }
  }
}

class OptionsParameter extends Parameter {
  /**
   * @param {string} param
   * @param {{id: string, value: function, display: string}[]} options
   */
  constructor(param, options) {
    super(param, options.map(o => o.id), 'number');
    this.param = param;
    this.options = options;
    this.generate()
      .addEventListeners()
      .setAttributes()
      .updateDisplay(this.option.display);
    return this;
  }

  setAttributes() {
    this.options.forEach((option, i) => {
      const el = document.getElementById(option.id);
      el.dataset.display = option.display;
      el.value = i;
    });
    return this;
  }

  update(value, emit = true) {
    this.option = this.options[value];
    this.value = this.option.value;
    this.updateDisplay.call(this, this.option.display);
    if (emit) {
      this.emit("update");
    }
    return this;
  }

  updateDisplay(value) {
    document.getElementById(this.option.id).checked = "checked";
    this.controlValue.innerText = value;
    return this;
  }

  generate() {
    const generated = Math.floor(Math.random() * this.options.length);
    this.rawValue = generated;
    this.option = this.options[generated];
    this.value = this.option.value;
    return this;
  }
}

class BooleanParameter extends Parameter {
  constructor(param) {
    super(param, [param]);
    this.param = param;
    this.generate()
      .addEventListeners()
      .updateDisplay(this.value);
    return this;
  }

  onInput(e) {
    this.rawValue = e.target.checked;
    this.update(this.rawValue);
    return this;
  }

  update(value, emit = true) {
    this.value = Boolean(value);
    this.updateDisplay(this.value);
    if (emit) {
      this.emit("update");
    }
    return this;
  }

  updateDisplay(checked) {
    this.controls[0].checked = checked;
    return this;
  }

  generate() {
    this.rawValue = this.value = this.chance();
    return this;
  }
}

class ColorParameter extends Parameter {
  constructor(param) {
    super(param, [param]);
    this.param = param;
    this.generate()
      .addEventListeners()
      .setAttributes()
      .updateDisplay(this.value);
    return this;
  }

  setAttributes() {
    this.controls[0].setAttribute("value", this.rawValue);
    return this;
  }

  update(value, emit = true) {
    this.value = value;
    if (emit) {
      this.emit("update");
    }
    return this;
  }

  generate() {
    this.rawValue = this.value = this.chance() ?
      "#000000" :
      valToRGBFactory(100, 0, {
        useHex: true
      })(Math.random() * 100);
    return this;
  }
}

// DRAWINGS
// ================

class Drawing {
  constructor(canvasID) {
    this.canvas = document.getElementById(canvasID);
    this.ctx = this.canvas.getContext("2d");
    this.params = {};
    this.radius = Math.max(this.canvas.width, this.canvas.height) / 2.1;
    this.offsetPoint = val => val + this.canvas.width / 2;

    // TODO: use canvasData to draw pixels
    // this.useImageData = false;
    // canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    // canvasData = ctx.createImageData(canvas.width, canvas.height);

    return this;
  }

  drawPixel(x, y, r, g, b, a) {
    var index = Math.round(x + y * this.canvas.height) * 4;
    this.canvasData.data[index + 0] = r;
    this.canvasData.data[index + 1] = g;
    this.canvasData.data[index + 2] = b;
    this.canvasData.data[index + 3] = a;
  }

  drawDots() {
    for (let t = 0; t <= this.max; t += this.increment) {
      var x = this.xScale(t) /*  * osc(i / xModDepth) */ ;
      var y = this.yScale(t) /*  * osc(i / yModDepth) */ ;
      this.ctx.fillStyle = this.getLineColor(t);
      this.ctx.fillRect(x, y, this.lineWidth, this.lineWidth);

      // TODO: use image data to draw rectangles
      // https://stackoverflow.com/a/8290734
      // if (this.useImageData) {
      //     this.drawPixel(x, y, 0, 0, 0, 255);
      // }
    }
    // if (this.useImageData) {
    //     this.ctx.putImageData(this.canvasData, 0, 0);
    // }
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
    this.getLineColor = this.params.lineColor.value(this.max);
    this.lineWidth = this.params.width.value;
    this.increment = 1 / this.params.resolution.value;
    return this;
  }
}

class Thumbnail extends Drawing {
  constructor(canvasID) {
    super(canvasID);
    this.canvas.addEventListener("click", this.onClick.bind(this));
    this.values = {};
  }

  onClick(e) {
    document.getElementById('mainCanvasControls').classList.remove('hide');
    Object.values(this.params).forEach(param => {
      param.setValue(this.values[param.param]);
    });
    mainCanvas.setParams(this.params).update();
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

class MainCanvas extends Drawing {
  constructor(canvasID) {
    super(canvasID);
  }

  /**
   * @param {Object} params
   */
  setParams(params) {
    Object.values(params).forEach(param => {
      param.on("update", this.update.bind(this));
    });
    this.params = params;
    return this;
  }
}

// TRANSFORMERS
// ================

// credit: https://stackoverflow.com/a/846249
class LogSlider {
  constructor({
    minpos = 1,
    maxpos = 10,
    minval = 0.1,
    maxval = 100
  } = {}) {
    this.minpos = minpos;
    this.maxpos = maxpos;
    this.minlval = Math.log(minval);
    this.maxlval = Math.log(maxval);
    this.scale = (this.maxlval - this.minlval) / (this.maxpos - this.minpos);
  }

  value(position) {
    // return round2(Math.exp((position - this.minpos) * this.scale + this.minlval));
    return round3(
      Math.exp((position - this.minpos) * this.scale + this.minlval)
    );
  }
  // Calculate slider position from a value
  position(value) {
    // return round2(this.minpos + (Math.log(value) - this.minlval) / this.scale);
    return round3(this.minpos + (Math.log(value) - this.minlval) / this.scale);
  }
}

// INITIALIZATION
// ==============

(function init() {
  var mainCanvasID = "mainCanvas";

  var params = {
    solid: new BooleanParameter("solid"),
    resolution: new SliderParameter("resolution", {
      min: 20,
      max: 100,
      step: 0.1,
      animationController: 'resolution-animate'
    }),
    len: new SliderParameter("len", {
      min: 1,
      max: 60,
      step: 0.1,
      animationController: 'len-animate'
    }),
    width: new SliderParameter("width", {
      min: 1,
      max: 10,
      step: 0.1,
      generate1: true,
      animationController: 'width-animate'
    }),
    xModDepth: new SliderParameter("xModDepth", {
      min: 1,
      max: 10,
      step: 0.1,
      transformer: new LogSlider(),
      generateIntegers: true,
      animationController: 'xModDepth-animate'
    }),
    yModDepth: new SliderParameter("yModDepth", {
      min: 1,
      max: 10,
      step: 0.1,
      transformer: new LogSlider(),
      generateIntegers: true,
      animationController: 'yModDepth-animate'
    }),
    lineColor: new OptionsParameter("lineColor", lineColors),
    oscillatorX: new OptionsParameter("oscillatorX", oscillatorsX),
    oscillatorY: new OptionsParameter("oscillatorY", oscillatorsY),
    bgColor: new ColorParameter("bgColor")
  };

  // instantiate main canvas
  // mainCanvas = new MainCanvas(mainCanvasID);
  // Use this if you want MainCanvas to load by default
  mainCanvas = new MainCanvas(mainCanvasID).setParams(params).setEquations().draw();
  document.getElementById('mainCanvasControls').classList.remove('hide');

  // generate thumbnails
  var refreshParams = refresh(params);
  document.getElementById("refresh").addEventListener("click", refreshParams);
  if (window.location.pathname.indexOf("full") > -1) {
    refreshParams();
  }
  
  // add toggle functionality
  document.querySelectorAll('.toggler').forEach(function(el) {
    el.addEventListener('click', toggleNextBlock);
  })

  document.getElementById('close-sidebar').addEventListener('click', toggleSidebar);
  document.getElementById('open-sidebar').addEventListener('click', toggleSidebar);

  // enable downloading image
  const downloader = document.getElementById("downloader");
  downloader.addEventListener("click", download);
})();