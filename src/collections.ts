import { valToRGBFactory, fixedColorFactory } from "./helpers";

// COLLECTIONS FOR OPTIONPARAMETERS
// ================

Math.log10 =
  Math.log10 ||
  function log10(x) {
    return Math.log(x) / Math.LN10;
  };

interface Oscillator {
  id: string;
  value: (number) => number;
  display: string;
}

// keeping for possible future experimentation
const oldOscillators = [
  (t) => (Math.cos(t) + 1) / 2,
  (t) => Math.cos(Math.pow(t, 0.35)),
  (t) => Math.sin(Math.cos(t) * Math.sin(t)) * 2,
];

// values must be functions that return a number
// bug 2
export const oscillatorsX: Array<Oscillator> = [
  {
    id: "osc0",
    value: (t) => Math.sin(t),
    display: "sine",
  },
  {
    id: "osc1",
    value: (t) => Math.cos(t),
    display: "cosine",
  },
  {
    id: "osc2",
    value: (t) => (Math.sin(t) + 1) / 2,
    display: "half-sine",
  },
  {
    id: "osc3",
    value: (t) => Math.sin(t) * Math.pow(t, -0.35),
    display: "collapse",
  },
  {
    // based on https://en.wikipedia.org/wiki/Trochoid
    id: "osc4",
    value: (t) => {
      var a = 0.5;
      var b = 0.5;
      return a - b * Math.sin(t);
    },
    display: "trochoid",
  },
  {
    id: "osc5",
    // based on: https://en.wikipedia.org/wiki/Epicycloid
    value: (t) => {
      var r = 0.2;
      var k = 3; // number of cusps
      // var R = k * r;
      // supposedly either of these two functions should work
      // return ( (r + R)*Math.cos(t) - r*Math.cos((r + R) / r * t) )
      return r * (k + 1) * Math.cos(t) - r * Math.cos((k + 1) * t);
    },
    display: "epicycloid",
  },
  {
    id: "osc6",
    value: (t) => Math.sin(Math.cos(Math.log10(t))),
    display: "log periodic",
  },
  {
    id: "osc7",
    value: (t) => Math.abs(Math.sin(t / 10)),
    display: "absolute",
  },
  {
    id: "osc8",
    value: (t) => {
      var start = Math.sin(t);
      if (start > 0.5) {
        return start;
      }
      return start / -3;
    },
    display: "experimental",
  },
];

export const oscillatorsY: Array<Oscillator> = [
  {
    id: "osc10",
    value: (t) => Math.sin(t),
    display: "sine",
  },
  {
    id: "osc11",
    value: (t) => Math.cos(t),
    display: "cosine",
  },
  {
    id: "osc12",
    value: (t) => (Math.sin(t) + 1) / 2,
    display: "half-sine",
  },
  {
    id: "osc13",
    value: (t) => Math.sin(t) * Math.pow(t, -0.35),
    display: "collapse",
  },
  {
    // based on https://en.wikipedia.org/wiki/Trochoid
    id: "osc14",
    value: (t) => {
      var a = 0.5;
      var b = 0.5;
      return a - b * Math.cos(t);
    },
    display: "trochoid",
  },
  {
    id: "osc15",
    // based on: https://en.wikipedia.org/wiki/Epicycloid
    value: (t) => {
      var r = 0.2;
      var k = 3; // number of cusps
      return r * (k + 1) * Math.sin(t) - r * Math.sin((k + 1) * t);
    },
    display: "epicycloid",
  },
  {
    id: "osc16",
    value: (t) => Math.sin(Math.cos(Math.log10(t))),
    display: "log periodic",
  },
  {
    id: "osc17",
    value: (t) => Math.abs(Math.sin(t / 10)),
    display: "absolute",
  },
  {
    id: "osc18",
    value: (t) => {
      var start = Math.sin(t);
      if (start > 0.5) {
        return start;
      }
      return start / -3;
    },
    display: "experimental",
  },
];

interface LineColor {
  id: string;
  value: () => (number) => string;
  display: string;
}

// values must be functions that return functions that return a color
export const lineColors: Array<LineColor> = [
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
