import os
import pandas as pd
import qrcode
from PIL import Image, ImageDraw, ImageFont
from urllib.parse import urlencode
import logging

#SETUP
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

CSV_FILE = "loomadevices.csv"
LOGO_FILE = "Looma-2019.png"
OUTPUT_DIR = "qr_labels"
BASE_URL = "http://127.0.0.1:5000/"  # Update this in production

# Create output directory if it doesn't exist
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Load logo and prepare
try:
    logo = Image.open(LOGO_FILE).convert("RGBA")
    logo = logo.resize((80, 80))
    logo = logo.rotate(270, expand=True)
except FileNotFoundError:
    logging.error(f"Logo file '{LOGO_FILE}' not found.")
    exit()

# Load fonts
try:
    font_bold = ImageFont.truetype("arialbd.ttf", 22)
    font_regular = ImageFont.truetype("arial.ttf", 20)
except IOError:
    logging.warning("TrueType fonts not found. Using default fonts.")
    font_bold = ImageFont.load_default()
    font_regular = ImageFont.load_default()

# MAIN LOOP 
while True:
    serial_input = input("Enter the serial number of the device (or type 'exit' to quit): ").strip()
    if serial_input.lower() == "exit":
        logging.info("Exiting QR label generator.")
        break

    quantity_input = input("Enter how many QR codes to generate for this serial: ").strip()

    try:
        quantity = int(quantity_input)
        if quantity <= 0:
            raise ValueError
    except ValueError:
        logging.warning("Invalid quantity. Please enter a positive integer.")
        continue

    # Load device data
    try:
        data = pd.read_csv(CSV_FILE)
    except FileNotFoundError:
        logging.error(f"CSV file '{CSV_FILE}' not found.")
        break

    # Filter matching serial
    filtered_data = data[data['serial'].astype(str).str.strip() == serial_input]
    if filtered_data.empty:
        logging.warning(f"No device found with serial: {serial_input}")
        continue

    row = filtered_data.iloc[0]
    serial = str(row['serial']).strip()
    model = str(row['model']).strip()
    build = str(row['build']).strip()

    logging.info(f"Generating {quantity} QR label(s) for device serial: {serial}")

    for i in range(1, quantity + 1):
        # Prepare URL
        query = urlencode({"serial": serial, "model": model, "build": build})
        full_url = BASE_URL + "?" + query

        # Generate QR code
        qr = qrcode.make(full_url).resize((100, 100))

        # Create label canvas
        label_width, label_height = 580, 120
        label = Image.new("RGB", (label_width, label_height), "white")
        draw = ImageDraw.Draw(label)

        # Add orange vertical strip
        margin, strip_width = 10, 45
        orange_strip = Image.new("RGB", (strip_width, label_height - 2 * margin), (128, 40, 0))
        strip_x = label_width - strip_width - margin
        strip_y = margin
        label.paste(orange_strip, (strip_x, strip_y))

        # Add QR code to label
        label.paste(qr, (10, 10))

        # Add logo to strip
        logo_x = strip_x + (strip_width - logo.width) // 2
        logo_y = strip_y + (orange_strip.height - logo.height) // 2
        label.paste(logo, (logo_x, logo_y), logo)

        # Add text
        draw.text((130, 20), "        Looma Education", font=font_bold, fill="black")
        draw.text((130, 50), "        +977 9812345678", font=font_regular, fill="black")
        draw.text((130, 80), f"        serial number: {serial}", font=font_bold, fill="black")

        # Save file
        filename = f"{serial}_{i}.png"
        label.save(os.path.join(OUTPUT_DIR, filename))
        logging.info(f"Label {i}/{quantity} saved: {filename}")
