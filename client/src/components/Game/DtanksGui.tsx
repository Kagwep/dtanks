import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import { shortAddress } from '@/utils/sanitizer';
import { ToastType } from '@/types';

export interface GameState {
    address: string;
    currentTank: number;
    totalTanks: number;
    players: string[];
}

export class GameGUI {
    private scene: BABYLON.Scene;
    private gameState: GameState;
    private advancedTexture: GUI.AdvancedDynamicTexture;
    
    private readonly backgroundColor: BABYLON.Color3 = new BABYLON.Color3(0.1, 0.2, 0.1);
    private readonly textColor: string = "#C0C0C0";
    private readonly panelColor: BABYLON.Color3 = new BABYLON.Color3(0.15, 0.25, 0.15);
    private readonly highlightColor: string = "#4CAF50";

    private currentMode: string | null = null;
    private readonly MODES = {
        DEPLOY: 'deploy',
        SHRUB: 'shrub',
        TREE: 'tree',
        MOVE: 'move',
        AIM: 'aim',
        FIRE: 'fire',
        REVEAL: 'reveal'
    } as const;

    private topPanel: GUI.Rectangle | undefined;
    private bottomPanel: GUI.Rectangle | undefined;
    private addressText: GUI.TextBlock | undefined;
    private tankInfo: GUI.TextBlock | undefined;
    private supplyInfo: GUI.TextBlock | undefined;
    private scoreInfo:GUI.TextBlock | undefined;
    private dummyTankInfo: GUI.TextBlock | undefined;
    private turnsInfo: GUI.TextBlock | undefined;
    private mainMenuBtn: GUI.Button | undefined;
    private mainMenuPanel: GUI.Rectangle | undefined;
    private activeSubPanel: GUI.Rectangle | null = null;
    private shortAddress =  (address: string, size?: number):string => {
        return shortAddress(address)
    }
    // Add this to your class properties at the top
private modeButtons: { [key: string]: GUI.Button } = {};

    constructor(scene: BABYLON.Scene, gameState: GameState) {
        this.scene = scene;
        this.gameState = gameState;
        this.advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        
        this.createTopPanel();
        this.createMainMenuButton();
        this.createMainMenuPanel();
        this.createBottomPanel();
        this.shortAddress = shortAddress;

        console.log(scene.metadata)
    }

