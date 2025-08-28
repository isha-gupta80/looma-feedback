
# Looma Device Scanner

A Flask-based web application for scanning and tracking Looma educational devices using QR codes. This application allows technicians to scan devices, record their condition, and track their locations through an administrative dashboard.

## Features

### Core Functionality
- **QR Code Scanning**: Scan device QR codes to auto-populate device information
- **Device Registration**: Record device details including serial number, condition, and location
- **Location Tracking**: Capture GPS coordinates when scanning devices
- **Admin Dashboard**: Monitor device statistics and scan history
- **Interactive Map**: View device locations on a map with address lookup
- **Secure Authentication**: Protected admin area with login system

### Device Information Tracking
- Serial numbers and manufacturing details
- Device condition assessment
- Technician and school information
- Software version tracking
- Scan timestamps with accurate timezone handling

### Administrative Features
- Real-time statistics dashboard
- Device location mapping with Leaflet integration
- Individual device scan history
- MongoDB data storage
- Responsive design for mobile and desktop

## Technology Stack

- **Backend**: Flask (Python)
- **Database**: MongoDB
- **Frontend**: HTML5, CSS3, JavaScript
- **Maps**: Leaflet with OpenStreetMap tiles
- **Authentication**: Session-based with password hashing
- **Deployment**: Replit-ready configuration

## Quick Start

### Prerequisites
- Python 3.12+
- MongoDB database
- Environment variables configured

### Installation

1. **Clone or fork this repository**

2. **Set up environment variables**
   Create a `.env` file with the following:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   ADMIN_USERNAME=your_admin_username
   ADMIN_PASSWORD_HASH=your_hashed_password
   SECRET_KEY=your_secret_key
   ```

3. **Install dependencies**
   Dependencies are automatically managed through `pyproject.toml`

4. **Run the application**
   ```bash
   python app.py
   ```

5. **Access the application**
   - Main scanning interface: `http://localhost:5000`
   - Admin login: `http://localhost:5000/login`

## Usage

### Scanning Devices

1. **QR Code Method**: Scan QR codes containing device parameters:
   ```
   http://your-domain.com/?serial=K001&date=July%202025&location=SJ&lot=1
   ```

2. **Manual Entry**: Access the form directly and enter device information manually

3. **Complete Form**: Fill out:
   - School name
   - Technician name
   - Software version
   - Device condition
   - Allow location access for GPS tracking

### Administrative Access

1. **Login**: Use admin credentials at `/login`
2. **Dashboard**: View statistics and device listings
3. **Device Records**: Click on any device serial to view scan history
4. **Map View**: See device locations on an interactive map

## Project Structure

```
├── app.py                 # Main Flask application
├── static/
│   ├── script.js         # Frontend JavaScript
│   ├── style.css         # Application styles
│   └── Looma-2019.png    # Logo image
├── templates/
│   ├── index.html        # Main scanning form
│   ├── login.html        # Admin login page
│   ├── dashboard.html    # Admin dashboard
│   ├── device.html       # Device details page
│   └── map.html          # Interactive map
├── loomadevices.csv      # Sample device data
├── pyproject.toml        # Python dependencies
└── README.md             # This file
```

## API Endpoints

### Public Routes
- `GET /` - Main scanning form
- `POST /` - Submit device scan data

### Protected Routes (Admin)
- `GET /login` - Admin login
- `GET /dashboard` - Admin dashboard
- `GET /device/<serial>` - Device scan history
- `GET /map` - Device location map
- `GET /api/stats` - Device statistics (JSON)
- `GET /api/locations-preview` - Location data (JSON)



## Database Schema

### Device Scans Collection
```javascript
{
  _id: ObjectId,
  serial: String,           // Device serial number
  technician: String,       // Technician name
  school: String,           // School name
  software_version: String, // Software version
  condition: String,        // Device condition
  latitude: String,         // GPS latitude
  longitude: String,        // GPS longitude
  build_date: String,       // Manufacturing date
  mfg_location: String,     // Manufacturing location
  lot_number: String,       // Lot number
  timestamp: Date           // Scan timestamp
}
```

## Security Features

- Password hashing using Werkzeug
- Session-based authentication
- CSRF protection through form validation
- Environment variable configuration
- Input sanitization and validation

## Mobile Support

- Responsive design for all screen sizes
- Touch-friendly interface
- GPS location access on mobile devices
- Optimized forms for mobile input

## Development

### Local Development
1. Set up environment variables
2. Run `python app.py`
3. Access at `http://localhost:5000`

### Testing
Test the application with sample URLs:
```
http://localhost:5000/?serial=K002&date=July%202025&location=SJ&lot=1
```

## Deployment

This application is configured for deployment on Replit with:
- Automatic dependency management
- Environment variable support
- Production-ready Flask configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is developed for Looma educational initiatives.

## Support

For issues or questions, please check the codebase or contact the development team.

---

**Looma Device Scanner** - Tracking educational technology for better learning outcomes.
