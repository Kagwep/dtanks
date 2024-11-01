# DTanks - Deceptive Tank Warfare on Starknet

![DTanks Logo Placeholder]

DTanks is a strategic tank combat game built on Starknet where deception meets warfare. Command your fleet of real and dummy tanks in a battle of wits and strategy, where victory depends not just on firepower, but on your ability to deceive and outmaneuver your opponents.

## 🎮 Game Overview

### Core Concept
In DTanks, victory requires reaching 1,500 points while managing a sophisticated fleet of tanks:
- **Real Tanks**: 6 combat-capable units
- **Dummy Tanks**: 6 deceptive units for strategic misdirection

### 🏆 Win Condition
- First player to accumulate 1,500 points claims victory
- Points are earned through successful combat and strategic revelations

### 🗺️ Battlefield Elements
- Procedurally generated combat zone featuring:
  - Strategic plantations affecting visibility and movement
  - Tactical tree cover for ambush opportunities
  - Strategic gate positions for controlling movement flows
- Every match features a unique battlefield layout

## 🎯 Gameplay Mechanics

### Unit Operations

#### 1. Tank Deployment
```cairo
fn deploy(
    ref world: IWorldDispatcher,
    game_id: u32, 
    row: u32, 
    col: u32,
    is_dummy: bool, 
    salt: felt252
)
```
- Strategic placement of both real and dummy tanks
- Concealment system using cryptographic salts
- Position validation against battlefield constraints

#### 2. Movement System
```cairo
fn move(
    ref world: IWorldDispatcher,
    game_id: u32,
    unit_id: u32, 
    row: u32, 
    col: u32
)
```
- Grid-based movement with terrain consideration
- Path validation through plantations and obstacles
- Strategic positioning around gates and cover

#### 3. Combat Operations
```cairo
// Target acquisition
fn aim(
    ref world: IWorldDispatcher,
    game_id: u32,
    unit_id: u32,
    target_id: u32
)

// Execute attack
fn fire(
    ref world: IWorldDispatcher,
    game_id: u32,
    unit_id: u32,
    is_dummy: bool, 
    salt: felt252
)

// Strategic revelation
fn reveal(
    ref world: IWorldDispatcher,
    game_id: u32,
    unit_id: u32,
    is_dummy: bool, 
    salt: felt252
)
```

### 🏟️ Arena System

#### Game Creation
```cairo
fn create(
    ref world: IWorldDispatcher,
    player_name: felt252,
    price: u256,
    penalty: u64
) -> u32
```
- Set entry stakes and penalty conditions
- Configure match parameters
- Initialize battlefield generation

#### Battlefield Generation
```cairo
fn handle_tile_plant_add(
    ref world: IWorldDispatcher,
    game_id: u32,
    start_row: u32,
    start_col: u32,
    end_row: u32,
    end_col: u32, 
    plant_density: u32, 
    gate_position: felt252
)
```
- Procedural terrain generation
- Strategic placement of obstacles and cover
- Balanced plant density for fair gameplay

## 💡 Strategic Elements

### Deception Tactics
- Use dummy tanks to create false frontlines
- Strategic revelation timing for maximum impact
- Psychological warfare through bluffing

### Combat Mechanics
```cairo
fn get_damage(
    ref world: IWorldDispatcher,
    game_id: u32,
    source_row: u32,
    source_col: u32,
    target_row: u32,
    target_col: u32,
) -> u32
```
- Distance-based damage calculations
- Terrain impact on attack effectiveness
- Strategic positioning bonuses

## 🔧 Technical Architecture

### Smart Contract Structure
Built on Starknet using Dojo framework with two primary interfaces:

#### 1. IActions Interface
```cairo
trait IActions {
    fn deploy(...)
    fn move(...)
    fn aim(...)
    fn fire(...)
    fn reveal(...)
}
```

#### 2. IArena Interface
```cairo
trait IArena {
    fn create(...)
    fn join(...)
    fn transfer(...)
    fn leave(...)
    fn start(...)
    fn delete(...)
    fn kick(...)
}
```

### Security Features
- Cryptographic salt system for tank concealment
- Action validation framework
- Anti-exploitation mechanisms

## 🚀 Getting Started

### Prerequisites
- Starknet wallet
- Basic understanding of crypto gaming

### Installation
1. Connect your wallet
2. Join or create a game:
```cairo
fn join(
    ref world: IWorldDispatcher,
    game_id: u32, 
    player_name: felt252
)
```

### Quick Start Guide
1. Create or join a game
2. Deploy your tanks strategically
3. Use movement and combat actions
4. Manage your real and dummy tanks effectively

## 🤝 Contributing
We welcome contributions to DTanks! Check our [Contributing Guidelines](CONTRIBUTING.md) for details.

## 📜 License
[Add License Information]

## 🔗 Links
- [Game Documentation]
- [Discord Community]
- [Twitter]
- [Starknet Resources]

---

Built with ❤️ on Starknet using Dojo
