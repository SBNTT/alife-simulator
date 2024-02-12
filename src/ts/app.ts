import fragmentShaderSource from "../shaders/shader.frag";
import vertexShaderSource from "../shaders/shader.vert";
import {
  configureQuadVertices,
  createFramebuffer,
  createRandomTexture,
  createShaderProgram,
  createTexture,
} from "./glutils";

import * as elements from "./elements";

const gl = elements.canvas.getContext("webgl2", {antialias: false});

elements.canvas.width = elements.canvas.clientWidth / 2;
elements.canvas.height = elements.canvas.clientHeight / 2;

const textureWidth = elements.canvas.width;
const textureHeight = elements.canvas.height;

const program = createShaderProgram(
  gl,
  vertexShaderSource,
  fragmentShaderSource,
);

const programLocations = {
  position: gl.getAttribLocation(program, "position"),
  dimensions: gl.getUniformLocation(program, "dimensions"),
  srcTexture: gl.getUniformLocation(program, "srcTexture"),
  computeNextState: gl.getUniformLocation(program, "computeNextState"),
};

const textureA = createRandomTexture(gl, textureWidth, textureHeight);
const textureB = createTexture(gl, textureWidth, textureHeight);

const framebufferA = createFramebuffer(gl, textureA);
const framebufferB = createFramebuffer(gl, textureB);

let previousState = {
  framebuffer: framebufferA,
  texture: textureA,
};

let nextState = {
  framebuffer: framebufferB,
  texture: textureB,
};

gl.useProgram(program);
configureQuadVertices(gl, programLocations.position);
gl.uniform1i(programLocations.srcTexture, 0);

// initial rendering
renderPreviousState();

let running = false;

let loopPromise: Promise<void>;

let loopPromiseResolve: (value: void | PromiseLike<void>) => void;

function play() {
  elements.playButton.disabled = true;
  elements.pauseButton.disabled = false;
  running = true;
  loopPromise = new Promise<void>((resolve) => {
    loopPromiseResolve = resolve;
  });
  requestAnimationFrame(loop);
}

function pause() {
  elements.playButton.disabled = false;
  elements.pauseButton.disabled = true;
  running = false;
}

async function reload() {
  pause();
  await loopPromise;
  createRandomTexture(gl, textureWidth, textureHeight, previousState.texture);
  renderPreviousState();
}

function openSettings() {
  elements.settingsButton.disabled = true;
  elements.settingsDialog.setAttribute("open", "");
}

function closeSettings() {
  elements.settingsButton.disabled = false;
  elements.settingsDialog.removeAttribute("open");
}

function loop() {
  computeNextState();
  swapStates();
  renderPreviousState();

  if (!running) {
    loopPromiseResolve();
    return;
  }

  setTimeout(() => requestAnimationFrame(loop), 300 - (+elements.speedRangeInput.value));
}

function renderPreviousState() {
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, previousState.texture);

  gl.uniform2f(programLocations.dimensions, elements.canvas.width, elements.canvas.height);
  gl.uniform1i(programLocations.computeNextState, 0);
  gl.viewport(0, 0, elements.canvas.width, elements.canvas.height);

  gl.drawArrays(gl.TRIANGLES, 0, 6);

  gl.bindTexture(gl.TEXTURE_2D, null);
}

function computeNextState() {
  gl.bindFramebuffer(gl.FRAMEBUFFER, nextState.framebuffer);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, previousState.texture);

  gl.uniform2f(programLocations.dimensions, textureWidth, textureHeight);
  gl.uniform1i(programLocations.computeNextState, 1);
  gl.viewport(0, 0, textureWidth, textureHeight);

  gl.drawArrays(gl.TRIANGLES, 0, 6);

  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function swapStates() {
  const temp = previousState;
  previousState = nextState;
  nextState = temp;
}

elements.playButton.onclick = play;
elements.pauseButton.onclick = pause;
elements.reloadButton.onclick = reload;
elements.settingsButton.onclick = openSettings;
elements.closeSettingsButton.onclick = closeSettings;
