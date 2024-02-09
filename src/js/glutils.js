/**
 * @param {WebGL2RenderingContext} gl
 * @param {string} vertexShaderSource 
 * @param {string} fragmentShaderSource 
 * @returns {WebGLProgram}
 */
export function createShaderProgram(gl, vertexShaderSource, fragmentShaderSource) {
  const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER)
  const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER)

  const program = gl.createProgram() || inlineThrow("Failed to create a shader program")

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  return program
}

/**
 * @param {WebGL2RenderingContext} gl 
 * @param {WebGLTexture} texture 
 * @returns {WebGLFramebuffer}
 */
export function createFramebuffer(gl, texture) {
  const framebuffer = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)

  return framebuffer
}

/**
 * @param {WebGL2RenderingContext} gl
 * @param {number} width
 * @param {number} height
 * @param {WebGLTexture |null} texture
 * @returns {WebGLTexture}
 */
export function createRandomTexture(gl, width, height, texture = null) {
  const pixelData = new Uint8Array(width * height * 4)

  for (let i = 0; i < width * height; i++) {
    const pixelIndex = i * 4;
    const c = Math.random() < 0.8 ? 0 : 255
    pixelData[pixelIndex] = c // Math.floor(Math.random() * 256)
    pixelData[pixelIndex + 1] = c // Math.floor(Math.random() * 256)
    pixelData[pixelIndex + 2] = c // Math.floor(Math.random() * 256)
    pixelData[pixelIndex + 3] = 255
  }

  texture ??= createTexture(gl, width, height)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixelData)
  gl.bindTexture(gl.TEXTURE_2D, null)

  return texture
}

/**
 * @param {WebGL2RenderingContext} gl
 * @param {number} width
 * @param {number} height
 * @returns {WebGLTexture}
 */
export function createTexture(gl, width, height) {
  const texture = gl.createTexture() || inlineThrow("Failed to create a texture")

  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.bindTexture(gl.TEXTURE_2D, null)

  return texture
}

/**
 * @param {WebGL2RenderingContext} gl 
 * @param {number} programLocation 
 */
export function configureQuadVertices(gl, programLocation) {
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  const vertices = new Float32Array([
    -1, -1,
    1, -1,
    -1, 1,
    -1, 1,
    1, -1,
    1, 1,
  ])
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(programLocation)
  gl.vertexAttribPointer(programLocation, 2, gl.FLOAT, false, 0, 0)
}

/**
 * 
 * @param {WebGL2RenderingContext} context 
 * @param {string} text 
 * @param {number} type 
 * @returns {WebGLShader}
 */
function compileShader(context, text, type) {
  const shader = context.createShader(type) || inlineThrow(`Failed to create a shader of type $type`)
  context.shaderSource(shader, text)
  context.compileShader(shader)

  if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
    throw new Error(`Failed to compile shader: ${context.getShaderInfoLog(shader)}`)
  }

  return shader
}

/** 
 * @param {string} message 
 * @returns {never}
 */
function inlineThrow(message) {
  throw new Error(message)
}
