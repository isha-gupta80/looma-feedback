import os
from flask import Flask, render_template, request, redirect, url_for, session, flash
from dotenv import load_dotenv
import csv
from datetime import datetime
from pymongo import MongoClient
from geopy.geocoders import Nominatim
import logging
from werkzeug.security import check_password_hash

# Load environment variables
load_dotenv()

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", os.urandom(24))  # fallback to random secret for dev

# Connect to MongoDB (with timeout and error handling)
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    client.server_info()  # Trigger exception if cannot connect
except Exception as e:
    logger.error(f"MongoDB connection error: {e}")
    raise

db = client['looma']
collection = db['scans']

# Secure login credentials
USERNAME = os.getenv("ADMIN_USERNAME", "admin")
PASSWORD_HASH = os.getenv("ADMIN_PASSWORD_HASH")

geolocator = Nominatim(user_agent="looma-scan-app")


def find_device(serial):
    try:
        with open('loomadevices.csv', newline='') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                if row.get('serial') == serial:
                    return row
    except FileNotFoundError:
        logger.warning("loomadevices.csv not found.")
    return None


def get_location_name(lat, lon):
    try:
        if lat is not None and lon is not None:
            location = geolocator.reverse((lat, lon), language='en', timeout=10)
            return location.address if location else "Unknown"
    except Exception as e:
        logger.error(f"Reverse geocoding error: {e}")
    return "Unknown"



from flask import request, render_template, flash
from datetime import datetime
import logging

@app.route("/", methods=['GET', 'POST'])
def index():
    serial = request.args.get('serial') or request.form.get('serial', '').strip()
    build_date = request.args.get('date') or request.form.get('build_date', '').strip()
    mfg_location = request.args.get('location') or request.form.get('mfg_location', '').strip()
    lot_number = request.args.get('lot') or request.form.get('lot_number', '').strip()

    device = find_device(serial) if serial else None
    success = False

    if request.method == 'POST':
        try:
            form_data = {
                'username': request.form['technician'].strip(),
                'school': request.form['school'].strip(),
                'software_version': request.form['software_version'].strip(),
                'condition': request.form['condition'].strip(),
                'latitude': request.form.get('latitude', '').strip(),
                'longitude': request.form.get('longitude', '').strip()
            }

            document = {
                'timestamp': datetime.utcnow(),
                'serial': serial,
                'username': form_data['username'],
                'school': form_data['school'],
                'software_version': form_data['software_version'],
                'condition': form_data['condition'],
                'gps_location': {
                    'latitude': form_data['latitude'],
                    'longitude': form_data['longitude']
                },
                 'build_date':build_date,
                 'mfg_location':mfg_location,
                 'lot_number':lot_number
            }

            collection.insert_one(document)

            if device:
                success = True
                flash("Form submitted successfully.", "success")
            else:
                flash("Device not found in CSV, but scan saved to database.", "warning")

        except Exception as e:
            logging.error(f"Error processing form: {e}", exc_info=True)
            flash("An error occurred while submitting the form.", "error")

    return render_template(
        'index.html',
        serial=serial or '',
        build_date=build_date,
        mfg_location=mfg_location,
        lot_number=lot_number,
        success=success
   
    )


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        print(f"Login attempt: username={username}, password={password}")

        if username == USERNAME and PASSWORD_HASH and check_password_hash(PASSWORD_HASH, password):
            session['logged_in'] = True
            print("Login success: session set")
            flash("Logged in successfully.", "success")
            return redirect(url_for('dashboard'))
        else:
            print("Login failed: invalid credentials")
            flash("Invalid credentials.", "error")

    return render_template('login.html')


@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    flash("Logged out successfully.", "info")
    return redirect(url_for('login'))


def login_required(f):
    from functools import wraps

    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('logged_in'):
            flash("Please log in to access this page.", "warning")
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function


@app.route('/dashboard')
@login_required
def dashboard():
    serials = collection.distinct('serial')
    return render_template('dashboard.html', serials=serials)


@app.route('/device/<serial>')
@login_required
def device(serial):
    records = list(collection.find({'serial': serial}))

    for record in records:
        lat = record.get('gps_location', {}).get('latitude')
        lon = record.get('gps_location', {}).get('longitude')
        try:
            lat = float(lat)
            lon = float(lon)
            record['gps_address'] = get_location_name(lat, lon)
        except (TypeError, ValueError):
            record['gps_address'] = "Unknown"

    return render_template('device.html', serial=serial, records=records)


@app.route('/looma_map')
@login_required
def map_view():
    cursor = collection.find({}, {
        'serial': 1,
        'model': 1,
        'school': 1,
        'gps_location.latitude': 1,
        'gps_location.longitude': 1
    })

    devices = []
    for rec in cursor:
        lat_str = rec.get('gps_location', {}).get('latitude')
        lon_str = rec.get('gps_location', {}).get('longitude')
        if lat_str and lon_str:
            try:
                lat = float(lat_str)
                lon = float(lon_str)
                address = get_location_name(lat, lon)
                devices.append({
                    'serial': rec.get('serial'),
                    'model': rec.get('model'),
                    'school': rec.get('school', 'Unknown'),
                    'latitude': lat,
                    'longitude': lon,
                    'gps_location': address
                })
            except ValueError:
                continue

    return render_template('map.html', devices=devices)


if __name__ == '__main__':
    # Run with debug=False in production for security
    app.run(debug=False, host="0.0.0.0", port=5000)
