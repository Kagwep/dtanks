use starknet::ContractAddress;
use contracts::models::positions::{GridPosition};

#[derive(Copy, Drop, Serde, Introspect)]
#[dojo::model]
struct Obstacle {
    #[key]
    game_id: u32,
    obstacle_id: u32,
    health: u32,
    position: GridPosition,
    destructible: bool,
}

#[generate_trait]
impl ObstacleImpl of ObstacleTrait {

    #[inline(always)]
    fn new(game_id: u32, obstacle_id: u32, row: u32, col: u32, destructible: bool, health: u32) -> Obstacle {
        Obstacle {
            game_id,
            obstacle_id,
            health,
            position: GridPosition {row, col},
            destructible,
        }
    }

    #[inline(always)]
    fn take_damage(ref self: Obstacle, damage: u32) {
        if self.destructible {
            if damage >= self.health {
                self.health = 0; // Obstacle is destroyed
            } else {
                self.health -= damage;
            }
        }
    }

    #[inline(always)]
    fn is_destroyed(self: Obstacle) -> bool {
        self.destructible && self.health == 0
    }

    #[inline(always)]
    fn get_position(self: Obstacle) -> (u32, u32) {
        (self.position.row, self.position.col)
    }

    #[inline(always)]
    fn is_destructible(self: Obstacle) -> bool {
        self.destructible
    }
}