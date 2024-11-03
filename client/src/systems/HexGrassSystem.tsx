import * as BABYLON from '@babylonjs/core';
import { Scene, Vector3, Mesh, ShaderMaterial, Texture, Effect, VertexData } from '@babylonjs/core';

class HexGrassSystem {
    private scene: Scene;
    private grassBlade: Mesh;
    private grassMaterial: ShaderMaterial;

    constructor(scene: Scene, light: BABYLON.DirectionalLight) {
        this.scene = scene;
        this.grassBlade = this.createGrassBlade(3);
        this.grassMaterial = this.createGrassMaterial(light,undefined);
        this.grassBlade.material = this.grassMaterial;
    }

    private rotateAround(vector: Vector3, axis: Vector3, theta: number) {
        // Please note that unit vector are required, i did not divided by the norms
        return vector
            .scale(Math.cos(theta))
            .addInPlace(BABYLON.Vector3.Cross(axis, vector).scaleInPlace(Math.sin(theta)))
            .addInPlace(axis.scale(BABYLON.Vector3.Dot(axis, vector) * (1.0 - Math.cos(theta))));
    }

    private createGrassBlade(nbStacks: number): Mesh {
        const nbVertices = 2 * nbStacks + 1;
        const nbTriangles = 2 * (nbStacks - 1) + 1;
    
        const positions = new Float32Array(nbVertices * 3);
        const normals = new Float32Array(nbVertices * 3);
        const indices = new Uint32Array(nbTriangles * 3);
    
        const normal = new BABYLON.Vector3(0, 0, 1);
        const curvyNormal1 = this.rotateAround(normal, new BABYLON.Vector3(0, 1, 0), Math.PI * 0.3);
        const curvyNormal2 = this.rotateAround(normal, new BABYLON.Vector3(0, 1, 0), -Math.PI * 0.3);
    
        // The vertices are aranged in rows of 2 vertices, we stack the rows on top of each other until we reach the top of the blade
        let vertexIndex = 0;
        let normalIndex = 0;
        let indexIndex = 0;
        const step = 1 / nbStacks;
        for (let i = 0; i < nbStacks; i++) {
            positions[vertexIndex++] = -0.05 * (nbStacks - i) * step;
            positions[vertexIndex++] = i * step;
            positions[vertexIndex++] = 0;
    
            positions[vertexIndex++] = 0.05 * (nbStacks - i) * step;
            positions[vertexIndex++] = i * step;
            positions[vertexIndex++] = 0;
    
            normals[normalIndex++] = curvyNormal1.x;
            normals[normalIndex++] = curvyNormal1.y;
            normals[normalIndex++] = curvyNormal1.z;
    
            normals[normalIndex++] = curvyNormal2.x;
            normals[normalIndex++] = curvyNormal2.y;
            normals[normalIndex++] = curvyNormal2.z;
    
            if (i === 0) {
                continue;
            }
    
            // make 2 triangles out of the vertices
            indices[indexIndex++] = 2 * (i - 1);
            indices[indexIndex++] = 2 * (i - 1) + 1;
            indices[indexIndex++] = 2 * i;
    
            indices[indexIndex++] = 2 * i;
            indices[indexIndex++] = 2 * (i - 1) + 1;
            indices[indexIndex++] = 2 * i + 1;
        }
    
        // the last vertex is the tip of the blade
        positions[vertexIndex++] = 0;
        positions[vertexIndex++] = nbStacks * step;
        positions[vertexIndex++] = 0;
    
        normals[normalIndex++] = 0;
        normals[normalIndex++] = 0;
        normals[normalIndex++] = 1;
    
        // last triangle
        indices[indexIndex++] = 2 * (nbStacks - 1);
        indices[indexIndex++] = 2 * (nbStacks - 1) + 1;
        indices[indexIndex++] = 2 * nbStacks;
    
        const vertexData = new BABYLON.VertexData();
        vertexData.positions = positions;
        vertexData.normals = normals;
        vertexData.indices = indices;
    
        const grassBlade = new BABYLON.Mesh("grassBlade", this.scene);
        vertexData.applyToMesh(grassBlade);
    
        return grassBlade;
    }

