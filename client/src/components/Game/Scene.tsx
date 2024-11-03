import { Scene, Engine, Vector3, HemisphericLight, MeshBuilder, UniversalCamera, DirectionalLight, StandardMaterial, Color3, SpriteManager, Sprite, SceneLoader, Axis, AssetContainer, Space, Mesh } from '@babylonjs/core';
import { initRenderSystem } from '../../systems/renderSystem';
import { initInputSystem } from '../../systems/inputSystem';
import Player from '../../entities/Player';
import CameraController from '../../systems/CameraController';
import Grid from './HexGrid';
import HexGrid from './HexGrid';
import { createSkybox } from '../../utils';
import { WeatherSystem } from '../../systems/DTanksWeatherSystem';
import { GameGUI, GameState } from './DtanksGui';
import { CustomShader } from '../../systems/TileShader';
import PlayerPerspectiveGrid from './PlayerPerspectiveGrid';
import { DTankManager } from '../../systems/Dtank';
import "@babylonjs/loaders/glTF";
import { Dtank, Tile } from '@/types';
import { DeploymentStorage } from '@/systems/DeploymentStorage';

interface TileMetadata {
    tiles: Tile[];  // Assuming this comes from your metadata
}

class GameScene  {
  private cameraController: CameraController;
  private playerIndex: number;
  private tank: AssetContainer | undefined;
  private tankContainerInitialized: boolean = false;
  private scene: Scene;
  private dtankUnits: Map<string, Dtank> = new Map();
  private tiles: Map<string, Tile> = new Map();
  private getTileKey(tile: Tile): string {
    return `${tile.game_id}-${tile.row}-${tile.col}`;
}

 private spriteManagerTrees;

