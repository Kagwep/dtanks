
use contracts::models::tree::{Tree};
use contracts::models::plants::{PlantsPatch};

const SIZE_OFFSET = 100;

#[derive(Copy,Drop,Serde)]
#[dojo::model]
struct Tile {
    #[key]
    game_id: u32,
    #[key]
    row: u32,
    #[key]
    col: u32,
    plants: PlantsPatch,
    tree: Tree,
    size: u32,
    occupied: bool,
}





#[generate_trait]
impl TileImpl of TileTrait {

    #[inline(always)]
    fn new(game_id: u32, row: u32,col: u32,  capacity: u32) -> Tile {
        Tile { 
            game_id,
            row,
            col,
            plants: PlantsPatch {
                position: GridPosition {
                    row, col
                },
                plant_density: 0,
                nb_stacks: 3,
            },
            tree: Tree{
                position: GridPosition {
                    row,col
                },
                capacity: capacity,  
                cell_size: CellSize {
                    width: 512,
                    height: 1024
                }
            },
            size:150, // 1.5 Offset
            accupied: false,
    }
    }

    #[inline(always)]
    fn can_deploy(self: Tile) -> bool {
        // Check if the tile's tree capacity is 0 and the tile is not occupied
        self.tree.capacity == 0 && !self.occupied
    }

    #[inline(always)]
    fn add_plant_to_grid(ref self:Tile, plant_density: u32){
        self.plants.plant_density = plant_density;
    }

    #[inline(always)]
    fn add_plant_tree_to_grid(ref self: Tile, capacity: u32){
     self.tree.capacity = capacity;
    }


    #[inline(always)]
    fn deploy(ref self: Tile){
        self.occupied = true;
    }

    #[inline(always)]
    fn move(ref self: Tile){
        self.occupied = false;
    }

    #[inline(always)]
    fn tile_has_plant_path(self: Tile)-> bool {
        self.plants.plant_density != 0
    }


      #[inline(always)]
      fn tile_has_tree(self: Tile) -> bool {
        self.tree.capacity ! = 0
      }
    
    
}