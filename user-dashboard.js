// user-dashboard.js - FIXED + SYNCED WITH ADMIN DASHBOARD

let currentFilters = {
    status: "all",
};

// Show notification
function showNotification(message, type = "success") {
    const notification = document.getElementById("notification");
    if (!notification) return;

    const icon = notification.querySelector(".notification-icon");
    const messageEl = notification.querySelector(".notification-message");

    icon.className = "notification-icon";
    if (type === "success") {
        icon.classList.add("fas", "fa-check-circle");
        notification.className = "notification success";
    } else {
        icon.classList.add("fas", "fa-exclamation-circle");
        notification.className = "notification error";
    }

    messageEl.textContent = message;
    notification.classList.add("show");

    setTimeout(() => notification.classList.remove("show"), 3000);
}

// Loading overlay
function showLoading() {
    const loadingOverlay = document.getElementById("loadingOverlay");
    if (loadingOverlay) loadingOverlay.classList.add("show");
}

function hideLoading() {
    setTimeout(() => {
        const loadingOverlay = document.getElementById("loadingOverlay");
        if (loadingOverlay) loadingOverlay.classList.remove("show");
    }, 300);
}

// Read file → Base64
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Detect location
function detectLocation() {
    if (!navigator.geolocation) {
        showNotification("Geolocation not supported", "error");
        return;
    }

    showLoading();
    showNotification("Detecting location...");

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            document.getElementById("location").value =
                `Lat: ${pos.coords.latitude.toFixed(5)}, Lon: ${pos.coords.longitude.toFixed(
                    5
                )}`;
            hideLoading();
            showNotification("Location detected!");
        },
        () => {
            hideLoading();
            showNotification("Failed to detect location", "error");
        }
    );
}

// Auth check
function checkAuth() {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    if (!user) {
        window.location.href = "index.html";
        return null;
    }
    if (user.role === "admin") {
        window.location.href = "admin-dashboard.html";
        return null;
    }
    return user;
}

// Logout
function logout() {
    showLoading();

    if (!confirm("Are you sure you want to logout?")) {
        hideLoading();
        return;
    }

    setTimeout(() => {
        localStorage.removeItem("currentUser");
        showNotification("Logged out successfully");
        setTimeout(() => {
            window.location.href = "index.html";
        }, 1000);
        
    }, 500);
}

// Update UI with user name
function updateUserInterface(user) {
    if (document.getElementById("userName")) {
        document.getElementById("userName").textContent = user.name;
    }

    if (document.getElementById("userGreeting")) {
        document.getElementById("userGreeting").textContent =
            "Hello, " + user.name.split(" ")[0] + "!";
    }
}

// Load dashboard statistics
function loadStatistics() {
    const issues = JSON.parse(localStorage.getItem("civic_issues")) || [];
    const user = JSON.parse(localStorage.getItem("currentUser"));
    if (!user) return;

    const myIssues = issues.filter((i) => i.reportedBy === user.email);

    const total = myIssues.length;
    const resolved = myIssues.filter((i) => i.status === "Resolved").length;
    const pending = myIssues.filter((i) => i.status !== "Resolved").length;

    document.getElementById("totalReports").textContent = total;
    document.getElementById("pendingReports").textContent = pending;
    document.getElementById("resolvedReports").textContent = resolved;

    const rate = total ? Math.round((resolved / total) * 100) : 0;
    document.getElementById("responseRate").textContent = rate + "%";
}

// Load issues list
function loadIssues() {
    const container = document.getElementById("issuesContainer");
    if (!container) return;

    showLoading();

    setTimeout(() => {
        let issues = JSON.parse(localStorage.getItem("civic_issues")) || [];
        const user = JSON.parse(localStorage.getItem("currentUser"));

        if (!user) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <h3>Please log in</h3>
                </div>`;
            hideLoading();
            return;
        }

        let myIssues = issues.filter((i) => i.reportedBy === user.email);

        if (currentFilters.status !== "all") {
            myIssues = myIssues.filter((i) => i.status === currentFilters.status);
        }

        myIssues.sort((a, b) => b.id - a.id);
        container.innerHTML = "";

        if (myIssues.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <h3>No issues found</h3>
                </div>`;
            hideLoading();
            return;
        }

        myIssues.forEach((issue) => container.appendChild(createIssueElement(issue)));

        hideLoading();
    }, 300);
}

// Create issue card UI
function createIssueElement(issue) {
    const div = document.createElement("div");
    div.className = "issue-card";

    const hasImage = issue.imageDataURL ? `<i class="fas fa-camera"></i>` : "";

    div.innerHTML = `
        <div class="issue-header">
            <h3>${issue.title} ${hasImage}</h3>
            <span class="urgency-badge ${issue.urgency.toLowerCase()}">${issue.urgency}</span>
        </div>
        <p class="issue-meta">
            <i class="fas fa-tag"></i> ${issue.category} • 
            <i class="fas fa-map-marker-alt"></i> ${issue.location}
        </p>
        <p class="issue-description">${issue.description}</p>
        <p class="issue-date"><i class="fas fa-calendar-alt"></i> ${new Date(
            issue.timestamp
        ).toLocaleString()}</p>

        <div class="issue-actions">
            <button class="btn btn-sm btn-secondary" onclick="viewIssueDetails(${issue.id})">
                <i class="fas fa-eye"></i> View
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteIssue(${issue.id})">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    `;

    return div;
}

