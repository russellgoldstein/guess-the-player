# Database Schema Documentation

## Users Table
- **Attributes:**
  - `id`: Primary Key
  - `username`: Unique identifier for the user
  - `email`: Unique email address
  - `password_hash`: Hashed and salted password
  - `created_at`: Timestamp of account creation
  - `updated_at`: Timestamp of last update

## Games Table
- **Attributes:**
  - `id`: Primary Key
  - `creator_id`: Foreign Key referencing `Users.id`
  - `title`: Title or description of the game
  - `created_at`: Timestamp of game creation
  - `updated_at`: Timestamp of last update

## GamePlayerConfig Table
- **Attributes:**
  - `id`: Primary Key
  - `game_id`: Foreign Key referencing `Games.id`
  - `player_id`: Identifier for the player being guessed
  - `hidden_stats`: JSON or array of stats to hide
  - `shown_stats`: JSON or array of stats to show
  - `created_at`: Timestamp of configuration creation

## UserGuesses Table
- **Attributes:**
  - `id`: Primary Key
  - `game_id`: Foreign Key referencing `Games.id`
  - `user_id`: Foreign Key referencing `Users.id`
  - `guess`: The player's guess
  - `is_correct`: Boolean indicating if the guess was correct
  - `attempted_at`: Timestamp of the guess 