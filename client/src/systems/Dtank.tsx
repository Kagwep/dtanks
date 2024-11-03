import { 
    Scene, 
    Mesh, 
    Vector3, 
    TransformNode, 
    AssetContainer, 
    AbstractMesh,
    AnimationGroup,
    Observable,
    PointerEventTypes,
    Quaternion,
    Animation,
    QuadraticEase,
    EasingFunction,
    MeshBuilder,
    StandardMaterial,
    Color3,
    GlowLayer
} from '@babylonjs/core';
import HexGrid from '@/components/Game/HexGrid';
import { Dtank, ToastType } from '@/types';
import { GameGUI } from '@/components/Game/DtanksGui';
import { Account, AccountInterface } from 'starknet';
import { DeploymentStorage } from './DeploymentStorage';

export interface DTank {
    id: string;
    rootMesh: AbstractMesh;
    position: { row: number; col: number };
    animations: {
        idle?: AnimationGroup;
        move?: AnimationGroup;
        attack?: AnimationGroup;
        death?: AnimationGroup;
        current?: AnimationGroup;
    };
    isSelected: boolean;
    player: number;
}

class DTankManager {
    private scene: Scene;
   
    
    private unitAsset: AssetContainer;
    private dtanks: Map<string, DTank> = new Map();

    // Track attacker and target tanks
    private attackerTank: DTank | null = null;
    private targetTank: DTank | null = null;
    
    // Observables for event handling
    public onTankSelected: Observable<DTank>;
    public onTankMoved: Observable<{ tank: DTank, fromPos: { row: number, col: number }, toPos: { row: number, col: number } }>;
    public onTargetSelected: Observable<{ attacker: DTank; target: DTank; }> | undefined;
    private selectedTank: DTank | null = null;;
    private gui: GameGUI;
    private arena;
    private actions;
    private getAccount: () => AccountInterface | Account;
    private unitIdToTankMap: Map<number, string> = new Map(); // unit_id -> tank.id
    private deploymentStorage: DeploymentStorage;
    constructor(
        scene: Scene, 
        assetContainer: AssetContainer,
        gui: GameGUI,
        arena,
        actions,
        getAccount,
        deploymentStorage,

    ) {
        this.scene = scene;
        this.unitAsset = assetContainer;
        
        this.onTankSelected = new Observable();
        this.onTankMoved = new Observable();

        this.gui = gui;
        this.arena = arena;
        this.actions = actions;
        this.getAccount = getAccount;
        // Setup pointer events for tank selection
        this.deploymentStorage = deploymentStorage;
        this.setupPointerEvents();
        
    }