    private createGrassMaterial(light: BABYLON.DirectionalLight, player: any): ShaderMaterial {
        const shaderName = "grassMaterial";
        BABYLON.Effect.ShadersStore[`${shaderName}FragmentShader`] = `precision highp float;

uniform float time;
uniform vec3 lightDirection;

in vec3 vPosition;
in mat4 normalMatrix;
in vec3 vNormal;

void main() {
    // Brighten the base and tip colors
    vec3 baseColor = vec3(0.1, 0.3, 0.05);  // Lighter, more vibrant green
    vec3 tipColor = vec3(0.6, 0.7, 0.2);    // Brighter, more yellow-green tip

    vec3 finalColor = mix(baseColor, tipColor, pow(vPosition.y, 3.0));

    vec3 normalW = normalize((normalMatrix * vec4(vNormal, 0.0)).xyz);

    float ndl1 = max(dot(normalW, lightDirection), 0.0);
    float ndl2 = max(dot(-normalW, lightDirection), 0.0);
    float ndl = ndl1 + ndl2;

    // Increase ambient lighting
    ndl = clamp(ndl + 0.3, 0.0, 1.0);  // Increased from 0.1 to 0.3

    float density = 0.2;
    float aoForDensity = mix(1.0, 0.5, density);  // Lightened the AO
    float ao = mix(aoForDensity, 1.0, pow(vPosition.y, 2.0));

    // Add a slight color variation based on time for a subtle animation effect
    vec3 timeColor = vec3(sin(time * 0.1) * 0.05, cos(time * 0.15) * 0.05, sin(time * 0.2) * 0.05);
    
    finalColor += timeColor;

    gl_FragColor = vec4(finalColor * ndl * ao, 1.0);
}`;
    
        BABYLON.Effect.ShadersStore[`${shaderName}VertexShader`] = "precision highp float;\n"+
    
    "in vec3 position;\n"+
    "in vec3 normal;\n"+
    
    "uniform mat4 view;\n"+
    "uniform mat4 projection;\n"+
    
    "uniform vec3 cameraPosition;\n"+
    "uniform vec3 playerPosition;\n"+
    
    "uniform float time;\n"+
    
    "uniform sampler2D perlinNoise;\n"+
    
    "out vec3 vPosition;\n"+
    
    "out mat4 normalMatrix;\n"+
    "out vec3 vNormal;\n"+
    
    // rotation using https://www.wikiwand.com/en/Rodrigues%27_rotation_formula
    "vec3 rotateAround(vec3 vector, vec3 axis, float theta) {\n"+
        // Please note that unit vector are required, i did not divided by the norms
        "return cos(theta) * vector + cross(axis, vector) * sin(theta) + axis * dot(axis, vector) * (1.0 - cos(theta));\n"+
    "}\n"+
    
    "float easeOut(float t, float a) {\n"+
        "return 1.0 - pow(1.0 - t, a);\n"+
    "}\n"+
    
    "float easeIn(float t, float alpha) {\n"+
        "return pow(t, alpha);\n"+
    "}\n"+
    
    // remap a value comprised between low1 and high1 to a value between low2 and high2
    "float remap(float value, float low1, float high1, float low2, float high2) {\n"+
        "return low2 + (value - low1) * (high2 - low2) / (high1 - low1);\n"+
    "}\n"+
    
    "#include<instancesDeclaration>\n"+
    
    "void main() {\n"+
        "#include<instancesVertex>\n"+
    
        // wind
        "vec3 objectWorld = world3.xyz;\n"+
        "float windStrength = texture2D(perlinNoise, objectWorld.xz * 0.007 + 0.1 * time).r;\n"+
        "float windDir = texture2D(perlinNoise, objectWorld.xz * 0.005 + 0.05 * time).r * 2.0 * 3.14;\n"+
    
        "float windLeanAngle = remap(windStrength, 0.0, 1.0, 0.25, 1.0);\n"+
        "windLeanAngle = easeIn(windLeanAngle, 2.0) * 0.75;\n"+
    
        // curved grass blade
        "float leanAmount = 0.3;\n"+
        "float curveAmount = leanAmount * position.y;\n"+
        "float objectDistance = length(objectWorld - playerPosition);\n"+
    
        // account for player presence
        "vec3 playerDirection = (objectWorld - playerPosition) / objectDistance;\n"+
        "float maxDistance = 3.0;\n"+
        "float distance01 = objectDistance / maxDistance;\n"+
        "float influence = 1.0 + 8.0 * smoothstep(0.0, 1.0, 1.0 - distance01);\n"+
        "curveAmount *= influence;\n"+
        "curveAmount += windLeanAngle * smoothstep(0.2, 1.0, distance01);\n"+
    
        "vec3 leanAxis = rotateAround(vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), windDir * smoothstep(0.2, 1.0, distance01));\n"+
        "leanAxis = normalize(mix(cross(vec3(0.0, 1.0, 0.0), playerDirection), leanAxis, smoothstep(0.0, 1.0, 1.0 - distance01)));\n"+
    
    
        "vec3 leaningPosition = rotateAround(position, leanAxis, curveAmount);\n"+
    
        "vec3 leaningNormal = rotateAround(normal, leanAxis, curveAmount);\n"+
    
        "vec4 worldPosition = finalWorld * vec4(leaningPosition, 1.0);\n"+
    
    
        //vec3 viewDir = normalize(cameraPosition - worldPosition);
        //float viewDotNormal = abs(dot(viewDir, leaningNormal));
        //float viewSpaceThickenFactor = easeOut(1.0 - viewDotNormal, 4.0);
    
        //viewSpaceThickenFactor *= smoothstep(0.0, 0.2, viewDotNormal);
    
        "vec4 viewPosition = view * worldPosition;\n"+
        //viewPosition.x += viewSpaceThickenFactor * leaningNormal.y;
    
        "vec4 outPosition = projection * viewPosition;\n"+
        "gl_Position = outPosition;\n"+
    
        "vPosition = position;\n"+
    
        "normalMatrix = transpose(inverse(finalWorld));\n"+
    
        "vNormal = leaningNormal;\n"+
    "}";
    
        const grassMaterial = new BABYLON.ShaderMaterial(shaderName, this.scene, shaderName, {
            attributes: ["position", "normal"],
            uniforms: ["world", "worldView", "worldViewProjection", "view", "projection", "viewProjection", "time", "lightDirection", "cameraPosition", "playerPosition"],
            defines: ["#define INSTANCES"],
            samplers: ["perlinNoise"]
        });
    
        var noiseTexture = new BABYLON.NoiseProceduralTexture("perlin", 256, this.scene);
        noiseTexture.animationSpeedFactor = 0;
        noiseTexture.brightness = 0.5;
        noiseTexture.octaves = 3;
    
        grassMaterial.backFaceCulling = false;
        //grassMaterial.setVector3("lightDirection", this.light.direction);
        grassMaterial.setTexture("perlinNoise", noiseTexture);
    
        let elapsedSeconds = 0;
        this.scene.onBeforeRenderObservable.add(() => {
            elapsedSeconds += this.scene.getEngine().getDeltaTime() / 1000;
    
            const playerPosition = player ? player.position : new Vector3(0, 500, 0); // high y to avoid interaction with grass
            const cameraPosition = this.scene.activeCamera ? this.scene.activeCamera.position : new Vector3(0, 0, 0);
            grassMaterial.setVector3("playerPosition", playerPosition);
            grassMaterial.setVector3("cameraPosition", cameraPosition);
            grassMaterial.setFloat("time", elapsedSeconds);
        });
    
        return grassMaterial;
    }

