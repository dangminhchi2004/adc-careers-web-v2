loadOptionalBackgrounds();

const jobName = new URLSearchParams(window.location.search).get("job");
if (jobName) {
  document.getElementById("thankYouMessage").textContent =
    `Hồ sơ ứng tuyển vị trí ${jobName} đã được ghi nhận. Đội ngũ P&O sẽ liên hệ khi có cập nhật phù hợp.`;
}

const HOME_URL = "index.html#top";
let redirectSecondsLeft = 5;
const redirectSecondsEl = document.getElementById("redirectSeconds");
const redirectNowBtn = document.getElementById("redirectNowBtn");

function goHome() {
  window.location.href = HOME_URL;
}

const redirectTimer = setInterval(() => {
  redirectSecondsLeft -= 1;
  if (redirectSecondsEl) redirectSecondsEl.textContent = redirectSecondsLeft;
  if (redirectSecondsLeft <= 0) {
    clearInterval(redirectTimer);
    goHome();
  }
}, 1000);

if (redirectNowBtn) {
  redirectNowBtn.addEventListener("click", () => {
    clearInterval(redirectTimer);
    goHome();
  });
}
