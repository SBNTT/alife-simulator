precision highp float;

uniform sampler2D srcTexture;
uniform vec2 dimensions;
uniform bool computeNextState;

vec4 readCell(vec2 pos) {
    vec2 normalizedPos = pos / dimensions;
    if (normalizedPos.x > 1.0) normalizedPos.x--;
    if (normalizedPos.y > 1.0) normalizedPos.y--;
    if (normalizedPos.x < 0.0) normalizedPos.x++;
    if (normalizedPos.y < 0.0) normalizedPos.y++;

    return texture2D(srcTexture, normalizedPos);
}

void main() {
    vec4 currentCell = readCell(gl_FragCoord.xy);

    if (!computeNextState) {
        gl_FragColor = vec4(currentCell.r, currentCell.r, currentCell.r, 1);
        return;
    }

    vec4 neighbors = readCell(gl_FragCoord.xy + vec2(1.0, 1.0))
    + readCell(gl_FragCoord.xy + vec2(1.0, 0.0))
    + readCell(gl_FragCoord.xy + vec2(1.0, -1.0))
    + readCell(gl_FragCoord.xy + vec2(0.0, -1.0))
    + readCell(gl_FragCoord.xy + vec2(-1.0, -1.0))
    + readCell(gl_FragCoord.xy + vec2(-1.0, 0.0))
    + readCell(gl_FragCoord.xy + vec2(-1.0, 1.0))
    + readCell(gl_FragCoord.xy + vec2(0.0, 1.0));

    if (currentCell.r == 1.0) {
        gl_FragColor = vec4(int(neighbors.r == 2.0 || neighbors.r == 3.0));
    } else if (neighbors.r == 3.0) {
        gl_FragColor = vec4(1);
    }
}
