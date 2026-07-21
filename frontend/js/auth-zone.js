const API_BASE = window.ADC_API_BASE ?? (window.location.protocol === "file:" ? "http://localhost:5000" : "");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
let recaptchaWidgetId = null;

if (localStorage.getItem("adcAdminToken")) {
  window.location.href = "admin.html";
}

fetch(`${API_BASE}/api/config/public`)
  .then(res => res.json())
  .then(config => {
    if (config.recaptchaSiteKey && window.grecaptcha) {
      grecaptcha.ready(function() {
        recaptchaWidgetId = grecaptcha.render("recaptchaContainer", {
          sitekey: config.recaptchaSiteKey
        });
      });
    }
  })
  .catch(e => console.error("Failed to load captcha config", e));

if (localStorage.getItem("adcAdminToken")) {
  window.location.href = "admin.html";
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const submitButton = loginForm.querySelector("button");

  let captchaToken = null;
  if (recaptchaWidgetId !== null) {
    captchaToken = grecaptcha.getResponse(recaptchaWidgetId);
    if (!captchaToken) {
      showMessage("error", "Vui lòng xác thực bạn không phải là người máy.");
      return;
    }
  }

  try {
    submitButton.disabled = true;
    submitButton.textContent = "Đang đăng nhập...";
    showMessage("success", "Đang xác thực...");

    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password, captchaToken })
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
    if (recaptchaWidgetId !== null) grecaptcha.reset(recaptchaWidgetId);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Đăng nhập";
  }
});

function showMessage(type, message) {
  loginMessage.className = `form-message visible ${type}`;
  loginMessage.textContent = message;
}
