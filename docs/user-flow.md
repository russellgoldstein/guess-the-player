# User Flow Documentation

## User Onboarding
- **Methods:**
  - Email/Password: Users can sign up and log in using their email and a password.
  - Social Login: Users can sign up and log in using their social network accounts.

## Core User Journey
1. **Sign Up/Login:**
   - User signs up or logs in using email/password or social login.

2. **Create a New Game:**
   - User navigates to the "Create Game" page.
   - User searches for a player using an autocomplete search box.
   - User selects a player, and the player's career stats are displayed.

3. **Configure Game:**
   - User hides/shows specific columns or information (e.g., draft info, date of birth, hometown).
   - User finalizes the configuration of the custom game.

4. **Generate and Share Link:**
   - User clicks "Generate Link" to create a shareable link.
   - User sends the link to others.

5. **Guessing Player:**
   - Recipient clicks the link and is taken to a page with the configured player's information.
   - Recipient guesses the player using an autocomplete textbox.
   - System checks if the guess is correct or incorrect and provides feedback.

## Page Interactions
- **Sign Up/Login Page:**
  - Forms: Email/password input fields for sign-up and login.
  - Buttons: "Sign Up" and "Log In" buttons.
  - Social Login Options: Buttons for logging in with social networks.

- **Create Game Page:**
  - Search Box: Autocomplete search for selecting a player.
  - Display Area: Show selected player's career stats.
  - Toggle Controls: Options to hide/show specific columns or information (e.g., checkboxes or toggle switches).
  - Button: "Generate Link" to create a shareable link.

- **Game Link Page (Guessing Player):**
  - Display Area: Show configured player's information without the name.
  - Autocomplete Textbox: Input for guessing the player's name.
  - Button: "Submit Guess" to confirm the guess.
  - Feedback: Display whether the guess is correct or incorrect.

## Error Handling
- **User-Facing Errors:**
  - Invalid Input: Display user-friendly error messages for invalid inputs (e.g., "Please enter a valid email address").
  - Failed API Calls: Show a generic error message (e.g., "Something went wrong. Please try again later.") and provide a retry option if applicable.
  - Network Issues: Inform users of connectivity problems (e.g., "Network error. Please check your internet connection.").

- **Logging:**
  - Detailed Error Messages: Log detailed error messages on the server-side for debugging purposes.
  - Error Tracking: Use monitoring tools like Sentry to track and analyze errors in real-time. 