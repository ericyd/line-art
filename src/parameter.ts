import { throttle, round2, valToRGBFactory } from "./helpers";
import { Transformer, IdentityTransformer } from "./transformer";

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
export class Parameter {
  events: { [s: string]: () => any };
  controls: Array<HTMLElement>;
  controlValue: any;
  value: any;
  rawValue: any;
  update: (value: string, emit?: boolean) => Parameter;
  setAttributes: () => Parameter;
  constructor(
    public param: string,
    ids,
    public rawValueType: any,
  ) {
    this.events = {};
    this.controls = ids.map((id) => document.getElementById(id));
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
    this.controls.forEach((control) => {
      control.addEventListener("input", throttle(this.onInput.bind(this), 125));
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
    this.rawValue =
      this.rawValueType === "number" ? Number(e.target.value) : e.target.value;
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

export class SliderParameter extends Parameter {
  // TODO: document transformer - purpose and implementation
  max: number;
  min: number;
  step: number;
  transformer: Transformer;
  generateIntegers: boolean;
  generate1: boolean;
  animation: { [s: string]: any };
  constructor(
    public param: string,
    {
      min = 1,
      max = 10,
      step = 0.1,
      transformer = new IdentityTransformer(),
      generateIntegers = false,
      generate1 = false,
      animationController = '',
      animationStep = 0.01,
    } = {},
  ) {
    super(param, [param], "number");
    this.max = max;
    this.min = min;
    this.step = step;
    this.transformer = transformer;
    this.generateIntegers = generateIntegers;
    this.generate1 = generate1;
    if (animationController !== '') {
      const animationContainer = document.getElementById(animationController);
      this.animation = {
        isActive: false,
        isIncrementing: true,
        now: Date.now(),
        lastRun: Date.now(),
        fps: 1000 / 30,
        step: animationStep || (this.max - this.min) / 50000,
        controller: {
          run: animationContainer?.querySelector(".animation-run-toggle"),
          direction: animationContainer?.querySelector(
            ".animation-direction-toggle",
          ),
          step: animationContainer?.querySelector(".animation-step"),
        },
      };
      this.animate = this.animate.bind(this);
      this.animation.controller.run?.addEventListener(
        "input",
        this.toggleAnimation.bind(this),
      );
      this.animation.controller.direction?.addEventListener(
        "click",
        this.toggleAnimationDirection.bind(this),
      );
      this.animation.controller.step?.addEventListener(
        "input",
        throttle(this.updateAnimationStep.bind(this), 150),
      );
      this.animation.controller.step?.setAttribute(
        "max",
        this.animation.step * 50,
      );
      this.animation.controller.step?.setAttribute(
        "min",
        this.animation.step / 10,
      );
      this.animation.controller.step?.setAttribute("step", this.animation.step);
      this.animation.controller.step?.setAttribute("value", this.animation.step);
    }

    this.generate()
      .addEventListeners()
      .setAttributes()
      .updateDisplay(round2(this.value));
    return this;
  }

  setAttributes() {
    this.controls[0].setAttribute("step", String(this.step));
    this.controls[0].setAttribute("max", String(this.max));
    this.controls[0].setAttribute("min", String(this.min));
    this.controls[0].setAttribute("value", this.rawValue);
    return this;
  }

  update(value, emit = true) {
    this.rawValue = Number(value);
    this.value = this.transformer.value(this.rawValue);
    this.updateDisplay(round2(this.value));
    if (emit) {
      this.emit("update");
    }
    return this;
  }

  generate() {
    if (this.generateIntegers) {
      // have to call this.transformer.position here because this is
      // what we want the final result to be;
      // internally, this.value is stored as the transformed value
      var rand =
        Math.random() * (this.transformer.maxpos - this.transformer.minpos) +
        this.transformer.minpos;
      var generated = this.transformer.position(rand);
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
  // however, typescript compiles these to generator functions which IE seems to not understand.
  // Since it isn't a huge performance boost anyway I am removing async to increase compatibility
  /*async*/ toggleAnimationDirection() {
    this.animation.isIncrementing = !this.animation.isIncrementing;
  }

  /*async*/ updateAnimationStep(e) {
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
        } else if (
          !this.animation.isIncrementing &&
          this.rawValue <= this.min
        ) {
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
  }
}

export class OptionsParameter extends Parameter {
  /**
   * @param {string} param
   * @param {{id: string, value: function, display: string}[]} options
   */
  constructor(
    public param: string,
    options,
  ) {
    super(
      param,
      options.map((o) => o.id),
      "number",
    );
    this.options = options;
    this.generate()
      .addEventListeners()
      .setAttributes()
      .updateDisplay(this.option.display);
    return this;
  }

  setAttributes() {
    this.options.forEach((option, i) => {
      const el = <HTMLInputElement>document.getElementById(option.id);
      el.dataset.display = option.display;
      el.value = i;
      const label = document.querySelector(`[for="${option.id}"`);
      label.innerText = option.display;
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
    // always start with "colorful"
    this.rawValue = 0;
    this.option = this.options[0];
    this.value = this.option.value;
    return this;
  }
}

export class BooleanParameter extends Parameter {
  constructor(public param: string) {
    super(param, [param]);
    this.generate().addEventListeners().updateDisplay(this.value);
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

export class ColorParameter extends Parameter {
  constructor(public param: string) {
    super(param, [param]);
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
    // always start with black
    this.rawValue = this.value = "#000000";
    return this;
  }
}
