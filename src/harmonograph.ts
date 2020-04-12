import { lineColors } from './collections';
import {
  SliderParameter,
  OptionsParameter,
  ColorParameter,
  BooleanParameter
} from './parameter';
import { MainCanvas, Thumbnail, Harmonograph } from './drawing';
import { LogSlider } from './transformer';
import {refresh, loadParams, getShareURL, toggleNextBlock, toggleSidebar, download} from './helpers';
import polyfill from './polyfill';
polyfill();

// INITIALIZATION
// ==============

(function init() {
  var mainCanvasID = 'mainCanvas';

  var params = {
    solid: new BooleanParameter('solid'),
    resolution: new SliderParameter('resolution', {
      min: 50,
      max: 1000,
      step: 1,
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
    lineColor: new OptionsParameter('lineColor', lineColors),
    bgColor: new ColorParameter('bgColor'),



    // Phase, not surprisingly, should range between 0 and 2*PI
    p1: new SliderParameter('p1', {
      min: 0.001,
      max: 2 * Math.PI,
      step: 0.001,
      // transformer: new LogSlider(),
      generateIntegers: true,
      // animationController: 'p1-animate',
      // animationStep: 1 / 10000
    }),

    p2: new SliderParameter('p2', {
      min: 0.001,
      max: 2 * Math.PI,
      step: 0.001,
      // transformer: new LogSlider(),
      generateIntegers: true,
      // animationController: 'p2-animate',
      // animationStep: 1 / 10000
    }),

    p3: new SliderParameter('p3', {
      min: 0.001,
      max: 2 * Math.PI,
      step: 0.001,
      // transformer: new LogSlider(),
      generateIntegers: true,
      // animationController: 'p3-animate',
      // animationStep: 1 / 10000
    }),

    p4: new SliderParameter('p4', {
      min: 0.001,
      max: 2 * Math.PI,
      step: 0.001,
      // transformer: new LogSlider(),
      generateIntegers: true,
      // animationController: 'p4-animate',
      // animationStep: 1 / 10000
    }),


    f1: new SliderParameter('f1', {
      min: 1,
      max: 10,
      step: 0.001,
      transformer: new LogSlider(),
      generateIntegers: true,
      // animationController: 'f1-animate',
      // animationStep: 1 / 10000
    }),

    f2: new SliderParameter('f2', {
      min: 1,
      max: 10,
      step: 0.001,
      transformer: new LogSlider(),
      generateIntegers: true,
      // animationController: 'f2-animate',
      // animationStep: 1 / 10000
    }),

    f3: new SliderParameter('f3', {
      min: 1,
      max: 10,
      step: 0.001,
      transformer: new LogSlider(),
      generateIntegers: true,
      // animationController: 'f3-animate',
      // animationStep: 1 / 10000
    }),

    f4: new SliderParameter('f4', {
      min: 1,
      max: 10,
      step: 0.001,
      transformer: new LogSlider(),
      generateIntegers: true,
      // animationController: 'f4-animate',
      // animationStep: 1 / 10000
    }),


    d1: new SliderParameter('d1', {
      min: 0.1,
      max: 10,
      step: 0.001,
      transformer: new LogSlider(),
      generateIntegers: true,
      // animationController: 'd1-animate',
      // animationStep: 1 / 10000
    }),

    // d2 and d4 are very sensitive, going above 1 not recommended
    d2: new SliderParameter('d2', {
      min: 0.001,
      max: 1,
      step: 0.001,
      // transformer: new LogSlider(),
      generateIntegers: true,
      // animationController: 'd2-animate',
      // animationStep: 1 / 10000
    }),

    d3: new SliderParameter('d3', {
      min: 0.1,
      max: 10,
      step: 0.001,
      transformer: new LogSlider(),
      generateIntegers: true,
      // animationController: 'd3-animate',
      // animationStep: 1 / 10000
    }),

    d4: new SliderParameter('d4', {
      min: 0.001,
      max: 1,
      step: 0.001,
      // transformer: new LogSlider(),
      generateIntegers: true,
      // animationController: 'd4-animate',
      // animationStep: 1 / 10000
    }),


    a1: new SliderParameter('a1', {
      min: 1,
      max: 1000,
      step: 0.01,
      // transformer: new LogSlider(),
      // generateIntegers: true,
      // animationController: 'a1-animate',
      // animationStep: 1 / 10000
    }),

    a2: new SliderParameter('a2', {
      min: 1,
      max: 1000,
      step: 0.01,
      // transformer: new LogSlider(),
      // generateIntegers: true,
      // animationController: 'a2-animate',
      // animationStep: 1 / 10000
    }),

    a3: new SliderParameter('a3', {
      min: 1,
      max: 1000,
      step: 0.01,
      // transformer: new LogSlider(),
      // generateIntegers: true,
      // animationController: 'a3-animate',
      // animationStep: 1 / 10000
    }),

    a4: new SliderParameter('a4', {
      min: 1,
      max: 1000,
      step: 0.01,
      // transformer: new LogSlider(),
      // generateIntegers: true,
      // animationController: 'a4-animate',
      // animationStep: 1 / 10000
    }),
  };

  // instantiate main canvas
  // mainCanvas = new MainCanvas(mainCanvasID);
  // Use this if you want MainCanvas to load by default
  const mainCanvas = new Harmonograph(mainCanvasID)
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
  document.querySelectorAll('.toggler').forEach(function(el) {
    el.addEventListener('click', toggleNextBlock);
  });

  document
    .getElementById('close-sidebar')
    .addEventListener('click', toggleSidebar);
  document
    .getElementById('open-sidebar')
    .addEventListener('click', toggleSidebar);

  // enable downloading image
  const downloader = document.getElementById('downloadBtn');
  document.getElementById('downloadBtn').addEventListener('click', (e) => {
    download(e, 'mainCanvas');
  });
  document.getElementById('downloadBtnHiRes').addEventListener('click', (e) => {
    new Thumbnail('downloadCanvas', mainCanvas).setParams(params, false).setEquations().draw();
    download(e, 'downloadCanvas');
  });
  

  document.getElementById('shareBtn').addEventListener('click', getShareURL(mainCanvas));
})();
