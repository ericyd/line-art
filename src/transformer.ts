import { round3 } from './helpers';

// TRANSFORMERS
// ================

// credit: https://stackoverflow.com/a/846249
export class LogSlider {
  constructor({ minpos = 1, maxpos = 10, minval = 0.1, maxval = 100 } = {}) {
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
