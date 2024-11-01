
use starknet::ContractAddress;

#[derive(Copy, Drop, Serde, Introspect)]
pub struct Position {
    coord: Vec2,
}

#[derive(Copy, Drop, Serde, Introspect,PartialEq)]
struct Vec2 {
    x: u32,
    y: u32,

}


#[derive(Copy, Drop, Serde, Introspect,PartialEq)]
struct GridPosition {
    row: u32,
    col: u32
}
