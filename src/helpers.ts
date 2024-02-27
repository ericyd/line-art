import { Thumbnail } from "./drawing";

// HELPER FUNCTIONS
// ================

const roundN = (decimals) => {
  return (val) => {
    if (isNaN(val)) return val;
    try {
      return Math.round(val * Math.pow(10, decimals)) / Math.pow(10, decimals);
    } catch (e) {
      return val;
    }
  };
};

export const round2 = roundN(2);

export const round3 = roundN(3);

export function toHex(value) {
  if (value > 255 || value < 0) {
    throw new Error("Please use an 8-bit value");
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
export function valToRGBFactory(
  nMax = 100,
  nMin = 0,
  {
    fixEdges = false, // show black @ nMin and white @ nMax
    returnHex = false, // return 6-digit hex value in form #000000
    returnChannels = false, // returns an array of the raw r, g, b values
  } = {},
) {
  return function (input) {
    const n = Math.min(nMax, Math.max(nMin, input));
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
    var period = (offset) => (2 * Math.PI * offset) / nMax;
    var clip = (x) => (x < min ? min : x > max ? max : x);
    var rangeAdjust = (x) => x * range + min + range / 2;
    var channel = (offset) => (x) =>
      clip(rangeAdjust(Math.sin(x * period(1) + period(offset))));
    // the offset math is a bit opaque to me, but it works
    var r = channel(n6th * 2 - n12th);
    var g = channel(n6th * 6 - n12th);
    var b = channel(n6th * 4 - n12th);

    if (returnHex) {
      return `#${toHex(r(n))}${toHex(g(n))}${toHex(b(n))}`;
    }
    if (returnChannels) {
      return [r(n), g(n), b(n)];
    }

    return `rgb(${r(n)},${g(n)},${b(n)})`;
  };
}

/**
 *
 * @param {string} color must be a hex value
 */
export function fixedColorFactory(color) {
  return (_, __, { returnChannels = false } = {}) => {
    return () => {
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

export function download(e, id) {
  e.target.download = "image.png";
  e.target.href = document
    .getElementById(id)
    .toDataURL("image/png")
    .replace(/^data:image\/[^;]/, "data:application/octet-stream");
}

export function refresh(params, mainCanvas) {
  return () => {
    document.querySelectorAll(".sidebar__thumb").forEach((el, i) => {
      new Thumbnail(el.id, mainCanvas).setParams(params, true).update();
    });
  };
}

export function toggleSidebar(e) {
  document.getElementById("sidebar")?.classList.toggle("collapsed");
  document.getElementById("sidebar")?.classList.toggle("expanded");
}

export function toggleNextBlock(e) {
  var listener = e.currentTarget;
  listener.parentElement.classList.toggle("is-expanded");
}

// credit: https://github.com/jashkenas/underscore/blob/ae037f7c41323807ae6f1533c45512e6d31a1574/underscore.js#L842-L881
export function throttle(func, wait, options = {}) {
  var timeout, context, args, result;
  var previous = 0;

  var later = function () {
    previous = options.leading === false ? 0 : Date.now();
    timeout = null;
    result = func.apply(context, args);
    if (!timeout) context = args = null;
  };

  var throttled = function () {
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

export function loadParams(mainCanvas) {
  const params = new URL(window.location.toString()).searchParams;
  params.forEach((value, key) => {
    // TODO: should probably expose a better API than accessing mainCanvas.params directly
    if (key === "bgColor") {
      value = value;
    } else if (key === "solid") {
      value = value === "true";
    } else {
      value = Number(value);
    }
    mainCanvas.params[key].setValue(value);
  });
}

export function getShareURL(mainCanvas) {
  return () => {
    // set URL and delete any existing params
    const baseURL = new URL(window.location.toString());
    for (let [key, _] of baseURL.searchParams) {
      baseURL.searchParams.delete(key);
    }
    // get new params and append to baseURL searchParams
    const params = mainCanvas.params;
    Object.keys(params).forEach((param) => {
      baseURL.searchParams.append(param, params[param].rawValue);
    });
    // display result to user
    prompt("Copy this URL and send it to someone awesome", baseURL.toString());
  };
}
