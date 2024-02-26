(function () {
    'use strict';

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise, SuppressedError, Symbol */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };

    var Drawing = (function () {
        function Drawing(canvasID) {
            var _this = this;
            this.canvas = document.getElementById(canvasID);
            this.ctx = this.canvas.getContext("2d");
            this.params = {};
            this.radius = Math.max(this.canvas.width, this.canvas.height) / 2.1;
            this.offsetPoint = function (val) { return val + _this.canvas.width / 2; };
            this.min = Math.PI / 12;
            this.useImageData = false;
            this.imageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
            return this;
        }
        Drawing.prototype.logDataOnHover = function (event) {
            var x = event.layerX;
            var y = event.layerY;
            var pixel = this.ctx.getImageData(x, y, 1, 1);
            var data = pixel.data;
            var rgba1 = "rgba(" +
                data[0] +
                ", " +
                data[1] +
                ", " +
                data[2] +
                ", " +
                data[3] +
                ")";
            console.log(rgba1);
        };
        Drawing.prototype.drawPixel = function (x, y, r, g, b, a) {
            var index = (y * this.canvas.width + x) * 4;
            this.imageData.data[index + 0] = r;
            this.imageData.data[index + 1] = g;
            this.imageData.data[index + 2] = b;
            this.imageData.data[index + 3] = a;
        };
        Drawing.prototype.drawDotsImageData = function () {
            this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            for (var t = this.min; t <= this.max; t += this.increment) {
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
            for (var t = this.min; t <= this.max; t += this.increment) {
                var x = this.xScale(t);
                var y = this.yScale(t);
                this.ctx.fillStyle = this.getLineColor(t);
                this.ctx.fillRect(x, y, this.lineWidth, this.lineWidth);
            }
            return this;
        };
        Drawing.prototype.drawLines = function () {
            this.ctx.lineWidth = this.lineWidth;
            for (var t = this.min; t <= this.max; t += this.increment) {
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
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = this.params.bgColor.value;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.strokeStyle = this.getLineColor(0);
            this.ctx.fillStyle = this.getLineColor(0);
            if (this.params.solid.value) {
                this.x = this.xScale(this.min);
                this.y = this.yScale(this.min);
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
            this.getPixelColor = this.params.lineColor.value(this.max, 0, {
                returnChannels: true,
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
            var _this = _super.call(this, canvasID) || this;
            _this.mainCanvas = mainCanvas;
            _this.canvas.addEventListener("click", _this.onClick.bind(_this));
            _this.values = {};
            return _this;
        }
        Thumbnail.prototype.onClick = function (e) {
            var _this = this;
            document.getElementById("mainCanvasControls").classList.remove("hide");
            Object.keys(this.params).forEach(function (key) {
                var param = _this.params[key];
                param.setValue(_this.values[param.param]);
            });
            this.mainCanvas.setParams(this.params).update();
        };
        Thumbnail.prototype.cacheValue = function (param, value) {
            this.values[param] = value;
        };
        Thumbnail.prototype.setParams = function (params, generate) {
            var _this = this;
            Object.keys(params).forEach(function (key) {
                var param = params[key];
                if (generate) {
                    param.generate();
                }
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
            return _super.call(this, canvasID) || this;
        }
        MainCanvas.prototype.setParams = function (params) {
            var _this = this;
            Object.keys(params).forEach(function (key) {
                var param = params[key];
                param.on("update", _this.update.bind(_this));
            });
            this.params = params;
            return this;
        };
        return MainCanvas;
    }(Drawing));
    var Harmonograph = (function (_super) {
        __extends(Harmonograph, _super);
        function Harmonograph(canvasID) {
            return _super.call(this, canvasID) || this;
        }
        Harmonograph.prototype.setEquations = function () {
            var _this = this;
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
            this.xScale = function (t) {
                return _this.offsetPoint(_this.a1 *
                    Math.sin(t * _this.f1 + _this.p1) *
                    Math.pow(Math.E, -_this.d1 * t) +
                    _this.a2 *
                        Math.sin(t * _this.f2 + _this.p2) *
                        Math.pow(Math.E, -_this.d2 * t));
            };
            this.yScale = function (t) {
                return _this.offsetPoint(_this.a3 *
                    Math.sin(t * _this.f3 + _this.p3) *
                    Math.pow(Math.E, -_this.d3 * t) +
                    _this.a4 *
                        Math.sin(t * _this.f4 + _this.p4) *
                        Math.pow(Math.E, -_this.d4 * t));
            };
            this.max = Math.PI * this.params.len.value;
            this.getLineColor = this.params.lineColor.value(this.max, 0);
            this.getPixelColor = this.params.lineColor.value(this.max, 0, {
                returnChannels: true,
            });
            this.lineWidth = this.params.width.value;
            this.increment = 1 / this.params.resolution.value;
            return this;
        };
        return Harmonograph;
    }(MainCanvas));

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
            throw new Error("Please use an 8-bit value");
        }
        return Math.round(value).toString(16);
    }
    function valToRGBFactory(nMax, nMin, _a) {
        if (nMax === void 0) { nMax = 100; }
        if (nMin === void 0) { nMin = 0; }
        var _b = _a === void 0 ? {} : _a, _c = _b.fixEdges, fixEdges = _c === void 0 ? false : _c, _d = _b.returnHex, returnHex = _d === void 0 ? false : _d, _e = _b.returnChannels, returnChannels = _e === void 0 ? false : _e;
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
            var min = 90;
            var max = 212;
            var range = max - min;
            var period = function (offset) { return (2 * Math.PI * offset) / nMax; };
            var clip = function (x) { return (x < min ? min : x > max ? max : x); };
            var rangeAdjust = function (x) { return x * range + min + range / 2; };
            var channel = function (offset) { return function (x) {
                return clip(rangeAdjust(Math.sin(x * period(1) + period(offset))));
            }; };
            var r = channel(n6th * 2 - n12th);
            var g = channel(n6th * 6 - n12th);
            var b = channel(n6th * 4 - n12th);
            if (returnHex) {
                return "#".concat(toHex(r(n))).concat(toHex(g(n))).concat(toHex(b(n)));
            }
            if (returnChannels) {
                return [r(n), g(n), b(n)];
            }
            return "rgb(".concat(r(n), ",").concat(g(n), ",").concat(b(n), ")");
        };
    }
    function fixedColorFactory(color) {
        return function (_, __, _a) {
            var _b = _a === void 0 ? {} : _a, _c = _b.returnChannels, returnChannels = _c === void 0 ? false : _c;
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
    function download(e, id) {
        e.target.download = "image.png";
        e.target.href = document
            .getElementById(id)
            .toDataURL("image/png")
            .replace(/^data:image\/[^;]/, "data:application/octet-stream");
    }
    function toggleNextBlock(e) {
        var listener = e.currentTarget;
        listener.parentElement.classList.toggle("is-expanded");
    }
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
        var params = new URL(window.location.toString()).searchParams;
        params.forEach(function (value, key) {
            if (key === "bgColor") {
                value = value;
            }
            else if (key === "solid") {
                value = value === "true";
            }
            else {
                value = Number(value);
            }
            mainCanvas.params[key].setValue(value);
        });
    }
    function getShareURL(mainCanvas) {
        return function () {
            var baseURL = new URL(window.location.toString());
            for (var _i = 0, _a = baseURL.searchParams; _i < _a.length; _i++) {
                var _b = _a[_i], key = _b[0]; _b[1];
                baseURL.searchParams.delete(key);
            }
            var params = mainCanvas.params;
            Object.keys(params).forEach(function (param) {
                baseURL.searchParams.append(param, params[param].rawValue);
            });
            prompt("Copy this URL and send it to someone awesome", baseURL.toString());
        };
    }

    Math.log10 =
        Math.log10 ||
            function log10(x) {
                return Math.log(x) / Math.LN10;
            };
    var lineColors = [
        {
            id: "colorful",
            value: valToRGBFactory,
            display: "colorful",
        },
        {
            id: "white",
            value: fixedColorFactory("#FFFFFF"),
            display: "white",
        },
        {
            id: "black",
            value: fixedColorFactory("#000000"),
            display: "black",
        },
    ];

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
            return Math.exp((position - this.minpos) * this.scale + this.minlval);
        };
        LogSlider.prototype.position = function (value) {
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

    var Parameter = (function () {
        function Parameter(param, ids, rawValueType) {
            this.param = param;
            this.rawValueType = rawValueType;
            this.events = {};
            this.controls = ids.map(function (id) { return document.getElementById(id); });
            try {
                this.controlValue = document.getElementById("".concat(param, "-value"));
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
                control.addEventListener("input", throttle(_this.onInput.bind(_this), 125));
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
                this.rawValueType === "number" ? Number(e.target.value) : e.target.value;
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
            var _this = _super.call(this, param, [param], "number") || this;
            _this.param = param;
            _this.max = max;
            _this.min = min;
            _this.step = step;
            _this.transformer = transformer;
            _this.generateIntegers = generateIntegers;
            _this.generate1 = generate1;
            if (animationController) {
                var animationContainer = document.getElementById(animationController);
                _this.animation = {
                    isActive: false,
                    isIncrementing: true,
                    now: Date.now(),
                    lastRun: Date.now(),
                    fps: 1000 / 30,
                    step: animationStep || (_this.max - _this.min) / 50000,
                    controller: {
                        run: animationContainer.querySelector(".animation-run-toggle"),
                        direction: animationContainer.querySelector(".animation-direction-toggle"),
                        step: animationContainer.querySelector(".animation-step"),
                    },
                };
                _this.animate = _this.animate.bind(_this);
                _this.animation.controller.run.addEventListener("input", _this.toggleAnimation.bind(_this));
                _this.animation.controller.direction.addEventListener("click", _this.toggleAnimationDirection.bind(_this));
                _this.animation.controller.step.addEventListener("input", throttle(_this.updateAnimationStep.bind(_this), 150));
                _this.animation.controller.step.setAttribute("max", _this.animation.step * 50);
                _this.animation.controller.step.setAttribute("min", _this.animation.step / 10);
                _this.animation.controller.step.setAttribute("step", _this.animation.step);
                _this.animation.controller.step.setAttribute("value", _this.animation.step);
            }
            _this.generate()
                .addEventListeners()
                .setAttributes()
                .updateDisplay(round2(_this.value));
            return _this;
        }
        SliderParameter.prototype.setAttributes = function () {
            this.controls[0].setAttribute("step", String(this.step));
            this.controls[0].setAttribute("max", String(this.max));
            this.controls[0].setAttribute("min", String(this.min));
            this.controls[0].setAttribute("value", this.rawValue);
            return this;
        };
        SliderParameter.prototype.update = function (value, emit) {
            if (emit === void 0) { emit = true; }
            this.rawValue = Number(value);
            this.value = this.transformer.value(this.rawValue);
            this.updateDisplay(round2(this.value));
            if (emit) {
                this.emit("update");
            }
            return this;
        };
        SliderParameter.prototype.generate = function () {
            if (this.generateIntegers) {
                var rand = Math.random() * (this.transformer.maxpos - this.transformer.minpos) +
                    this.transformer.minpos;
                var generated = this.transformer.position(rand);
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
        SliderParameter.prototype.toggleAnimationDirection = function () {
            this.animation.isIncrementing = !this.animation.isIncrementing;
        };
        SliderParameter.prototype.updateAnimationStep = function (e) {
            this.animation.step = Number(e.target.value);
        };
        SliderParameter.prototype.animate = function () {
            if (this.animation.isActive) {
                this.animation.now = Date.now();
                this.animation.elapsed = this.animation.now - this.animation.lastRun;
                if (this.animation.elapsed > this.animation.fps) {
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
        function OptionsParameter(param, options) {
            var _this = _super.call(this, param, options.map(function (o) { return o.id; }), "number") || this;
            _this.param = param;
            _this.options = options;
            _this.generate()
                .addEventListeners()
                .setAttributes()
                .updateDisplay(_this.option.display);
            return _this;
        }
        OptionsParameter.prototype.setAttributes = function () {
            this.options.forEach(function (option, i) {
                var el = document.getElementById(option.id);
                el.dataset.display = option.display;
                el.value = i;
                var label = document.querySelector("[for=\"".concat(option.id, "\""));
                label.innerText = option.display;
            });
            return this;
        };
        OptionsParameter.prototype.update = function (value, emit) {
            if (emit === void 0) { emit = true; }
            this.option = this.options[value];
            this.value = this.option.value;
            this.updateDisplay.call(this, this.option.display);
            if (emit) {
                this.emit("update");
            }
            return this;
        };
        OptionsParameter.prototype.updateDisplay = function (value) {
            document.getElementById(this.option.id).checked = "checked";
            this.controlValue.innerText = value;
            return this;
        };
        OptionsParameter.prototype.generate = function () {
            this.rawValue = 0;
            this.option = this.options[0];
            this.value = this.option.value;
            return this;
        };
        return OptionsParameter;
    }(Parameter));
    var BooleanParameter = (function (_super) {
        __extends(BooleanParameter, _super);
        function BooleanParameter(param) {
            var _this = _super.call(this, param, [param]) || this;
            _this.param = param;
            _this.generate().addEventListeners().updateDisplay(_this.value);
            return _this;
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
                this.emit("update");
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
            var _this = _super.call(this, param, [param]) || this;
            _this.param = param;
            _this.generate()
                .addEventListeners()
                .setAttributes()
                .updateDisplay(_this.value);
            return _this;
        }
        ColorParameter.prototype.setAttributes = function () {
            this.controls[0].setAttribute("value", this.rawValue);
            return this;
        };
        ColorParameter.prototype.update = function (value, emit) {
            if (emit === void 0) { emit = true; }
            this.value = value;
            if (emit) {
                this.emit("update");
            }
            return this;
        };
        ColorParameter.prototype.generate = function () {
            this.rawValue = this.value = "#000000";
            return this;
        };
        return ColorParameter;
    }(Parameter));

    var polyfill = (function () {
        var forEachPolyfill = function (callback, thisArg) {
            thisArg = thisArg || window;
            for (var i = 0; i < this.length; i++) {
                callback.call(thisArg, this[i], i, this);
            }
        };
        if (window.NodeList && !NodeList.prototype.forEach) {
            NodeList.prototype.forEach = forEachPolyfill;
        }
    });

    polyfill();
    (function init() {
        var mainCanvasID = "mainCanvas";
        var amplitudeConfig = {
            min: 1,
            max: 1000,
            step: 0.1,
        };
        var phaseConfig = {
            min: 0.001,
            max: 2 * Math.PI,
            step: 0.01,
        };
        var frequencyConfig = {
            min: 0.1,
            max: 100,
            step: 0.01,
        };
        var dampingConfig = {
            min: 0.01,
            max: 10,
            step: 0.01,
            transformer: new LogSlider({
                minpos: 0.01,
                maxpos: 10,
                minval: 0.01,
                maxval: 10,
            }),
            generateIntegers: true,
        };
        var params = {
            solid: new BooleanParameter("solid"),
            resolution: new SliderParameter("resolution", {
                min: 50,
                max: 1000,
                step: 1,
                animationController: "resolution-animate",
                animationStep: 1 / 5000,
            }),
            len: new SliderParameter("len", {
                min: 1,
                max: 60,
                step: 0.1,
                animationController: "len-animate",
                animationStep: 1 / 1000,
            }),
            width: new SliderParameter("width", {
                min: 1,
                max: 10,
                step: 0.1,
                generate1: true,
                animationController: "width-animate",
                animationStep: 1 / 1000,
            }),
            lineColor: new OptionsParameter("lineColor", lineColors),
            bgColor: new ColorParameter("bgColor"),
            p1: new SliderParameter("p1", phaseConfig),
            p2: new SliderParameter("p2", phaseConfig),
            p3: new SliderParameter("p3", phaseConfig),
            p4: new SliderParameter("p4", phaseConfig),
            f1: new SliderParameter("f1", frequencyConfig),
            f2: new SliderParameter("f2", frequencyConfig),
            f3: new SliderParameter("f3", frequencyConfig),
            f4: new SliderParameter("f4", frequencyConfig),
            d1: new SliderParameter("d1", dampingConfig),
            d2: new SliderParameter("d2", dampingConfig),
            d3: new SliderParameter("d3", dampingConfig),
            d4: new SliderParameter("d4", dampingConfig),
            a1: new SliderParameter("a1", amplitudeConfig),
            a2: new SliderParameter("a2", amplitudeConfig),
            a3: new SliderParameter("a3", amplitudeConfig),
            a4: new SliderParameter("a4", amplitudeConfig),
        };
        var mainCanvas = new Harmonograph(mainCanvasID)
            .setParams(params)
            .setEquations()
            .draw();
        document.getElementById("mainCanvasControls").classList.remove("hide");
        loadParams(mainCanvas);
        mainCanvas.setParams(params).update();
        document.querySelectorAll(".toggler").forEach(function (el) {
            el.addEventListener("click", toggleNextBlock);
        });
        document.getElementById("downloadBtn").addEventListener("click", function (e) {
            download(e, "mainCanvas");
        });
        document.getElementById("downloadBtnHiRes").addEventListener("click", function (e) {
            new Thumbnail("downloadCanvas", mainCanvas)
                .setParams(params, false)
                .setEquations()
                .draw();
            download(e, "downloadCanvas");
        });
        document
            .getElementById("shareBtn")
            .addEventListener("click", getShareURL(mainCanvas));
    })();

})();
