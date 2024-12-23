import * as BABYLON from '@babylonjs/core';

export class CustomShader {
    private static readonly VERTEX_SHADER = `
        precision highp float;
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 worldViewProjection;
        varying vec2 vUv;
        
        void main() {
            vec4 p = vec4(position, 1.);
            gl_Position = worldViewProjection * p;
            vUv = uv;
        }
    `;

    private static readonly FRAGMENT_SHADER = `
        varying vec2 vUv;
        uniform sampler2D textureSampler;
        vec2 tex_repeat = vec2(10.0,10.);

        // Function declarations
        float Round(float num);
        vec3 Round3(vec3 ivec);
        vec2 Rotate(vec2 UV, float amount);
        vec3 Hash2(vec2 UV);
        float Lerp(float val1, float val2, float amount);
        vec2 Translate(vec2 UV, vec2 amount);
        vec2 Scale(vec2 UV, vec2 amount);
        vec2 Transform(vec2 UV, float rotation, vec2 scale, vec2 translation);
        vec2 RandomTransform(vec2 UV, vec2 seed);

        // Function implementations
        float Round(float num) { return floor(num + .5); }
        vec3 Round3(vec3 ivec) { return floor(ivec + vec3(0.5)); }
        vec2 Rotate(vec2 UV, float amount) {
            vec2 center = vec2(.5) * tex_repeat;
            UV -= center;	
            vec2 rot = vec2(cos(amount), sin(amount));
            return vec2((rot.x * UV.x) + (rot.y * UV.y), (rot.x * UV.y) - (rot.y * UV.x)) + center;
        }
        vec3 Hash2(vec2 UV) {
            return fract(sin(vec3(
                dot(vec3(UV.x, UV.y, UV.x), vec3(127.09, 311.7, 74.69)), 
                dot(vec3(UV.y, UV.x, UV.x), vec3(269.5, 183.3, 246.1)), 
                dot(vec3(UV.x, UV.y, UV.y), vec3(113.5, 271.89, 124.59))
            )) * 43758.5453);
        }
        float Lerp(float val1, float val2, float amount) { return (val2 - val1) * amount; }
        vec2 Translate(vec2 UV, vec2 amount) { return UV + amount; }
        vec2 Scale(vec2 UV, vec2 amount) { return UV * amount; }
        vec2 Transform(vec2 UV, float rotation, vec2 scale, vec2 translation) {
            return Translate(Scale(Rotate(UV, rotation), scale), translation);
        }	
        vec2 RandomTransform(vec2 UV, vec2 seed) {
            vec3 hash = Hash2(seed);
            float rot = mix(-3.1415, 3.1415, fract(hash.b*16.));
            float scl = mix(.8, 1.2, hash.b);
            return Transform(UV, rot, vec2(scl), hash.xy);
        }

        void main() {	
            vec2 v_vTexcoord = vUv;
            vec4 v_vColour = vec4(0.,1.,0.,1.);
            float sharpness = 1.;
            float hex_size = 4.;

            vec2 base_uv = v_vTexcoord * tex_repeat;
            vec2 uv	= vec2(base_uv);
            uv = vec2(uv.x - ((.5/(1.732 / 2.))*uv.y), (1./(1.732 / 2.))*uv.y) / hex_size;
            
            vec2 coord	= floor(uv);	
            vec4 color	= vec4(coord.x, coord.y, 0., 1.);			
            color.rgb = ((vec3(color.r - color.g) + vec3(0, 1, 2)) * .3333333) + 5./3.;																
            color.rgb = Round3(fract(color.rgb));						
            
            vec4 refcol = vec4(fract(vec2(uv.x, uv.y)), 1, 1);
            refcol.rgb = vec3(refcol.g + refcol.r) - 1.;
            vec4 abscol = vec4(abs(refcol.rgb), 1);
            
            vec4 refswz = vec4(fract(vec2(uv.y, uv.x)), 1, 1);
            vec4 use_col = vec4(fract(vec2(uv.x, uv.y)), 1, 1);
            
            float flip_check = 0.;
            if (((refcol.r+refcol.g+refcol.b)/3.) > 0.) {
                use_col = vec4(1.-refswz.x, 1.-refswz.y, refswz.b, refswz.a);
                flip_check = 1.;
            }

            abscol.rgb = abs(vec3(abscol.r, use_col.r, use_col.g));
            use_col.rgb = vec3(
                pow(dot(abscol.rgb, vec3(color.z, color.x, color.y)), sharpness), 
                pow(dot(abscol.rgb, vec3(color.y, color.z, color.x)), sharpness), 
                pow(dot(abscol.rgb, color.rgb), sharpness)
            );

            float coldot = dot(use_col.rgb, vec3(1));
            use_col /= coldot;
            
            vec2 color_swiz1 = vec2(color.a, color.z);
            vec2 color_swiz2 = vec2(color.z, color.x);
            vec2 color_swiz3 = vec2(color.x, color.a);
            
            color.rgb *= flip_check;
            vec4 ruv1 = texture2D(textureSampler, RandomTransform(base_uv, color_swiz1 + vec2(color.r) + coord)) * vec4(vec3(use_col.r), 1);
            vec4 ruv2 = texture2D(textureSampler, RandomTransform(base_uv, color_swiz2 + vec2(color.g) + coord)) * vec4(vec3(use_col.g), 1);
            vec4 ruv3 = texture2D(textureSampler, RandomTransform(base_uv, color_swiz3 + vec2(color.b) + coord)) * vec4(vec3(use_col.b), 1);
            vec4 rout = ruv1 + ruv2 + ruv3;
            
            gl_FragColor = rout;
        }
    `;

    public static createShader(name: string, scene: BABYLON.Scene): BABYLON.ShaderMaterial {
        BABYLON.Effect.ShadersStore[name + "VertexShader"] = this.VERTEX_SHADER;
        BABYLON.Effect.ShadersStore[name + "FragmentShader"] = this.FRAGMENT_SHADER;

        return new BABYLON.ShaderMaterial(name, scene, {
            vertex: name,
            fragment: name,
        }, {
            attributes: ["position", "uv"],
            uniforms: ["worldViewProjection"],
            samplers: ["textureSampler"],
        });
    }

    public static applyToMesh(mesh: BABYLON.Mesh, shaderMaterial: BABYLON.ShaderMaterial, texturePath: string): void {
        const texture = new BABYLON.Texture(texturePath, mesh.getScene());
        shaderMaterial.setTexture("textureSampler", texture);
        mesh.material = shaderMaterial;
    }
}