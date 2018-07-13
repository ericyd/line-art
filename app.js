(function () {
    'use strict';

    function __extends(d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    function __awaiter(thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments)).next());
        });
    }

    // DRAWINGS
    // ================
    var Drawing = (function () {
        function Drawing(canvasID) {
            var _this = this;
            this.canvas = document.getElementById(canvasID);
            this.ctx = this.canvas.getContext('2d');
            this.params = {};
            this.radius = Math.max(this.canvas.width, this.canvas.height) / 2.1;
            this.offsetPoint = function (val) { return val + _this.canvas.width / 2; };
            // TODO: figure out best way to apply lineWidth to pixels drawnn on imageData
            this.useImageData = false;
            this.imageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
            // this.canvas.addEventListener('mousemove', this.logDataOnHover.bind(this));
            return this;
        }
        // currently not used, but could be useful for debugging
        Drawing.prototype.logDataOnHover = function (event) {
            var x = event.layerX;
            var y = event.layerY;
            var pixel = this.ctx.getImageData(x, y, 1, 1);
            var data = pixel.data;
            var rgba1 = 'rgba(' +
                data[0] +
                ', ' +
                data[1] +
                ', ' +
                data[2] +
                ', ' +
                data[3] +
                ')';
            console.log(rgba1);
        };
        Drawing.prototype.drawPixel = function (x, y, r, g, b, a) {
            var index = (y * this.canvas.width + x) * 4;
            this.imageData.data[index + 0] = r;
            this.imageData.data[index + 1] = g;
            this.imageData.data[index + 2] = b;
            this.imageData.data[index + 3] = a;
        };
        // this method has some serious issues:
        // 1. the pixels are aliased
        // 2. the lineWidth is very challenging to modulate
        //     it might require a combination of spreading the x/y and adjusting the alpha
        // 3. testing it's performance would be challenging, and all of these custom
        //     functions may well be slower
        // Therefore putting on hold for now
        Drawing.prototype.drawDotsImageData = function () {
            // get imageData here to capture background color;
            this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            for (var t = 0; t <= this.max; t += this.increment) {
                // if x and y are not rounded, the pixel indexing is very inaccurate (why?)
                var x = Math.round(this.xScale(t));
                var y = Math.round(this.yScale(t));
                var _a = this.getPixelColor(t), r = _a[0], g = _a[1], b = _a[2];
                var spread = Math.floor(this.lineWidth / 3);
                for (var i = x - spread; i <= x + spread; i++) {
                    for (var j = y - spread; j <= y + spread; j++) {
                        this.drawPixel(i, j, r, g, b, 255);
                    }
                }
                this.drawPixel(x, y, r, g, b, 255);
            }
            this.ctx.putImageData(this.imageData, 0, 0);
            return this;
        };
        Drawing.prototype.drawDots = function () {
            for (var t = 0; t <= this.max; t += this.increment) {
                var x = this.xScale(t);
                var y = this.yScale(t);
                this.ctx.fillStyle = this.getLineColor(t);
                this.ctx.fillRect(x, y, this.lineWidth, this.lineWidth);
            }
            return this;
        };
        Drawing.prototype.drawLines = function () {
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
        };
        Drawing.prototype.draw = function () {
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
            }
            else if (this.useImageData) {
                return this.drawDotsImageData();
            }
            else {
                return this.drawDots();
            }
        };
        Drawing.prototype.update = function () {
            this.setEquations().draw();
        };
        /**
         * Set drawing functions
         * Must set params before calling
         */
        Drawing.prototype.setEquations = function () {
            var _this = this;
            this.xScale = function (t) {
                return _this.offsetPoint(Math.sin(t) *
                    _this.radius *
                    _this.params.oscillatorY.value(t * _this.params.xModDepth.value));
            };
            this.yScale = function (t) {
                return _this.offsetPoint(Math.cos(t) *
                    _this.radius *
                    _this.params.oscillatorX.value(t * _this.params.yModDepth.value));
            };
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
        };
        return Drawing;
    }());
    var Thumbnail = (function (_super) {
        __extends(Thumbnail, _super);
        function Thumbnail(canvasID, mainCanvas) {
            _super.call(this, canvasID);
            this.mainCanvas = mainCanvas;
            this.canvas.addEventListener('click', this.onClick.bind(this));
            this.values = {};
        }
        Thumbnail.prototype.onClick = function (e) {
            var _this = this;
            document.getElementById('mainCanvasControls').classList.remove('hide');
            Object.keys(this.params).forEach(function (key) {
                var param = _this.params[key];
                param.setValue(_this.values[param.param]);
            });
            this.mainCanvas.setParams(this.params).update();
        };
        /**
         * @param {string} param
         * @param {any} value
         */
        Thumbnail.prototype.cacheValue = function (param, value) {
            this.values[param] = value;
        };
        /**
         * @param {Object} params
         */
        Thumbnail.prototype.setParams = function (params) {
            var _this = this;
            Object.keys(params).forEach(function (key) {
                var param = params[key];
                param.generate();
                _this.cacheValue(param.param, param.rawValue);
            });
            this.params = params;
            return this;
        };
        return Thumbnail;
    }(Drawing));
    var MainCanvas = (function (_super) {
        __extends(MainCanvas, _super);
        function MainCanvas(canvasID) {
            _super.call(this, canvasID);
        }
        /**
         * @param {Object} params
         */
        MainCanvas.prototype.setParams = function (params) {
            var _this = this;
            Object.keys(params).forEach(function (key) {
                var param = params[key];
                param.on('update', _this.update.bind(_this));
            });
            this.params = params;
            return this;
        };
        return MainCanvas;
    }(Drawing));

    // HELPER FUNCTIONS
    // ================
    var roundN = function (decimals) {
        return function (val) {
            if (isNaN(val))
                return val;
            try {
                return Math.round(val * Math.pow(10, decimals)) / Math.pow(10, decimals);
            }
            catch (e) {
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
    function valToRGBFactory(nMax, nMin, _a) {
        if (nMax === void 0) { nMax = 100; }
        if (nMin === void 0) { nMin = 0; }
        var _b = _a === void 0 ? {} : _a, _c = _b.fixEdges, fixEdges = _c === void 0 ? false : _c, _d = _b.returnHex, returnHex = _d === void 0 ? false : _d, _e = _b.returnChannels, returnChannels = _e === void 0 ? false : _e;
        return function (n) {
            if (n < nMin || n > nMax) {
                throw new Error('n must satisfy ' + nMin + ' <= n <= ' + nMax);
            }
            if (fixEdges) {
                if (n == nMax) {
                    return '#FFFFFF';
                }
                if (n == nMin) {
                    return '#000000';
                }
            }
            var n6th = (nMax - nMin) / 6;
            var n12th = n6th / 2;
            // set min/max based on desired saturation
            var min = 90;
            var max = 212;
            var range = max - min;
            var period = function (offset) { return (2 * Math.PI * offset) / nMax; };
            var clip = function (x) { return (x < min ? min : x > max ? max : x); };
            var rangeAdjust = function (x) { return x * range + min + range / 2; };
            var channel = function (offset) { return function (x) {
                return clip(rangeAdjust(Math.sin(x * period(1) + period(offset))));
            }; };
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
        return function (_, __, _a) {
            var _b = (_a === void 0 ? {} : _a).returnChannels, returnChannels = _b === void 0 ? false : _b;
            return function () {
                if (returnChannels) {
                    if (color.slice(1, 2) === 'F') {
                        return [255, 255, 255];
                    }
                    return [0, 0, 0];
                }
                return color;
            };
        };
    }
    function download(e) {
        e.target.download = 'image.png';
        e.target.href = document
            .getElementById('mainCanvas')
            .toDataURL('image/png')
            .replace(/^data:image\/[^;]/, 'data:application/octet-stream');
    }
    function refresh(params, mainCanvas) {
        return function () {
            document.querySelectorAll('.sidebar__thumb').forEach(function (el, i) {
                new Thumbnail(el.id, mainCanvas).setParams(params).update();
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
    function throttle(func, wait, options) {
        if (options === void 0) { options = {}; }
        var timeout, context, args, result;
        var previous = 0;
        var later = function () {
            previous = options.leading === false ? 0 : Date.now();
            timeout = null;
            result = func.apply(context, args);
            if (!timeout)
                context = args = null;
        };
        var throttled = function () {
            var now = Date.now();
            if (!previous && options.leading === false)
                previous = now;
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
                if (!timeout)
                    context = args = null;
            }
            else if (!timeout && options.trailing !== false) {
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
    function loadParams(mainCanvas) {
        var params = new URL(window.location).searchParams;
        params.forEach(function (value, key) {
            // TODO: should probably expose a better API than accessing mainCanvas.params directly
            value = key === 'bgColor' ? value : Number(value);
            mainCanvas.params[key].setValue(value);
        });
    }
    function getShareURL(mainCanvas) {
        return function () {
            // set URL and delete any existing params
            var baseURL = new URL(window.location.toString());
            for (var _i = 0, _a = baseURL.searchParams; _i < _a.length; _i++) {
                var _b = _a[_i], key = _b[0], _ = _b[1];
                baseURL.searchParams.delete(key);
            }
            // get new params and append to baseURL searchParams
            var params = mainCanvas.params;
            Object.keys(params).forEach(function (param) {
                baseURL.searchParams.append(param, round2(params[param].rawValue));
            });
            // display result to user
            prompt('Copy this URL and send it to someone awesome', baseURL.toString());
        };
    }

    // values must be functions that return a number
    var oscillatorsX = [
        {
            id: 'osc0',
            value: function (t) { return Math.sin(t); },
            display: 'sine'
        },
        {
            id: 'osc1',
            value: function (t) { return Math.cos(t); },
            display: 'cosine'
        },
        {
            id: 'osc2',
            value: function (t) { return (Math.sin(t) + 1) / 2; },
            display: 'half-sine'
        },
        {
            id: 'osc3',
            value: function (t) { return Math.sin(t) * Math.pow(t, -0.35); },
            display: 'collapse'
        },
        {
            // based on https://en.wikipedia.org/wiki/Trochoid
            id: 'osc4',
            value: function (t) {
                var a = 0.5;
                var b = 0.5;
                return a - b * Math.sin(t);
            },
            display: 'trochoid'
        },
        {
            id: 'osc5',
            // based on: https://en.wikipedia.org/wiki/Epicycloid
            value: function (t) {
                var r = 0.2;
                var k = 3; // number of cusps
                // var R = k * r;
                // supposedly either of these two functions should work
                // return ( (r + R)*Math.cos(t) - r*Math.cos((r + R) / r * t) )
                return r * (k + 1) * Math.cos(t) - r * Math.cos((k + 1) * t);
            },
            display: 'epicycloid'
        },
        {
            id: 'osc6',
            value: function (t) { return Math.sin(Math.cos(Math.log10(t))); },
            display: 'log periodic'
        },
        {
            id: 'osc7',
            value: function (t) { return Math.abs(Math.sin(t / 10)); },
            display: 'absolute'
        },
        {
            id: 'osc8',
            value: function (t) {
                var start = Math.sin(t);
                if (start > 0.5) {
                    return start;
                }
                return start / -3;
            },
            display: 'experimental!'
        }
    ];
    var oscillatorsY = [
        {
            id: 'osc10',
            value: function (t) { return Math.sin(t); },
            display: 'sine'
        },
        {
            id: 'osc11',
            value: function (t) { return Math.cos(t); },
            display: 'cosine'
        },
        {
            id: 'osc12',
            value: function (t) { return (Math.sin(t) + 1) / 2; },
            display: 'half-sine'
        },
        {
            id: 'osc13',
            value: function (t) { return Math.sin(t) * Math.pow(t, -0.35); },
            display: 'collapse'
        },
        {
            // based on https://en.wikipedia.org/wiki/Trochoid
            id: 'osc14',
            value: function (t) {
                var a = 0.5;
                var b = 0.5;
                return a - b * Math.cos(t);
            },
            display: 'trochoid'
        },
        {
            id: 'osc15',
            // based on: https://en.wikipedia.org/wiki/Epicycloid
            value: function (t) {
                var r = 0.2;
                var k = 3; // number of cusps
                return r * (k + 1) * Math.sin(t) - r * Math.sin((k + 1) * t);
            },
            display: 'epicycloid'
        },
        {
            id: 'osc16',
            value: function (t) { return Math.sin(Math.cos(Math.log10(t))); },
            display: 'log periodic'
        },
        {
            id: 'osc17',
            value: function (t) { return Math.abs(Math.sin(t / 10)); },
            display: 'absolute'
        },
        {
            id: 'osc18',
            value: function (t) {
                var start = Math.sin(t);
                if (start > 0.5) {
                    return start;
                }
                return start / -3;
            },
            display: 'experimental!'
        }
    ];
    // values must be functions that return functions that return a color
    var lineColors = [
        {
            id: 'colorize',
            value: valToRGBFactory,
            display: 'colorize'
        },
        {
            id: 'white',
            value: fixedColorFactory('#FFFFFF'),
            display: 'white'
        },
        {
            id: 'black',
            value: fixedColorFactory('#000000'),
            display: 'black'
        }
    ];

    // credit: https://stackoverflow.com/a/846249
    var LogSlider = (function () {
        function LogSlider(_a) {
            var _b = _a === void 0 ? {} : _a, _c = _b.minpos, minpos = _c === void 0 ? 1 : _c, _d = _b.maxpos, maxpos = _d === void 0 ? 10 : _d, _e = _b.minval, minval = _e === void 0 ? 0.1 : _e, _f = _b.maxval, maxval = _f === void 0 ? 100 : _f;
            this.minpos = minpos;
            this.maxpos = maxpos;
            this.minlval = Math.log(minval);
            this.maxlval = Math.log(maxval);
            this.scale = (this.maxlval - this.minlval) / (this.maxpos - this.minpos);
        }
        LogSlider.prototype.value = function (position) {
            // return round2(Math.exp((position - this.minpos) * this.scale + this.minlval));
            return round3(Math.exp((position - this.minpos) * this.scale + this.minlval));
        };
        // Calculate slider position from a value
        LogSlider.prototype.position = function (value) {
            // return round2(this.minpos + (Math.log(value) - this.minlval) / this.scale);
            return round3(this.minpos + (Math.log(value) - this.minlval) / this.scale);
        };
        return LogSlider;
    }());
    var id = function (x) { return x; };
    var IdentityTransformer = (function () {
        function IdentityTransformer() {
            this.value = id;
            this.position = id;
            return this;
        }
        return IdentityTransformer;
    }());

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
    var Parameter = (function () {
        function Parameter(param, ids, rawValueType) {
            this.param = param;
            this.rawValueType = rawValueType;
            this.events = {};
            this.controls = ids.map(function (id) { return document.getElementById(id); });
            try {
                this.controlValue = document.getElementById(param + "-value");
            }
            catch (e) {
                this.controlValue = null;
            }
            return this;
        }
        Parameter.prototype.chance = function () {
            return Math.random() > 0.5;
        };
        Parameter.prototype.addEventListeners = function () {
            var _this = this;
            this.controls.forEach(function (control) {
                control.addEventListener('input', throttle(_this.onInput.bind(_this), 125));
            });
            return this;
        };
        Parameter.prototype.on = function (eventName, callback) {
            this.events[eventName] = callback;
            return this;
        };
        Parameter.prototype.emit = function (eventName, data) {
            this.events[eventName](data);
            return this;
        };
        Parameter.prototype.onInput = function (e) {
            this.rawValue =
                this.rawValueType === 'number' ? Number(e.target.value) : e.target.value;
            this.update(this.rawValue);
            return this;
        };
        Parameter.prototype.updateDisplay = function (value) {
            if (this.controlValue) {
                this.controlValue.innerText = value;
            }
            return this;
        };
        Parameter.prototype.setValue = function (value) {
            this.rawValue = value;
            this.update(this.rawValue, false);
            if (this.setAttributes)
                this.setAttributes();
            return this;
        };
        return Parameter;
    }());
    var SliderParameter = (function (_super) {
        __extends(SliderParameter, _super);
        function SliderParameter(param, _a) {
            var _b = _a === void 0 ? {} : _a, _c = _b.min, min = _c === void 0 ? 1 : _c, _d = _b.max, max = _d === void 0 ? 10 : _d, _e = _b.step, step = _e === void 0 ? 0.1 : _e, _f = _b.transformer, transformer = _f === void 0 ? new IdentityTransformer() : _f, _g = _b.generateIntegers, generateIntegers = _g === void 0 ? false : _g, _h = _b.generate1, generate1 = _h === void 0 ? false : _h, _j = _b.animationController, animationController = _j === void 0 ? false : _j, _k = _b.animationStep, animationStep = _k === void 0 ? 0.01 : _k;
            _super.call(this, param, [param], 'number');
            this.param = param;
            this.max = max;
            this.min = min;
            this.step = step;
            this.transformer = transformer;
            this.generateIntegers = generateIntegers;
            this.generate1 = generate1;
            if (animationController) {
                var animationContainer = document.getElementById(animationController);
                this.animation = {
                    isActive: false,
                    isIncrementing: true,
                    now: Date.now(),
                    lastRun: Date.now(),
                    fps: 1000 / 30,
                    step: animationStep || (this.max - this.min) / 50000,
                    controller: {
                        run: animationContainer.querySelector('.animation-run-toggle'),
                        direction: animationContainer.querySelector('.animation-direction-toggle'),
                        step: animationContainer.querySelector('.animation-step')
                    }
                };
                this.animate = this.animate.bind(this);
                this.animation.controller.run.addEventListener('input', this.toggleAnimation.bind(this));
                this.animation.controller.direction.addEventListener('click', this.toggleAnimationDirection.bind(this));
                this.animation.controller.step.addEventListener('input', throttle(this.updateAnimationStep.bind(this), 150));
                this.animation.controller.step.setAttribute('max', this.animation.step * 50);
                this.animation.controller.step.setAttribute('min', this.animation.step / 10);
                this.animation.controller.step.setAttribute('step', this.animation.step);
                this.animation.controller.step.setAttribute('value', this.animation.step);
            }
            this.generate()
                .addEventListeners()
                .setAttributes()
                .updateDisplay(round2(this.value));
            return this;
        }
        SliderParameter.prototype.setAttributes = function () {
            this.controls[0].setAttribute('value', this.rawValue);
            this.controls[0].setAttribute('step', String(this.step));
            this.controls[0].setAttribute('max', String(this.max));
            this.controls[0].setAttribute('min', String(this.min));
            return this;
        };
        SliderParameter.prototype.update = function (value, emit) {
            if (emit === void 0) { emit = true; }
            this.value = this.transformer.value(Number(value));
            this.updateDisplay(round2(this.value));
            if (emit) {
                this.emit('update');
            }
            return this;
        };
        SliderParameter.prototype.generate = function () {
            if (this.generateIntegers) {
                // have to call this.transformer.position here because this is
                // what we want the final result to be;
                // internally, this.value is stored as the transformed value
                var generated = this.transformer.position(Math.pow(
                // Math.ceil(Math.random() * 10) + (this.chance() ? 1 : -1) * Math.random() / 20, // base
                Math.ceil(Math.random() * 10) + (this.chance() ? 0.01 : -0.01), // base
                this.chance() ? -1 : 1 // exponent
                ));
            }
            else if (this.generate1) {
                var generated = 1;
            }
            else {
                var generated = Math.random() * (this.max - this.min) + this.min;
            }
            this.rawValue = generated;
            this.value = this.transformer.value(this.rawValue);
            return this;
        };
        SliderParameter.prototype.toggleAnimation = function () {
            this.animation.isActive = !this.animation.isActive;
            this.animate();
        };
        // these don't need to be handled synchronously - effects are non-critical
        SliderParameter.prototype.toggleAnimationDirection = function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.animation.isIncrementing = !this.animation.isIncrementing;
            });
        };
        SliderParameter.prototype.updateAnimationStep = function (e) {
            return __awaiter(this, void 0, void 0, function* () {
                this.animation.step = Number(e.target.value);
            });
        };
        SliderParameter.prototype.animate = function () {
            if (this.animation.isActive) {
                // has enough time elapsed to update?
                this.animation.now = Date.now();
                this.animation.elapsed = this.animation.now - this.animation.lastRun;
                // if more time has elapsed than our desired framerate, then draw
                if (this.animation.elapsed > this.animation.fps) {
                    // are we incrementing or decrementing?
                    if (this.animation.isIncrementing && this.rawValue >= this.max) {
                        this.animation.isIncrementing = false;
                    }
                    else if (!this.animation.isIncrementing &&
                        this.rawValue <= this.min) {
                        this.animation.isIncrementing = true;
                    }
                    this.rawValue = this.animation.isIncrementing
                        ? this.rawValue + this.animation.step
                        : this.rawValue - this.animation.step;
                    this.update(this.rawValue).setAttributes();
                    // set "last run" to "now" minus any additional time that elapsed beyond the desired frame rate
                    this.animation.lastRun =
                        this.animation.now - (this.animation.elapsed % this.animation.fps);
                }
                requestAnimationFrame(this.animate);
            }
        };
        return SliderParameter;
    }(Parameter));
    var OptionsParameter = (function (_super) {
        __extends(OptionsParameter, _super);
        /**
         * @param {string} param
         * @param {{id: string, value: function, display: string}[]} options
         */
        function OptionsParameter(param, options) {
            _super.call(this, param, options.map(function (o) { return o.id; }), 'number');
            this.param = param;
            this.options = options;
            this.generate()
                .addEventListeners()
                .setAttributes()
                .updateDisplay(this.option.display);
            return this;
        }
        OptionsParameter.prototype.setAttributes = function () {
            this.options.forEach(function (option, i) {
                var el = document.getElementById(option.id);
                el.dataset.display = option.display;
                el.value = i;
            });
            return this;
        };
        OptionsParameter.prototype.update = function (value, emit) {
            if (emit === void 0) { emit = true; }
            this.option = this.options[value];
            this.value = this.option.value;
            this.updateDisplay.call(this, this.option.display);
            if (emit) {
                this.emit('update');
            }
            return this;
        };
        OptionsParameter.prototype.updateDisplay = function (value) {
            document.getElementById(this.option.id).checked = 'checked';
            this.controlValue.innerText = value;
            return this;
        };
        OptionsParameter.prototype.generate = function () {
            var generated = Math.floor(Math.random() * this.options.length);
            this.rawValue = generated;
            this.option = this.options[generated];
            this.value = this.option.value;
            return this;
        };
        return OptionsParameter;
    }(Parameter));
    var BooleanParameter = (function (_super) {
        __extends(BooleanParameter, _super);
        function BooleanParameter(param) {
            _super.call(this, param, [param]);
            this.param = param;
            this.generate()
                .addEventListeners()
                .updateDisplay(this.value);
            return this;
        }
        BooleanParameter.prototype.onInput = function (e) {
            this.rawValue = e.target.checked;
            this.update(this.rawValue);
            return this;
        };
        BooleanParameter.prototype.update = function (value, emit) {
            if (emit === void 0) { emit = true; }
            this.value = Boolean(value);
            this.updateDisplay(this.value);
            if (emit) {
                this.emit('update');
            }
            return this;
        };
        BooleanParameter.prototype.updateDisplay = function (checked) {
            this.controls[0].checked = checked;
            return this;
        };
        BooleanParameter.prototype.generate = function () {
            this.rawValue = this.value = this.chance();
            return this;
        };
        return BooleanParameter;
    }(Parameter));
    var ColorParameter = (function (_super) {
        __extends(ColorParameter, _super);
        function ColorParameter(param) {
            _super.call(this, param, [param]);
            this.param = param;
            this.generate()
                .addEventListeners()
                .setAttributes()
                .updateDisplay(this.value);
            return this;
        }
        ColorParameter.prototype.setAttributes = function () {
            this.controls[0].setAttribute('value', this.rawValue);
            return this;
        };
        ColorParameter.prototype.update = function (value, emit) {
            if (emit === void 0) { emit = true; }
            this.value = value;
            if (emit) {
                this.emit('update');
            }
            return this;
        };
        ColorParameter.prototype.generate = function () {
            this.rawValue = this.value = this.chance()
                ? '#000000'
                : valToRGBFactory(100, 0, {
                    returnHex: true
                })(Math.random() * 100);
            return this;
        };
        return ColorParameter;
    }(Parameter));

    // INITIALIZATION
    // ==============
    (function init() {
        var mainCanvasID = 'mainCanvas';
        var params = {
            solid: new BooleanParameter('solid'),
            resolution: new SliderParameter('resolution', {
                min: 20,
                max: 100,
                step: 0.1,
                animationController: 'resolution-animate',
                animationStep: 1 / 5000
            }),
            len: new SliderParameter('len', {
                min: 1,
                max: 60,
                step: 0.1,
                animationController: 'len-animate',
                animationStep: 1 / 1000
            }),
            width: new SliderParameter('width', {
                min: 1,
                max: 10,
                step: 0.1,
                generate1: true,
                animationController: 'width-animate',
                animationStep: 1 / 1000
            }),
            xModDepth: new SliderParameter('xModDepth', {
                min: 1,
                max: 10,
                step: 0.01,
                transformer: new LogSlider(),
                generateIntegers: true,
                animationController: 'xModDepth-animate',
                animationStep: 1 / 10000
            }),
            yModDepth: new SliderParameter('yModDepth', {
                min: 1,
                max: 10,
                step: 0.01,
                transformer: new LogSlider(),
                generateIntegers: true,
                animationController: 'yModDepth-animate',
                animationStep: 1 / 10000
            }),
            lineColor: new OptionsParameter('lineColor', lineColors),
            oscillatorX: new OptionsParameter('oscillatorX', oscillatorsX),
            oscillatorY: new OptionsParameter('oscillatorY', oscillatorsY),
            bgColor: new ColorParameter('bgColor')
        };
        // instantiate main canvas
        // mainCanvas = new MainCanvas(mainCanvasID);
        // Use this if you want MainCanvas to load by default
        var mainCanvas = new MainCanvas(mainCanvasID)
            .setParams(params)
            .setEquations()
            .draw();
        document.getElementById('mainCanvasControls').classList.remove('hide');
        loadParams(mainCanvas);
        mainCanvas.setParams(params).update();
        // generate thumbnails
        var refreshParams = refresh(params, mainCanvas);
        document.getElementById('refresh').addEventListener('click', refreshParams);
        // add toggle functionality
        document.querySelectorAll('.toggler').forEach(function (el) {
            el.addEventListener('click', toggleNextBlock);
        });
        document
            .getElementById('close-sidebar')
            .addEventListener('click', toggleSidebar);
        document
            .getElementById('open-sidebar')
            .addEventListener('click', toggleSidebar);
        // enable downloading image
        var downloader = document.getElementById('downloadBtn');
        downloader.addEventListener('click', download);
        document.getElementById('shareBtn').addEventListener('click', getShareURL(mainCanvas));
    })();

}());
