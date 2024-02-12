export function createShaderProgram(
  gl: WebGL2RenderingContext,
  vertexShaderSource: string,
  fragmentShaderSource: string,
): WebGLProgram {
  const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
  const fragmentShader = compileShader(
    gl,
    fragmentShaderSource,
    gl.FRAGMENT_SHADER,
  );

  const program = gl.createProgram() || inlineThrow("Failed to create a shader program");

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  return program;
}

export function createFramebuffer(gl: WebGL2RenderingContext, texture: WebGLTexture): WebGLFramebuffer {
  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0,
  );
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return framebuffer;
}

export function createRandomTexture(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  texture: WebGLTexture | null = null,
): WebGLTexture {
  const pixelData = new Uint8Array(width * height * 4);

  for (let i = 0; i < width * height; i++) {
    const pixelIndex = i * 4;
    const c = Math.random() < 0.8 ? 0 : 255;
    pixelData[pixelIndex] = c; // Math.floor(Math.random() * 256)
    pixelData[pixelIndex + 1] = c; // Math.floor(Math.random() * 256)
    pixelData[pixelIndex + 2] = c; // Math.floor(Math.random() * 256)
    pixelData[pixelIndex + 3] = 255;
  }

  texture ??= createTexture(gl, width, height);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    width,
    height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    pixelData,
  );
  gl.bindTexture(gl.TEXTURE_2D, null);

  return texture;
}

export function createTexture(gl: WebGL2RenderingContext, width: number, height: number): WebGLTexture {
  const texture =
    gl.createTexture() || inlineThrow("Failed to create a texture");

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    width,
    height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindTexture(gl.TEXTURE_2D, null);

  return texture;
}

export function configureQuadVertices(gl: WebGL2RenderingContext, programLocation: number) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(programLocation);
  gl.vertexAttribPointer(programLocation, 2, gl.FLOAT, false, 0, 0);
}

function compileShader(context: WebGL2RenderingContext, text: string, type: number): WebGLShader {
  const shader =
    context.createShader(type) ||
    inlineThrow(`Failed to create a shader of type $type`);
  context.shaderSource(shader, text);
  context.compileShader(shader);

  if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
    throw new Error(
      `Failed to compile shader: ${context.getShaderInfoLog(shader)}`,
    );
  }

  return shader;
}

function inlineThrow(message: string): never {
  throw new Error(message);
}
