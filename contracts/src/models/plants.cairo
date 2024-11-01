use contracts::models::position::{GridPosition};


#[derive(Copy, Drop, Serde, Introspect,PartialEq)]
struct PlantsPatch {
    position: GridPosition,
    plant_density: u32,
    nb_stacks: u32,
}