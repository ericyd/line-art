/**
 * Note: the major difference between this file and main.ts
 * is that this one has different initialization params,
 * and it intantiates the Harmonograph class instead of the
 * MainCanvas class.
 * The underlying design and use-cases are identical.
 */
import { lineColors } from "./collections";
import {
  SliderParameter,
  OptionsParameter,
  ColorParameter,
  BooleanParameter,
} from "./parameter";
import { MainCanvas, Thumbnail, Harmonograph } from "./drawing";
import { LogSlider } from "./transformer";
import {
  refresh,
  loadParams,
  getShareURL,
  toggleNextBlock,
  toggleSidebar,
  download,
} from "./helpers";
import polyfill from "./polyfill";
polyfill();

// INITIALIZATION
// ==============

(function init() {
  var mainCanvasID = "mainCanvas";

  const amplitudeConfig = {
    min: 1,
    max: 1000,
    step: 0.01,
  }

  // Phase, not surprisingly, should range between 0 and 2*PI
  const phaseConfig = {
    min: 0.001,
    max: 2 * Math.PI,
    step: 0.001,
  }

  const frequencyConfig = {
    min: 0.1,
    max: 100,
    step: 0.001,
  }

  const dampingConfig = {
    min: 0.01,
    max: 10,
    step: 0.001,
    transformer: new LogSlider({ minpos:0.01, maxpos:10, minval: 0.01, maxval: 10 }),
    generateIntegers: true
  }

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

  // instantiate main canvas
  // mainCanvas = new MainCanvas(mainCanvasID);
  // Use this if you want MainCanvas to load by default
  const mainCanvas = new Harmonograph(mainCanvasID)
    .setParams(params)
    .setEquations()
    .draw();
  document.getElementById("mainCanvasControls").classList.remove("hide");
  loadParams(mainCanvas);
  mainCanvas.setParams(params).update();

  // generate thumbnails
  // var refreshParams = refresh(params, mainCanvas);
  // document.getElementById("refresh").addEventListener("click", refreshParams);

  // add toggle functionality
  document.querySelectorAll(".toggler").forEach(function (el) {
    el.addEventListener("click", toggleNextBlock);
  });

  // document
  //   .getElementById("close-sidebar")
  //   .addEventListener("click", toggleSidebar);
  // document
  //   .getElementById("open-sidebar")
  //   .addEventListener("click", toggleSidebar);

  // enable downloading image
  document.getElementById("downloadBtn").addEventListener("click", (e) => {
    download(e, "mainCanvas");
  });
  document.getElementById("downloadBtnHiRes").addEventListener("click", (e) => {
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