    private createHexagonalMatrixBuffer(center: Vector3, hexSize: number, resolution: number): Float32Array {
        const matrixBuffer = new Float32Array(resolution * resolution * 16);
        let index = 0;
        const hexHeight = hexSize * Math.sqrt(3);

        for (let i = 0; i < resolution * resolution; i++) {
            // Generate a random point within the hexagon's bounding rectangle
            const x = (Math.random() - 0.5) * 2 * hexSize;
            const z = (Math.random() - 0.5) * hexHeight;

            // Check if the point is within the hexagon
            if (Math.abs(x) * 2 / (3 * hexSize) + Math.abs(z) / hexHeight <= 1) {
                const position = new Vector3(
                    center.x + x,
                    center.y,
                    center.z + z
                );

                const scaling = 0.7 + Math.random() * 0.6;
                const rotation = Math.random() * 2 * Math.PI;

                const matrix = BABYLON.Matrix.Compose(
                    new Vector3(scaling, scaling, scaling),
                    BABYLON.Quaternion.RotationAxis(Vector3.Up(), rotation),
                    position
                );

                matrix.copyToArray(matrixBuffer, 16 * index);
                index++;
            }
        }

        return matrixBuffer.slice(0, index * 16);  // Trim unused buffer space
    }

    public addGrassToHex(hexCenter: Vector3, hexSize: number, grassDensity: number = 1000): Mesh {
        const grassPatch = this.grassBlade.clone("grassPatch");
        grassPatch.isVisible = true;

        const matrixBuffer = this.createHexagonalMatrixBuffer(Vector3.Zero(), hexSize, Math.sqrt(grassDensity * 2));
        grassPatch.thinInstanceSetBuffer("matrix", matrixBuffer, 16);

        // Set the position of the entire grass patch
        grassPatch.position = hexCenter;

        return grassPatch;
    }

}

export default HexGrassSystem;