    private createTopPanel(): void {
        this.topPanel = new GUI.Rectangle();
        this.topPanel.width = "100%";
        this.topPanel.height = "60px";
        this.topPanel.cornerRadius = 0;
        this.topPanel.color = this.highlightColor;
        this.topPanel.thickness = 2;
        this.topPanel.background = this.backgroundColor.toHexString();
        this.topPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.topPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.advancedTexture.addControl(this.topPanel);
    
        const topPanelContent = new GUI.Grid();
        // Make columns slightly wider to accommodate icons
        topPanelContent.addColumnDefinition(0.25);
        topPanelContent.addColumnDefinition(0.25);
        topPanelContent.addColumnDefinition(0.25);
        topPanelContent.addColumnDefinition(0.25);
        this.topPanel.addControl(topPanelContent);
    
        // Address section with icon
        const addressContainer = new GUI.StackPanel();
        addressContainer.isVertical = false;
        addressContainer.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        
        const addressIcon = new GUI.Image("addressIcon", "wallet.png");
        addressIcon.width = "20px";
        addressIcon.height = "20px";
        addressIcon.paddingRight = "5px";
        addressContainer.addControl(addressIcon);
    
        this.addressText = new GUI.TextBlock();
        this.addressText.color = this.textColor;
        this.addressText.width = '80px'
        this.addressText.fontSize = 14;
        addressContainer.addControl(this.addressText);
        topPanelContent.addControl(addressContainer, 0, 0);
    
        // Tanks section with icon
        const tanksContainer = new GUI.StackPanel();
        tanksContainer.isVertical = false;
        tanksContainer.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    
        const tanksIcon = new GUI.Image("tanksIcon", "/dtanks.png");
        tanksIcon.width = "20px";
        tanksIcon.height = "20px";
        tanksIcon.paddingRight = "5px";
        tanksContainer.addControl(tanksIcon);
    
        this.tankInfo = new GUI.TextBlock();
        this.tankInfo.color = this.textColor;
        this.tankInfo.width = '80px'
        this.tankInfo.fontSize = 14;
        this.tankInfo.paddingRight = "15px"
        tanksContainer.addControl(this.tankInfo);
        topPanelContent.addControl(tanksContainer, 0, 1);


        const dummyTanksIcon = new GUI.Image("tanksIcon", "/dummy.png");
        dummyTanksIcon.width = "20px";
        dummyTanksIcon.height = "20px";
        dummyTanksIcon.paddingRight = "5px";
        tanksContainer.addControl( dummyTanksIcon);
    
        this.dummyTankInfo = new GUI.TextBlock();
        this.dummyTankInfo.color = this.textColor;
        this.dummyTankInfo.width = '80px'
        this.dummyTankInfo.fontSize = 14;
        tanksContainer.addControl(this.dummyTankInfo);
        topPanelContent.addControl(tanksContainer, 0, 1);
    
        // Supply section with icon
        const supplyContainer = new GUI.StackPanel();
        supplyContainer.isVertical = false;
        supplyContainer.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    
        const supplyIcon = new GUI.Image("supplyIcon", "/supply.png");
        supplyIcon.width = "20px";
        supplyIcon.height = "20px";
        supplyIcon.paddingRight = "5px";
        supplyContainer.addControl(supplyIcon);
    
        this.supplyInfo = new GUI.TextBlock();
        this.supplyInfo.color = this.textColor;
        this.supplyInfo.width = "80px"
        this.supplyInfo.fontSize = 14;
        supplyContainer.addControl(this.supplyInfo);
        topPanelContent.addControl(supplyContainer, 0, 2);


        const scoreIcon = new GUI.Image("supplyIcon", "/score.png");
        scoreIcon.width = "20px";
        scoreIcon.height = "20px";
        scoreIcon.paddingRight = "5px";
        supplyContainer.addControl(scoreIcon);
    
        this.scoreInfo = new GUI.TextBlock();
        this.scoreInfo.color = this.textColor;
        this.scoreInfo.width = "80px"
        this.scoreInfo.fontSize = 14;
        supplyContainer.addControl(this.scoreInfo);
        topPanelContent.addControl(supplyContainer, 0, 2);
    
        // Turns section with icon
        const turnsContainer = new GUI.StackPanel();
        turnsContainer.isVertical = false;
        turnsContainer.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    
        const turnsIcon = new GUI.Image("turnsIcon", "path/to/clock-icon.png");
        turnsIcon.width = "20px";
        turnsIcon.height = "20px";
        turnsIcon.paddingRight = "5px";
        turnsContainer.addControl(turnsIcon);
    
        this.turnsInfo = new GUI.TextBlock();
        this.turnsInfo.color = this.textColor;
        this.turnsInfo.fontSize = 14;
        turnsContainer.addControl(this.turnsInfo);
        topPanelContent.addControl(turnsContainer, 0, 3);
    
        this.updateTopPanel();
    }

    private createMainMenuButton(): void {
        this.mainMenuBtn = GUI.Button.CreateSimpleButton("mainMenuBtn", "Main Menu");
        this.mainMenuBtn.width = "120px";
        this.mainMenuBtn.height = "40px";
        this.mainMenuBtn.color = this.textColor;
        this.mainMenuBtn.cornerRadius = 5;
        this.mainMenuBtn.background = this.panelColor.toHexString();
        this.mainMenuBtn.hoverCursor = "pointer";
        this.mainMenuBtn.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.mainMenuBtn.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.mainMenuBtn.top = "70px";
        this.mainMenuBtn.left = "10px";
        this.advancedTexture.addControl(this.mainMenuBtn);

        this.mainMenuBtn.onPointerUpObservable.add(() => {
            this.toggleMainMenu();
        });
    }

    private createMainMenuPanel(): void {
        this.mainMenuPanel = new GUI.Rectangle();
        this.mainMenuPanel.width = "200px";
        this.mainMenuPanel.height = "300px";
        this.mainMenuPanel.cornerRadius = 10;
        this.mainMenuPanel.color = this.highlightColor;
        this.mainMenuPanel.thickness = 2;
        this.mainMenuPanel.background = this.panelColor.toHexString();
        this.mainMenuPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.mainMenuPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.mainMenuPanel.top = "120px";
        this.mainMenuPanel.left = "10px";
        this.mainMenuPanel.isVisible = false;
        this.advancedTexture.addControl(this.mainMenuPanel);

        const menuContent = new GUI.StackPanel();
        menuContent.isVertical = true;
        menuContent.spacing = 10;
        this.mainMenuPanel.addControl(menuContent);

        const menuTitle = new GUI.TextBlock();
        menuTitle.text = "MAIN MENU";
        menuTitle.color = this.highlightColor;
        menuTitle.fontSize = 24;
        menuTitle.height = "40px";
        menuContent.addControl(menuTitle);

        this.addMenuButton(menuContent, "Game Stats", () => this.openSubPanel("gameStats"));
        this.addMenuButton(menuContent, "Player List", () => this.openSubPanel("playerList"));


        const closeBtn = GUI.Button.CreateSimpleButton("closeBtn", "Close");
        closeBtn.width = "100px";
        closeBtn.height = "30px";
        closeBtn.color = this.textColor;
        closeBtn.cornerRadius = 5;
        closeBtn.background = BABYLON.Color3.Red().toHexString();
        closeBtn.onPointerUpObservable.add(() => {
            this.toggleMainMenu();
        });
        menuContent.addControl(closeBtn);
    }

