export default () => {
  const forEachPolyfill = function (callback, thisArg) {
    thisArg = thisArg || window;
    for (var i = 0; i < this.length; i++) {
        callback.call(thisArg, this[i], i, this);
    }
  };

  if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = forEachPolyfill;
  }
};