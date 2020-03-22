import * as THREE from 'three'
import FlowFieldMapMaterial from './Materials/FlowFieldMapMaterial'

export default class FlowFieldMap
{
    constructor(_options)
    {
        // Options
        this.debug = _options.debug
        this.renderer = _options.renderer
        this.time = _options.time

        // Debug
        if(this.debug)
        {
            this.debug.Register({
                type: 'folder',
                label: 'flowField',
                open: true
            })
        }

        // Set up
        this.width = 512
        this.height = 1
        this.size = this.width * this.height

        // Environment
        this.scene = new THREE.Scene()
        this.camera = new THREE.OrthographicCamera(- 1, 1, 1, - 1, 0.5, 1.5)
        this.camera.position.z = 1

        // Base texture
        const data = new Float32Array(4 * this.size)

        for(let i = 0; i < this.size; i++)
        {
            const pixelIndex = i * 4
            data[pixelIndex + 0] = Math.random()
            data[pixelIndex + 1] = Math.random()
            data[pixelIndex + 2] = Math.random()
            data[pixelIndex + 3] = Math.random()
        }
        this.baseTexture = new THREE.DataTexture(data, this.width, this.height, THREE.RGBAFormat, THREE.FloatType)
        this.baseTexture.minFilter = THREE.NearestFilter
        this.baseTexture.magFilter = THREE.NearestFilter
        this.baseTexture.generateMipmaps = false
        this.baseTexture.needsUpdate = true
        this.baseTexture.flipY = false

        // Render target
        this.renderTargets = {}
        this.renderTargets.a = new THREE.WebGLRenderTarget(
            this.width,
            this.height,
            {
                wrapS: THREE.ClampToEdgeWrapping,
                wrapT: THREE.ClampToEdgeWrapping,
                minFilter: THREE.NearestFilter,
                magFilter: THREE.NearestFilter,
                format: THREE.RGBAFormat,
                type: THREE.FloatType,
                depthWrite: false,
                depthBuffer: false,
                stencilBuffer: false
            }
        )
        this.renderTargets.b = this.renderTargets.a.clone()
        this.renderTargets.current = this.renderTargets.a
        this.renderTargets.other = this.renderTargets.b

        // Texture
        this.texture = this.renderTargets.a.texture

        // Plane
        this.geometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1)

        this.material = new FlowFieldMapMaterial()
        this.material.uniforms.uBaseTexture.value = this.baseTexture
        this.material.uniforms.uTexture.value = this.baseTexture
        this.material.uniforms.uTime.value = 0.0
        this.material.uniforms.uTimeFrequency.value = 0.00003
        this.material.uniforms.uPositionFrequency.value = 2
        this.material.uniforms.uPositionSpeed.value = 0.02
        this.material.uniforms.uLifeSpeed.value = 0.003

        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.scene.add(this.mesh)

        // First render
        this.renderer.instance.setRenderTarget(this.renderTargets.current)
        this.renderer.instance.render(this.scene, this.camera)
        this.renderer.instance.setRenderTarget(null)

        // Debug
        if(this.debug)
        {
            this.debug.Register({
                folder: 'flowField',
                type: 'range',
                label: 'uTimeFrequency',
                min: 0,
                max: 0.001,
                step: 0.0000001,
                object: this.material.uniforms.uTimeFrequency,
                property: 'value'
            })

            this.debug.Register({
                folder: 'flowField',
                type: 'range',
                label: 'uPositionFrequency',
                min: 0.0001,
                max: 20,
                step: 0.0001,
                object: this.material.uniforms.uPositionFrequency,
                property: 'value'
            })

            this.debug.Register({
                folder: 'flowField',
                type: 'range',
                label: 'uPositionSpeed',
                min: 0.0001,
                max: 0.1,
                step: 0.0001,
                object: this.material.uniforms.uPositionSpeed,
                property: 'value'
            })

            this.debug.Register({
                folder: 'flowField',
                type: 'range',
                label: 'uLifeSpeed',
                min: 0.00001,
                max: 0.01,
                step: 0.00001,
                object: this.material.uniforms.uLifeSpeed,
                property: 'value'
            })
        }
    }

    render()
    {
        // Update material texture
        this.material.uniforms.uTexture.value = this.renderTargets.current.texture
        this.material.uniforms.uTime.value = this.time.elapsed

        // Render
        this.renderer.instance.setRenderTarget(this.renderTargets.other)
        this.renderer.instance.render(this.scene, this.camera)
        this.renderer.instance.setRenderTarget(null)
        this.renderTargets.current.needsUpdate = true

        // Swap
        const temp = this.renderTargets.current
        this.renderTargets.current = this.renderTargets.other
        this.renderTargets.other = temp
    }
}