    private addMenuButton(parent: GUI.StackPanel, text: string, onClick: () => void): void {
        const button = GUI.Button.CreateSimpleButton(`menuBtn_${text}`, text);
        button.width = "180px";
        button.height = "40px";
        button.color = this.textColor;
        button.cornerRadius = 5;
        button.background = this.backgroundColor.toHexString();
        button.onPointerUpObservable.add(onClick);
        parent.addControl(button);
    }

    private openSubPanel(panelType: string): void {
        if (this.activeSubPanel) {
            this.advancedTexture.removeControl(this.activeSubPanel);
        }

        this.activeSubPanel = new GUI.Rectangle();
        this.activeSubPanel.width = "400px";
        this.activeSubPanel.height = "550px";
        this.activeSubPanel.cornerRadius = 10;
        this.activeSubPanel.color = this.highlightColor;
        this.activeSubPanel.thickness = 2;
        this.activeSubPanel.background = this.panelColor.toHexString();
        this.activeSubPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.activeSubPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.activeSubPanel.top = "120px";
        this.activeSubPanel.left = "220px";
        this.advancedTexture.addControl(this.activeSubPanel);

        const panelContent = new GUI.StackPanel();
        panelContent.isVertical = true;
        panelContent.spacing = 5;
        this.activeSubPanel.addControl(panelContent);

        const panelTitle = new GUI.TextBlock();
        panelTitle.fontSize = 18;
        panelTitle.height = "40px";
        panelTitle.color = this.highlightColor;
        panelContent.addControl(panelTitle);

        switch (panelType) {
            case "gameStats":
                panelTitle.text = "GAME STATS";
                this.createGameStatsContent(panelContent);
                break;
            case "playerList":
                panelTitle.text = "PLAYER LIST";
                this.createPlayerListContent(panelContent);
                break;
            case "settings":
                panelTitle.text = "SETTINGS";
                this.createSettingsContent(panelContent);
                break;
        }

        const closeBtn = GUI.Button.CreateSimpleButton("closeSubPanelBtn", "Close");
        closeBtn.width = "100px";
        closeBtn.height = "30px";
        closeBtn.color = this.textColor;
        closeBtn.cornerRadius = 5;
        closeBtn.background = BABYLON.Color3.Red().toHexString();
        closeBtn.onPointerUpObservable.add(() => {
            this.advancedTexture.removeControl(this.activeSubPanel!);
            this.activeSubPanel = null;
        });
        panelContent.addControl(closeBtn);
    }

    private createGameStatsContent(parent: GUI.StackPanel): void {
        const statsText = new GUI.TextBlock();
        statsText.text = `🎮 Host: ${this.shortAddress(this.scene.metadata.game.arena)}\n` +
        `⏱️ Turn: ${this.scene.metadata.game.current_turn}/${this.scene.metadata.game.number_max_turns}\n` +
        `👥 Players: ${this.scene.metadata.game.player_count}\n` +
        `🎯 Moves Left: ${this.scene.metadata.game.limit}\n` +
        `🌤️ Weather: ${this.scene.metadata.game.weather}\n` +
        `🏆 Game Status: ${this.scene.metadata.game.over ? "Finished" : "Active"}`;
        statsText.color = this.textColor;
        statsText.fontSize = 18;
        statsText.height = "210px";
        parent.addControl(statsText);
    }

        private createPlayerListContent(parent: GUI.StackPanel): void {
            const playerListText = new GUI.TextBlock();
            
            // Format each player's data
            const formattedPlayers = this.scene.metadata.players.map(player => {
                const shortAddress = `${this.shortAddress(player.address)}`;
                return `👤 ${player.name} (${shortAddress})\n` +
                    `   🎖️ Rank: ${player.rank}\n` +
                    `   ⭐ Score: ${player.player_score}\n` +
                    `   🎯 Tanks: ${player.real_tank_count + player.dummy_tank_count}\n` +
                    `   📦 Supply: ${player.supply}\n` +
                    `   ⏳ Turns Left: ${player.turns_remaining}\n`;
            }).join('\n');
        
            playerListText.text = `🎮 PLAYERS LIST:\n\n${formattedPlayers}`;
            playerListText.color = this.textColor;
            playerListText.fontSize = 16;
            playerListText.height = "420px";
            playerListText.lineSpacing = "5px";
            parent.addControl(playerListText);
        }

