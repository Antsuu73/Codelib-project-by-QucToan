(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const REGISTER_SUCCESS_KEY = "codelib_register_success";

  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  // Show success alert on login page after successful register flow
  if ($("#loginForm") && sessionStorage.getItem(REGISTER_SUCCESS_KEY) === "1") {
    alert("Tạo tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ.");
    sessionStorage.removeItem(REGISTER_SUCCESS_KEY);
  }

  // Bootstrap toast (demo-only helpers)
  const toastEl = $("#demoToast");
  const getToast = () => {
    if (!toastEl || !window.bootstrap?.Toast) return null;
    return window.bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 1600 });
  };
  $$('[data-toast="demo"]').forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      getToast()?.show();
    });
  });

  // Toggle password visibility
  $$("[data-toggle-password]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = btn.closest(".input-group")?.querySelector('input[type="password"], input[type="text"]');
      if (!input) return;
      const next = input.type === "password" ? "text" : "password";
      input.type = next;
      const icon = btn.querySelector("i");
      if (icon) icon.className = next === "text" ? "fa-regular fa-eye-slash" : "fa-regular fa-eye";
    });
  });

  const pulse = (el) => {
    if (!el) return;
    el.classList.remove("animate__animated", "animate__pulse");
    void el.offsetWidth;
    el.classList.add("animate__animated", "animate__pulse");
  };

  // Login validation (frontend-only)
  $("#loginForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    pulse(btn);
    setTimeout(() => (btn.disabled = false), 550);
  });

  // Register validation (confirm password)
  $("#registerForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const pw = form.password?.value ?? "";
    const cf = form.confirm?.value ?? "";
    if (form.confirm) form.confirm.setCustomValidity(pw && cf && pw === cf ? "" : "mismatch");

    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    pulse(btn);
    setTimeout(() => {
      btn.disabled = false;
      sessionStorage.setItem(REGISTER_SUCCESS_KEY, "1");
      window.location.href = "./login.html";
    }, 550);
  });
})();

