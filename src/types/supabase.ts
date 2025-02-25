export type Database = {
    public: {
        Tables: {
            games: {
                Row: {
                    id: string;
                    title: string;
                    created_at: string;
                    creator_id: string | null;
                    game_player_config: {
                        id: string;
                        game_id: string;
                        player_id: number;
                        stats_config: any;
                        game_options: any;
                    }[];
                };
                Insert: {
                    id?: string;
                    title: string;
                    created_at?: string;
                    creator_id?: string | null;
                };
                Update: {
                    id?: string;
                    title?: string;
                    created_at?: string;
                    creator_id?: string | null;
                };
            };
            game_player_config: {
                Row: {
                    id: string;
                    game_id: string;
                    player_id: number;
                    stats_config: any;
                    game_options: any;
                };
                Insert: {
                    id?: string;
                    game_id: string;
                    player_id: number;
                    stats_config: any;
                    game_options: any;
                };
                Update: {
                    id?: string;
                    game_id?: string;
                    player_id?: number;
                    stats_config?: any;
                    game_options?: any;
                };
            };
        };
    };
}; 