    private createSettingsContent(parent: GUI.StackPanel): void {
        // Add settings controls here
        const settingsText = new GUI.TextBlock();
        settingsText.text = "Settings placeholder. Add actual settings controls here.";
        settingsText.color = this.textColor;
        settingsText.fontSize = 18;
        settingsText.height = "100px";
        parent.addControl(settingsText);
    }

    private toggleMainMenu(): void {
        this.mainMenuPanel!.isVisible = !this.mainMenuPanel!.isVisible;
        if (!this.mainMenuPanel!.isVisible && this.activeSubPanel) {
            this.advancedTexture.removeControl(this.activeSubPanel);
            this.activeSubPanel = null;
        }
    }

    public updateTopPanel(): void {

        if (this.scene.metadata.me !== null) {
            const shortAddress =  this.shortAddress(this.scene.metadata.me.address)
            this.addressText!.text = `Addr: ${shortAddress}`;
            this.tankInfo!.text = `DTanks: ${this.scene.metadata.me.real_tank_count}`;
            this.dummyTankInfo!.text = `D DTanks: ${this.scene.metadata.me.dummy_tank_count}`;
            this.supplyInfo!.text = `Supply: ${this.scene.metadata.me.supply}`;
            this.turnsInfo!.text = `Turns: ${this.scene.metadata.me.turns_remaining}`;
            this.scoreInfo!.text = `Score: ${this.scene.metadata.me.player_score}`;
        }
       
 
    }

    public updateGUI(): void {
        this.updateTopPanel();
        // Update other dynamic elements if needed
    }

    public updateGameState(newState: Partial<GameState>): void {
        this.gameState = { ...this.gameState, ...newState };
        this.updateGUI();
    }

