import * as BABYLON from '@babylonjs/core';
import { Scene, Vector3, StandardMaterial, Color3, VertexData, Mesh, MeshBuilder, Texture, ShaderMaterial } from '@babylonjs/core';
import { FurMaterial } from '@babylonjs/materials';
import HexGrassSystem from '../../systems/HexGrassSystem';
import { CustomShader } from '../../systems/TileShader';
import { GameGUI } from './DtanksGui';
import { Account, AccountInterface } from 'starknet';
import { Deploy, ToastType } from '@/types';
import { DTank, DTankManager } from '@/systems/Dtank';
import { DeploymentStorage } from '@/systems/DeploymentStorage';


class HexGrid {
    private scene: Scene;
    private rows: number;
    private columns: number;
    private hexSize: number;
    private selectedHex: BABYLON.Mesh | null = null;
    public hexGrid: BABYLON.Mesh[][] = [];
    private grassSystem: HexGrassSystem;
    private shader:  ShaderMaterial;
    private occupiedCells: Map<string, boolean> = new Map();
    private dtanksGui: GameGUI;
    private arena;
    private actions;
    private getAccount: () => AccountInterface | Account;
    private dtankManager: DTankManager;
    private deploymentStorage: DeploymentStorage;

    constructor(scene: Scene,light:BABYLON.DirectionalLight, rows: number, columns: number, hexSize: number,dtanksGui: GameGUI,arena,actions,getAccount,dtankManager,deploymentStorage) {
        this.scene = scene;
        this.rows = rows;
        this.columns = columns;
        this.hexSize = hexSize;
        this.shader = CustomShader.createShader("customShader", scene);
        this.createHexGrid();
        this.grassSystem = new HexGrassSystem(scene,light);
        this.dtanksGui = dtanksGui;
        this.arena = arena;
        this.actions = actions;
        this.getAccount = getAccount;
        this.dtankManager = dtankManager;
        this.deploymentStorage = deploymentStorage;
   
    }

    // Convert grid coordinates to world position
    public gridToWorld(row: number, col: number): Vector3 {
        const xSpacing = this.hexSize * 1;
        const zSpacing = Math.sqrt(1.3) * this.hexSize;
        const xPos = col * xSpacing;
        const zPos = row * zSpacing + (col % 2 === 0 ? 0 : zSpacing / 2);
        
        return new Vector3(xPos, 0, zPos);
    }
    
            // Convert world position to grid coordinates
    public worldToGrid(position: Vector3): { row: number; col: number } {
        const xSpacing = this.hexSize * 1;
        const zSpacing = Math.sqrt(1.3) * this.hexSize;
        
        // Calculate the rough column first
        let col = Math.round(position.x / xSpacing);
        
        // Adjust for the offset in odd columns
        const zOffset = col % 2 === 0 ? 0 : zSpacing / 2;
        let row = Math.round((position.z - zOffset) / zSpacing);

        // Ensure we stay within grid bounds
        col = Math.max(0, Math.min(col, this.columns - 1));
        row = Math.max(0, Math.min(row, this.rows - 1));

        return { row, col };
    }

    // Check if position is valid
    public isValidPosition(row: number, col: number): boolean {
        return row >= 0 && row < this.rows && 
               col >= 0 && col < this.columns;
    }


    private createHexagon(name: string): BABYLON.Mesh {
        const mesh = new BABYLON.Mesh(name, this.scene);
        const positions = [];
        const indices = [];
        const normals: BABYLON.Nullable<BABYLON.FloatArray> = [];

        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            positions.push(Math.cos(angle), 0, Math.sin(angle));
        }

        // Center point
        positions.push(0, 0, 0);

        // Create triangles
        for (let i = 0; i < 6; i++) {
            indices.push(i, (i + 1) % 6, 6);
        }

        // Compute normals
        BABYLON.VertexData.ComputeNormals(positions, indices, normals);

        // Apply vertex data to mesh
        const vertexData = new VertexData();
        vertexData.positions = positions;
        vertexData.indices = indices;
        vertexData.normals = normals;
        vertexData.applyToMesh(mesh);

