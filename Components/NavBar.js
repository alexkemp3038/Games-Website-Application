async function loadNavbar() {
  try {
    // Fetch the navbar HTML
    const response = await fetch("../Components/NavBar.html");
    const navbarHtml = await response.text();

    // Insert navbar at top of body
    document.body.insertAdjacentHTML("afterbegin", navbarHtml);

    // Once inserted, populate user data
    updateNavbar();

  } catch (error) {
    console.error("Error loading navbar:", error);
  }
}

function updateNavbar() {
  const isLoggedIn = localStorage.getItem("loggedIn") === "true";
  const guestDropdown = document.getElementById("guest-dropdown");
  const userDropdown = document.getElementById("user-dropdown");

  if (isLoggedIn) {
    // Show user dropdown, hide guest dropdown
    if (guestDropdown) guestDropdown.style.display = "none";
    if (userDropdown) userDropdown.style.display = "block";

    // Populate user info from localStorage
    document.getElementById("user-username").textContent =
      localStorage.getItem("userName") || "Unknown";
    document.getElementById("user-fullname").textContent =
      `${localStorage.getItem("firstName") || ""} ${localStorage.getItem("secondName") || ""}`;
    document.getElementById("user-email").textContent =
      localStorage.getItem("email") || "None";
    document.getElementById("user-date").textContent =
      localStorage.getItem("createdAt") || "Today";

    // Add logout button handler
    const logoutBtn = document.getElementById("logout");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "../Login_Page/login.html";
      });
    }
	// === Admin Panel Button Handling ===
	const adminBtn = document.getElementById("adminBtn");
	const role = localStorage.getItem("Role");

	if (role === "Admin" && adminBtn) {
		adminBtn.style.display = "block"; // show admin panel button
		adminBtn.addEventListener("click", () => {
		window.location.href = "../Admin_Page/admin-page.html";
  });
}

  } else {
    // Show guest dropdown, hide user dropdown
    if (guestDropdown) guestDropdown.style.display = "block";
    if (userDropdown) userDropdown.style.display = "none";
	
	const loginBtn = document.getElementById("loginBtn");
	if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      window.location.href = "../Login_Page/login.html";
    });
  }
    const signupBtn = document.getElementById("signupBtn");
  if (signupBtn) {
    signupBtn.addEventListener("click", () => {
      window.location.href = "../Login_Page/login.html";
	});
	}
	}
}

// Load navbar when DOM is ready
document.addEventListener("DOMContentLoaded", loadNavbar);
