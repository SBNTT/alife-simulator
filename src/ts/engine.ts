import * as glutils from "./glutils";
import {configureQuadVertices, createRandomTexture, createShaderProgram} from "./glutils";
import * as elements from "./elements";
import vertexShaderSource from "../shaders/shader.vert";
import fragmentShaderSource from "../shaders/shader.frag";
import {inlineThrow} from "./utils";

type EngineState = {
  framebuffer: WebGLFramebuffer
  texture: WebGLTexture
}

type EngineProgramLocations = {
  position: number
  dimensions: WebGLUniformLocation
  srcTexture: WebGLUniformLocation
  computeNextState: WebGLUniformLocation
}

export class Engine {
  private readonly gl: WebGL2RenderingContext | WebGLRenderingContext;
  private readonly program: WebGLProgram;
  private readonly programLocations: EngineProgramLocations;

  private readonly textureWidth: number;
  private readonly textureHeight: number;

  private previousState: EngineState;
  private nextState: EngineState;

  private running = false;
  private loopPromise: Promise<void> | null = null;
  private loopPromiseResolve: ((value: void | PromiseLike<void>) => void) | null = null;

  constructor() {
    this.gl = elements.canvas.getContext("webgl2", {antialias: false})
      || elements.canvas.getContext("webgl", {antialias: false})
      || inlineThrow("Failed to get a Webgl rendering context");

    elements.canvas.width = elements.canvas.clientWidth / 2;
    elements.canvas.height = elements.canvas.clientHeight / 2;

    this.textureWidth = elements.canvas.width;
    this.textureHeight = elements.canvas.height;

    this.program = createShaderProgram(this.gl, vertexShaderSource, fragmentShaderSource);
    this.programLocations = {
      position: this.gl.getAttribLocation(this.program, "position"),
      dimensions: this.gl.getUniformLocation(this.program, "dimensions") || inlineThrow(
        "Failed to create \"dimension\" uniform location",
      ),
      srcTexture: this.gl.getUniformLocation(this.program, "srcTexture") || inlineThrow(
        "Failed to create \"srcTexture\" uniform location",
      ),
      computeNextState: this.gl.getUniformLocation(this.program, "computeNextState") || inlineThrow(
        "Failed to create \"computeNextState\" uniform location",
      ),
    };

    const textureA = glutils.createRandomTexture(this.gl, this.textureWidth, this.textureHeight);
    const textureB = glutils.createTexture(this.gl, this.textureWidth, this.textureHeight);

    const framebufferA = glutils.createFramebuffer(this.gl, textureA);
    const framebufferB = glutils.createFramebuffer(this.gl, textureB);

    this.previousState = {
      framebuffer: framebufferA,
      texture: textureA,
    };

    this.nextState = {
      framebuffer: framebufferB,
      texture: textureB,
    };

    this.gl.useProgram(this.program);
    configureQuadVertices(this.gl, this.programLocations.position);
    this.gl.uniform1i(this.programLocations.srcTexture, 0);

    this.renderPreviousState()
  }

  play() {
    elements.playButton.disabled = true;
    elements.pauseButton.disabled = false;
    this.running = true;
    this.loopPromise = new Promise<void>((resolve) => {
      this.loopPromiseResolve = resolve;
    });
    requestAnimationFrame(() => this.loop());
  }

  pause() {
    elements.playButton.disabled = false;
    elements.pauseButton.disabled = true;
    this.running = false;
  }

  async reload() {
    this.pause();
    await this.loopPromise;
    createRandomTexture(this.gl, this.textureWidth, this.textureHeight, this.previousState.texture);
    this.renderPreviousState();
  }

  openSettings() {
    elements.settingsButton.disabled = true;
    elements.settingsDialog.setAttribute("open", "");
  }

  closeSettings() {
    elements.settingsButton.disabled = false;
    elements.settingsDialog.removeAttribute("open");
  }

  private loop() {
    this.computeNextState();
    this.swapStates();
    this.renderPreviousState();

    if (!this.running) {
      this.loopPromiseResolve?.();
      return;
    }

    setTimeout(() => requestAnimationFrame(() => this.loop()), 300 - (+elements.speedRangeInput.value));
  }

  private renderPreviousState() {
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.previousState.texture);

    this.gl.uniform2f(this.programLocations.dimensions, elements.canvas.width, elements.canvas.height);
    this.gl.uniform1i(this.programLocations.computeNextState, 0);
    this.gl.viewport(0, 0, elements.canvas.width, elements.canvas.height);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
  }

  private computeNextState() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.nextState.framebuffer);

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.previousState.texture);

    this.gl.uniform2f(this.programLocations.dimensions, this.textureWidth, this.textureHeight);
    this.gl.uniform1i(this.programLocations.computeNextState, 1);
    this.gl.viewport(0, 0, this.textureWidth, this.textureHeight);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  private swapStates() {
    const temp = this.previousState;
    this.previousState = this.nextState;
    this.nextState = temp;
  }
}
