#[derive(Drop, Starknet)]
struct PlantsPatch {
    position: GridPosition,
    plant_density: u32,
    nb_stacks: u32,
}