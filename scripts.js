"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// HELPER FUNCTIONS
// ================
var mainCanvas;

var id = function id(x) {
  return x;
};

var roundN = function roundN(decimals) {
  return function (val) {
    if (isNaN(val)) return val;
    try {
      return Math.round(val * Math.pow(10, decimals)) / Math.pow(10, decimals);
    } catch (e) {
      return val;
    }
  };
};

var round2 = roundN(2);

var round3 = roundN(3);

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
 * @returns {any} rgb(num,num,num) | #HHHHHH | [num, num, num]
 */
function valToRGBFactory() {
  var nMax = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 100;
  var nMin = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

  var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
      _ref$fixEdges = _ref.fixEdges,
      fixEdges = _ref$fixEdges === undefined ? false : _ref$fixEdges,
      _ref$returnHex = _ref.returnHex,
      returnHex = _ref$returnHex === undefined ? false : _ref$returnHex,
      _ref$returnChannels = _ref.returnChannels,
      returnChannels = _ref$returnChannels === undefined ? false : _ref$returnChannels;

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
    var period = function period(offset) {
      return 2 * Math.PI * offset / nMax;
    };
    var clip = function clip(x) {
      return x < min ? min : x > max ? max : x;
    };
    var rangeAdjust = function rangeAdjust(x) {
      return x * range + min + range / 2;
    };
    var channel = function channel(offset) {
      return function (x) {
        return clip(rangeAdjust(Math.sin(x * period(1) + period(offset))));
      };
    };
    // the offset math is a bit opaque to me, but it works
    var r = channel(n6th * 2 - n12th);
    var g = channel(n6th * 6 - n12th);
    var b = channel(n6th * 4 - n12th);

    if (returnHex) {
      return "#" + toHex(r(n)) + toHex(g(n)) + toHex(b(n));
    }
    if (returnChannels) {
      return [r(n), g(n), b(n)];
    }

    return "rgb(" + r(n) + "," + g(n) + "," + b(n) + ")";
  };
}

/**
 * 
 * @param {string} color must be a hex value
 */
function fixedColorFactory(color) {
  return function (_, __) {
    var _ref2 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
        _ref2$returnChannels = _ref2.returnChannels,
        returnChannels = _ref2$returnChannels === undefined ? false : _ref2$returnChannels;

    return function () {
      if (returnChannels) {
        if (color.slice(1, 2) === "F") {
          return [255, 255, 255];
        }
        return [0, 0, 0];
      }
      return color;
    };
  };
}

function download(e) {
  e.target.download = "image.png";
  e.target.href = document.getElementById("mainCanvas").toDataURL("image/png").replace(/^data:image\/[^;]/, "data:application/octet-stream");
}

