import { Scene, PointerEventTypes, PointerInfo, EventState, Observer } from '@babylonjs/core';
import StrategyCameraController from './CameraController';

export function initInputSystem(scene: Scene, cameraController: StrategyCameraController) {
  // Most of the camera controls are now handled by Babylon.js built-in systems
  // We can add additional custom controls here if needed

  // For example, we could add a key to reset the camera:
  scene.onKeyboardObservable.add((kbInfo) => {
    if (kbInfo.type === 1) { // Key down
      if (kbInfo.event.key === 'r' || kbInfo.event.key === 'R') {
        cameraController.resetCamera();
      }
    }
  });

  // Add any other custom input handling here
}