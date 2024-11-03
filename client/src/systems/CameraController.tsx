import { UniversalCamera, Scene, Vector3, PointerInfo, PointerEventTypes } from '@babylonjs/core';

class CameraController {
    private camera: UniversalCamera;
    private scene: Scene;
    private moveSpeed: number = 0.5;
    private zoomSpeed: number = 0.1;
    private keysPressed: { [key: string]: boolean } = {
      'w': false,
      'a': false,
      's': false,
      'd': false
    };
    private isRotationLocked: boolean = false;
    private minZoomDistance: number = 5.247856641606259;
    private maxZoomDistance: number = 6.414047006407654;

  
    constructor(camera: UniversalCamera, scene: Scene) {
      this.camera = camera;
      this.scene = scene;
  
      this.setupInputs();
  
      // Register keyboard events
      this.scene.onKeyboardObservable.add((kbInfo) => {
        const key = kbInfo.event.key.toLowerCase();
        if (key in this.keysPressed) {
          this.keysPressed[key] = kbInfo.type === 1; // 1 for key down, 2 for key up
        }
      });
  
      // Update camera position based on keyboard input
      this.scene.onBeforeRenderObservable.add(() => {
        this.updateCameraPositionFromKeyboard();
      });

      // Custom zoom functionality
      this.scene.onPointerObservable.add((pointerInfo) => {
        if (pointerInfo.type === PointerEventTypes.POINTERWHEEL) {
          this.handleZoom(pointerInfo);
        }
      });
    }
  
    private setupInputs(): void {
      this.camera.inputs.clear();
      this.camera.inputs.addKeyboard();
      if (!this.isRotationLocked) {
        this.camera.inputs.addMouse();
      }
    }

    private updateCameraPositionFromKeyboard(): void {
      let moveVector = Vector3.Zero();
  
      if (this.keysPressed['w']) moveVector.addInPlace(this.camera.getDirection(Vector3.Forward()));
      if (this.keysPressed['s']) moveVector.addInPlace(this.camera.getDirection(Vector3.Backward()));
      if (this.keysPressed['a']) moveVector.addInPlace(this.camera.getDirection(Vector3.Left()));
      if (this.keysPressed['d']) moveVector.addInPlace(this.camera.getDirection(Vector3.Right()));
  
      if (moveVector.length() > 0) {
        moveVector.normalize().scaleInPlace(this.moveSpeed);
        // Move the camera parallel to the ground plane
        this.camera.position.addInPlace(moveVector.multiply(new Vector3(1, 0, 1)));
       // console.log(this.camera.position)
      }
    }

    private handleZoom(pointerInfo: PointerInfo): void {
        if (pointerInfo.event instanceof WheelEvent) {
          const delta = pointerInfo.event.deltaY;
          const zoomFactor = delta > 0 ? 1 + this.zoomSpeed : 1 - this.zoomSpeed;
      
          // Calculate the current distance between the camera and its target
          const direction = this.camera.getTarget().subtract(this.camera.position);
          const currentDistance = direction.length();
      
          // Calculate the potential new distance
          const newDistance = currentDistance * zoomFactor;

         // console.log(newDistance)
      
          // Ensure the new distance is within the allowed limits
          if (newDistance >= this.minZoomDistance && newDistance <= this.maxZoomDistance) {
            // Apply the zoom if within limits
            const newPosition = this.camera.position.add(direction.scale(1 - zoomFactor));
            this.camera.position = newPosition;
          }
        }
      }
      
  
    resetCamera(): void {
      this.camera.position = new Vector3(20, 20, -15);
      this.camera.setTarget(new Vector3(16, 17, -12));
      this.camera.rotation = new Vector3(0.555522375789330, -0.02190561437701, 0);
    }
  
    getCamera(): UniversalCamera {
      return this.camera;
    }
  
    setMoveSpeed(speed: number): void {
      this.moveSpeed = speed;
    }

    setZoomSpeed(speed: number): void {
      this.zoomSpeed = speed;
    }

    lockRotation(): void {
      if (!this.isRotationLocked) {
        this.isRotationLocked = true;
        this.setupInputs();
      }
    }

    unlockRotation(): void {
      if (this.isRotationLocked) {
        this.isRotationLocked = false;
        this.setupInputs();
      }
    }
}

export default CameraController;