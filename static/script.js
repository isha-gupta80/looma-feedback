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

    if (!locationGranted) {
        if (confirm("Location permission not granted. Submit without location data?")) {
            submitForm();
        }
    } else {
        submitForm();
    }
});

function submitForm() {
    const form = document.getElementById("deviceForm");
    const formData = new FormData(form);
    const submitBtn = document.getElementById("submitBtn");

    // Add accurate client timestamp in ISO format
    const clientTimestamp = new Date().toISOString();
    formData.append('client_timestamp', clientTimestamp);

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    fetch("/", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            form.reset();
            document.getElementById("latitude").value = "";
            document.getElementById("longitude").value = "";
        } else {
            alert("Error: " + data.message);
        }
    })
    .catch(error => {
        alert("An error occurred: " + error.message);
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Scan";
    });
}

function showSuccessPopup() {
    document.getElementById("overlay").style.display = "block";
    document.getElementById("successPopup").style.display = "block";
}

function closeSuccessPopup() {
    document.getElementById("overlay").style.display = "none";
    document.getElementById("successPopup").style.display = "none";
}