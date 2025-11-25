# TrailWise

A comprehensive camping and outdoor trip planning application with weather integration and intelligent packing checklist generation.

## Features

- **User Authentication**: JWT-based authentication with secure password hashing
- **Trip Management**: Create, view, and delete camping trips with location, dates, and activity details
- **Weather Integration**: Real-time weather forecasts using OpenWeather API
- **Intelligent Checklists**: Rule-based packing checklist generation based on weather, activities, and trip details

## Checklist Generation Logic

The checklist generation system uses rule-based logic to create personalized packing lists for your trips. The system analyzes multiple factors to recommend appropriate items:

### Weather-Based Items

The system classifies weather conditions from forecast data and adds relevant items:

- **Rain**: Rain jacket, rain pants (optional for beginners), waterproof bag cover
- **Cold** (avg < 10°C or min < 5°C): Warm jacket, thermal underwear, warm hat, gloves
- **Hot** (avg > 25°C or max > 30°C): Sun hat, sunscreen, lightweight clothing
- **Windy**: Windbreaker

### Activity-Specific Items

Items are added based on the activities you've selected for your trip:

- **Hiking/Camping**: Hiking boots, tent (for camping), sleeping bag, sleeping pad
- **Fishing**: Fishing rod (max 2), fishing tackle
- **Swimming**: Swimsuit, towel

### Experience Level Adjustments

The system adjusts recommendations based on your experience level:

- **Beginner**: Emergency whistle, headlamp (always recommended)
- **Advanced/Expert**: Multi-tool (recommended for experienced campers)
- **All Levels**: Map and compass (recommended for beginners and intermediates)

### Duration-Based Items

For longer trips, additional items are recommended:

- **Trips > 3 days**: Extra batteries, portable charger

### Group Size Considerations

Large groups get additional equipment:

- **Groups > 4 people**: Group cooking equipment

### Base Essentials

Every checklist includes these essential items:

- Backpack (1 per trip)
- Water bottle (1 per person)
- First aid kit (1 per trip)
- Food supplies (calculated based on duration and group size)

### Item Properties

Each checklist item includes:

- **name**: Item name (e.g., "Rain jacket", "Hiking boots")
- **qty**: Quantity needed (calculated based on group size, duration, or activity requirements)
- **reason**: Explanation of why this item is included
- **recommended**: Boolean flag indicating if this is a recommended item (vs. optional)

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and get JWT token

### Trips
- `POST /trips` - Create a new trip (requires JWT)
- `GET /trips` - List all trips for current user (requires JWT)
- `GET /trips/:id` - Get trip details (requires JWT)
- `DELETE /trips/:id` - Delete a trip (requires JWT)

### Weather
- `GET /weather?lat={lat}&lon={lon}&from={from}&to={to}` - Get weather forecast (requires JWT)

### Checklist
- `GET /checklist/:tripId` - Generate packing checklist for a trip (requires JWT)

## Technology Stack

- **Backend**: Node.js, Express, TypeScript, MongoDB (Mongoose)
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Authentication**: JWT (HS256)
- **Weather API**: OpenWeather 2.5 Forecast API

## Development

See `docs/RUNBOOK.md` for detailed setup and deployment instructions.

## License

[Add your license here]

