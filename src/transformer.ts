import { round3 } from "./helpers";

// TRANSFORMERS
// ================

export interface Transformer {
  value: (number) => number;
  position: (number) => number;
}

// credit: https://stackoverflow.com/a/846249
export class LogSlider implements Transformer {
  minpos: number;
  maxpos: number;
  minlval: number;
  maxlval: number;
  scale: number;
  constructor({ minpos = 1, maxpos = 10, minval = 0.1, maxval = 100 } = {}) {
    this.minpos = minpos;
    this.maxpos = maxpos;
    this.minlval = Math.log(minval);
    this.maxlval = Math.log(maxval);
    this.scale = (this.maxlval - this.minlval) / (this.maxpos - this.minpos);
  }

  value(position) {
    return Math.exp((position - this.minpos) * this.scale + this.minlval);
  }
  // Calculate slider position from a value
  position(value) {
    return round3(this.minpos + (Math.log(value) - this.minlval) / this.scale);
  }
}

const id = (x) => x;

export class IdentityTransformer implements Transformer {
  value: (any) => any;
  position: (any) => any;
  constructor() {
    this.value = id;
    this.position = id;
    return this;
  }
}