  constructor(scene: Scene, engine: Engine,arena,actions,getAccount,assetcont,camera: UniversalCamera) {

 
    this.scene = scene;

    this.initialize(assetcont);

    this.spriteManagerTrees = new SpriteManager("treesManager", "textures/palm.png", 2000, {width: 512, height: 1024},scene);


    this.scene.onBeforeRenderObservable.add(() => {
        // console.log('Current Infantry Units:', this.scene.metadata.infantryUnits);


         if (this.scene.metadata && this.scene.metadata.me) {
             // console.log('Current Infantry Units:', this.scene.metadata.infantryUnits);

           // console.log(this.playerIndex)

             if (this.scene.metadata.me.index === 0 && this.playerIndex !== 1) {
                camera.position = new Vector3(20, 20, -15);
                camera.setTarget(new Vector3(16, 17, -12));
                camera.rotation = new Vector3(0.555522375789330,-0.02190561437701,0);
            
                camera.rotation.copyFromFloats(0.555522375789330, -0.02190561437701, 0);
                
                this.playerIndex = 1;
             }else if  (this.scene.metadata.me.index === 1 && this.playerIndex !== 2){
                camera.position = new Vector3(23.931598126972048, 27.381181454383313, 46.99027397326361);
                camera.setTarget(new Vector3(23.98981744949033, 22.958736123353404, 43.19045972761293));
                camera.rotation = new Vector3(0.8609209251110627,3.1262722296024106,0);
            
                camera.rotation.copyFromFloats(0.8609209251110627, 3.1262722296024106, 0);
                this.playerIndex = 2;
             }

            // console.log(this.playerIndex )
              
             //console.log(this.scene.metadata.me)

             // console.log('Updated infantryUnits Map:', this.infantryUnits);
          }

     });



    console.log(this.playerIndex)

    if (this.playerIndex === 1){
        camera.position = new Vector3(20, 20, -15);
        camera.setTarget(new Vector3(16, 17, -12));
        camera.rotation = new Vector3(0.555522375789330,-0.02190561437701,0);
    
        camera.rotation.copyFromFloats(0.555522375789330, -0.02190561437701, 0);
    }else{
        camera.position = new Vector3(23.931598126972048, 27.381181454383313, 46.99027397326361);
        camera.setTarget(new Vector3(23.98981744949033, 22.958736123353404, 43.19045972761293));
        camera.rotation = new Vector3(0.8609209251110627,3.1262722296024106,0);
    
        camera.rotation.copyFromFloats(0.8609209251110627, 3.1262722296024106, 0);
    }


    camera.angularSensibility = 0;
    

    // Enable zoom in/out using mouse wheel or pinch gestures
    camera.inputs.addMouseWheel();
   // camera.inputs.attached["mousewheel"].wheelPrecision = 50; // Adjust zoom sensitivity
    
    // Lock camera rotation to prevent too much freedom (optional for turn-based games)
    camera.angularSensibility = 1000; // Adjust to control rotation speed or lock if needed
    
    // Optional: Limit camera movement bounds (if you have a board)
    // camera.lowerRadiusLimit = 10; // Minimum zoom distance
    // camera.upperRadiusLimit = 50; // Maximum zoom distance
    
    this.scene.activeCamera = camera;

    

    // Initialize the strategy camera controller
    this.cameraController = new CameraController(camera, scene);

    this.cameraController.lockRotation();
//
    // Adjust zoom speed if desired
   this.cameraController.setZoomSpeed(0.1);  // Adjust zoom sensitivity

    const light = new DirectionalLight("light", new Vector3(-5, 10, 10).negateInPlace().normalize(), scene);
    new HemisphericLight("hemi", new Vector3(0, 1, 0),scene);

    light.intensity = 0.1

    createSkybox(scene, light.direction.scale(-1));

    // Usage
    const gameState: GameState = {
        address: "123 Game Street",
        currentTank: 1,
        totalTanks: 10,
        players: ["Player1", "Player2", "Player3"]
        };

        const gui = new GameGUI(scene, gameState);

        // Update GUI when game state changes
        gui.updateGameState({
        currentTank: 2,
        players: [...gameState.players, "Player4"]
        });
        
    const deploymentStorage = new DeploymentStorage();
    const weather = new WeatherSystem(scene,camera);
    const dtankManager =new DTankManager(scene, this.tank, gui,arena,actions,getAccount,deploymentStorage)



    weather.setWeather('clear')

    const ground = MeshBuilder.CreateGround("ground", { width: 200, height: 200 }, scene);
    ground.position.y = -0.5
    ground.position.x +=10;
    ground.position.z += 10;


    const boxMaterial = new StandardMaterial("boxMaterial", scene);
    boxMaterial.diffuseColor = new Color3(0.133, 0.5, 0.33); // Blue color
    ground.material = boxMaterial;

       // this.loadTank()
       const spriteManagerTrees = new SpriteManager("treesManager", "textures/palm.png", 2000, {width: 512, height: 1024},scene);

    //this.player = new Player(this);

    // Function to create an enclosed plot with a gate
    function addEnclosedPlot(hexGrid: HexGrid, startRow: number, startCol: number, endRow: number, endCol: number, grassDensity: number, gatePosition: string) {
        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                if (row === startRow || row === endRow || col === startCol || col === endCol) {
                    if (!isGate(row, col, startRow, startCol, endRow, endCol, gatePosition)) {
                        hexGrid.addGrassToHex(row, col, grassDensity);
                    }
                } else {
                    // Add trees inside the plot with a certain probability
                    if (Math.random() < 0.2) {  // 20% chance to place a tree
                        const tree = new Sprite("tree", spriteManagerTrees);
                        hexGrid.placeTreeOnGrid(row, col, tree);
                    }
                }
            }
        }
    }

    // Helper function to determine if the current position is a gate
    function isGate(row: number, col: number, startRow: number, startCol: number, endRow: number, endCol: number, gatePosition: string) {
        const midCol = Math.floor((startCol + endCol) / 2);
        const midRow = Math.floor((startRow + endRow) / 2);
        
        return (gatePosition === "top" && row === startRow && col === midCol) ||
            (gatePosition === "bottom" && row === endRow && col === midCol) ||
            (gatePosition === "left" && col === startCol && row === midRow) ||
            (gatePosition === "right" && col === endCol && row === midRow);
    }

    // Main code
   

    const perspectiveGrid = new PlayerPerspectiveGrid(scene, camera, 1.5);

   // perspectiveGrid.switchPlayerPerspective(2);
    
    const hexGrid = new HexGrid(scene, light, 30, 28, 1.5,gui,arena,actions,getAccount,dtankManager,deploymentStorage);

    // Symmetrical layout
    // Top row
   // addEnclosedPlot(hexGrid, 1, 1, 7, 7, 200, "bottom");
    // addEnclosedPlot(hexGrid, 1, 11, 7, 17, 200, "bottom");
    // addEnclosedPlot(hexGrid, 1, 21, 7, 27, 200, "bottom");

    // // Middle row
    // addEnclosedPlot(hexGrid, 11, 1, 19, 9, 250, "right");
    // addEnclosedPlot(hexGrid, 11, 19, 19, 27, 250, "left");

    // // Bottom row
    // addEnclosedPlot(hexGrid, 23, 1, 29, 7, 200, "top");
    // addEnclosedPlot(hexGrid, 23, 11, 29, 17, 200, "top");
    // addEnclosedPlot(hexGrid, 23, 21, 29, 27, 200, "top");

    // Add additional trees in open areas
        // for (let row = 0; row < 30; row++) {
        //     for (let col = 0; col < 28; col++) {
        //         if (Math.random() < 0.05) {  // 5% chance to place a tree in open areas
        //             const tree = new Sprite("tree", spriteManagerTrees);
        //             hexGrid.placeTreeOnGrid(row, col, tree);
        //         }
        //     }
        // }

    
    //console.log(hexGrid.hexGrid)
    //hexGrid.placeBoxOnGrid(0, 3);

    initRenderSystem(scene);
    initInputSystem(scene, this.cameraController);

    


    // this.scene.registerBeforeRender(() => {
    //     if (!this.tankContainerInitialized && this.tank){
    //         console.log('.........')
    //         const dtankManager =new DTankManager(scene, this.tank, hexGrid)
    //         const newTank = dtankManager.createTank(1,14,2)
    //         console.log(newTank)
    //         //hexGrid.placeBoxOnGrid(newTank!.position.row,newTank!.position.col)
    //         hexGrid.placeTankOnGrid(newTank!.position.row,newTank!.position.col,newTank?.rootMesh as Mesh)

    //         const newTankOne = dtankManager.createTank(0,1,2)
    //         console.log(newTank)
    //         //hexGrid.placeBoxOnGrid(newTank!.position.row,newTank!.position.col)
    //         hexGrid.placeTankOnGrid( newTankOne!.position.row, newTankOne!.position.col, newTankOne?.rootMesh as Mesh)


    //         this.tankContainerInitialized = true
    //     }
    // } 

    
    // );


    this.scene.onBeforeRenderObservable.add(() => {
      /// console.log('Current Infantry Units:', this.scene.metadata,this.tank,Array.isArray(this.scene.metadata.dtankUnits ))
        // console.log('Current Infantry Units:', this.scene.metadata.infantryUnits);
         if (this.scene.metadata && Array.isArray(this.scene.metadata.dtankUnits ) && this.tank) {
           // console.log('Current Infantry Units:', this.scene.metadata.dtankUnits);
             gui.updateTopPanel()
             this.scene.metadata.dtankUnits.forEach(unitData => {
                 if (!this.dtankUnits.has(unitData.unit_id) ) {
                     // This is a new unit
                     
                    console.log('New infantry unit detected:', unitData);
                     this.dtankUnits.set(unitData.unit_id, unitData);
                     const newTank = dtankManager.createTank(unitData.position.row,unitData.position.col,unitData.player_id +1,unitData)
                     hexGrid.placeTankOnGrid(newTank!.position.row,newTank!.position.col,newTank?.rootMesh as Mesh)
                     gui.updateTopPanel()
                 } else {
                     // Update existing unit data
                                     // Check for and handle updates to existing tank
                    const existingTank = this.dtankUnits.get(unitData.unit_id);
                    if (this.hasRelevantTankChanges(existingTank!, unitData)) {
                        console.log('Tank updated:', unitData);
                        this.handleTankUpdate(existingTank!, unitData, hexGrid, gui,dtankManager);
                    }
                     this.dtankUnits.set(unitData.unit_id, unitData);
                 }
             });

             // Optionally, remove units that no longer exist in the metadata
            // this.removeNonExistentUnits();

            // console.log('Updated infantryUnits Map:', this.infantryUnits);
         }

         if (this.scene.metadata && Array.isArray(this.scene.metadata.tiles)) {
            //console.log(this.scene.metadata.tiles)
            this.scene.metadata.tiles.forEach((tileData: Tile) => {
                const tileKey = this.getTileKey(tileData);
                const existingTile = this.tiles.get(tileKey);

                if (!existingTile) {
                    // New tile discovered
                    console.log('New tile detected:', tileData);
                    this.tiles.set(tileKey, tileData);
                    this.handleNewTile(tileData,hexGrid);
                } else {
                    // Check for relevant changes
                    if (this.hasRelevantChanges(existingTile, tileData)) {
                        console.log('Tile updated:', tileData);
                        this.tiles.set(tileKey, tileData);
                        this.handleTileUpdate(existingTile, tileData,hexGrid);
                    }
                }
            });

            // Optionally remove tiles that no longer exist in metadata
           // this.removeNonExistentTiles(this.scene.metadata.tiles);
        }

     });

    
  }


    // Add these methods to your existing class
    private hasRelevantTankChanges(oldTank: Dtank, newTank: Dtank): boolean {
        // Check for changes in key properties
        const positionChanged = 
            oldTank.position.row !== newTank.position.row || 
            oldTank.position.col !== newTank.position.col;
        
        const statsChanged = 
            oldTank.ammunition !== newTank.ammunition ||
            oldTank.health !== newTank.health ||
            oldTank.is_active !== newTank.is_active ||
            oldTank.target_id !== newTank.target_id ||
            oldTank.pending_damage !== newTank.pending_damage;
        
        return positionChanged || statsChanged;
    }

    private handleTankUpdate(oldTank: Dtank, newTank: Dtank, hexGrid: HexGrid, gui: GameGUI, dtankManager: DTankManager): void {
        // Handle position changes
        const tank = dtankManager.getDTankByPosition(oldTank.position.row, oldTank.position.col);
        if (oldTank.position.row !== newTank.position.row || 
            oldTank.position.col !== newTank.position.col) {
            
            if (tank) {
                // Update tank position on grid
                const worldPos = hexGrid.gridToWorld(newTank.position.row,newTank.position.col);

                dtankManager.moveTank(tank, newTank.position.row,newTank.position.col,worldPos, newTank)

            }
        }

        // Handle health changes
        if (oldTank.health !== newTank.health) {
            // Update health visualization
            // You might want to update health bar or show damage effects
          
            dtankManager.updateMetaData(tank,newTank);
        }

        // Handle ammunition changes
        if (oldTank.ammunition !== newTank.ammunition) {
            // Update ammunition display
            dtankManager.updateMetaData(tank,newTank);
        }

        // Handle active state changes
        if (oldTank.is_active !== newTank.is_active) {
            // Update tank's visual state (e.g., highlight active tanks)
            dtankManager.updateMetaData(tank,newTank);
        }

        // Handle pending damage
        if (oldTank.pending_damage !== newTank.pending_damage) {
            // Show pending damage indicator
            dtankManager.updateMetaData(tank,newTank);
        }

        // Handle target changes
        if (oldTank.target_id !== newTank.target_id) {
            // Update targeting visualization
            dtankManager.updateMetaData(tank,newTank);
        }
    }

  private hasRelevantChanges(oldTile: Tile, newTile: Tile): boolean {
    // Check for changes in tree capacity
    const treeChanged = oldTile.tree.capacity !== newTile.tree.capacity;
    
    // Check for changes in plant density
    const plantsChanged = oldTile.plants.plant_density !== newTile.plants.plant_density ||
                        oldTile.plants.nb_stacks !== newTile.plants.nb_stacks;
    
    return treeChanged || plantsChanged;
}

