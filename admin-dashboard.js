// admin-dashboard.js - final synced version (uses civic_users, civic_issues)

let currentFilters = {
    status: "all",
    category: "all",
    urgency: "all",
    search: ""
};

let currentIssueId = null;

function showNotification(message, type = "success") {
    const n = document.getElementById("notification");
    if (!n) return;
    const icon = n.querySelector(".notification-icon");
    const msg = n.querySelector(".notification-message");
    icon.className = "notification-icon fas " + (type === "success" ? "fa-check-circle" : "fa-exclamation-circle");
    n.className = "notification " + type;
    msg.textContent = message;
    n.classList.add("show");
    setTimeout(() => n.classList.remove("show"), 3000);
}

function showLoading() {
    const o = document.getElementById("loadingOverlay");
    if (o) o.classList.add("show");
}
function hideLoading() {
    setTimeout(() => {
        const o = document.getElementById("loadingOverlay");
        if (o) o.classList.remove("show");
    }, 300);
}

function checkAuth() {
    const u = JSON.parse(localStorage.getItem("currentUser"));
    if (!u || u.role !== "admin") {
        window.location.href = "index.html";
        return null;
    }
    return u;
}

function logout() {
    showLoading();
    if (!confirm("Are you sure you want to logout?")) {
        hideLoading();
        return;
    }
    localStorage.removeItem("currentUser");
    showNotification("Logged out successfully");
    setTimeout(() => window.location.href = "index.html", 700);
}

function loadStatistics() {
    const users = JSON.parse(localStorage.getItem("civic_users")) || [];
    const issues = JSON.parse(localStorage.getItem("civic_issues")) || [];

    document.getElementById("totalUsers").textContent = users.length;
    document.getElementById("totalIssues").textContent = issues.length;
    document.getElementById("pendingIssues").textContent = issues.filter(i => i.status !== "Resolved").length;
    document.getElementById("resolvedIssues").textContent = issues.filter(i => i.status === "Resolved").length;
}

