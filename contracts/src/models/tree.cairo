use contracts::models::position::{GridPosition};

#[derive(Copy, Drop, Serde, Introspect,PartialEq)]
struct Tree {
    // Tree specific properties
    position: GridPosition,
    capacity: u32,  // Could represent max number of trees or size
    cell_size: CellSize
}


#[derive(Copy, Drop, Serde, Introspect,PartialEq)]
struct CellSize {
    width: u32,
    height: u32
}