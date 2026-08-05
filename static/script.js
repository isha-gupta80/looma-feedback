
let locationGranted = false;

window.onload = function () {
    requestLocationPermission();
};

function requestLocationPermission() {
    const locationStatus = document.getElementById("locationStatus");
    const locationText = document.getElementById("locationText");

    if ("geolocation" in navigator) {
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
                    [error.PERMISSION_DENIED]: "Location permission denied by user",
                    [error.POSITION_UNAVAILABLE]: "Location information unavailable", 
                    [error.TIMEOUT]: "Location request timed out"
                };
                
                const errorMessage = errorMessages[error.code] || "Location access denied";
                locationText.textContent = "⚠ " + errorMessage;
                locationStatus.className = "location-status location-denied";
                console.warn("Location error:", errorMessage);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
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
    fetch("", {
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
