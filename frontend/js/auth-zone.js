const API_BASE = window.ADC_API_BASE ?? (window.location.protocol === "file:" ? "http://localhost:5000" : "");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
let recaptchaWidgetId = null;

// The session now lives in an httpOnly cookie, invisible to JS, so we can't
// check "already logged in" via localStorage anymore — ask the server instead.
// Body is hidden via inline <style> in the HTML until this check resolves,
// preventing a flash of the login form before an immediate redirect.
fetch(`${API_BASE}/api/auth/me`, { credentials: "include" })
  .then((res) => {
    if (res.ok) {
      window.location.href = "admin.html";
    } else {
      document.body.style.visibility = "visible";
    }
  })
  .catch(() => {
    document.body.style.visibility = "visible";
  });

function loadReCaptcha() {
  if (window.grecaptcha) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.grecaptcha) window.grecaptcha.ready(resolve);
      else resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

loadReCaptcha().then(() => {
  fetch(`${API_BASE}/api/config/public`)
    .then(res => res.json())
    .then(config => {
      if (config.recaptchaSiteKey && window.grecaptcha) {
        recaptchaWidgetId = grecaptcha.render("recaptchaContainer", {
          sitekey: config.recaptchaSiteKey
        });
      }
    })
    .catch(e => console.error("Failed to load captcha config", e));
});

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
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password, captchaToken })
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Không thể đăng nhập.");
    }

    // The session token itself is now an httpOnly cookie set by the server —
    // only non-sensitive display info is kept client-side.
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
