import fragmentShaderSource from '../shaders/shader.frag'
import vertexShaderSource from '../shaders/shader.vert'
import { 
  createFramebuffer, 
  createRandomTexture, 
  createTexture, 
  createShaderProgram, 
  configureQuadVertices 
} from './glutils'

/** @type HTMLCanvasElement */
const canvas = document.getElementById("lenia-canvas")

/** @type {HTMLButtonElement} playButton */
const playButton = document.getElementById("play-button")

/** @type {HTMLButtonElement} pauseButton */
const pauseButton = document.getElementById("pause-button")

/** @type {HTMLButtonElement} reloadButton */
const reloadButton = document.getElementById("reload-button")

/** @type {HTMLButtonElement} settingsButton */
const settingsButton = document.getElementById("settings-button")

/** @type {HTMLButtonElement} closeSettingsButton */
const closeSettingsButton = document.getElementById("close-settings-button")

const settingsDialog = document.getElementById("settings-dialog")

/** @type {HTMLInputElement} speedRangeInput */
const speedRangeInput = document.getElementById("speed-range-input")

/** @type {HTMLInputElement} resolutionRangeInput */
const resolutionRangeInput = document.getElementById("resolution-range-input")

const gl = canvas.getContext("webgl2", { antialias: false })

canvas.width = canvas.clientWidth / 2
canvas.height = canvas.clientHeight / 2

const textureWidth = canvas.width
const textureHeight = canvas.height

const program = createShaderProgram(gl, vertexShaderSource, fragmentShaderSource)

const programLocations = {
  position: gl.getAttribLocation(program, 'position'),
  dimensions: gl.getUniformLocation(program, 'dimensions'),
  srcTexture: gl.getUniformLocation(program, 'srcTexture'),
  computeNextState: gl.getUniformLocation(program, 'computeNextState')
}

const textureA = createRandomTexture(gl, textureWidth, textureHeight)
const textureB = createTexture(gl, textureWidth, textureHeight)

const framebufferA = createFramebuffer(gl, textureA)
const framebufferB = createFramebuffer(gl, textureB)

let previousState = {
  framebuffer: framebufferA,
  texture: textureA,
}

let nextState = {
  framebuffer: framebufferB,
  texture: textureB,
}

gl.useProgram(program)
configureQuadVertices(gl, programLocations.position)
gl.uniform1i(programLocations.srcTexture, 0)

// initial rendering
renderPreviousState()

let running = false

/** @type {Promise<void>} loopPromise */
let loopPromise

/** @type {() => void} loopPromiseResolve */
let loopPromiseResolve

function play() {
  playButton.disabled = true
  pauseButton.disabled = false
  running = true
  loopPromise = new Promise((resolve) => {
    loopPromiseResolve = resolve
  })
  requestAnimationFrame(loop)
}

function pause() {
  playButton.disabled = false
  pauseButton.disabled = true
  running = false
}

async function reload() {
  pause()
  await loopPromise
  createRandomTexture(gl, textureWidth, textureHeight, previousState.texture)
  renderPreviousState()
}

function openSettings() {
  settingsButton.disabled = true
  settingsDialog.setAttribute("open", "")
}

function closeSettings() {
  settingsButton.disabled = false
  settingsDialog.removeAttribute("open")
}

function loop() {
  computeNextState()
  swapStates()
  renderPreviousState()

  if (!running) {
    loopPromiseResolve()
    return
  }

  setTimeout(() => requestAnimationFrame(loop), 300 - speedRangeInput.value)
}

function renderPreviousState() {
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, previousState.texture)

  gl.uniform2f(programLocations.dimensions, canvas.width, canvas.height)
  gl.uniform1i(programLocations.computeNextState, 0)
  gl.viewport(0, 0, canvas.width, canvas.height)

  gl.drawArrays(gl.TRIANGLES, 0, 6)

  gl.bindTexture(gl.TEXTURE_2D, null)
}

function computeNextState() {
  gl.bindFramebuffer(gl.FRAMEBUFFER, nextState.framebuffer)

  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, previousState.texture)

  gl.uniform2f(programLocations.dimensions, textureWidth, textureHeight)
  gl.uniform1i(programLocations.computeNextState, 1)
  gl.viewport(0, 0, textureWidth, textureHeight)

  gl.drawArrays(gl.TRIANGLES, 0, 6)

  gl.bindTexture(gl.TEXTURE_2D, null)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
}

function swapStates() {
  const temp = previousState
  previousState = nextState
  nextState = temp
}

playButton.onclick = play
pauseButton.onclick = pause
reloadButton.onclick = reload
settingsButton.onclick = openSettings
closeSettingsButton.onclick = closeSettings
