# API Documentation

## User Authentication
- `POST /api/auth/signup`: Register a new user
- `POST /api/auth/login`: Authenticate a user and return a token
- `POST /api/auth/logout`: Log out a user

## User Management
- `GET /api/users/:id`: Retrieve user profile information
- `PUT /api/users/:id`: Update user profile information

## Game Management
- `POST /api/games`: Create a new game
- `GET /api/games/:id`: Retrieve details of a specific game
- `GET /api/games`: List all games created by a user
- `PUT /api/games/:id`: Update game details
- `DELETE /api/games/:id`: Delete a game

## Game Player Configuration
- `POST /api/games/:gameId/config`: Create or update player configuration for a game
- `GET /api/games/:gameId/config`: Retrieve player configuration for a game

## User Guesses
- `POST /api/games/:gameId/guesses`: Submit a guess for a game
- `GET /api/games/:gameId/guesses`: Retrieve all guesses for a game

## Player Data
- `GET /api/players/search`: Search for players (using MLB API)
- `GET /api/players/:id`: Retrieve detailed stats for a specific player (using MLB API) 