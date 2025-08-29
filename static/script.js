
let locationGranted = false;

window.onload = function () {
    requestLocationPermission();
};

function requestLocationPermission() {
    const locationStatus = document.getElementById("locationStatus");
    const locationText = document.getElementById("locationText");

    if ("geolocation" in navigator) {
        // Check if we're on mobile and possibly need HTTPS
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isHTTPS = location.protocol === 'https:';
        
        if (isMobile && !isHTTPS) {
            locationText.innerHTML = "⚠ Location access may require HTTPS on mobile devices. <button onclick='retryLocation()' style='margin-left:10px; padding:5px 10px; border:none; background:#0056b3; color:white; border-radius:3px; cursor:pointer;'>Try Anyway</button>";
            locationStatus.className = "location-status location-denied";
            return;
        }

        locationText.textContent = "Requesting location permission...";
        locationStatus.className = "location-status location-pending";

        navigator.geolocation.getCurrentPosition(
            function (position) {
                document.getElementById("latitude").value = position.coords.latitude;
                document.getElementById("longitude").value = position.coords.longitude;
                locationGranted = true;
                
                locationText.textContent = "✓ Location permission granted";
                locationStatus.className = "location-status location-granted";
            },
            function (error) {
                const errorMessages = {
                    [error.PERMISSION_DENIED]: isMobile ? 
                        "Location permission denied. Try enabling location in your browser settings or use HTTPS." :
                        "Location permission denied by user",
                    [error.POSITION_UNAVAILABLE]: "Location information unavailable", 
                    [error.TIMEOUT]: "Location request timed out"
                };
                
                const errorMessage = errorMessages[error.code] || "Location access denied";
                
                if (isMobile && error.code === error.PERMISSION_DENIED) {
                    locationText.innerHTML = `⚠ ${errorMessage} <button onclick='retryLocation()' style='margin-left:10px; padding:5px 10px; border:none; background:#0056b3; color:white; border-radius:3px; cursor:pointer;'>Retry</button>`;
                    document.getElementById("manualLocationSection").style.display = "block";
                } else {
                    locationText.textContent = "⚠ " + errorMessage;
                    if (error.code === error.PERMISSION_DENIED) {
                        document.getElementById("manualLocationSection").style.display = "block";
                    }
                }
                
                locationStatus.className = "location-status location-denied";
                console.warn("Location error:", errorMessage);
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

function retryLocation() {
    const locationStatus = document.getElementById("locationStatus");
    const locationText = document.getElementById("locationText");
    
    locationText.textContent = "Requesting location permission...";
    locationStatus.className = "location-status location-pending";
    
    navigator.geolocation.getCurrentPosition(
        function (position) {
            document.getElementById("latitude").value = position.coords.latitude;
            document.getElementById("longitude").value = position.coords.longitude;
            locationGranted = true;
            
            locationText.textContent = "✓ Location permission granted";
            locationStatus.className = "location-status location-granted";
            document.getElementById("manualLocationSection").style.display = "none";
        },
        function (error) {
            locationText.innerHTML = "⚠ Location access still denied. You can use manual entry below or submit without location. <br><small>To enable automatic: Go to browser settings → Site permissions → Location → Allow</small>";
            locationStatus.className = "location-status location-denied";
            document.getElementById("manualLocationSection").style.display = "block";
        },
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000 // Shorter cache for retry
        }
    );
}

function useManualLocation() {
    const lat = document.getElementById("manualLat").value;
    const lng = document.getElementById("manualLng").value;
    
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
        document.getElementById("latitude").value = lat;
        document.getElementById("longitude").value = lng;
        locationGranted = true;
        
        const locationStatus = document.getElementById("locationStatus");
        const locationText = document.getElementById("locationText");
        
        locationText.textContent = "✓ Manual coordinates entered";
        locationStatus.className = "location-status location-granted";
        document.getElementById("manualLocationSection").style.display = "none";
    } else {
        alert("Please enter valid latitude and longitude values.");
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
