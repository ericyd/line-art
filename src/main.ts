import { oscillatorsX, oscillatorsY, lineColors } from "./collections";
import {
  SliderParameter,
  OptionsParameter,
  ColorParameter,
  BooleanParameter,
} from "./parameter";
import { MainCanvas, Thumbnail } from "./drawing";
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

  var params = {
    solid: new BooleanParameter("solid"),
    resolution: new SliderParameter("resolution", {
      min: 20,
      max: 100,
      step: 0.1,
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
    xModDepth: new SliderParameter("xModDepth", {
      min: 1,
      max: 10,
      step: 0.001,
      transformer: new LogSlider(),
      generateIntegers: true,
      animationController: "xModDepth-animate",
      animationStep: 1 / 10000,
    }),
    yModDepth: new SliderParameter("yModDepth", {
      min: 1,
      max: 10,
      step: 0.001,
      transformer: new LogSlider(),
      generateIntegers: true,
      // bug 1
      animationController: "yModDepth-animate",
      animationStep: 1 / 10000,
    }),
    lineColor: new OptionsParameter("lineColor", lineColors),
    oscillatorX: new OptionsParameter("oscillatorX", oscillatorsX),
    oscillatorY: new OptionsParameter("oscillatorY", oscillatorsY),
    bgColor: new ColorParameter("bgColor"),
  };

  // instantiate main canvas
  // mainCanvas = new MainCanvas(mainCanvasID);
  // Use this if you want MainCanvas to load by default
  const mainCanvas = new MainCanvas(mainCanvasID)
    .setParams(params)
    .setEquations()
    .draw();
  document.getElementById("mainCanvasControls")?.classList.remove("hide");
  loadParams(mainCanvas);
  mainCanvas.setParams(params).update();

  // generate thumbnails
  var refreshParams = refresh(params, mainCanvas);
  document.getElementById("refresh")?.addEventListener("click", refreshParams);

  // add toggle functionality
  document.querySelectorAll(".toggler").forEach(function (el) {
    el.addEventListener("click", toggleNextBlock);
  });

  document
    .getElementById("close-sidebar")
    ?.addEventListener("click", toggleSidebar);
  document
    .getElementById("open-sidebar")
    ?.addEventListener("click", toggleSidebar);

  // enable downloading image
  const downloader = document.getElementById("downloadBtn");
  document.getElementById("downloadBtn")?.addEventListener("click", (e) => {
    download(e, "mainCanvas");
  });
  document.getElementById("downloadBtnHiRes")?.addEventListener("click", (e) => {
    new Thumbnail("downloadCanvas", mainCanvas)
      .setParams(params, false)
      .setEquations()
      .draw();
    download(e, "downloadCanvas");
  });

  document
    .getElementById("shareBtn")
    ?.addEventListener("click", getShareURL(mainCanvas));
})();
