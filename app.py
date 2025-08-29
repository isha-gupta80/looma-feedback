
import os
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from dotenv import load_dotenv
from datetime import datetime, timedelta
import pymongo
from pymongo import MongoClient
import logging
from werkzeug.security import check_password_hash
from functools import wraps

# Load environment variables
load_dotenv()

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", os.urandom(24))

# MongoDB connection
MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    logger.error("MONGODB_URI environment variable not set")
    raise Exception("MONGODB_URI environment variable not set")

try:
    client = MongoClient(MONGODB_URI)
    client.admin.command('ping')
    db = client['looma-devices']
    scans_collection = db.device_scans
    logger.info("MongoDB connection established successfully")
except Exception as e:
    logger.error(f"MongoDB connection error: {e}")
    raise

# Secure login credentials
USERNAME = os.getenv("ADMIN_USERNAME", "admin")
PASSWORD_HASH = os.getenv("ADMIN_PASSWORD_HASH")

def get_scan_timestamp(request):
    """Get accurate timestamp from client or fallback to server time"""
    client_timestamp = request.form.get('client_timestamp')
    if client_timestamp:
        try:
            return datetime.fromisoformat(client_timestamp.replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            logger.warning("Invalid client timestamp format, using server time")
    return datetime.now()

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('logged_in'):
            flash("Please log in to access this page.", "warning")
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

@app.route("/", methods=['GET', 'POST'])
def index():
    # Extract QR code parameters
    serial = request.args.get('serial') or request.form.get('serial', '').strip()
    build_date = request.args.get('date') or request.form.get('build_date', '').strip()
    mfg_location = request.args.get('location') or request.form.get('mfg_location', '').strip()
    lot_number = request.args.get('lot') or request.form.get('lot_number', '').strip()

    if request.method == 'POST':
        try:
            form_data = {
                'serial': serial,
                'technician': request.form['technician'].strip(),
                'school': request.form['school'].strip(),
                'software_version': request.form['software_version'].strip(),
                'condition': request.form['condition'].strip(),
                'latitude': request.form.get('latitude', '').strip(),
                'longitude': request.form.get('longitude', '').strip(),
                'build_date': build_date,
                'mfg_location': mfg_location,
                'lot_number': lot_number,
                'timestamp': get_scan_timestamp(request)
            }

            scans_collection.insert_one(form_data)
            logger.info(f"Scan data saved for device: {serial}")
            return jsonify({"success": True, "message": "Device scan submitted successfully!"})

        except Exception as e:
            logger.error(f"Error processing form: {e}")
            return jsonify({"success": False, "message": "An error occurred while submitting the form."})

    return render_template('index.html', serial=serial or '', build_date=build_date, 
                         mfg_location=mfg_location, lot_number=lot_number)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')

        if username == USERNAME and PASSWORD_HASH and check_password_hash(PASSWORD_HASH, password):
            session['logged_in'] = True
            flash("Logged in successfully.", "success")
            return redirect(url_for('dashboard'))
        else:
            flash("Invalid credentials.", "error")

    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    flash("Logged out successfully.", "info")
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required
def dashboard():
    try:
        # Get stats efficiently with aggregation
        pipeline = [
            {"$group": {
                "_id": None,
                "unique_serials": {"$addToSet": "$serial"},
                "total_scans": {"$sum": 1}
            }}
        ]
        
        result = list(scans_collection.aggregate(pipeline))
        if result:
            serials = sorted([s for s in result[0]["unique_serials"] if s])
            total_scans = result[0]["total_scans"]
        else:
            serials, total_scans = [], 0

        return render_template('dashboard.html', serials=serials, total_scans=total_scans)
    except Exception as e:
        logger.error(f"Dashboard error: {e}")
        flash("Error loading dashboard data.", "error")
        return render_template('dashboard.html', serials=[], total_scans=0)

@app.route('/device/<serial>')
@login_required
def device(serial):
    try:
        records = list(scans_collection.find({"serial": serial}).sort("timestamp", -1))
        for record in records:
            record['_id'] = str(record['_id'])
        return render_template('device.html', serial=serial, records=records)
    except Exception as e:
        logger.error(f"Device records error: {e}")
        flash("Error loading device records.", "error")
        return render_template('device.html', serial=serial, records=[])

@app.route('/map')
@login_required
def device_map():
    try:
        # Optimized query with projection
        devices = list(scans_collection.find({
            "latitude": {"$ne": None, "$ne": ""},
            "longitude": {"$ne": None, "$ne": ""},
            "serial": {"$ne": None, "$ne": ""}
            
        }, {
            "serial": 1, "school": 1, "latitude": 1, "longitude": 1,
            "technician": 1, "condition": 1, "timestamp": 1
        }))
        
        map_devices = []
        for device in devices:
            try:
                map_devices.append({
                    'serial': device['serial'],
                    'school': device.get('school', 'Unknown School'),
                    'latitude': float(device['latitude']),
                    'longitude': float(device['longitude']),
                    'technician': device.get('technician', 'Unknown'),
                    'condition': device.get('condition', 'Unknown'),
                    'timestamp': device.get('timestamp', 'Unknown')
                })
            except (ValueError, TypeError):
                continue
        
        return render_template('map.html', devices=map_devices)
    except Exception as e:
        logger.error(f"Map error: {e}")
        flash("Error loading device map.", "error")
        return render_template('map.html', devices=[])

@app.route('/api/stats')
@login_required
def api_stats():
    try:
        thirty_days_ago = datetime.now() - timedelta(days=30)
        
        # Single aggregation pipeline for all stats
        pipeline = [
            {
                "$facet": {
                    "total_devices": [{"$group": {"_id": "$serial"}}, {"$count": "count"}],
                    "total_scans": [{"$count": "count"}],
                    "recent_scans": [
                        {"$match": {"timestamp": {"$gte": thirty_days_ago}}},
                        {"$count": "count"}
                    ],
                    "devices_with_location": [
                        {"$match": {
                            "latitude": {"$ne": None, "$ne": ""},
                            "longitude": {"$ne": None, "$ne": ""}
                        }},
                        {"$count": "count"}
                    ]
                }
            }
        ]
        
        result = list(scans_collection.aggregate(pipeline))[0]
        
        return jsonify({
            "total_devices": result["total_devices"][0]["count"] if result["total_devices"] else 0,
            "total_scans": result["total_scans"][0]["count"] if result["total_scans"] else 0,
            "recent_scans": result["recent_scans"][0]["count"] if result["recent_scans"] else 0,
            "devices_with_location": result["devices_with_location"][0]["count"] if result["devices_with_location"] else 0
        })
    except Exception as e:
        logger.error(f"API stats error: {e}")
        return jsonify({"error": "Unable to fetch statistics"})

@app.route('/api/locations-preview')
@login_required
def api_locations_preview():
    try:
        locations = list(scans_collection.find({
            "latitude": {"$ne": None, "$ne": ""},
            "longitude": {"$ne": None, "$ne": ""},
            "serial": {"$ne": None, "$ne": ""}
        }, {
            "serial": 1, "school": 1, "latitude": 1, "longitude": 1
        }).sort("timestamp", -1).limit(5))
        
        location_data = [{
            'serial': loc['serial'],
            'school': loc.get('school', 'Unknown School'),
            'latitude': loc['latitude'],
            'longitude': loc['longitude']
        } for loc in locations]
        
        return jsonify({"locations": location_data})
    except Exception as e:
        logger.error(f"Locations preview error: {e}")
        return jsonify({"error": "Unable to fetch locations", "locations": []})

if __name__ == '__main__':
    logger.info("Starting Flask application...")
    app.run(debug=False, host="0.0.0.0", port=5000)
