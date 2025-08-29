
let locationGranted = false;
let locationRetryCount = 0;
const MAX_RETRY_ATTEMPTS = 3;

window.onload = function () {
    // Check if we're on a secure context (required for location on mobile)
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        showLocationError("Location requires HTTPS on mobile devices");
        return;
    }
    
    requestLocationPermission();
};

function requestLocationPermission() {
    const locationStatus = document.getElementById("locationStatus");
    const locationText = document.getElementById("locationText");

    if (!("geolocation" in navigator)) {
        locationText.textContent = "⚠ Geolocation not supported by this browser";
        locationStatus.className = "location-status location-denied";
        return;
    }

    // Check permissions API if available (mainly for mobile)
    if ('permissions' in navigator) {
        navigator.permissions.query({name: 'geolocation'}).then(function(result) {
            if (result.state === 'granted') {
                getLocationWithRetry();
            } else if (result.state === 'prompt') {
                showLocationPrompt();
            } else {
                showLocationDenied();
            }
        }).catch(function() {
            // Fallback if permissions API fails
            getLocationWithRetry();
        });
    } else {
        getLocationWithRetry();
    }
}

function showLocationPrompt() {
    const locationText = document.getElementById("locationText");
    const locationStatus = document.getElementById("locationStatus");
    
    locationText.innerHTML = "📍 Please allow location access when prompted<br><small>Required for device tracking</small>";
    locationStatus.className = "location-status location-pending";
    
    getLocationWithRetry();
}

function getLocationWithRetry() {
    const locationText = document.getElementById("locationText");
    const locationStatus = document.getElementById("locationStatus");
    
    locationText.textContent = "Requesting location permission...";
    locationStatus.className = "location-status location-pending";

    const options = {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout for mobile
        maximumAge: 60000 // Reduced max age for fresher location
    };

    navigator.geolocation.getCurrentPosition(
        function (position) {
            document.getElementById("latitude").value = position.coords.latitude;
            document.getElementById("longitude").value = position.coords.longitude;
            locationGranted = true;
            
            locationText.textContent = "✓ Location permission granted";
            locationStatus.className = "location-status location-granted";
            locationRetryCount = 0;
        },
        function (error) {
            handleLocationError(error);
        },
        options
    );
}

function handleLocationError(error) {
    const locationText = document.getElementById("locationText");
    const locationStatus = document.getElementById("locationStatus");
    
    const errorMessages = {
        [error.PERMISSION_DENIED]: "Location permission denied",
        [error.POSITION_UNAVAILABLE]: "Location information unavailable", 
        [error.TIMEOUT]: "Location request timed out"
    };
    
    const errorMessage = errorMessages[error.code] || "Location access failed";
    console.warn("Location error:", errorMessage);
    
    // Mobile-specific retry logic
    if (error.code === error.TIMEOUT && locationRetryCount < MAX_RETRY_ATTEMPTS) {
        locationRetryCount++;
        locationText.innerHTML = `⏳ Retrying location request (${locationRetryCount}/${MAX_RETRY_ATTEMPTS})...<br><small>Please ensure GPS is enabled</small>`;
        locationStatus.className = "location-status location-pending";
        
        setTimeout(() => {
            getLocationWithRetry();
        }, 2000);
        return;
    }
    
    if (error.code === error.PERMISSION_DENIED) {
        showLocationDenied();
    } else {
        showLocationError(errorMessage);
    }
}

function showLocationDenied() {
    const locationText = document.getElementById("locationText");
    const locationStatus = document.getElementById("locationStatus");
    
    locationText.innerHTML = `⚠ Location access denied<br><small>You can still submit the form without location</small><br><button onclick="requestLocationPermission()" style="margin-top: 8px; padding: 4px 8px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Try Again</button>`;
    locationStatus.className = "location-status location-denied";
}

function showLocationError(message) {
    const locationText = document.getElementById("locationText");
    const locationStatus = document.getElementById("locationStatus");
    
    locationText.innerHTML = `⚠ ${message}<br><small>You can still submit the form without location</small><br><button onclick="requestLocationPermission()" style="margin-top: 8px; padding: 4px 8px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Try Again</button>`;
    locationStatus.className = "location-status location-denied";
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
