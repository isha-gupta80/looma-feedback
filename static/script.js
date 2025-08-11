window.onload = function () {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            function (position) {
                document.getElementById("latitude").value = position.coords.latitude;
                document.getElementById("longitude").value = position.coords.longitude;
            },
            function () {
                console.warn("Location access denied or unavailable.");
            }
        );
    } else {
        console.warn("Geolocation not supported.");
    }
};

document.getElementById("deviceForm").addEventListener("submit", function (event) {
    event.preventDefault();
    const namePattern = /^[A-Za-z\s]+$/;
    const school = document.querySelector("[name='school']").value.trim();
    const tech = document.querySelector("[name='technician']").value.trim();

    if (!namePattern.test(school)) {
        alert("School name should contain only letters and spaces.");
        return;
    }
    if (!namePattern.test(tech)) {
        alert("Technician name should contain only letters and spaces.");
        return;
    }

    const formData = new FormData(this);
    fetch(this.action, {
        method: this.method,
        body: formData
    })
    .then(response => {
        if (response.ok) {
            alert("Form submitted successfully!");
            this.reset();
        } else {
            alert("Failed to submit the form. Please try again.");
        }
    })
    .catch(error => {
        alert("An error occurred. Please check your connection.");
        console.error(error);
    });
});