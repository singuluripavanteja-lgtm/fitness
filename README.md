# fitnesSHARE 🏋️

fitnesSHARE is an AI-powered fitness social platform designed to gamify your fitness journey. Build streaks, partner up for Duo challenges, and use Grok AI to optimize your training and nutrition.

## 🚀 Features

-   **🤖 Grok AI Workout Planner**: Personalized routines that adapt to your progress and plateau detection.
-   **📸 Food Vision**: Snap a photo of your meal for instant calorie and macro estimation via AI.
-   **🔥 Gamified Streaks**: Keep your daily workout streak alive. Use "Streak Freezes" to save your progress on rest days.
-   **👥 Duo Streaks**: Partner with a friend—both must log a workout to keep the shared streak alive.
-   **📸 Social Feed**: Share your progress, meals, and PRs with data-driven stickers.
-   **🏆 Global Leaderboard**: Compete with the community for the highest streak.
-   **🤖 FitAI Coach**: A real-time chat assistant for fitness and nutrition advice.

## 🛠️ Technology Stack

-   **Backend**: Node.js, Express, MongoDB (Mongoose)
-   **Frontend**: Vanilla HTML5, CSS3 (Rich Custom Design), JavaScript (ES6+)
-   **AI**: Grok API (x.ai) for Chat and Vision
-   **Real-time**: Socket.IO (Notification ready)
-   **Storage**: Multer for image uploads

## 🏁 Getting Started

1.  **Clone the repository**
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Configure environment variables**:
    Create a `.env` file in the root directory:
    ```env
    PORT=5000
    MONGO_URI=your_mongodb_uri
    JWT_SECRET=your_jwt_secret
    GROK_API_KEY=your_grok_api_key
    ```
4.  **Run the project**:
    -   Development: `npm run dev`
    -   Production: `npm start`
5.  **Visit**: `http://localhost:5000`

## 📁 Project Structure

```text
├── backend/
│   ├── config/      # Database configuration
│   ├── middleware/  # Auth & Upload logic
│   ├── models/      # Mongoose schemas
│   ├── routes/      # API endpoints (Auth, AI, Social, etc.)
│   ├── utils/       # Streak engine & AI integration
│   └── server.js    # Entry point
├── frontend/
│   ├── css/         # Global styles
│   ├── js/          # API & Utility scripts
│   └── *.html       # Application pages
└── .env             # Configuration
```

## 💪 Let's get fit!
fitnesSHARE is built to make fitness social, fun, and data-driven.