private handleNewTile(tile: Tile,hexGrid: HexGrid) {
    // Handle new tile visualization
    // Example: Create visual elements for trees and plants
    if (tile.tree.capacity > 0) {
        // Add tree visualization
        // this.hexGrid.addTreeToGrid(tile.row, tile.col, tile.tree);
        const tree = new Sprite("tree", this.spriteManagerTrees);
        hexGrid.placeTreeOnGrid(tile.row, tile.col, tree);
    }
    
    if (tile.plants.plant_density > 0) {
        // Add plants visualization
        // this.hexGrid.addPlantsToGrid(tile.row, tile.col, tile.plants);
        hexGrid.addGrassToHex(tile.row, tile.col, tile.plants.plant_density);
    }
}

private handleTileUpdate(oldTile: Tile, newTile: Tile, hexGrid: HexGrid) {
    // Handle changes in existing tile
    if (oldTile.tree.capacity !== newTile.tree.capacity) {
        // Update tree visualization
        // this.hexGrid.updateTreeOnGrid(newTile.row, newTile.col, newTile.tree);
        const tree = new Sprite("tree", this.spriteManagerTrees);
        hexGrid.placeTreeOnGrid(newTile.row, newTile.col, tree);
    }
    
    if (oldTile.plants.plant_density !== newTile.plants.plant_density ||
        oldTile.plants.nb_stacks !== newTile.plants.nb_stacks) {
        // Update plants visualization
        // this.hexGrid.updatePlantsOnGrid(newTile.row, newTile.col, newTile.plants);
        hexGrid.addGrassToHex(newTile.row, newTile.col, newTile.plants.plant_density);
    }
}

  private  loadTank(assetcont) {
    try {
        
        
        assetcont.meshes[0].scaling = new Vector3(0.1, 0.1, 0.1);
        assetcont.meshes[0].rotation = new Vector3(0, -Math.PI, 0);
    
        //
    
        assetcont.meshes[0].rotate(Axis.Y, Math.PI, Space.LOCAL);

        console.log(assetcont)

        this.tank = assetcont;
    
    } catch (error) {
        console.error("Failed to load tank model:", error);
    }
}

private  initialize(assetcont: AssetContainer) {
    try {
        this.loadTank(assetcont);
        console.log("Tank loaded successfully");
    } catch (error) {
        console.error("Failed to load tank:", error);
    }
}


}

export default GameScene;