    private createBottomPanel(): void {
        // Create main bottom panel
        this.bottomPanel = new GUI.Rectangle();
        this.bottomPanel.width = "100%";
        this.bottomPanel.height = "150px";
        this.bottomPanel.thickness = 2;
        this.bottomPanel.paddingBottom = 5;
        this.bottomPanel.cornerRadius = 5;
        this.bottomPanel.color = "#333333";
        this.bottomPanel.background = "#1a1a1a";
        this.bottomPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.advancedTexture.addControl(this.bottomPanel);
    
        // Create grid for organizing buttons
        const grid = new GUI.Grid();
        grid.addColumnDefinition(0.3); // Left section for unit info
        grid.addColumnDefinition(0.4); // Middle section for main actions
        grid.addColumnDefinition(0.3); // Right section for combat actions
        this.bottomPanel.addControl(grid);
    
        // Left Section - Unit Info
        const unitInfoPanel = new GUI.StackPanel();
        this.createUnitInfoSection(unitInfoPanel);
        grid.addControl(unitInfoPanel, 0, 0);
    
        // Middle Section - Movement & Deployment Actions
        const mainActionsPanel = new GUI.StackPanel();
        mainActionsPanel.isVertical = false;
        this.createMainActions(mainActionsPanel);
        grid.addControl(mainActionsPanel, 0, 1);
    
        // Right Section - Combat Actions
        const combatActionsPanel = new GUI.StackPanel();
        combatActionsPanel.isVertical = false;
        this.createCombatActions(combatActionsPanel);
        grid.addControl(combatActionsPanel, 0, 2);
    }
    


private createUnitInfoSection(parent: GUI.StackPanel): void {
    // const unitInfo = new GUI.TextBlock();
    // unitInfo.text = "Selected Unit Info";
    // unitInfo.color = "white";
    // unitInfo.height = "40px";
    // parent.addControl(unitInfo);

    const quickActions = new GUI.StackPanel();
    quickActions.isVertical = false;
    quickActions.height = "80px";
    
    const quickActionButtons = [
        { name: 'Deploy', icon: '🎮', mode: this.MODES.DEPLOY }, // or '⚓' or '🚀'
        { name: 'Shrub', icon: '🌿', mode: this.MODES.SHRUB }, // or '🌳'
        { name: 'Tree', icon: '🌲', mode: this.MODES.TREE }  // or '🌴'
    ];

    // Store references to buttons to update their appearance
    this.modeButtons = {};

    quickActionButtons.forEach(action => {
        const btn = GUI.Button.CreateSimpleButton(action.name, `${action.icon} ${action.name}`);
        btn.width = "60px";
        btn.height = "80px";
        btn.color = "white";
        btn.background = "#454545";
        btn.cornerRadius = 5;
        btn.onPointerClickObservable.add(() => {
            this.setMode(action.mode);
        });
        this.modeButtons[action.mode] = btn;
        quickActions.addControl(btn);
    });
    parent.addControl(quickActions);
}

private createMainActions(parent: GUI.StackPanel): void {
    const mainButtons = [
        { name: "Move", icon: "⬆️", mode: this.MODES.MOVE },
        { name: "Aim", icon: "🎯", mode: this.MODES.AIM }
    ];

    mainButtons.forEach(button => {
        const btn = GUI.Button.CreateSimpleButton(button.name, `${button.icon}\n${button.name}`);
        btn.width = "100px";
        btn.height = "80px";
        btn.color = "white";
        btn.background = "#2d2d2d";
        btn.cornerRadius = 5;
        btn.onPointerClickObservable.add(() => {
            this.setMode(button.mode);
        });
        this.modeButtons[button.mode] = btn;
        parent.addControl(btn);
    });
}

private createCombatActions(parent: GUI.StackPanel): void {
    const combatButtons = [
        { name: "Fire", icon: "💥", mode: this.MODES.FIRE },
        { name: "Reveal", icon: "👁️", mode: this.MODES.REVEAL }
    ];

    combatButtons.forEach(button => {
        const btn = GUI.Button.CreateSimpleButton(button.name, `${button.icon}\n${button.name}`);
        btn.width = "80px";
        btn.height = "80px";
        btn.color = "white";
        btn.background = "#2d2d2d";
        btn.cornerRadius = 5;
        btn.onPointerClickObservable.add(() => {
            this.setMode(button.mode);
        });
        this.modeButtons[button.mode] = btn;
        parent.addControl(btn);
    });
}

// Mode handling methods
private setMode(newMode: string | null): void {
    // If clicking the active mode, reset it
    if (this.currentMode === newMode) {
        this.resetMode();
        return;
    }

    // Reset previous mode's button style
    if (this.currentMode && this.modeButtons[this.currentMode]) {
        this.modeButtons[this.currentMode].background = "#2d2d2d";
    }

    // Set new mode
    this.currentMode = newMode;

    // Update new mode's button style
    if (newMode && this.modeButtons[newMode]) {
        this.modeButtons[newMode].background = "#556B2F"; // Active color
    }

    // Emit event or call callback for mode change
    this.onModeChange(newMode);
}

private resetMode(): void {
    if (this.currentMode && this.modeButtons[this.currentMode]) {
        this.modeButtons[this.currentMode].background = "#2d2d2d";
    }
    this.currentMode = null;
    this.onModeChange(null);
}

private onModeChange(mode: string | null): void {
    if (mode === this.MODES.DEPLOY) {
        this.showDeployDialog();
    }
}

// Method to check current mode
public getCurrentMode(): string | null {
    return this.currentMode;
}


private showDeployDialog(): void {
    // Create dialog container with futuristic border
    const dialog = new GUI.Rectangle("deployDialog");
    dialog.width = "320px";
    dialog.height = "250px";
    dialog.thickness = 4;
    dialog.color = "#556B2F"; // Cyan border
    dialog.cornerRadius = 5;
    dialog.background = "rgba(0, 20, 40, 0.95)"; // Dark blue, slightly transparent
    this.advancedTexture.addControl(dialog);

    // Add diagonal lines for futuristic effect
    const decorLine1 = new GUI.Rectangle("decorLine1");
    decorLine1.width = "20px";
    decorLine1.height = "3px";
    decorLine1.rotation = 0.45; // Diagonal angle
    decorLine1.color = "#556B2F";
    decorLine1.left = "-140px";
    decorLine1.top = "-115px";
    dialog.addControl(decorLine1);

    const decorLine2 = new GUI.Rectangle("decorLine2");
    decorLine2.width = "20px";
    decorLine2.height = "3px";
    decorLine2.rotation = 0.45;
    decorLine2.color = "#556B2F";
    decorLine2.left = "140px";
    decorLine2.top = "115px";
    dialog.addControl(decorLine2);

    // Create layout container
    const layout = new GUI.StackPanel();
    layout.spacing = 10;
    dialog.addControl(layout);

    // Title with tech style
    const titleText = new GUI.TextBlock();
    titleText.text = "DEPLOY DTANK";
    titleText.height = "40px";
    titleText.color = "#556B2F";
    titleText.fontSize = 20;
    titleText.fontStyle = "bold";
    layout.addControl(titleText);

    // Checkbox for dummy tank with military green when selected
    const checkboxContainer = new GUI.StackPanel();
    checkboxContainer.isVertical = false;
    checkboxContainer.height = "40px";
    
    const checkbox = new GUI.Checkbox();
    checkbox.width = "20px";
    checkbox.height = "20px";
    checkbox.color = "#556B2F";
    checkbox.background = "#1a1a1a";
    checkbox.isChecked = false;
    // Change color when checked
    checkbox.onIsCheckedChangedObservable.add((value) => {
        if (value) {
            checkbox.background = "#4B5320"; // Army green
            checkbox.color = "#98FB98"; // Light green
        } else {
            checkbox.background = "#1a1a1a";
            checkbox.color = "#0ff";
        }
    });
    checkboxContainer.addControl(checkbox);

    const checkboxLabel = new GUI.TextBlock();
    checkboxLabel.text = "DUMMY TANK";
    checkboxLabel.width = "120px"
    checkboxLabel.color = "#556B2F";
    checkboxLabel.paddingLeft = "10px";
    checkboxLabel.fontSize = 16;
    checkboxContainer.addControl(checkboxLabel);
    
    layout.addControl(checkboxContainer);

    // Input for code name with tech styling
    const inputContainer = new GUI.StackPanel();
    inputContainer.height = "70px";

    const inputLabel = new GUI.TextBlock();
    inputLabel.text = "CODE NAME:";
    inputLabel.color = "#556B2F";
    inputLabel.height = "30px";
    inputLabel.fontSize = 16;
    inputLabel.paddingBottom = 10;
    inputContainer.addControl(inputLabel);

    const input = new GUI.InputText();
    input.width = "250px";
    input.height = "35px";
    input.color = "#fff";
    input.background = "rgba(0, 255, 255, 0.1)";
    input.placeholderText = "Enter code name...";
    input.placeholderColor = "rgba(0, 255, 255, 0.5)";
    input.focusedBackground = "rgba(0, 255, 255, 0.2)";
    input.fontSize = 16;
    inputContainer.addControl(input);

    layout.addControl(inputContainer);

    // Buttons container
    const buttonContainer = new GUI.StackPanel();
    buttonContainer.isVertical = false;
    buttonContainer.height = "45px";
    buttonContainer.spacing = 10;

    // Confirm button with hover effect
    const confirmBtn = GUI.Button.CreateSimpleButton("confirm", "CONFIRM");
    confirmBtn.width = "120px";
    confirmBtn.height = "35px";
    confirmBtn.color = "#fff";
    confirmBtn.background = "#4B5320";
    confirmBtn.cornerRadius = 5;
    confirmBtn.fontSize = 16;
    confirmBtn.pointerEnterAnimation = () => {
        confirmBtn.background = "#556B2F";
    };
    confirmBtn.pointerOutAnimation = () => {
        confirmBtn.background = "#4B5320";
    };
    confirmBtn.onPointerClickObservable.add(() => {
        this.deployParams = {
            isDummy: checkbox.isChecked,
            codeName: input.text
        };
        this.advancedTexture.removeControl(dialog);
        this.showToast("Select Grid to deploy Dtank");
    });
    buttonContainer.addControl(confirmBtn);

    // Cancel button with hover effect
    const cancelBtn = GUI.Button.CreateSimpleButton("cancel", "CANCEL");
    cancelBtn.width = "120px";
    cancelBtn.height = "35px";
    cancelBtn.color = "#fff";
    cancelBtn.background = "#555555";
    cancelBtn.cornerRadius = 5;
    cancelBtn.fontSize = 16;
    cancelBtn.pointerEnterAnimation = () => {
        cancelBtn.background = "#777777";
    };
    cancelBtn.pointerOutAnimation = () => {
        cancelBtn.background = "#555555";
    };
    cancelBtn.onPointerClickObservable.add(() => {
        this.resetMode();
        this.advancedTexture.removeControl(dialog);
    });
    buttonContainer.addControl(cancelBtn);

    layout.addControl(buttonContainer);

    // Add subtle glow animation to border
    let alpha = 0;
    const glowAnimation = () => {
        alpha += 0.05;
        dialog.thickness = 3 + Math.sin(alpha) * 1;
        requestAnimationFrame(glowAnimation);
    };
    glowAnimation();
}


public tankInfoDeployDialog(): void {
    // Create dialog container with futuristic border
    const dialog = new GUI.Rectangle("tankInfoDialog");
    dialog.width = "320px";
    dialog.height = "250px";
    dialog.thickness = 4;
    dialog.color = "#556B2F"; // Cyan border
    dialog.cornerRadius = 5;
    dialog.background = "rgba(0, 20, 40, 0.95)"; // Dark blue, slightly transparent
    this.advancedTexture.addControl(dialog);

    // Add diagonal lines for futuristic effect
    const decorLine1 = new GUI.Rectangle("decorLine1");
    decorLine1.width = "20px";
    decorLine1.height = "3px";
    decorLine1.rotation = 0.45; // Diagonal angle
    decorLine1.color = "#556B2F";
    decorLine1.left = "-140px";
    decorLine1.top = "-115px";
    dialog.addControl(decorLine1);

    const decorLine2 = new GUI.Rectangle("decorLine2");
    decorLine2.width = "20px";
    decorLine2.height = "3px";
    decorLine2.rotation = 0.45;
    decorLine2.color = "#556B2F";
    decorLine2.left = "140px";
    decorLine2.top = "115px";
    dialog.addControl(decorLine2);

    // Create layout container
    const layout = new GUI.StackPanel();
    layout.spacing = 10;
    dialog.addControl(layout);

    // Title with tech style
    const titleText = new GUI.TextBlock();
    titleText.text = "DDTANK";
    titleText.height = "40px";
    titleText.color = "#556B2F";
    titleText.fontSize = 20;
    titleText.fontStyle = "bold";
    layout.addControl(titleText);

    // Checkbox for dummy tank with military green when selected
    const checkboxContainer = new GUI.StackPanel();
    checkboxContainer.isVertical = false;
    checkboxContainer.height = "40px";
    
    const checkbox = new GUI.Checkbox();
    checkbox.width = "20px";
    checkbox.height = "20px";
    checkbox.color = "#556B2F";
    checkbox.background = "#1a1a1a";
    checkbox.isChecked = false;
    // Change color when checked
    checkbox.onIsCheckedChangedObservable.add((value) => {
        if (value) {
            checkbox.background = "#4B5320"; // Army green
            checkbox.color = "#98FB98"; // Light green
        } else {
            checkbox.background = "#1a1a1a";
            checkbox.color = "#0ff";
        }
    });
    checkboxContainer.addControl(checkbox);

    const checkboxLabel = new GUI.TextBlock();
    checkboxLabel.text = "Is DUMMY";
    checkboxLabel.width = "120px"
    checkboxLabel.color = "#556B2F";
    checkboxLabel.paddingLeft = "10px";
    checkboxLabel.fontSize = 16;
    checkboxContainer.addControl(checkboxLabel);
    
    layout.addControl(checkboxContainer);

    // Input for code name with tech styling
    const inputContainer = new GUI.StackPanel();
    inputContainer.height = "70px";

    const inputLabel = new GUI.TextBlock();
    inputLabel.text = "CODE NAME:";
    inputLabel.color = "#556B2F";
    inputLabel.height = "30px";
    inputLabel.fontSize = 16;
    inputLabel.paddingBottom = 10;
    inputContainer.addControl(inputLabel);

    const input = new GUI.InputText();
    input.width = "250px";
    input.height = "35px";
    input.color = "#fff";
    input.background = "rgba(0, 255, 255, 0.1)";
    input.placeholderText = "Enter code name...";
    input.placeholderColor = "rgba(0, 255, 255, 0.5)";
    input.focusedBackground = "rgba(0, 255, 255, 0.2)";
    input.fontSize = 16;
    inputContainer.addControl(input);

    layout.addControl(inputContainer);

    // Buttons container
    const buttonContainer = new GUI.StackPanel();
    buttonContainer.isVertical = false;
    buttonContainer.height = "45px";
    buttonContainer.spacing = 10;

    // Confirm button with hover effect
    const confirmBtn = GUI.Button.CreateSimpleButton("confirm", "CONFIRM");
    confirmBtn.width = "120px";
    confirmBtn.height = "35px";
    confirmBtn.color = "#fff";
    confirmBtn.background = "#4B5320";
    confirmBtn.cornerRadius = 5;
    confirmBtn.fontSize = 16;
    confirmBtn.pointerEnterAnimation = () => {
        confirmBtn.background = "#556B2F";
    };
    confirmBtn.pointerOutAnimation = () => {
        confirmBtn.background = "#4B5320";
    };
    confirmBtn.onPointerClickObservable.add(() => {
        this.tankParams = {
            isDummy: checkbox.isChecked,
            codeName: input.text
        };
        this.advancedTexture.removeControl(dialog);
        this.showToast("Select Grid to deploy Dtank");
    });
    buttonContainer.addControl(confirmBtn);

    // Cancel button with hover effect
    const cancelBtn = GUI.Button.CreateSimpleButton("cancel", "CANCEL");
    cancelBtn.width = "120px";
    cancelBtn.height = "35px";
    cancelBtn.color = "#fff";
    cancelBtn.background = "#555555";
    cancelBtn.cornerRadius = 5;
    cancelBtn.fontSize = 16;
    cancelBtn.pointerEnterAnimation = () => {
        cancelBtn.background = "#777777";
    };
    cancelBtn.pointerOutAnimation = () => {
        cancelBtn.background = "#555555";
    };
    cancelBtn.onPointerClickObservable.add(() => {
        this.resetMode();
        this.advancedTexture.removeControl(dialog);
    });
    buttonContainer.addControl(cancelBtn);

    layout.addControl(buttonContainer);

    // Add subtle glow animation to border
    let alpha = 0;
    const glowAnimation = () => {
        alpha += 0.05;
        dialog.thickness = 3 + Math.sin(alpha) * 1;
        requestAnimationFrame(glowAnimation);
    };
    glowAnimation();
}

// Add to your class properties
public deployParams: {
    isDummy: boolean;
    codeName: string;
} | null = null;


// Add to your class properties
public tankParams: {
    isDummy: boolean;
    codeName: string;
} | null = null;

// Then in your deploy action handler
public handleDeploy(row: number, col: number): void {
    if (this.deployParams) {
        // const salt = this.generateSaltFromCodeName(this.deployParams.codeName);
        // // Call your deploy function
        // this.deploy(
        //     this.gameId,
        //     row,
        //     col,
        //     this.deployParams.isDummy,
        //     salt
        // );
        // Reset deploy params

        this.deployParams = null;
        this.resetMode()
    }
}

public showToast(message: string, toastType: ToastType = ToastType.Info): void {
    // Create a background panel for the toast
    const toastPanel = new GUI.Rectangle();
    toastPanel.width = "800px";
    toastPanel.height = "80px";
    toastPanel.cornerRadius = 10;
    toastPanel.color = "white";  // Border color
    toastPanel.thickness = 0;    // Border thickness
    toastPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    toastPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    toastPanel.paddingBottom = "20px"; // Position the toast slightly above the bottom

    // Determine background and text colors based on the message type
    let backgroundColor = "rgba(0, 80, 40, 0.9)";  // Default: success (greenish)
    let textColor = "cyan";  // Default text color for success/info

    switch (toastType) {
        case ToastType.Error:
            backgroundColor = "rgba(139, 0, 0, 0.9)";  // Red background for errors
            textColor = "white";
            break;
        case ToastType.Warning:
            backgroundColor = "rgba(255, 165, 0, 0.9)";  // Orange background for warnings
            textColor = "black";
            break;
        case ToastType.Success:
            backgroundColor = "rgba(0, 128, 0, 0.9)";  // Green background for success
            textColor = "cyan";
            break;
        case ToastType.Info:
        default:
            backgroundColor = "rgba(0, 80, 40, 0.9)";  // Default to greenish
            textColor = "cyan";
            break;
    }

    // Set the background color of the toast
    toastPanel.background = backgroundColor;

    // Create the text block to show the message
    const toastText = new GUI.TextBlock();
    toastText.text = message;
    toastText.color = textColor;
    toastText.fontSize = 15;
    toastText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    toastText.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;

    // Add the text block to the panel
    toastPanel.addControl(toastText);

    // Add the panel to the GUI
    this.advancedTexture.addControl(toastPanel);

    // Add animation: fade in, stay visible, and then fade out
    this.animateToast(toastPanel);
}


private animateToast(panel: GUI.Rectangle): void {
    // Fade in animation
    panel.alpha = 0; // Start fully transparent
    let fadeIn = new BABYLON.Animation(
        "fadeIn", "alpha", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    let fadeInKeys = [
        { frame: 0, value: 0 },  // Initial transparency
        { frame: 20, value: 1 }  // Fully visible
    ];
    fadeIn.setKeys(fadeInKeys);

    // Fade out animation (after 3 seconds)
    let fadeOut = new BABYLON.Animation(
        "fadeOut", "alpha", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    let fadeOutKeys = [
        { frame: 0, value: 1 },  // Start fully visible
        { frame: 30, value: 0 }  // Fully transparent
    ];
    fadeOut.setKeys(fadeOutKeys);

    // Run fade in, wait for 3 seconds, then fade out
    this.advancedTexture.getScene().beginDirectAnimation(panel, [fadeIn], 0, 20, false, 1, () => {
        setTimeout(() => {
            this.advancedTexture.getScene().beginDirectAnimation(panel, [fadeOut], 0, 30, false, 1, () => {
                // Remove the toast after fading out
                panel.dispose();
            });
        }, 3000); // Toast stays visible for 3 seconds
    });
}



}