function loadIssues() {
    const body = document.getElementById("issuesTableBody");
    const empty = document.querySelector("#issuesSection .empty-state");
    if (!body) return;
    showLoading();
    setTimeout(() => {
        let issues = JSON.parse(localStorage.getItem("civic_issues")) || [];

        if (currentFilters.status !== "all") issues = issues.filter(i => i.status === currentFilters.status);
        if (currentFilters.category !== "all") issues = issues.filter(i => i.category === currentFilters.category);
        if (currentFilters.urgency !== "all") issues = issues.filter(i => i.urgency === currentFilters.urgency);
        if (currentFilters.search) {
            const s = currentFilters.search.toLowerCase();
            issues = issues.filter(i => i.title.toLowerCase().includes(s) || i.description.toLowerCase().includes(s) || (i.reportedBy || "").toLowerCase().includes(s));
        }

        body.innerHTML = "";
        if (issues.length === 0) {
            if (empty) empty.style.display = "block";
            hideLoading();
            return;
        }
        if (empty) empty.style.display = "none";

        issues.sort((a,b) => b.id - a.id).forEach(issue => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${issue.title}</td>
                <td>${issue.category}</td>
                <td><span class="status-badge">${issue.status}</span></td>
                <td>${issue.urgency}</td>
                <td>${issue.reportedBy}</td>
                <td>${new Date(issue.timestamp).toLocaleDateString()}</td>
                <td>
                    <button class="btn-sm btn-secondary" onclick="viewAdminIssue(${issue.id})">View</button>
                    <button class="btn-sm btn-primary" onclick="openStatusModal(${issue.id})">Update</button>
                    <button class="btn-sm btn-danger" onclick="deleteIssue(${issue.id})">Delete</button>
                </td>
            `;
            body.appendChild(tr);
        });

        hideLoading();
    }, 300);
}

function viewAdminIssue(id) {
    const issues = JSON.parse(localStorage.getItem("civic_issues")) || [];
    const issue = issues.find(i => i.id === id);
    if (!issue) return showNotification("Issue not found", "error");

    document.getElementById("adminModalTitle").textContent = issue.title;
    document.getElementById("adminModalCategory").innerHTML = `<b>Category:</b> ${issue.category}`;
    document.getElementById("adminModalLocation").innerHTML = `<b>Location:</b> ${issue.location || 'N/A'}`;
    document.getElementById("adminModalUrgency").innerHTML = `<b>Urgency:</b> ${issue.urgency || 'N/A'}`;
    document.getElementById("adminModalStatus").innerHTML = `<b>Status:</b> ${issue.status}`;
    document.getElementById("adminModalDescription").textContent = issue.description || '';

    if (issue.imageDataURL) {
        document.getElementById("adminModalImage").src = issue.imageDataURL;
        document.getElementById("adminModalImageContainer").style.display = "block";
    } else {
        document.getElementById("adminModalImageContainer").style.display = "none";
    }

    document.getElementById("adminIssueModal").classList.add("show");
}

function closeAdminModal() {
    document.getElementById("adminIssueModal").classList.remove("show");
}

function deleteIssue(id) {
    if (!confirm("Delete this issue permanently?")) return;
    let issues = JSON.parse(localStorage.getItem("civic_issues")) || [];
    issues = issues.filter(i => i.id !== id);
    localStorage.setItem("civic_issues", JSON.stringify(issues));
    loadIssues();
    loadStatistics();
    showNotification("Issue deleted!");
}

function openStatusModal(id) {
    currentIssueId = id;
    const issues = JSON.parse(localStorage.getItem("civic_issues")) || [];
    const issue = issues.find(i => i.id === id) || {};
    document.getElementById("modalIssueTitle").textContent = issue.title || '';
    document.getElementById("statusSelect").value = issue.status || 'Reported';
    document.getElementById("statusModal").classList.add("show");
}

function closeModal() {
    document.getElementById("statusModal").classList.remove("show");
    currentIssueId = null;
}

function confirmStatusUpdate() {
    if (!currentIssueId) return;
    let issues = JSON.parse(localStorage.getItem("civic_issues")) || [];
    const index = issues.findIndex(i => i.id === currentIssueId);
    if (index === -1) return;
    const newStatus = document.getElementById("statusSelect").value;
    issues[index].status = newStatus;
    issues[index].notes = document.getElementById("statusNotes").value;
    localStorage.setItem("civic_issues", JSON.stringify(issues));
    closeModal();
    loadIssues();
    loadStatistics();
    showNotification("Status updated!");
}

function loadUsers() {
    const users = JSON.parse(localStorage.getItem("civic_users")) || [];
    const tbody = document.getElementById("usersTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";
    users.forEach(u => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${u.name}</td>
            <td>${u.email}</td>
            <td><span class="role-badge">${u.role || 'Community Member'}</span></td>
            <td>${new Date(u.joined).toLocaleDateString()}</td>
            <td><button class="btn-sm btn-danger" onclick="deleteUser('${u.email}')">Delete</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function deleteUser(email) {
    if (!confirm("Delete this user?")) return;
    let users = JSON.parse(localStorage.getItem("civic_users")) || [];
    users = users.filter(u => u.email !== email);
    localStorage.setItem("civic_users", JSON.stringify(users));
    loadUsers();
    loadStatistics();
    showNotification("User deleted!");
}

function setupEventListeners() {
    document.getElementById("filterStatus")?.addEventListener("change", e => {
        currentFilters.status = e.target.value;
        loadIssues();
    });
    document.getElementById("filterCategory")?.addEventListener("change", e => {
        currentFilters.category = e.target.value;
        loadIssues();
    });
    document.getElementById("filterUrgency")?.addEventListener("change", e => {
        currentFilters.urgency = e.target.value;
        loadIssues();
    });
    document.getElementById("searchInput")?.addEventListener("input", e => {
        currentFilters.search = e.target.value;
        loadIssues();
    });
    document.getElementById("clearFiltersBtn")?.addEventListener("click", () => {
        currentFilters = { status: "all", category: "all", urgency: "all", search: "" };
        document.getElementById("filterStatus").value = "all";
        document.getElementById("filterCategory").value = "all";
        document.getElementById("filterUrgency").value = "all";
        document.getElementById("searchInput").value = "";
        loadIssues();
    });
    document.getElementById("refreshBtn")?.addEventListener("click", () => {
        loadStatistics();
        loadIssues();
        showNotification("Dashboard refreshed");
    });

    document.querySelectorAll(".nav-menu a").forEach(link => {
        link.addEventListener("click", e => {
            e.preventDefault();
            const target = link.getAttribute("href").replace("#", "") + "Section";
            document.querySelectorAll(".content-section").forEach(s => s.classList.remove("active"));
            const el = document.getElementById(target);
            if (el) el.classList.add("active");
        });
    });

    document.getElementById("menuToggle")?.addEventListener("click", () => {
        document.querySelector('.sidebar').classList.toggle('show');
        document.querySelector('.main-content').classList.toggle('sidebar-open');
    });
}

function initDashboard() {
    const admin = checkAuth();
    if (!admin) return;
    showLoading();
    setTimeout(() => {
        loadStatistics();
        loadIssues();
        loadUsers();
        setupEventListeners();
        hideLoading();
    }, 300);

    window.viewAdminIssue = viewAdminIssue;
    window.closeAdminModal = closeAdminModal;
    window.logout = logout;
    window.openStatusModal = openStatusModal;
    window.closeModal = closeModal;
    window.confirmStatusUpdate = confirmStatusUpdate;
    window.deleteIssue = deleteIssue;
    window.deleteUser = deleteUser;
}

document.addEventListener("DOMContentLoaded", initDashboard);
