use starknet::ContractAddress;

#[derive(Copy, Drop, Serde, Introspect)]
#[dojo::model]
struct Scoreboard {
    #[key]
    game_id: u32,
    #[key]
    player_id: u32,
    score: u32,
}

#[generate_trait]
impl ScoreboardImpl of ScoreboardTrait {

    #[inline(always)]
    fn new(game_id: u32, player_id: u32) -> Scoreboard {
        Scoreboard {
            game_id,
            player_id,
            score: 0,
        }
    }

    #[inline(always)]
    fn add_points(ref self: Scoreboard, points: u32) {
        self.score += points;
    }

    #[inline(always)]
    fn get_score(self: Scoreboard) -> u32 {
        self.score
    }

    #[inline(always)]
    fn check_for_winner(self: Scoreboard) -> bool {
        self.score >= 1500
    }

    #[inline(always)]
    fn reset_score(ref self: Scoreboard) {
        self.score = 0;
    }
}