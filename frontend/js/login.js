const API_BASE = window.ADC_API_BASE ?? (window.location.protocol === "file:" ? "http://localhost:5000" : "");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

if (localStorage.getItem("adcAdminToken")) {
  window.location.href = "admin.html";
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const submitButton = loginForm.querySelector("button");

  try {
    submitButton.disabled = true;
    submitButton.textContent = "Đang đăng nhập...";
    showMessage("success", "Đang xác thực...");

    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Không thể đăng nhập.");
    }

    localStorage.setItem("adcAdminToken", result.token);
    localStorage.setItem("adcAdminUser", JSON.stringify(result.user));
    window.location.href = "admin.html";
  } catch (error) {
    const message = error instanceof TypeError
      ? "Không kết nối được backend. Hãy kiểm tra server đang chạy."
      : error.message;
    showMessage("error", message);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Đăng nhập";
  }
});

function showMessage(type, message) {
  loginMessage.className = `form-message visible ${type}`;
  loginMessage.textContent = message;
}
