
let locationGranted = false;

window.onload = function () {
    requestLocationPermission();
};

function requestLocationPermission() {
    const locationStatus = document.getElementById("locationStatus");
    const locationText = document.getElementById("locationText");

    // Check if we're on HTTPS or localhost (required for geolocation on mobile)
    const isSecure = location.protocol === 'https:' || location.hostname === 'localhost';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if ("geolocation" in navigator) {
        // Show different messages for mobile vs desktop
        if (isMobile && !isSecure) {
            locationText.textContent = "⚠ Location requires secure connection (HTTPS) on mobile devices";
            locationStatus.className = "location-status location-denied";
            return;
        }

        locationText.textContent = isMobile ? 
            "Tap 'Allow' when prompted for location access..." : 
            "Requesting location permission...";
        locationStatus.className = "location-status location-pending";

        // Add user interaction prompt for mobile
        if (isMobile) {
            locationText.innerHTML = locationText.textContent + "<br><small>You may need to tap 'Allow' in your browser's permission dialog</small>";
        }

        navigator.geolocation.getCurrentPosition(
            function (position) {
                document.getElementById("latitude").value = position.coords.latitude;
                document.getElementById("longitude").value = position.coords.longitude;
                locationGranted = true;
                
                locationText.textContent = "✓ Location permission granted";
                locationStatus.className = "location-status location-granted";
            },
            function (error) {
                let errorMessage;
                let helpText = "";

                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Location permission denied";
                        if (isMobile) {
                            helpText = "<br><small>Try: Settings → Site Settings → Location → Allow</small>";
                        }
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Location information unavailable";
                        helpText = "<br><small>Check if location services are enabled on your device</small>";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "Location request timed out";
                        helpText = "<br><small>Please try again or check your GPS signal</small>";
                        break;
                    default:
                        errorMessage = "Location access failed";
                        if (isMobile && !isSecure) {
                            helpText = "<br><small>Mobile devices require HTTPS for location access</small>";
                        }
                }
                
                locationText.innerHTML = "⚠ " + errorMessage + helpText;
                locationStatus.className = "location-status location-denied";
                console.warn("Location error:", error);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000, // Increased timeout for mobile
                maximumAge: 300000
            }
        );
    } else {
        locationText.textContent = "⚠ Geolocation not supported by this browser";
        locationStatus.className = "location-status location-denied";
    }
}

document.getElementById("deviceForm").addEventListener("submit", function (event) {
    event.preventDefault();
    
    // Validate form inputs
    const namePattern = /^[A-Za-z\s]+$/;
    const fields = {
        school: this.school.value.trim(),
        technician: this.technician.value.trim(),
        software_version: this.software_version.value.trim(),
        condition: this.condition.value
    };

    if (!namePattern.test(fields.school)) {
        alert("School name should contain only letters and spaces.");
        return;
    }
    if (!namePattern.test(fields.technician)) {
        alert("Technician name should contain only letters and spaces.");
        return;
    }
    if (!fields.software_version) {
        alert("Software version is required.");
        return;
    }
    if (!fields.condition) {
        alert("Please select a condition.");
        return;
    }

    // Disable submit button and show loading
    const submitBtn = document.getElementById("submitBtn");
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    // Prepare form data with client timestamp
    const formData = new FormData(this);
    formData.append('client_timestamp', new Date().toISOString());

    // Submit form via AJAX
    fetch("/", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showSuccessPopup();
            // Reset form while preserving hidden fields
            this.reset();
            const hiddenFields = ['serial', 'build_date', 'mfg_location', 'lot_number'];
            hiddenFields.forEach(field => {
                if (formData.get(field)) {
                    this[field].value = formData.get(field);
                }
            });
        } else {
            alert("Error: " + data.message);
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("An error occurred while submitting the form. Please try again.");
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    });
});

function showSuccessPopup() {
    document.getElementById("overlay").style.display = "block";
    document.getElementById("successPopup").style.display = "block";
}

function closeSuccessPopup() {
    document.getElementById("overlay").style.display = "none";
    document.getElementById("successPopup").style.display = "none";
}
