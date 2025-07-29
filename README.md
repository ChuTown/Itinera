# Itinera - [Devpost & Demo] -> (https://devpost.com/amaanomo?ref_content=user-portfolio&ref_feature=portfolio&ref_medium=global-nav)

Itinera is a full-stack web application that helps travelers plan optimized multi-city routes and discover personalized places to visit. Users can select cities, input their travel preferences, and visualize routes and recommendations on an interactive map.

---

## Features

- Multi-city route planning with Google Maps Directions API
- Dynamic route optimization based on user-defined cities
- City-specific exploration panel with AI-powered suggestions
- Ability to toggle between route planning and place exploration
- Popular spots shown for each city
- Per-city optimized routes for selected places
- Interactive map rendering using Google Maps

---

## Tech Stack

- Framework: Next.js (App Router)
- Frontend: React, Tailwind CSS
- Backend: Node.js API routes via Next.js
- APIs: Google Maps (Directions, Places, Geocoding), OpenAI GPT-3.5
- Libraries: @react-google-maps/api, OpenAI SDK

---

## Setup Instructions

1. **Clone the Repository**
git clone https://github.com/your-username/itinera.git
cd itinera


2. **Install Dependencies**
npm install


3. **Add Environment Variables**

Create a `.env.local` file in the root directory with the following:

NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
OPENAI_API_KEY=your_openai_api_key


4. **Run the Development Server**
npm run dev


Navigate to `http://localhost:3000` to view the app.

---

## How It Works

- Users input a start and end city, and can add intermediate cities.
- The app calculates an optimized travel route using the Google Maps API.
- Users can explore each city by entering interest tags (e.g., food, history, anime), which are sent to the OpenAI API for custom suggestions.
- Suggested and popular places can be added to the route and visualized with markers on the map.
- A separate route can be optimized for each city based on the selected in-city locations.
