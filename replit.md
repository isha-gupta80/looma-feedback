# Overview

The Looma Device Scanner is a Flask-based web application designed for tracking and managing Looma educational devices through QR code scanning. The system enables technicians to scan devices, record their condition, track locations with GPS coordinates, and provides administrators with comprehensive dashboards and mapping capabilities. The application serves as a field management tool for educational technology deployment and maintenance.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Web-based Interface**: HTML5, CSS3, and vanilla JavaScript for responsive design
- **Mobile-first Design**: Optimized for field technicians using mobile devices
- **Progressive Enhancement**: Core functionality works without JavaScript, enhanced features require it
- **Real-time Location**: Browser geolocation API integration for GPS coordinate capture
- **Interactive Mapping**: Leaflet.js with OpenStreetMap tiles for device location visualization

## Backend Architecture
- **Framework**: Flask (Python) with session-based authentication
- **Route Structure**: RESTful endpoints for device scanning, dashboard access, and data retrieval
- **Authentication**: Secure admin area with password hashing and session management
- **Middleware**: Custom decorators for route protection and permission handling
- **Error Handling**: Comprehensive logging and graceful error recovery

## Data Storage
- **Primary Database**: MongoDB for flexible document storage
- **Collections**: Device scans with embedded location and metadata
- **Schema Design**: Document-based structure supporting varied device attributes
- **Indexing Strategy**: Optimized for serial number lookups and timestamp queries
- **Data Validation**: Server-side validation for all input fields

## Authentication & Authorization
- **Session Management**: Flask sessions with secure secret key
- **Password Security**: Werkzeug password hashing for admin credentials
- **Environment-based Credentials**: Username and password hash stored in environment variables
- **Route Protection**: Decorator-based access control for admin endpoints

## Location Services
- **GPS Integration**: Browser geolocation API for real-time coordinate capture
- **Fallback Handling**: Graceful degradation when location services unavailable
- **Timestamp Accuracy**: Client-side timestamp capture with server fallback
- **Mapping Integration**: Leaflet maps for visualizing device locations

# External Dependencies

## Database Services
- **MongoDB Atlas**: Cloud-hosted MongoDB instance via connection string
- **PyMongo**: Python MongoDB driver for database operations
- **DNS Resolution**: dnspython for MongoDB connection string parsing

## Web Framework & Extensions
- **Flask**: Core web framework with routing and templating
- **Flask-PyMongo**: MongoDB integration extension
- **Flask-Login**: User session management (referenced in requirements)
- **Flask-WTF**: Form handling and CSRF protection
- **WTForms**: Form validation and rendering

## Mapping & Location Services
- **Leaflet.js**: Open-source mapping library via CDN
- **OpenStreetMap**: Tile service for map rendering
- **Geopy**: Python library for geocoding and reverse geocoding
- **Browser Geolocation API**: Native location services in web browsers

## Deployment & Infrastructure
- **Replit**: Primary hosting platform with environment variable support
- **Gunicorn**: WSGI HTTP server for production deployment
- **Python-dotenv**: Environment variable management
- **Environment Variables**: Secure storage for MongoDB URI, admin credentials, and secret keys

## Third-party Integrations
- **QR Code Scanning**: Browser-based camera API for QR code reading
- **Address Lookup**: Reverse geocoding for converting coordinates to addresses
- **Responsive Design**: CSS Grid and Flexbox for cross-device compatibility