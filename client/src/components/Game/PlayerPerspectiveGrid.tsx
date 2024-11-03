import { Vector3, Scene, Camera, UniversalCamera } from '@babylonjs/core';

class PlayerPerspectiveGrid {
    private scene: Scene;
    private camera: UniversalCamera;
    private readonly ROWS = 30;
    private readonly COLS = 28;
    private readonly MIDDLE_ROW = 15;
    private currentPlayer: number = 1; // 1 or 2
    private hexSize: number;

    constructor(scene: Scene, camera: UniversalCamera, hexSize: number = 1.5) {
        this.scene = scene;
        this.camera = camera;
        this.hexSize = hexSize;
    }

    // Switch player perspective
    public switchPlayerPerspective(playerNumber: number): void {
        this.currentPlayer = playerNumber;
        
        if (playerNumber === 2) {
            // Player 2's perspective (bottom side)
            this.camera.position = new Vector3(20, 20, 45); // Moved to other side
            this.camera.setTarget(new Vector3(16, 0, 42));
            this.camera.rotation = new Vector3(-0.555522375789330, 3.119690179, 0); // Flipped rotation
        } else {
            // Player 1's perspective (top side)
            this.camera.position = new Vector3(20, 20, -15);
            this.camera.setTarget(new Vector3(16, 0, -12));
            this.camera.rotation = new Vector3(0.555522375789330, -0.02190561437701, 0);
        }
    }

    // Convert logical grid position to world position
    public gridToWorld(row: number, col: number): Vector3 {
        if (this.currentPlayer === 2) {
            // Flip coordinates for player 2
            row = this.ROWS - 1 - row;
            col = this.COLS - 1 - col;
        }

        // Convert to world coordinates using hex geometry
        const x = col * this.hexSize * 2;
        const z = row * this.hexSize * Math.sqrt(3);
        
        return new Vector3(x, 0, z);
    }

    // Convert world position to grid position
    public worldToGrid(position: Vector3): { row: number, col: number } {
        let col = Math.round(position.x / (this.hexSize * 2));
        let row = Math.round(position.z / (this.hexSize * Math.sqrt(3)));

        if (this.currentPlayer === 2) {
            // Flip coordinates back for player 2
            row = this.ROWS - 1 - row;
            col = this.COLS - 1 - col;
        }

        return { row, col };
    }

    // Get relative forward direction based on current player
    public getForwardDirection(): Vector3 {
        return this.currentPlayer === 1 
            ? new Vector3(0, 0, 1)  // Forward for player 1
            : new Vector3(0, 0, -1); // Forward for player 2
    }

    // Check if position is in player's half of the board
    public isInPlayerTerritory(row: number): boolean {
        if (this.currentPlayer === 1) {
            return row <= this.MIDDLE_ROW;
        } else {
            return row >= this.MIDDLE_ROW;
        }
    }

    // Get normalized position for pathfinding/AI calculations
    public getNormalizedPosition(row: number, col: number): { row: number, col: number } {
        if (this.currentPlayer === 2) {
            return {
                row: this.ROWS - 1 - row,
                col: this.COLS - 1 - col
            };
        }
        return { row, col };
    }

    // Get relative movement direction
    public getRelativeDirection(fromRow: number, fromCol: number, toRow: number, toCol: number): { deltaRow: number, deltaCol: number } {
        let deltaRow = toRow - fromRow;
        let deltaCol = toCol - fromCol;

        if (this.currentPlayer === 2) {
            deltaRow = -deltaRow;
            deltaCol = -deltaCol;
        }

        return { deltaRow, deltaCol };
    }

    // Get hex neighbors considering current perspective
    public getNeighbors(row: number, col: number): Array<{ row: number, col: number }> {
        const directions = [
            { row: -1, col: 0 },  // North
            { row: -1, col: 1 },  // Northeast
            { row: 0, col: 1 },   // Southeast
            { row: 1, col: 0 },   // South
            { row: 1, col: -1 },  // Southwest
            { row: 0, col: -1 }   // Northwest
        ];

        return directions
            .map(dir => {
                const newRow = row + (this.currentPlayer === 2 ? -dir.row : dir.row);
                const newCol = col + (this.currentPlayer === 2 ? -dir.col : dir.col);
                return { row: newRow, col: newCol };
            })
            .filter(pos => this.isValidPosition(pos.row, pos.col));
    }

    private isValidPosition(row: number, col: number): boolean {
        return row >= 0 && row < this.ROWS && col >= 0 && col < this.COLS;
    }
}

export default PlayerPerspectiveGrid;