function refresh(params) {
  return function () {
    document.querySelectorAll(".sidebar__thumb").forEach(function (el, i) {
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

// credit: https://github.com/jashkenas/underscore/blob/ae037f7c41323807ae6f1533c45512e6d31a1574/underscore.js#L842-L881
function throttle(func, wait) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  var timeout, context, args, result;
  var previous = 0;

  var later = function later() {
    previous = options.leading === false ? 0 : Date.now();
    timeout = null;
    result = func.apply(context, args);
    if (!timeout) context = args = null;
  };

  var throttled = function throttled() {
    var now = Date.now();
    if (!previous && options.leading === false) previous = now;
    var remaining = wait - (now - previous);
    context = this;
    args = arguments;
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    } else if (!timeout && options.trailing !== false) {
      timeout = setTimeout(later, remaining);
    }
    return result;
  };

  throttled.cancel = function () {
    clearTimeout(timeout);
    previous = 0;
    timeout = context = args = null;
  };

  return throttled;
}

function loadParams() {
  var params = new URL(window.location).searchParams;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = params[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var _ref3 = _step.value;

      var _ref4 = _slicedToArray(_ref3, 2);

      var key = _ref4[0];
      var value = _ref4[1];

      // TODO: should probably expose a better API than accessing mainCanvas.params directly
      value = key === 'bgColor' ? value : Number(value);
      mainCanvas.params[key].setValue(value);
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }
}

function getShareURL() {
  // set URL and delete any existing params
  var baseURL = new URL(window.location);
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = baseURL.searchParams[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var _ref5 = _step2.value;

      var _ref6 = _slicedToArray(_ref5, 2);

      var key = _ref6[0];
      var value = _ref6[1];

      baseURL.searchParams.delete(key);
    }
    // get new params and append to baseURL searchParams
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  var params = mainCanvas.params;
  Object.keys(params).forEach(function (param) {
    baseURL.searchParams.append(param, round2(params[param].rawValue));
  });
  // display result to user
  prompt("Copy this URL and send it to someone awesome", baseURL.toString());
}

// COLLECTIONS FOR OPTIONPARAMETERS
// ================

// keeping for possible future experimentation
var oldOscillators = [function (t) {
  return (Math.cos(t) + 1) / 2;
}, function (t) {
  return Math.cos(Math.pow(t, 0.35));
}, function (t) {
  return Math.sin(Math.cos(t) * Math.sin(t)) * 2;
}];

// values must be functions that return a number
var oscillatorsX = [{
  id: "osc0",
  value: function value(t) {
    return Math.sin(t);
  },
  display: "sine"
}, {
  id: "osc1",
  value: function value(t) {
    return Math.cos(t);
  },
  display: "cosine"
}, {
  id: "osc2",
  value: function value(t) {
    return (Math.sin(t) + 1) / 2;
  },
  display: "half-sine"
}, {
  id: "osc3",
  value: function value(t) {
    return Math.sin(t) * Math.pow(t, -0.35);
  },
  display: "collapse"
}, {
  // based on https://en.wikipedia.org/wiki/Trochoid
  id: "osc4",
  value: function value(t) {
    var a = 0.5;
    var b = 0.5;
    return a - b * Math.sin(t);
  },
  display: "trochoid"
}, {
  id: "osc5",
  // based on: https://en.wikipedia.org/wiki/Epicycloid
  value: function value(t) {
    var r = 0.2;
    var k = 3; // number of cusps
    // var R = k * r;
    // supposedly either of these two functions should work
    // return ( (r + R)*Math.cos(t) - r*Math.cos((r + R) / r * t) )
    return r * (k + 1) * Math.cos(t) - r * Math.cos((k + 1) * t);
  },
  display: "epicycloid"
}, {
  id: "osc6",
  value: function value(t) {
    return Math.sin(Math.cos(Math.log10(t)));
  },
  display: "log periodic"
}, {
  id: "osc7",
  value: function value(t) {
    return Math.abs(Math.sin(t / 10));
  },
  display: "absolute"
}, {
  id: "osc8",
  value: function value(t) {
    var start = Math.sin(t);
    if (start > 0.5) {
      return start;
    }
    return start / -3;
  },
  display: "experimental!"
}];

var oscillatorsY = [{
  id: "osc10",
  value: function value(t) {
    return Math.sin(t);
  },
  display: "sine"
}, {
  id: "osc11",
  value: function value(t) {
    return Math.cos(t);
  },
  display: "cosine"
}, {
  id: "osc12",
  value: function value(t) {
    return (Math.sin(t) + 1) / 2;
  },
  display: "half-sine"
}, {
  id: "osc13",
  value: function value(t) {
    return Math.sin(t) * Math.pow(t, -0.35);
  },
  display: "collapse"
}, {
  // based on https://en.wikipedia.org/wiki/Trochoid
  id: "osc14",
  value: function value(t) {
    var a = 0.5;
    var b = 0.5;
    return a - b * Math.cos(t);
  },
  display: "trochoid"
}, {
  id: "osc15",
  // based on: https://en.wikipedia.org/wiki/Epicycloid
  value: function value(t) {
    var r = 0.2;
    var k = 3; // number of cusps
    return r * (k + 1) * Math.sin(t) - r * Math.sin((k + 1) * t);
  },
  display: "epicycloid"
}, {
  id: "osc16",
  value: function value(t) {
    return Math.sin(Math.cos(Math.log10(t)));
  },
  display: "log periodic"
}, {
  id: "osc17",
  value: function value(t) {
    return Math.abs(Math.sin(t / 10));
  },
  display: "absolute"
}, {
  id: "osc18",
  value: function value(t) {
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
}, {
  id: "white",
  value: fixedColorFactory("#FFFFFF"),
  display: "white"
}, {
  id: "black",
  value: fixedColorFactory("#000000"),
  display: "black"
}];

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

var Parameter = function () {
  function Parameter(param, ids, rawValueType) {
    _classCallCheck(this, Parameter);

    this.rawValueType = rawValueType;
    this.events = {};
    this.controls = ids.map(function (id) {
      return document.getElementById(id);
    });
    try {
      this.controlValue = document.getElementById(param + "-value");
    } catch (e) {
      this.controlValue = null;
    }
    return this;
  }

  _createClass(Parameter, [{
    key: "chance",
    value: function chance() {
      return Math.random() > 0.5;
    }
  }, {
    key: "addEventListeners",
    value: function addEventListeners() {
      var _this = this;

      this.controls.forEach(function (control) {
        control.addEventListener("input", throttle(_this.onInput.bind(_this), 125));
      });
      return this;
    }
  }, {
    key: "on",
    value: function on(eventName, callback) {
      this.events[eventName] = callback;
      return this;
    }
  }, {
    key: "emit",
    value: function emit(eventName, data) {
      this.events[eventName](data);
      return this;
    }
  }, {
    key: "onInput",
    value: function onInput(e) {
      this.rawValue = this.rawValueType === 'number' ? Number(e.target.value) : e.target.value;
      this.update(this.rawValue);
      return this;
    }
  }, {
    key: "updateDisplay",
    value: function updateDisplay(value) {
      if (this.controlValue) {
        this.controlValue.innerText = value;
      }
      return this;
    }
  }, {
    key: "setValue",
    value: function setValue(value) {
      this.rawValue = value;
      this.update(this.rawValue, false);
      if (this.setAttributes) this.setAttributes();
      return this;
    }
  }]);

  return Parameter;
}();

var SliderParameter = function (_Parameter) {
  _inherits(SliderParameter, _Parameter);

  // TODO: document transformer - purpose and implementation
  function SliderParameter(param) {
    var _ret;

    var _ref7 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        min = _ref7.min,
        max = _ref7.max,
        step = _ref7.step,
        _ref7$transformer = _ref7.transformer,
        transformer = _ref7$transformer === undefined ? {
      value: id,
      position: id
    } : _ref7$transformer,
        _ref7$generateInteger = _ref7.generateIntegers,
        generateIntegers = _ref7$generateInteger === undefined ? false : _ref7$generateInteger,
        _ref7$generate = _ref7.generate1,
        generate1 = _ref7$generate === undefined ? false : _ref7$generate,
        _ref7$animationContro = _ref7.animationController,
        animationController = _ref7$animationContro === undefined ? false : _ref7$animationContro,
        animationStep = _ref7.animationStep;

    _classCallCheck(this, SliderParameter);

    var _this2 = _possibleConstructorReturn(this, (SliderParameter.__proto__ || Object.getPrototypeOf(SliderParameter)).call(this, param, [param], 'number'));

    _this2.param = param;
    _this2.max = max;
    _this2.min = min;
    _this2.step = step;
    _this2.transformer = transformer;
    _this2.generateIntegers = generateIntegers;
    _this2.generate1 = generate1;
    if (animationController) {
      var animationContainer = document.getElementById(animationController);
      _this2.animation = {
        isActive: false,
        isIncrementing: true,
        now: Date.now(),
        lastRun: Date.now(),
        fps: 1000 / 30,
        step: animationStep || (_this2.max - _this2.min) / 50000,
        controller: {
          run: animationContainer.querySelector('.animation-run-toggle'),
          direction: animationContainer.querySelector('.animation-direction-toggle'),
          step: animationContainer.querySelector('.animation-step')
        }
      };
      _this2.animate = _this2.animate.bind(_this2);
      _this2.animation.controller.run.addEventListener('input', _this2.toggleAnimation.bind(_this2));
      _this2.animation.controller.direction.addEventListener('click', _this2.toggleAnimationDirection.bind(_this2));
      _this2.animation.controller.step.addEventListener('input', throttle(_this2.updateAnimationStep.bind(_this2), 150));
      _this2.animation.controller.step.setAttribute('max', _this2.animation.step * 50);
      _this2.animation.controller.step.setAttribute('min', _this2.animation.step / 10);
      _this2.animation.controller.step.setAttribute('step', _this2.animation.step);
      _this2.animation.controller.step.setAttribute('value', _this2.animation.step);
    }

    _this2.generate().addEventListeners().setAttributes().updateDisplay(round2(_this2.value));
    return _ret = _this2, _possibleConstructorReturn(_this2, _ret);
  }

  _createClass(SliderParameter, [{
    key: "setAttributes",
    value: function setAttributes() {
      this.controls[0].setAttribute("value", this.rawValue);
      this.controls[0].setAttribute("step", this.step);
      this.controls[0].setAttribute("max", this.max);
      this.controls[0].setAttribute("min", this.min);
      return this;
    }
  }, {
    key: "update",
    value: function update(value) {
      var emit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

      this.value = this.transformer.value(Number(value));
      this.updateDisplay(round2(this.value));
      if (emit) {
        this.emit("update");
      }
      return this;
    }
  }, {
    key: "generate",
    value: function generate() {
      if (this.generateIntegers) {
        // have to call this.transformer.position here because this is
        // what we want the final result to be;
        // internally, this.value is stored as the transformed value
        var generated = this.transformer.position(Math.pow(
        // Math.ceil(Math.random() * 10) + (this.chance() ? 1 : -1) * Math.random() / 20, // base
        Math.ceil(Math.random() * 10) + (this.chance() ? 0.01 : -0.01), // base
        this.chance() ? -1 : 1 // exponent
        ));
      } else if (this.generate1) {
        var generated = 1;
      } else {
        var generated = Math.random() * (this.max - this.min) + this.min;
      }
      this.rawValue = generated;
      this.value = this.transformer.value(this.rawValue);
      return this;
    }
  }, {
    key: "toggleAnimation",
    value: function toggleAnimation() {
      this.animation.isActive = !this.animation.isActive;
      this.animate();
    }

    // TODO: babel isn't transforming async correctly...?
    // these don't need to be handled synchronously - effects are non-critical

  }, {
    key: "toggleAnimationDirection",
    value: function toggleAnimationDirection() {
      // async toggleAnimationDirection() {
      this.animation.isIncrementing = !this.animation.isIncrementing;
    }
  }, {
    key: "updateAnimationStep",
    value: function updateAnimationStep(e) {
      // async updateAnimationStep(e) {
      this.animation.step = Number(e.target.value);
    }
  }, {
    key: "animate",
    value: function animate() {
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
          this.animation.lastRun = this.animation.now - this.animation.elapsed % this.animation.fps;
        }
        requestAnimationFrame(this.animate);
      }
    }
  }]);

  return SliderParameter;
}(Parameter);

var OptionsParameter = function (_Parameter2) {
  _inherits(OptionsParameter, _Parameter2);

  /**
   * @param {string} param
   * @param {{id: string, value: function, display: string}[]} options
   */
  function OptionsParameter(param, options) {
    var _ret2;

    _classCallCheck(this, OptionsParameter);

    var _this3 = _possibleConstructorReturn(this, (OptionsParameter.__proto__ || Object.getPrototypeOf(OptionsParameter)).call(this, param, options.map(function (o) {
      return o.id;
    }), 'number'));

    _this3.param = param;
    _this3.options = options;
    _this3.generate().addEventListeners().setAttributes().updateDisplay(_this3.option.display);
    return _ret2 = _this3, _possibleConstructorReturn(_this3, _ret2);
  }

  _createClass(OptionsParameter, [{
    key: "setAttributes",
    value: function setAttributes() {
      this.options.forEach(function (option, i) {
        var el = document.getElementById(option.id);
        el.dataset.display = option.display;
        el.value = i;
      });
      return this;
    }
  }, {
    key: "update",
    value: function update(value) {
      var emit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

      this.option = this.options[value];
      this.value = this.option.value;
      this.updateDisplay.call(this, this.option.display);
      if (emit) {
        this.emit("update");
      }
      return this;
    }
  }, {
    key: "updateDisplay",
    value: function updateDisplay(value) {
      document.getElementById(this.option.id).checked = "checked";
      this.controlValue.innerText = value;
      return this;
    }
  }, {
    key: "generate",
    value: function generate() {
      var generated = Math.floor(Math.random() * this.options.length);
      this.rawValue = generated;
      this.option = this.options[generated];
      this.value = this.option.value;
      return this;
    }
  }]);

  return OptionsParameter;
}(Parameter);

var BooleanParameter = function (_Parameter3) {
  _inherits(BooleanParameter, _Parameter3);

  function BooleanParameter(param) {
    var _ret3;

    _classCallCheck(this, BooleanParameter);

    var _this4 = _possibleConstructorReturn(this, (BooleanParameter.__proto__ || Object.getPrototypeOf(BooleanParameter)).call(this, param, [param]));

    _this4.param = param;
    _this4.generate().addEventListeners().updateDisplay(_this4.value);
    return _ret3 = _this4, _possibleConstructorReturn(_this4, _ret3);
  }

  _createClass(BooleanParameter, [{
    key: "onInput",
    value: function onInput(e) {
      this.rawValue = e.target.checked;
      this.update(this.rawValue);
      return this;
    }
  }, {
    key: "update",
    value: function update(value) {
      var emit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

      this.value = Boolean(value);
      this.updateDisplay(this.value);
      if (emit) {
        this.emit("update");
      }
      return this;
    }
  }, {
    key: "updateDisplay",
    value: function updateDisplay(checked) {
      this.controls[0].checked = checked;
      return this;
    }
  }, {
    key: "generate",
    value: function generate() {
      this.rawValue = this.value = this.chance();
      return this;
    }
  }]);

  return BooleanParameter;
}(Parameter);

var ColorParameter = function (_Parameter4) {
  _inherits(ColorParameter, _Parameter4);

  function ColorParameter(param) {
    var _ret4;

    _classCallCheck(this, ColorParameter);

    var _this5 = _possibleConstructorReturn(this, (ColorParameter.__proto__ || Object.getPrototypeOf(ColorParameter)).call(this, param, [param]));

    _this5.param = param;
    _this5.generate().addEventListeners().setAttributes().updateDisplay(_this5.value);
    return _ret4 = _this5, _possibleConstructorReturn(_this5, _ret4);
  }

  _createClass(ColorParameter, [{
    key: "setAttributes",
    value: function setAttributes() {
      this.controls[0].setAttribute("value", this.rawValue);
      return this;
    }
  }, {
    key: "update",
    value: function update(value) {
      var emit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

      this.value = value;
      if (emit) {
        this.emit("update");
      }
      return this;
    }
  }, {
    key: "generate",
    value: function generate() {
      this.rawValue = this.value = this.chance() ? "#000000" : valToRGBFactory(100, 0, {
        returnHex: true
      })(Math.random() * 100);
      return this;
    }
  }]);

  return ColorParameter;
}(Parameter);

// DRAWINGS
// ================

var Drawing = function () {
  function Drawing(canvasID) {
    var _this6 = this;

    _classCallCheck(this, Drawing);

    this.canvas = document.getElementById(canvasID);
    this.ctx = this.canvas.getContext("2d");
    this.params = {};
    this.radius = Math.max(this.canvas.width, this.canvas.height) / 2.1;
    this.offsetPoint = function (val) {
      return val + _this6.canvas.width / 2;
    };

    // TODO: figure out best way to apply lineWidth to pixels drawnn on imageData
    this.useImageData = false;
    this.imageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
    // this.canvas.addEventListener('mousemove', this.logDataOnHover.bind(this));

    return this;
  }

  // currently not used, but could be useful for debugging


  _createClass(Drawing, [{
    key: "logDataOnHover",
    value: function logDataOnHover(event) {
      var x = event.layerX;
      var y = event.layerY;
      var pixel = this.ctx.getImageData(x, y, 1, 1);
      var data = pixel.data;
      var rgba1 = 'rgba(' + data[0] + ', ' + data[1] + ', ' + data[2] + ', ' + data[3] + ')';
      console.log(rgba1);
    }
  }, {
    key: "drawPixel",
    value: function drawPixel(x, y, r, g, b, a) {
      // if x and y are not rounded this returns very inaccurate results (why?)
      var index = (Math.round(y) * this.canvas.width + Math.round(x)) * 4;
      this.imageData.data[index + 0] = r;
      this.imageData.data[index + 1] = g;
      this.imageData.data[index + 2] = b;
      this.imageData.data[index + 3] = a;
    }
  }, {
    key: "drawDotsImageData",
    value: function drawDotsImageData() {
      // get imageData here to capture background color;
      this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      for (var t = 0; t <= this.max; t += this.increment) {
        var x = this.xScale(t);
        var y = this.yScale(t);

        var _getPixelColor = this.getPixelColor(t),
            _getPixelColor2 = _slicedToArray(_getPixelColor, 3),
            r = _getPixelColor2[0],
            g = _getPixelColor2[1],
            b = _getPixelColor2[2];

        this.drawPixel(x, y, r, g, b, 255);
      }
      this.ctx.putImageData(this.imageData, 0, 0);
      return this;
    }
  }, {
    key: "drawDots",
    value: function drawDots() {
      for (var t = 0; t <= this.max; t += this.increment) {
        var x = this.xScale(t) /*  * osc(i / xModDepth) */;
        var y = this.yScale(t) /*  * osc(i / yModDepth) */;
        this.ctx.fillStyle = this.getLineColor(t);
        this.ctx.fillRect(x, y, this.lineWidth, this.lineWidth);
      }
      return this;
    }
  }, {
    key: "drawLines",
    value: function drawLines() {
      this.ctx.lineWidth = this.lineWidth;
      for (var t = 0; t <= this.max; t += this.increment) {
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
  }, {
    key: "draw",
    value: function draw() {
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
  }, {
    key: "update",
    value: function update() {
      this.setEquations().draw();
    }

    /**
     * Set drawing functions
     * Must set params before calling
     */

  }, {
    key: "setEquations",
    value: function setEquations() {
      var _this7 = this;

      this.xScale = function (t) {
        return _this7.offsetPoint(Math.sin(t) * _this7.radius * _this7.params.oscillatorY.value(t * _this7.params.xModDepth.value));
      };
      this.yScale = function (t) {
        return _this7.offsetPoint(Math.cos(t) * _this7.radius * _this7.params.oscillatorX.value(t * _this7.params.yModDepth.value));
      };
      this.max = Math.PI * this.params.len.value;
      this.getLineColor = this.params.lineColor.value(this.max, 0);
      // pixelColor is used when drawing with imageData because individual channels are required
      // could consider refactoring the factory to return channels by default and then transform as needed
      this.getPixelColor = this.params.lineColor.value(this.max, 0, { returnChannels: true });
      this.lineWidth = this.params.width.value;
      this.increment = 1 / this.params.resolution.value;
      return this;
    }
  }]);

  return Drawing;
}();

var Thumbnail = function (_Drawing) {
  _inherits(Thumbnail, _Drawing);

  function Thumbnail(canvasID) {
    _classCallCheck(this, Thumbnail);

    var _this8 = _possibleConstructorReturn(this, (Thumbnail.__proto__ || Object.getPrototypeOf(Thumbnail)).call(this, canvasID));

    _this8.canvas.addEventListener("click", _this8.onClick.bind(_this8));
    _this8.values = {};
    return _this8;
  }

  _createClass(Thumbnail, [{
    key: "onClick",
    value: function onClick(e) {
      var _this9 = this;

      document.getElementById('mainCanvasControls').classList.remove('hide');
      Object.values(this.params).forEach(function (param) {
        param.setValue(_this9.values[param.param]);
      });
      mainCanvas.setParams(this.params).update();
    }

    /**
     * @param {string} param
     * @param {any} value
     */

  }, {
    key: "cacheValue",
    value: function cacheValue(param, value) {
      this.values[param] = value;
    }

    /**
     * @param {Object} params
     */

  }, {
    key: "setParams",
    value: function setParams(params) {
      var _this10 = this;

      Object.values(params).forEach(function (param) {
        param.generate();
        _this10.cacheValue(param.param, param.rawValue);
      });
      this.params = params;
      return this;
    }
  }]);

  return Thumbnail;
}(Drawing);

var MainCanvas = function (_Drawing2) {
  _inherits(MainCanvas, _Drawing2);

  function MainCanvas(canvasID) {
    _classCallCheck(this, MainCanvas);

    return _possibleConstructorReturn(this, (MainCanvas.__proto__ || Object.getPrototypeOf(MainCanvas)).call(this, canvasID));
  }

  /**
   * @param {Object} params
   */


  _createClass(MainCanvas, [{
    key: "setParams",
    value: function setParams(params) {
      var _this12 = this;

      Object.values(params).forEach(function (param) {
        param.on("update", _this12.update.bind(_this12));
      });
      this.params = params;
      return this;
    }
  }]);

  return MainCanvas;
}(Drawing);

// TRANSFORMERS
// ================

// credit: https://stackoverflow.com/a/846249


var LogSlider = function () {
  function LogSlider() {
    var _ref8 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref8$minpos = _ref8.minpos,
        minpos = _ref8$minpos === undefined ? 1 : _ref8$minpos,
        _ref8$maxpos = _ref8.maxpos,
        maxpos = _ref8$maxpos === undefined ? 10 : _ref8$maxpos,
        _ref8$minval = _ref8.minval,
        minval = _ref8$minval === undefined ? 0.1 : _ref8$minval,
        _ref8$maxval = _ref8.maxval,
        maxval = _ref8$maxval === undefined ? 100 : _ref8$maxval;

    _classCallCheck(this, LogSlider);

    this.minpos = minpos;
    this.maxpos = maxpos;
    this.minlval = Math.log(minval);
    this.maxlval = Math.log(maxval);
    this.scale = (this.maxlval - this.minlval) / (this.maxpos - this.minpos);
  }

  _createClass(LogSlider, [{
    key: "value",
    value: function value(position) {
      // return round2(Math.exp((position - this.minpos) * this.scale + this.minlval));
      return round3(Math.exp((position - this.minpos) * this.scale + this.minlval));
    }
    // Calculate slider position from a value

  }, {
    key: "position",
    value: function position(value) {
      // return round2(this.minpos + (Math.log(value) - this.minlval) / this.scale);
      return round3(this.minpos + (Math.log(value) - this.minlval) / this.scale);
    }
  }]);

  return LogSlider;
}();

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
      animationController: 'resolution-animate',
      animationStep: 1 / 5000
    }),
    len: new SliderParameter("len", {
      min: 1,
      max: 60,
      step: 0.1,
      animationController: 'len-animate',
      animationStep: 1 / 1000
    }),
    width: new SliderParameter("width", {
      min: 1,
      max: 10,
      step: 0.1,
      generate1: true,
      animationController: 'width-animate',
      animationStep: 1 / 1000
    }),
    xModDepth: new SliderParameter("xModDepth", {
      min: 1,
      max: 10,
      step: 0.01,
      transformer: new LogSlider(),
      generateIntegers: true,
      animationController: 'xModDepth-animate',
      animationStep: 1 / 10000
    }),
    yModDepth: new SliderParameter("yModDepth", {
      min: 1,
      max: 10,
      step: 0.01,
      transformer: new LogSlider(),
      generateIntegers: true,
      animationController: 'yModDepth-animate',
      animationStep: 1 / 10000
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
  loadParams();
  mainCanvas.setParams(params).update();

  // generate thumbnails
  var refreshParams = refresh(params);
  document.getElementById("refresh").addEventListener("click", refreshParams);
  if (window.location.pathname.indexOf("full") > -1) {
    refreshParams();
  }

  // add toggle functionality
  document.querySelectorAll('.toggler').forEach(function (el) {
    el.addEventListener('click', toggleNextBlock);
  });

  document.getElementById('close-sidebar').addEventListener('click', toggleSidebar);
  document.getElementById('open-sidebar').addEventListener('click', toggleSidebar);

  // enable downloading image
  var downloader = document.getElementById("downloadBtn");
  downloader.addEventListener("click", download);

  document.getElementById("shareBtn").addEventListener("click", getShareURL);
})();
//# sourceMappingURL=scripts.js.map
