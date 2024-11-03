import { Scene, MeshBuilder, Mesh } from '@babylonjs/core';


class Player {
  private mesh: Mesh;

  constructor(scene: Scene) {
    this.mesh = MeshBuilder.CreateBox("player", { size: 1 }, scene);
    this.mesh.position.y = 0.5;
  }

  update() {
    // Update player logic
  }
}

export default Player;