
import * as Webcam from "./webcam.js"
import {
    HandLandmarker,
    FilesetResolver
  } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";
  
  
  let handLandmarker = undefined;
  let runningMode = "video";
  
  function isWebGL2Supported() {
    const canvas = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
  }

  const webgl2 = isWebGL2Supported();

  // Before we can use HandLandmarker class we must wait for it to finish
  // loading. Machine Learning models can be large and take a moment to
  // get everything needed to run.
  const createHandLandmarker = async () => {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
        delegate: !webgl2 ? "CPU" : "GPU"
      },
      runningMode: runningMode,
      numHands: 2
    });
  };
  console.log(`mode = ${ !webgl2 ? "CPU" : "GPU"}`);
  createHandLandmarker();
  

Webcam.setProcess(async ({video}) => {
  let results = null;
  if (handLandmarker) {
    let startTimeMs = performance.now();
    results = await handLandmarker.detectForVideo(video, startTimeMs);
    results.timeStamp = startTimeMs;
  }
  return results;
})