(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const REGISTER_SUCCESS_KEY = "codelib_register_success";
  const USERS_KEY = "codelib.users";
  const SESSION_KEY = "codelib.session";
  const SESSION_KEY_TEMP = "codelib.session.temp";

  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  // Show success alert on login page after successful register flow
  if ($("#loginForm") && sessionStorage.getItem(REGISTER_SUCCESS_KEY) === "1") {
    alert("Tạo tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ.");
    sessionStorage.removeItem(REGISTER_SUCCESS_KEY);
  }

  const safeJsonParse = (raw, fallback) => {
    try {
      if (raw == null) return fallback;
      const val = JSON.parse(raw);
      return val ?? fallback;
    } catch {
      return fallback;
    }
  };

  const normalizeEmail = (s) => String(s || "").trim().toLowerCase();
  const normalizeUsername = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, "");

  const getUsers = () => {
    const list = safeJsonParse(localStorage.getItem(USERS_KEY), []);
    return Array.isArray(list) ? list : [];
  };
  const saveUsers = (users) => localStorage.setItem(USERS_KEY, JSON.stringify(users));

  const setAuthAlert = (form, message, variant = "danger") => {
    if (!form) return;
    let holder = form.querySelector("[data-auth-alert]");
    if (!holder) {
      holder = document.createElement("div");
      holder.setAttribute("data-auth-alert", "1");
      holder.className = "alert alert-" + variant + " py-2 small";
      holder.setAttribute("role", "alert");
      form.prepend(holder);
    }
    holder.className = "alert alert-" + variant + " py-2 small";
    holder.textContent = message;
  };

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

  const setSession = ({ username, email }, remember) => {
    const session = { username, email, ts: Date.now() };
    if (remember) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      sessionStorage.removeItem(SESSION_KEY_TEMP);
    } else {
      sessionStorage.setItem(SESSION_KEY_TEMP, JSON.stringify(session));
    }
  };

  // Login (localStorage users)
  $("#loginForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }
    const email = normalizeEmail(form.email?.value);
    const password = String(form.password?.value ?? "");
    const remember = !!$("#rememberMe")?.checked;

    const users = getUsers();
    const hit = users.find((u) => normalizeEmail(u.email) === email);
    if (!hit || String(hit.password) !== password) {
      setAuthAlert(form, "Email hoặc mật khẩu không đúng.");
      pulse(form.querySelector('button[type="submit"]'));
      return;
    }

    setSession({ username: hit.username, email: hit.email }, remember);
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    pulse(btn);
    setTimeout(() => {
      btn.disabled = false;
      // login.html lives in `Login and register/html/` → main is `../../main/main.html`
      window.location.href = "../../main/main.html";
    }, 450);
  });

  // Register (save to localStorage)
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

    const fullname = String(form.fullname?.value ?? "").trim();
    const usernameRaw = String(form.username?.value ?? "");
    const username = normalizeUsername(usernameRaw);
    const email = normalizeEmail(form.email?.value);
    const password = String(form.password?.value ?? "");

    if (username.length < 3) {
      setAuthAlert(form, "Tên người dùng phải tối thiểu 3 ký tự.");
      return;
    }
    if (!/^[a-z0-9._-]+$/i.test(username)) {
      setAuthAlert(form, "Tên người dùng chỉ nên gồm chữ/số và . _ -");
      return;
    }

    const users = getUsers();
    if (users.some((u) => normalizeUsername(u.username) === username)) {
      setAuthAlert(form, "Username đã tồn tại. Vui lòng chọn tên khác.");
      return;
    }
    if (users.some((u) => normalizeEmail(u.email) === email)) {
      setAuthAlert(form, "Email đã được dùng. Vui lòng dùng email khác.");
      return;
    }

    users.push({ fullname, username, email, password, createdAt: Date.now() });
    saveUsers(users);

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