// View issue modal
function viewIssueDetails(id) {
    const issues = JSON.parse(localStorage.getItem("civic_issues")) || [];
    const issue = issues.find((i) => i.id === id);

    if (!issue) return showNotification("Issue not found", "error");

    document.getElementById("modalTitle").textContent = issue.title;
    document.getElementById("modalCategory").textContent = issue.category;
    document.getElementById("modalLocation").textContent = issue.location;
    document.getElementById("modalUrgency").textContent = issue.urgency;
    document.getElementById("modalStatus").textContent = issue.status;
    document.getElementById("modalDescription").textContent = issue.description;

    if (issue.imageDataURL) {
        document.getElementById("modalImage").src = issue.imageDataURL;
        document.getElementById("modalImageContainer").style.display = "block";
    } else {
        document.getElementById("modalImageContainer").style.display = "none";
    }

    document.getElementById("issueDetailsModal").classList.add("show");
}

// Close modal
function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove("show");
}

// Delete issue
function deleteIssue(id) {
    if (!confirm("Delete this issue permanently?")) return;

    let issues = JSON.parse(localStorage.getItem("civic_issues")) || [];
    issues = issues.filter((i) => i.id !== id);
    localStorage.setItem("civic_issues", JSON.stringify(issues));

    showNotification("Issue deleted!");
    loadStatistics();
    loadIssues();
}

// Submit new issue
async function handleIssueSubmit(e) {
    e.preventDefault();
    showLoading();

    const user = JSON.parse(localStorage.getItem("currentUser"));
    if (!user) return showNotification("Please log in", "error");

    const title = document.getElementById("title").value;
    const category = document.getElementById("category").value;
    const location = document.getElementById("location").value;
    const urgency = document.getElementById("urgency").value;
    const description = document.getElementById("description").value;
    const file = document.getElementById("issueImage").files[0];

    if (!title || !category || !location || !description) {
        hideLoading();
        return showNotification("Please fill all fields", "error");
    }

    let imageDataURL = null;
    if (file) imageDataURL = await readFileAsDataURL(file);

    const newIssue = {
        id: Date.now(),
        title,
        category,
        location,
        urgency,
        description,
        imageDataURL,
        status: "Reported",
        reportedBy: user.email,
        timestamp: new Date().toISOString(),
    };

    let issues = JSON.parse(localStorage.getItem("civic_issues")) || [];
    issues.push(newIssue);
    localStorage.setItem("civic_issues", JSON.stringify(issues));

    showNotification("Issue submitted!");
    document.getElementById("issueForm").reset();
    document.getElementById("imagePreview").innerHTML = "";

    loadStatistics();
    loadIssues();
    hideLoading();
}

// Navigation
function handleNavigation(sectionId) {
    document.querySelectorAll(".content-section").forEach((s) => s.classList.remove("active"));
    document.getElementById(sectionId).classList.add("active");

    if (sectionId === "issuesSection") loadIssues();
    if (sectionId === "dashboardSection") loadStatistics();
}

// Event listeners setup
function setupEventListeners() {
    document.getElementById("issueForm")?.addEventListener("submit", handleIssueSubmit);

    document.getElementById("userFilterStatus")?.addEventListener("change", function () {
        currentFilters.status = this.value;
        loadIssues();
    });

    document.getElementById("refreshIssues")?.addEventListener("click", () => {
        loadIssues();
        loadStatistics();
    });

    document.getElementById("detectLocationBtn")?.addEventListener("click", detectLocation);

    document.getElementById("issueImage")?.addEventListener("change", function () {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById("imagePreview").innerHTML =
                `<img src="${e.target.result}" />`;
        };
        reader.readAsDataURL(this.files[0]);
    });

    document.querySelectorAll(".nav-menu a").forEach((a) => {
        a.addEventListener("click", (e) => {
            e.preventDefault();
            const target = a.getAttribute("href").replace("#", "");
            const map = {
                dashboard: "dashboardSection",
                "report-issue": "reportSection",
                "my-issues": "issuesSection",
            };
            handleNavigation(map[target]);
        });
    });
}

// Dashboard init
function initDashboard() {
    const user = checkAuth();
    if (!user) return;

    showLoading();

    setTimeout(() => {
        updateUserInterface(user);
        setupEventListeners();

        loadStatistics();
        loadIssues();

        hideLoading();
    }, 400);
}

// GLOBAL
window.logout = logout;
window.viewIssueDetails = viewIssueDetails;
window.deleteIssue = deleteIssue;
window.closeModal = closeModal;

// INIT
document.addEventListener("DOMContentLoaded", initDashboard);