    private setupPointerEvents(): void {
        this.scene.onPointerObservable.add(async (pointerInfo) => {
            if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
                const pickResult = this.scene.pick(
                    this.scene.pointerX, 
                    this.scene.pointerY
                );
                
                if (pickResult.hit) {
                    const mesh = pickResult.pickedMesh;
                    const tank = this.findTankByMesh(mesh);

                    //console.log(tank)

                    //console.log(tank.rootMesh.metadata)
                    
                    if (tank) {

                        this.selectedTank =  tank;
                        this.selectTank(tank);
                        this.setTarget(tank)

                        if (this.gui.getCurrentMode() == 'aim'){
                            await this.aimAtTarget();
                        }

                        if (this.gui.getCurrentMode() == 'fire'){
                            await this.fireAtTarget(tank);
                        }

                        if (this.gui.getCurrentMode() == 'reveal'){
                            await this.revealTarget(tank);
                        }
                        
                    } else {
                        this.deselectAllTanks();
                    }
                }
            }
        });
    }

    public createTank(row: number, col: number, player: number,unitData: Dtank): DTank | null {
        try {
            // Instantiate tank model
            const result = this.unitAsset.instantiateModelsToScene(
                name => `tank_${unitData.unit_id}_${name}`,
                false,
                { doNotInstantiate: true }
            );
            const rootMesh = result.rootNodes[0] as AbstractMesh;
            
            // Stop all animations first
            result.animationGroups.forEach(animGroup => {
                animGroup.stop();
                // animGroup.reset();
            });
    
            // Find and parent the gun to the tower
            const tankGun = rootMesh.getChildMeshes().find(
                mesh => mesh.name.includes('tank_gun')
            );
            const tankTower = rootMesh.getChildMeshes().find(
                mesh => mesh.name.includes('tank_tower')
            );
    
            if (tankGun && tankTower) {
                // Preserve the gun's original position before parenting
                const originalPosition = tankGun.position.clone();
                const originalRotation = tankGun.rotationQuaternion?.clone() || 
                                       Quaternion.FromEulerAngles(
                                           tankGun.rotation.x,
                                           tankGun.rotation.y,
                                           tankGun.rotation.z
                                       );
    
                // Parent the gun to the tower
                tankGun.parent = tankTower;
    
                // Restore the gun's position relative to its new parent
                tankGun.position = originalPosition;
                tankGun.rotationQuaternion = originalRotation;
            } else {
                console.warn('Could not find tank_gun or tank_tower mesh');
            }
            
            // Setup tank object
            const tank: DTank = {
                id: `tank_${unitData.unit_id}`,
                rootMesh,
                position: { row, col },
                animations: {
                    idle: this.findAnimation(result.animationGroups, "idle"),
                    move: this.findAnimation(result.animationGroups, "move"),
                    attack: this.findAnimation(result.animationGroups, "attack"),
                    death: this.findAnimation(result.animationGroups, "death"),
                },
                isSelected: false,
                player
            };
    
            // Add metadata to meshes for picking
            rootMesh.metadata = { tankId: tank.id, unitData };
            rootMesh.getChildMeshes().forEach(mesh => {
                mesh.metadata = { tankId: tank.id, unitData };
            });
    
            this.dtanks.set(tank.id, tank);
            this.unitIdToTankMap.set(unitData.unit_id, tank.id);
            // Optionally start idle animation after setup
            if (tank.animations.idle) {
                tank.animations.idle.start(true);
                tank.animations.current = tank.animations.idle;
            }
    
            return tank;
        } catch (error) {
            console.error("Error creating tank:", error);
            return null;
        }
    }

    public getDTankByUnitIdFast(unitId: number): DTank | undefined {
        const tankId = this.unitIdToTankMap.get(unitId);
        return tankId ? this.dtanks.get(tankId) : undefined;
    }

    public async moveTank(tank: DTank, toRow: number, toCol: number,worldPos: Vector3, unitData: Dtank): Promise<boolean> {

        const fromPos = { ...tank.position };
       // const worldPos = this.grid.gridToWorld(toRow, toCol);

        // Stop current animation
        if (tank.animations.current) {
            tank.animations.current.stop();
        }

        // Start move animation
        if (tank.animations.move) {
            tank.animations.current = tank.animations.move;
            tank.animations.move.start(false);
        }

        // Move the tank
        await this.animateMove(tank.rootMesh, worldPos);

        // Update position
        tank.position = { row: toRow, col: toCol };

        // Return to idle animation
        if (tank.animations.current) {
            tank.animations.current.stop();
        }
        if (tank.animations.idle) {
            tank.animations.current = tank.animations.idle;
            tank.animations.idle.start(true);
        }

        tank.rootMesh.metadata = { tankId: tank.id, unitData };
        tank.rootMesh.getChildMeshes().forEach(mesh => {
            mesh.metadata = { tankId: tank.id, unitData };
        });

        this.onTankMoved.notifyObservers({ 
            tank, 
            fromPos, 
            toPos: { row: toRow, col: toCol } 
        });

        return true;
    }

    private async animateMove(mesh: AbstractMesh, targetPos: Vector3): Promise<void> {
        return new Promise((resolve) => {
            const frameRate = 30;
            const duration = 1; // seconds
            
            let elapsed = 0;
            const startPos = mesh.position.clone();
            
            const animate = () => {
                elapsed += (1 / frameRate);
                const t = Math.min(elapsed / duration, 1);
                
                mesh.position = Vector3.Lerp(startPos, targetPos, t);
                
                if (t < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            
            animate();
        });
    }

    private selectTank(tank: DTank): void {
        this.deselectAllTanks();
        tank.isSelected = true;
        this.onTankSelected.notifyObservers(tank);
    }

    private deselectAllTanks(): void {
        this.dtanks.forEach(tank => tank.isSelected = false);
    }

    private findTankByMesh(mesh: AbstractMesh | null): DTank | null {
        if (!mesh || !mesh.metadata?.tankId) return null;
        return this.dtanks.get(mesh.metadata.tankId) || null;
    }

    private findAnimation(animations: AnimationGroup[], name: string): AnimationGroup | undefined {
        return animations.find(anim => 
            anim.name.toLowerCase().includes(name.toLowerCase())
        );
    }

    public getDTankById(id: string): DTank | undefined {
        return this.dtanks.get(id);
    }



    public getSelectedDTanks(): DTank[] {
        return Array.from(this.dtanks.values())
            .filter(tank => tank.isSelected);
    }

    public getAllDTanks(): DTank[] {
        return Array.from(this.dtanks.values());
    }

    private setTarget(tank: DTank): void {
        if (this.attackerTank && tank.id !== this.attackerTank.id) {
           this.targetTank = tank
        }else{
            this.attackerTank = tank
        }
    }

    public async aimAtTarget(): Promise<void> {
        if (!this.attackerTank || !this.targetTank) {
            console.log("No attacker or target selected");
            return;
        }

        if (this.scene.metadata.me.index === this.targetTank.rootMesh.metadata.unitData.player_id){

            this.gui.showToast("You cannot target your own tanks",ToastType.Warning)
            return
        }

        // Find the tower mesh
        const attackerTower = this.attackerTank.rootMesh.getChildMeshes().find(
            mesh => mesh.name.includes('tank_tower')
        );

        if (!attackerTower) {
            console.log("Could not find tank tower");
            return;
        }

        // Store original rotation
        const originalRotation = attackerTower.rotation.clone();

        // Calculate direction to target
        const attackerPos = this.attackerTank.rootMesh.position;
        const targetPos = this.targetTank.rootMesh.position;
        const direction = targetPos.subtract(attackerPos);
        direction.y = 0; // Keep rotation on Y axis only

        // Calculate target angle
        const targetAngle = Math.atan2(direction.x, direction.z);

        // Create rotation animation
        const rotationAnimation = new Animation(
            "towerRotation",
            "rotation.y",
            30, // fps
            Animation.ANIMATIONTYPE_FLOAT,
            Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        // Setup keyframes
        const keyFrames = [];
        keyFrames.push({
            frame: 0,
            value: attackerTower.rotation.y
        });
        keyFrames.push({
            frame: 30, // 1 second duration
            value: targetAngle
        });

        rotationAnimation.setKeys(keyFrames);

        // Add easing
        const easingFunction = new QuadraticEase();
        easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEOUT);
        rotationAnimation.setEasingFunction(easingFunction);

        // Play aim animation
        await new Promise<void>((resolve) => {
            this.scene.beginDirectAnimation(
                attackerTower,
                [rotationAnimation],
                0,
                30,
                false,
                1,
                resolve
            );
        });

        // Wait 3 seconds
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Create return animation
        const returnAnimation = new Animation(
            "towerReturnRotation",
            "rotation.y",
            15,
            Animation.ANIMATIONTYPE_FLOAT,
            Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        // Setup return keyframes
        const returnKeyFrames = [];
        returnKeyFrames.push({
            frame: 0,
            value: targetAngle
        });
        returnKeyFrames.push({
            frame: 30,
            value: originalRotation.y
        });

        returnAnimation.setKeys(returnKeyFrames);
        returnAnimation.setEasingFunction(easingFunction);

        // Play return animation
        await new Promise<void>((resolve) => {
            this.scene.beginDirectAnimation(
                attackerTower,
                [returnAnimation],
                0,
                30,
                false,
                1,
                resolve
            );
        });


            try {

            const result  = await this.actions.aim(this.getAccount(), this.scene.metadata.game.game_id, this.attackerTank.rootMesh.metadata.unitData.unit_id,this.targetTank.rootMesh.metadata.unitData.unit_id);
            console.log(result)
            if (result?.message) {
                const match = result.message.match(/Failure reason: 0x[0-9a-f]+\s\(([^)]+)\)/i);
                if (match && match[1]) {
                    // Remove single quotes from the extracted error message
                    const cleanedMessage = match[1].replace(/['"]+/g, '');
                    
                    // readable message like "Turn Timeout" without quotes
                    this.gui.showToast(cleanedMessage, ToastType.Error);

    
                    //this.dtanksGui.handleDeploy(hex.metadata.row,hex.metadata.col);
                }
            }
    
            if (result?.execution_status) {
                
                if (result?.execution_status === 'SUCCEEDED') {
                    // Remove single quotes from the extracted error message
                    const cleanedMessage = `target  locked`;
                    
                    // readable message like "Turn Timeout" without quotes
                    this.gui.showToast(cleanedMessage, ToastType.Success);
                }
            }
            

            if (typeof result === 'string' && result.includes('[Tx REVERTED]')) {
                const revertedMatch = result.match(/\[Tx REVERTED\] (.*)/);
                if (revertedMatch) {
                    this.gui.showToast(revertedMatch[1], ToastType.Error);
                    //this.dtanksGui.handleDeploy(hex.metadata.row, hex.metadata.col);
                    return;
                }
            }

            if (result.toString().startsWith("Error:")) {
                const strippedMessage = result.toString().replace(/^Error:\s*/, ""); // Remove "Error: " from the start
                this.gui.showToast(strippedMessage, ToastType.Error);
                   // this.dtanksGui.handleDeploy(hex.metadata.row, hex.metadata.col);
                    return;
              }
            
    
            } catch (error: any) {
              this.gui.showToast(error.message);
            } finally {
              
            }
        
        

        this.attackerTank = null
        this.targetTank = null
    }

    private createBulletMesh(scene: Scene): Mesh {
        // Create a small sphere for the bullet
        const bullet = MeshBuilder.CreateSphere("bullet", { diameter: 0.3 }, scene);
        
        // Create glowing material
        const bulletMaterial = new StandardMaterial("bulletMaterial", scene);
        bulletMaterial.emissiveColor = new Color3(1, 0.5, 0); // Orange glow
        bulletMaterial.specularColor = new Color3(1, 1, 1);
        bulletMaterial.alpha = 0.7;
        
        // Add glow layer if not exists
        if (!scene.getGlowLayerByName("bulletGlow")) {
            const glowLayer = new GlowLayer("bulletGlow", scene);
            glowLayer.intensity = 1;
        }
        
        bullet.material = bulletMaterial;
        return bullet;
    }

    private async fireBullet(
        from: Vector3,
        to: Vector3,
        scene: Scene,
        speed: number = 2 // Lower number = faster bullet
    ): Promise<void> {
        // Create bullet at shooter position
        const bullet = this.createBulletMesh(scene);
        bullet.position = from.clone();
    
        // Calculate trajectory
        const direction = to.subtract(from);
        const distance = direction.length();
    
        // Calculate frames - fewer frames = faster bullet
        const frames = Math.floor(distance * speed); // This will create fewer frames
        
        // Create animation with higher FPS for smoother motion
        const bulletAnimation = new Animation(
            "bulletAnimation",
            "position",
            120, // Increased FPS for smoother motion
            Animation.ANIMATIONTYPE_VECTOR3,
            Animation.ANIMATIONLOOPMODE_CONSTANT
        );
    
        // Create straight line trajectory
        const keys = [];
        for(let i = 0; i <= frames; i++) {
            const t = i / frames;
            const position = Vector3.Lerp(from, to, t);
            
            keys.push({
                frame: i,
                value: position
            });
        }
    
        bulletAnimation.setKeys(keys);
    
        // Remove easing for instant acceleration (more realistic for tank shell)
        // If you want to keep very slight easing:
        // const easingFunction = new QuadraticEase();
        // easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEOUT);
        // bulletAnimation.setEasingFunction(easingFunction);
    
        // Play animation and clean up
        return new Promise((resolve) => {
            scene.beginDirectAnimation(
                bullet,
                [bulletAnimation],
                0,
                frames,
                false,
                1, // Increased speed multiplier
                () => {
                    bullet.dispose();
                    resolve();
                }
            );
        });
    }
    private getBulletStartPosition(tank: DTank, targetPos: Vector3): Vector3 {
        // Get the gun mesh
        const tankGun = tank.rootMesh.getChildMeshes().find(
            mesh => mesh.name.includes('tank_gun')
        );
    
        if (!tankGun) {
            console.warn('Tank gun mesh not found');
            return tank.rootMesh.position.clone();
        }
    
        // Get gun's absolute position
        const gunPos = tankGun.getAbsolutePosition();
    
        // Get gun's forward direction (assuming gun points along local Z axis)
        const gunDirection = tankGun.getDirection(Vector3.Forward());
        
        // Calculate barrel length (adjust based on your model)
        const barrelLength = 2.0; // Adjust this value based on your gun model
        
        // Calculate bullet start position at the end of the barrel
        const bulletStartPos = gunPos.add(gunDirection.scale(barrelLength));
    
        // Optional: Add slight random variation for realism
        const spread = 0.05; // Small random spread
        bulletStartPos.x += (Math.random() - 0.5) * spread;
        bulletStartPos.y += (Math.random() - 0.5) * spread;
        bulletStartPos.z += (Math.random() - 0.5) * spread;
    
        return bulletStartPos;
    }
    
    public async fireAtTarget(tank:DTank): Promise<void> {


        if (tank.rootMesh.metadata.unitData.target_id == 0){

            this.gui.showToast("Dtank has no target",ToastType.Warning)
            return
        }

            const deployment = this.deploymentStorage.getDeploymentByUnitId(tank.rootMesh.metadata.unitData.unit_id);
            let isDummy: boolean;
            let codeName: string;

            console.log(deployment)

            if (deployment) {
                isDummy = deployment.isDummy;
                codeName = deployment.codeName
            }else{
                this.gui.tankInfoDeployDialog();

                await new Promise(resolve => setTimeout(resolve, 2000));

                if(this.gui.tankParams){
                    isDummy = this.gui.tankParams.isDummy
                    codeName = this.gui.tankParams.codeName
                }else{
                    this.gui.showToast("Please provide tank info, is tank dummy and codename", ToastType.Warning);
                    return
                }
            }

            try {

            const result  = await this.actions.fire(this.getAccount(), this.scene.metadata.game.game_id,tank.rootMesh.metadata.unitData.unit_id,isDummy,codeName);
            console.log(result)
            if (result?.message) {
                const match = result.message.match(/Failure reason: 0x[0-9a-f]+\s\(([^)]+)\)/i);
                if (match && match[1]) {
                    // Remove single quotes from the extracted error message
                    const cleanedMessage = match[1].replace(/['"]+/g, '');
                    
                    // readable message like "Turn Timeout" without quotes
                    this.gui.showToast(cleanedMessage, ToastType.Error);

    
                    //this.dtanksGui.handleDeploy(hex.metadata.row,hex.metadata.col);
                }
            }
    
            if (result?.execution_status) {
                
                if (result?.execution_status === 'SUCCEEDED') {
                    // Remove single quotes from the extracted error message
                    const cleanedMessage = `Firing`;
                    
                    // readable message like "Turn Timeout" without quotes
                    this.gui.showToast(cleanedMessage, ToastType.Success);


                                // Find the tower mesh
                    const attackerTower = tank.rootMesh.getChildMeshes().find(
                        mesh => mesh.name.includes('tank_tower')
                    );

                    if (!attackerTower) {
                        console.log("Could not find tank tower");
                        return;
                    }

                    // Store original rotation
                    const originalRotation = attackerTower.rotation.clone();

                    const targetTank = this.getDTankByUnitIdFast(tank.rootMesh.metadata.unitData.target_id)

                    // Calculate direction to target
                    const attackerPos = tank.rootMesh.position;
                    const targetPos = targetTank.rootMesh.position;
                    const direction = targetPos.subtract(attackerPos);
                    direction.y = 0; // Keep rotation on Y axis only

                    // Calculate target angle
                    const targetAngle = Math.atan2(direction.x, direction.z);

                    // Create rotation animation
                    const rotationAnimation = new Animation(
                        "towerRotation",
                        "rotation.y",
                        30, // fps
                        Animation.ANIMATIONTYPE_FLOAT,
                        Animation.ANIMATIONLOOPMODE_CONSTANT
                    );

                    // Setup keyframes
                    const keyFrames = [];
                    keyFrames.push({
                        frame: 0,
                        value: attackerTower.rotation.y
                    });
                    keyFrames.push({
                        frame: 30, // 1 second duration
                        value: targetAngle
                    });

                    rotationAnimation.setKeys(keyFrames);

                    // Add easing
                    const easingFunction = new QuadraticEase();
                    easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEOUT);
                    rotationAnimation.setEasingFunction(easingFunction);

                    // Play aim animation
                    await new Promise<void>((resolve) => {
                        this.scene.beginDirectAnimation(
                            attackerTower,
                            [rotationAnimation],
                            0,
                            30,
                            false,
                            1,
                            resolve
                        );
                    });

                    const tankGun = tank.rootMesh.getChildMeshes().find(
                        mesh => mesh.name.includes('tank_gun')
                    );
                    // Calculate bullet start position (from tower barrel)
                    const bulletStartPos = this.getBulletStartPosition(tank, targetPos);
                    bulletStartPos.y += 0.5; // Adjust based on your tower model

                    // Fire bullet
                    await this.fireBullet(bulletStartPos, targetPos, this.scene);

                    // Wait 3 seconds
                    await new Promise(resolve => setTimeout(resolve, 3000));

                    // Create return animation
                    const returnAnimation = new Animation(
                        "towerReturnRotation",
                        "rotation.y",
                        15,
                        Animation.ANIMATIONTYPE_FLOAT,
                        Animation.ANIMATIONLOOPMODE_CONSTANT
                    );

                    // Setup return keyframes
                    const returnKeyFrames = [];
                    returnKeyFrames.push({
                        frame: 0,
                        value: targetAngle
                    });
                    returnKeyFrames.push({
                        frame: 30,
                        value: originalRotation.y
                    });

                    returnAnimation.setKeys(returnKeyFrames);
                    returnAnimation.setEasingFunction(easingFunction);

                    // Play return animation
                    await new Promise<void>((resolve) => {
                        this.scene.beginDirectAnimation(
                            attackerTower,
                            [returnAnimation],
                            0,
                            30,
                            false,
                            1,
                            resolve
                        );
                    });

                }
            }
            

            if (typeof result === 'string' && result.includes('[Tx REVERTED]')) {
                const revertedMatch = result.match(/\[Tx REVERTED\] (.*)/);
                if (revertedMatch) {
                    this.gui.showToast(revertedMatch[1], ToastType.Error);
                    //this.dtanksGui.handleDeploy(hex.metadata.row, hex.metadata.col);
                    return;
                }
            }

            if (result.toString().startsWith("Error:")) {
                const strippedMessage = result.toString().replace(/^Error:\s*/, ""); // Remove "Error: " from the start
                this.gui.showToast(strippedMessage, ToastType.Error);
                   // this.dtanksGui.handleDeploy(hex.metadata.row, hex.metadata.col);
                    return;
              }
            
    
            } catch (error: any) {
              this.gui.showToast(error.message);
            } finally {
              
            }
        
        

        this.attackerTank = null
        this.targetTank = null
    }


    public async revealTarget(tank:DTank): Promise<void> {


        if (tank.rootMesh.metadata.unitData.pending_damage == 0){

            this.gui.showToast("Dtank has no pending damage",ToastType.Warning)
            return
        }
              

            const deployment = this.deploymentStorage.getDeploymentByUnitId(tank.rootMesh.metadata.unitData.unit_id);
            let isDummy: boolean;
            let codeName: string;

            if (deployment) {
                isDummy = deployment.isDummy;
                codeName = deployment.codeName
            }else{
                this.gui.tankInfoDeployDialog();

                await new Promise(resolve => setTimeout(resolve, 2000));

                if(this.gui.tankParams){
                    isDummy = this.gui.tankParams.isDummy
                    codeName = this.gui.tankParams.codeName
                }else{
                    this.gui.showToast("Please provide tank info, is tank dummy and codename", ToastType.Warning);
                    return
                }
            }

            try {

            const result  = await this.actions.reveal(this.getAccount(), this.scene.metadata.game.game_id,tank.rootMesh.metadata.unitData.unit_id,isDummy,codeName);
            console.log(result)
            if (result?.message) {
                const match = result.message.match(/Failure reason: 0x[0-9a-f]+\s\(([^)]+)\)/i);
                if (match && match[1]) {
                    // Remove single quotes from the extracted error message
                    const cleanedMessage = match[1].replace(/['"]+/g, '');
                    
                    // readable message like "Turn Timeout" without quotes
                    this.gui.showToast(cleanedMessage, ToastType.Error);

    
                    //this.dtanksGui.handleDeploy(hex.metadata.row,hex.metadata.col);
                }
            }
    
            if (result?.execution_status) {
                
                if (result?.execution_status === 'SUCCEEDED') {
                    // Remove single quotes from the extracted error message
                    const cleanedMessage = `tank revealed`;
                    
                    // readable message like "Turn Timeout" without quotes
                    this.gui.showToast(cleanedMessage, ToastType.Success);
                }
            }
            

            if (typeof result === 'string' && result.includes('[Tx REVERTED]')) {
                const revertedMatch = result.match(/\[Tx REVERTED\] (.*)/);
                if (revertedMatch) {
                    this.gui.showToast(revertedMatch[1], ToastType.Error);
                    //this.dtanksGui.handleDeploy(hex.metadata.row, hex.metadata.col);
                    return;
                }
            }

            if (result.toString().startsWith("Error:")) {
                const strippedMessage = result.toString().replace(/^Error:\s*/, ""); // Remove "Error: " from the start
                this.gui.showToast(strippedMessage, ToastType.Error);
                   // this.dtanksGui.handleDeploy(hex.metadata.row, hex.metadata.col);
                    return;
              }
            
    
            } catch (error: any) {
              this.gui.showToast(error.message);
            } finally {
              
            }
        
        

        this.attackerTank = null
        this.targetTank = null
    }


    public getSelectedDTank() {
        return this.selectedTank
    }

    public getDTankByPosition(row: number, col: number): DTank | undefined {
        return Array.from(this.dtanks.values()).find(tank => 
            tank.position.row === row && 
            tank.position.col === col
        );
    }

    public updateMetaData(tank: DTank, unitData: Dtank) {
        // Create metadata object once
        const sharedMetadata = { tankId: tank.id, unitData };
        
        // Reference the same object for all meshes
        tank.rootMesh.metadata = sharedMetadata;
        tank.rootMesh.getChildMeshes().forEach(mesh => {
            mesh.metadata = sharedMetadata;  // Uses same reference
        });

    }
    

    public dispose(): void {
        this.dtanks.forEach(tank => {
            Object.values(tank.animations).forEach(anim => anim?.dispose());
            tank.rootMesh.dispose();
        });
        this.dtanks = new Map;
    }
}

export { DTankManager };