-- Add game_options column to game_player_config table
ALTER TABLE game_player_config
ADD COLUMN game_options JSONB DEFAULT jsonb_build_object('maxGuesses', 3);

-- Update existing rows to have default game_options
UPDATE game_player_config
SET game_options = jsonb_build_object('maxGuesses', 3)
WHERE game_options IS NULL; 