        return mesh;
    }


    private createHexGrid(): void {
        const greenMaterial = new StandardMaterial('greenMaterial', this.scene);
        greenMaterial.diffuseTexture = new BABYLON.Texture("/textures/grass.jpg");
    
        const redMaterial = new StandardMaterial('redMaterial', this.scene);
        redMaterial.diffuseColor = new Color3(1, 0, 0);
    
        const xSpacing = this.hexSize * 1;
        const zSpacing = Math.sqrt(1.3) * this.hexSize;

        for (let row = 0; row < this.rows; row++) {
            this.hexGrid[row] = [];
        }
    
    
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.columns; col++) {
                const xPos = col * xSpacing;
                const zPos = row * zSpacing + (col % 2 === 0 ? 0 : zSpacing / 2);
    
                const hex = this.createHexagon(`hex_${row}_${col}`);
                hex.position = new Vector3(xPos, 0, zPos);

                const amigaTexture = new BABYLON.Texture("/textures/grass.jpg", this.scene);
                this.shader.setTexture("textureSampler", amigaTexture);
              
    
                hex.material = this.shader.clone(`greenMaterial_${row}_${col}`);
    
                // Store row and column info on the mesh for future reference
                hex.metadata = { row, col };
    
                // Add action to handle click event
                hex.actionManager = new BABYLON.ActionManager(this.scene);
                hex.actionManager.registerAction(
                    new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, async () => {
                        if (this.selectedHex) {
                            this.selectedHex.material = this.shader; // Reset previous selection
                            console.log(hex.metadata)
                            if (this.dtanksGui.getCurrentMode() === 'deploy' && this.dtanksGui.deployParams.codeName != null){
                                console.log(this.dtanksGui.deployParams,this.getAccount());

                                try {
                                const nextUnitId = this.scene.metadata.game.unit_count += 1;

                                const isDummy  = this.dtanksGui.deployParams.isDummy;
                                
                                const codeName = this.dtanksGui.deployParams.codeName;
                                const result  = await this.actions.deploy(this.getAccount(), this.scene.metadata.game.game_id, hex.metadata.row,hex.metadata.col, this.dtanksGui.deployParams.isDummy,this.dtanksGui.deployParams.codeName);
                                console.log(result)
                                if (result?.message) {
                                    const match = result.message.match(/Failure reason: 0x[0-9a-f]+\s\(([^)]+)\)/i);
                                    if (match && match[1]) {
                                        // Remove single quotes from the extracted error message
                                        const cleanedMessage = match[1].replace(/['"]+/g, '');
                                        
                                        // readable message like "Turn Timeout" without quotes
                                        this.dtanksGui.showToast(cleanedMessage, ToastType.Error);

                        
                                        this.dtanksGui.handleDeploy(hex.metadata.row,hex.metadata.col);

                                                                                // Store deployment info
                                        this.deploymentStorage.addDeployment({
                                            unitId: nextUnitId,
                                            isDummy,
                                            codeName,
                                            gameId: this.scene.metadata.game.id // if needed
                                        });



                                    }
                                }
                        
                                if (result?.execution_status) {
                                    
                                    if (result?.execution_status === 'SUCCEEDED') {
                                        // Remove single quotes from the extracted error message
                                        const cleanedMessage = `Deployed Dtank`;
                                        
                                        // readable message like "Turn Timeout" without quotes
                                        this.dtanksGui.showToast(cleanedMessage, ToastType.Success);
                                    }
                                }
                                

                                if (typeof result === 'string' && result.includes('[Tx REVERTED]')) {
                                    const revertedMatch = result.match(/\[Tx REVERTED\] (.*)/);
                                    if (revertedMatch) {
                                        this.dtanksGui.showToast(revertedMatch[1], ToastType.Error);
                                        this.dtanksGui.handleDeploy(hex.metadata.row, hex.metadata.col);
                                        return;
                                    }
                                }

                                if (result.toString().startsWith("Error:")) {
                                    const strippedMessage = result.toString().replace(/^Error:\s*/, ""); // Remove "Error: " from the start
                                    this.dtanksGui.showToast(strippedMessage, ToastType.Error);
                                        this.dtanksGui.handleDeploy(hex.metadata.row, hex.metadata.col);
                                        return;
                                  }
                                
                        
                                } catch (error: any) {
                                  this.dtanksGui.showToast(error.message);
                                } finally {
                                  
                                }
                            
                            }

                            if (this.dtanksGui.getCurrentMode() === 'shrub'){
                                console.log(this.dtanksGui.deployParams,this.getAccount());

                                try {
    
                                const result  = await this.actions.shrub(this.getAccount(), this.scene.metadata.game.game_id, hex.metadata.row,hex.metadata.col);
                                console.log(result)
                                if (result?.message) {
                                    const match = result.message.match(/Failure reason: 0x[0-9a-f]+\s\(([^)]+)\)/i);
                                    if (match && match[1]) {
                                        // Remove single quotes from the extracted error message
                                        const cleanedMessage = match[1].replace(/['"]+/g, '');
                                        
                                        // readable message like "Turn Timeout" without quotes
                                        this.dtanksGui.showToast(cleanedMessage, ToastType.Error);

                        
                                        this.dtanksGui.handleDeploy(hex.metadata.row,hex.metadata.col);
                                    }
                                }
                        
                                if (result?.execution_status) {
                                    
                                    if (result?.execution_status === 'SUCCEEDED') {
                                        // Remove single quotes from the extracted error message
                                        const cleanedMessage = `Shrub Added`;
                                        
                                        // readable message like "Turn Timeout" without quotes
                                        this.dtanksGui.showToast(cleanedMessage, ToastType.Success);
                                    }
                                }
                                

                                if (typeof result === 'string' && result.includes('[Tx REVERTED]')) {
                                    const revertedMatch = result.match(/\[Tx REVERTED\] (.*)/);
                                    if (revertedMatch) {
                                        this.dtanksGui.showToast(revertedMatch[1], ToastType.Error);
                                        this.dtanksGui.handleDeploy(hex.metadata.row, hex.metadata.col);
                                        return;
                                    }
                                }

                                if (result.toString().startsWith("Error:")) {
                                    const strippedMessage = result.toString().replace(/^Error:\s*/, ""); // Remove "Error: " from the start
                                    this.dtanksGui.showToast(strippedMessage, ToastType.Error);
                                        this.dtanksGui.handleDeploy(hex.metadata.row, hex.metadata.col);
                                        return;
                                  }
                                
                        
                                } catch (error: any) {
                                  this.dtanksGui.showToast(error.message);
                                } finally {
                                  
                                }
                            
                            }

                            if (this.dtanksGui.getCurrentMode() === 'tree'){
                                console.log(this.dtanksGui.deployParams,this.getAccount());

                                try {
    
                                const result  = await this.actions.tree(this.getAccount(), this.scene.metadata.game.game_id, hex.metadata.row,hex.metadata.col);
                                console.log(result)
                                if (result?.message) {
                                    const match = result.message.match(/Failure reason: 0x[0-9a-f]+\s\(([^)]+)\)/i);
                                    if (match && match[1]) {
                                        // Remove single quotes from the extracted error message
                                        const cleanedMessage = match[1].replace(/['"]+/g, '');
                                        
                                        // readable message like "Turn Timeout" without quotes
                                        this.dtanksGui.showToast(cleanedMessage, ToastType.Error);

                        
                                        this.dtanksGui.handleDeploy(hex.metadata.row,hex.metadata.col);
                                    }
                                }
                        
                                if (result?.execution_status) {
                                    
                                    if (result?.execution_status === 'SUCCEEDED') {
                                        // Remove single quotes from the extracted error message
                                        const cleanedMessage = `tree Added`;
                                        
                                        // readable message like "Turn Timeout" without quotes
                                        this.dtanksGui.showToast(cleanedMessage, ToastType.Success);
                                    }
                                }
                                

                                if (typeof result === 'string' && result.includes('[Tx REVERTED]')) {
                                    const revertedMatch = result.match(/\[Tx REVERTED\] (.*)/);
                                    if (revertedMatch) {
                                        this.dtanksGui.showToast(revertedMatch[1], ToastType.Error);
                                        this.dtanksGui.handleDeploy(hex.metadata.row, hex.metadata.col);
                                        return;
                                    }
                                }

                                if (result.toString().startsWith("Error:")) {
                                    const strippedMessage = result.toString().replace(/^Error:\s*/, ""); // Remove "Error: " from the start
                                    this.dtanksGui.showToast(strippedMessage, ToastType.Error);
                                        this.dtanksGui.handleDeploy(hex.metadata.row, hex.metadata.col);
                                        return;
                                  }
                                
                        
                                } catch (error: any) {
                                  this.dtanksGui.showToast(error.message);
                                } finally {
                                  
                                }
                            
                            }

                            if (this.dtanksGui.getCurrentMode() === 'move'  && this.dtankManager.getSelectedDTank()){
                                console.log(this.dtankManager.getSelectedDTank().rootMesh.metadata.unitData.unit_id);

                                try {
    
                                const result  = await this.actions.move(this.getAccount(), this.scene.metadata.game.game_id,this.dtankManager.getSelectedDTank().rootMesh.metadata.unitData.unit_id, hex.metadata.row,hex.metadata.col);
                                console.log(result)
                                if (result?.message) {
                                    const match = result.message.match(/Failure reason: 0x[0-9a-f]+\s\(([^)]+)\)/i);
                                    if (match && match[1]) {
                                        // Remove single quotes from the extracted error message
                                        const cleanedMessage = match[1].replace(/['"]+/g, '');
                                        
                                        // readable message like "Turn Timeout" without quotes
                                        this.dtanksGui.showToast(cleanedMessage, ToastType.Error);

                        
                                        this.dtanksGui.handleDeploy(hex.metadata.row,hex.metadata.col);
                                    }
                                }
                        
                                if (result?.execution_status) {
                                    
                                    if (result?.execution_status === 'SUCCEEDED') {
                                        // Remove single quotes from the extracted error message
                                        const cleanedMessage = `Dtank Moved Added`;
                                        
                                        // readable message like "Turn Timeout" without quotes
                                        this.dtanksGui.showToast(cleanedMessage, ToastType.Success);
                                        
                                    }
                                }
                                

                                if (typeof result === 'string' && result.includes('[Tx REVERTED]')) {
                                    const revertedMatch = result.match(/\[Tx REVERTED\] (.*)/);
                                    if (revertedMatch) {
                                        this.dtanksGui.showToast(revertedMatch[1], ToastType.Error);
                                        this.dtanksGui.handleDeploy(hex.metadata.row, hex.metadata.col);
                                        return;
                                    }
                                }

                                if (result.toString().startsWith("Error:")) {
                                    const strippedMessage = result.toString().replace(/^Error:\s*/, ""); // Remove "Error: " from the start
                                    this.dtanksGui.showToast(strippedMessage, ToastType.Error);
                                        this.dtanksGui.handleDeploy(hex.metadata.row, hex.metadata.col);
                                        return;
                                  }
                                
                        
                                } catch (error: any) {
                                  this.dtanksGui.showToast(error.message);
                                } finally {
                                  
                                }
                            
                            }
                           
                        }
                        
                        this.selectedHex = hex;
                        hex.material = redMaterial;
                    })
                );

               this.hexGrid[row][col] = hex;
            }
        }
    }

    public addGrassToHex(row: number, col: number, grassDensity: number = 1000) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.columns) {
            console.error("Invalid grid position");
            return;
        }

        const targetHex = this.hexGrid[row][col];
        if (!targetHex) {
            console.error("No hexagon found at the specified position");
            return;
        }

        // Use the same positioning logic as in createHexGrid
        const xSpacing = this.hexSize * 1;
        const zSpacing = Math.sqrt(1.3) * this.hexSize;
        const xPos = col * xSpacing;
        const zPos = row * zSpacing + (col % 2 === 0 ? 0 : zSpacing / 2);

        const hexCenter = new Vector3(xPos, 0, zPos);
        const grassPatch = this.grassSystem.addGrassToHex(hexCenter, this.hexSize*0.55, grassDensity);
        
        // Instead of parenting, set the position directly
        grassPatch.position = hexCenter;
    }

    public placeBoxOnGrid(row: number, col: number): void {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.columns) {
            console.error("Invalid grid position");
            return;
        }

        const targetHex = this.hexGrid[row][col];
        if (!targetHex) {
            console.error("No hexagon found at the specified position");
            return;
        }

        const box = MeshBuilder.CreateBox("box", { size: this.hexSize * 0.5 }, this.scene);
        box.position = new Vector3(targetHex.position.x, this.hexSize * 0.25, targetHex.position.z);

        const boxMaterial = new StandardMaterial("boxMaterial", this.scene);
        boxMaterial.diffuseColor = new Color3(0.133, 0.545, 0.133); // Blue color
        box.material = boxMaterial;
    }

    public placeTankOnGrid(row: number, col: number,tank: Mesh): void {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.columns) {
            console.error("Invalid grid position");
            return;
        }

        const targetHex = this.hexGrid[row][col];
        if (!targetHex) {
            console.error("No hexagon found at the specified position");
            return;
        }
;
        tank.position = new Vector3(targetHex.position.x, this.hexSize * 0.25, targetHex.position.z-0.4);

        const boxMaterial = new StandardMaterial("boxMaterial", this.scene);
        boxMaterial.diffuseColor = new Color3(0.133, 0.545, 0.133); // Blue color
        //tank.material = boxMaterial;
    }

    public placeTreeOnGrid(row: number, col: number,tree: BABYLON.Sprite): void {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.columns) {
            console.error("Invalid grid position");
            return;
        }

        const targetHex = this.hexGrid[row][col];
        if (!targetHex) {
            console.error("No hexagon found at the specified position");
            return;
        }

        tree.size = 5;

  
        tree.position = new Vector3(targetHex.position.x, this.hexSize * 0.25, targetHex.position.z);

    
    }
}

export default HexGrid;