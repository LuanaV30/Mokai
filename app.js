(() => {
  "use strict";

  const PRODUCTS = [
    { id: "sake", name: "Combinado Sake", price: 89.9, cat: "combinados", tag: "Mais pedido",
      desc: "10 sashimis, 8 niguiris e 12 uramakis selecionados pelo chef.",
      img: "images/combinado-sake.jpg", tone: "linear-gradient(135deg,#6b3b1d,#d98a45 60%,#2a1a10)" },
    { id: "niguiri", name: "Seleção Niguiri", price: 54.9, cat: "sashimis", tag: "Chef's Choice",
      desc: "Salmão, atum e peixe branco sobre arroz temperado. 12 unidades.",
      img: "images/selecao-niguiri.jpg", tone: "linear-gradient(135deg,#0a0a0a,#2b2b2b 60%,#e0653a)" },
    { id: "uramaki", name: "Uramaki Especial", price: 42.9, cat: "uramakis", tag: "Novidade",
      desc: "Salmão, avocado, crispy de alho-poró e molho tarê. 10 unidades.",
      img: "images/uramaki-especial.jpg", tone: "linear-gradient(135deg,#3a2a14,#e6b43a 55%,#4b1f10)" },
    { id: "sashimi", name: "Sashimi Salmão", price: 49.9, cat: "sashimis", tag: "",
      desc: "Cortes frescos de salmão premium. 12 unidades.",
      img: "images/sashimi-salmao.jpg", tone: "linear-gradient(135deg,#111,#c4553a 60%,#f2c36b)" },
    { id: "hotroll", name: "Hot Roll Yasai", price: 36.9, cat: "quentes", tag: "",
      desc: "Roll empanado, cream cheese, cebolinha e tarê. 10 unidades.",
      img: "images/hot-roll-yasai.jpg", tone: "linear-gradient(135deg,#1a1a1a,#c9752b 60%,#f3b05a)" },
    { id: "temaki", name: "Temaki de Salmão", price: 29.9, cat: "temakis", tag: "",
      desc: "Salmão fresco, cebolinha e cream cheese no nori crocante.",
      img: "images/temaki-salmao.jpg", tone: "linear-gradient(135deg,#0d0d0d,#3a3a3a 55%,#d8452f)" },
  ];

  const SEED_ORDERS = [
    { id: "NR2048", status: "entregue", date: "18 mai, 20:42", desc: "Combinado Sake, Temaki de Salmão e Coca-Cola", total: 142.7, lines: { sake: 1, temaki: 1 } },
    { id: "NR1982", status: "entregue", date: "03 mai, 19:18", desc: "Seleção Niguiri e Hot Roll Yasai", total: 91.8, lines: { niguiri: 1, hotroll: 1 } },
    { id: "NR1844", status: "cancelado", date: "12 abr, 21:05", desc: "Sashimi Salmão", total: 49.9, lines: {} },
  ];

  const DEFAULT_PROFILE = {
    nome: "Marina Lima", cpf: "123.456.789-00", email: "marina@email.com", cel: "(11) 99999-1234",
    cep: "05435-000", end: "Rua Harmonia", num: "123", comp: "Apto 42", bairro: "Vila Madalena", cidade: "São Paulo",
  };

  const FREE_SHIPPING_FROM = 120;
  const SHIPPING_FEE = 8.9;
  const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const money = (n) => "R$ " + n.toFixed(2).replace(".", ",");
  const byId = (id) => PRODUCTS.find((p) => p.id === id);
  const norm = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();


  /* ---------- Tema claro e escuro ---------- */
  function applyTheme(theme) {
    const isDark = theme === "dark";
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    store.set("theme", isDark ? "dark" : "light");

    const button = $("#themeToggle");
    if (!button) return;

    button.setAttribute("aria-pressed", String(isDark));
    button.setAttribute("aria-label", isDark ? "Ativar tema claro" : "Ativar tema escuro");
    button.title = isDark ? "Ativar tema claro" : "Ativar tema escuro";
    const label = $(".theme-toggle__label", button);
    if (label) label.textContent = isDark ? "Tema claro" : "Tema escuro";
  }

  function initTheme() {
    const savedTheme = store.get("theme", "light");
    applyTheme(savedTheme);

    $("#themeToggle")?.addEventListener("click", () => {
      const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
    });
  }

  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem("mokai:" + key); return v ? JSON.parse(v) : fallback; }
      catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem("mokai:" + key, JSON.stringify(value)); } catch { /* ignore */ }
    },
  };

  let cart = store.get("cart", {});
  let orders = store.get("orders", SEED_ORDERS);
  let profile = { ...DEFAULT_PROFILE, ...store.get("profile", {}) };
  let user = store.get("user", null);
  let filter = { cat: "todos", q: "" };

  let toastTimer;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("is-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-show"), 2200);
  }

  const PLUS = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';

  function cardHTML(p) {
    return `
      <article class="card">
        <div class="card__media" style="background-image:url('${p.img}'), ${p.tone}">
          ${p.tag ? `<span class="tag">${p.tag}</span>` : ""}
          <button class="add" type="button" data-add="${p.id}" aria-label="Adicionar ${p.name} ao carrinho">${PLUS}</button>
        </div>
        <div class="card__row"><h3>${p.name}</h3><strong>${money(p.price)}</strong></div>
        <p>${p.desc}</p>
      </article>`;
  }

  function renderFeatured() {
    if (!$("#featuredGrid")) return;
    $("#featuredGrid").innerHTML = PRODUCTS.slice(0, 3).map(cardHTML).join("");
  }

  function renderProducts() {
    if (!$("#productsGrid")) return;
    const q = norm(filter.q.trim());
    const list = PRODUCTS.filter((p) =>
      (filter.cat === "todos" || p.cat === filter.cat) &&
      (!q || norm(p.name + " " + p.desc).includes(q))
    );
    $("#productsGrid").innerHTML = list.map(cardHTML).join("");
    $("#count").textContent = `${list.length} ${list.length === 1 ? "produto encontrado" : "produtos encontrados"}`;
    $("#noResults").hidden = list.length > 0;
  }

  const cartCount = () => Object.values(cart).reduce((a, b) => a + b, 0);
  const cartSubtotal = () => Object.entries(cart).reduce((s, [id, q]) => s + (byId(id)?.price || 0) * q, 0);

  function saveCart() { store.set("cart", cart); renderCartBadge(); }

  function addToCart(id, qty = 1) {
    if (!byId(id)) return;
    cart[id] = (cart[id] || 0) + qty;
    saveCart();
    renderCart();
  }

  function setQty(id, qty) {
    if (qty <= 0) delete cart[id]; else cart[id] = Math.min(qty, 99);
    saveCart();
    renderCart();
  }

  function renderCartBadge() {
    const n = cartCount();
    const badge = $("#cartCount");
    badge.textContent = n > 99 ? "99+" : n;
    badge.hidden = n === 0;
  }

  function addressLine() {
    const p = profile;
    return `${p.end}, ${p.num}${p.comp ? " — " + p.comp : ""} · ${p.bairro}, ${p.cidade}`;
  }

  function renderCart() {
    if (!$("#cartEmpty")) return;
    const ids = Object.keys(cart).filter(byId);
    const empty = ids.length === 0;
    $("#cartEmpty").hidden = !empty;
    $("#cartFilled").hidden = empty;
    if (empty) return;

    $("#cartItems").innerHTML = ids.map((id) => {
      const p = byId(id), q = cart[id];
      return `
        <div class="cart-item">
          <div class="cart-item__img" style="background-image:url('${p.img}'), ${p.tone}"></div>
          <div><h3>${p.name}</h3><small>${money(p.price)} cada</small></div>
          <div class="cart-item__side">
            <span class="cart-item__price">${money(p.price * q)}</span>
            <div class="qty" role="group" aria-label="Quantidade de ${p.name}">
              <button type="button" data-dec="${id}" aria-label="Diminuir">−</button>
              <span>${q}</span>
              <button type="button" data-inc="${id}" aria-label="Aumentar">+</button>
            </div>
          </div>
        </div>`;
    }).join("");

    const sub = cartSubtotal();
    const ship = sub >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;
    $("#sumSub").textContent = money(sub);
    $("#sumShip").textContent = ship === 0 ? "Grátis" : money(ship);
    $("#sumTotal").textContent = money(sub + ship);
    $("#freeBar").style.width = Math.min(100, (sub / FREE_SHIPPING_FROM) * 100) + "%";
    $("#freeMsg").textContent = ship === 0
      ? "Você ganhou frete grátis!"
      : `Faltam ${money(FREE_SHIPPING_FROM - sub)} para frete grátis.`;
    $("#sumAddr").textContent = "Entrega em: " + addressLine();
  }

  function checkout() {
    if (!cartCount()) return;
    if (!user) {
      toast("Entre na sua conta para finalizar o pedido.");
      openModal();
      return;
    }
    const ids = Object.keys(cart).filter(byId);
    const sub = cartSubtotal();
    const total = sub + (sub >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE);
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    orders.unshift({
      id: "NR" + (2049 + orders.length + Math.floor(Math.random() * 40)),
      status: "preparo",
      date: `${pad(now.getDate())} ${MONTHS[now.getMonth()]}, ${pad(now.getHours())}:${pad(now.getMinutes())}`,
      desc: ids.map((id) => (cart[id] > 1 ? `${cart[id]}x ` : "") + byId(id).name).join(", "),
      total,
      lines: { ...cart },
    });
    store.set("orders", orders);
    cart = {};
    saveCart();
    renderCart();
    renderOrders();
    sessionStorage.setItem("mokai:toast", "Pedido confirmado! Já estamos preparando.");
    location.href = "pedidos.html";
  }

  const STATUS = {
    entregue: ["Entregue", "badge--ok"],
    cancelado: ["Cancelado", "badge--cancel"],
    preparo: ["Em preparo", "badge--prep"],
  };
  const DOC = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>';

  function renderOrders() {
    if (!$("#ordersList")) return;
    $("#ordersList").innerHTML = orders.map((o) => {
      const [label, cls] = STATUS[o.status] || STATUS.entregue;
      const canReorder = o.status !== "cancelado" && Object.keys(o.lines || {}).length;
      return `
        <article class="order">
          <div class="order__icon">${DOC}</div>
          <div>
            <div class="order__head"><strong>#${o.id}</strong><span class="badge ${cls}">${label}</span></div>
            <p class="order__date">${o.date}</p>
            <p class="order__desc">${o.desc}</p>
          </div>
          <div class="order__side">
            <span class="order__total">${money(o.total)}</span>
            ${canReorder ? `<button class="btn-pill btn-pill--sm" type="button" data-reorder="${o.id}">Pedir novamente</button>` : ""}
          </div>
        </article>`;
    }).join("");
  }

  function reorder(id) {
    const o = orders.find((x) => x.id === id);
    if (!o) return;
    Object.entries(o.lines).forEach(([pid, q]) => { if (byId(pid)) cart[pid] = (cart[pid] || 0) + q; });
    saveCart();
    renderCart();
    sessionStorage.setItem("mokai:toast", "Itens adicionados ao carrinho.");
    location.href = "carrinho.html";
  }

  function fillProfile() {
    if (!$("#profileForm")) return;
    const form = $("#profileForm");
    Object.entries(profile).forEach(([k, v]) => { if (form.elements[k]) form.elements[k].value = v; });
    const first = profile.nome.trim().split(/\s+/)[0] || "";
    $("#helloName").textContent = first;
    $("#sideName").textContent = profile.nome;
    $(".avatar").textContent = (first[0] || "M").toUpperCase();
    $("#addrLine").textContent = `${profile.end}, ${profile.num}${profile.comp ? " — " + profile.comp : ""}`;
    $("#addrCity").textContent = `${profile.bairro} · ${profile.cidade} · CEP ${profile.cep}`;
  }

  const maskCPF = (v) => v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  const maskCEP = (v) => v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
  const maskPhone = (v) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d ? "(" + d : "";
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };

  function setTab(name) {
    $$(".ptab").forEach((b) => b.classList.toggle("is-active", b.dataset.tab === name));
    $$(".panel").forEach((p) => p.classList.toggle("is-active", p.dataset.panel === name));
  }

  function initProfile() {
    if (!$("#profileForm")) return;
    fillProfile();
    const form = $("#profileForm");
    form.elements.cpf.addEventListener("input", (e) => (e.target.value = maskCPF(e.target.value)));
    form.elements.cep.addEventListener("input", (e) => (e.target.value = maskCEP(e.target.value)));
    form.elements.cel.addEventListener("input", (e) => (e.target.value = maskPhone(e.target.value)));

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      if (!data.nome.trim()) { toast("Informe seu nome completo."); form.elements.nome.focus(); return; }
      if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) { toast("E-mail inválido."); form.elements.email.focus(); return; }
      profile = { ...profile, ...data };
      store.set("profile", profile);
      fillProfile();
      renderCart();
      toast("Alterações salvas.");
    });

    $$(".ptab").forEach((b) => b.addEventListener("click", () => setTab(b.dataset.tab)));
    $("#editAddr").addEventListener("click", () => { setTab("dados"); form.elements.cep.focus(); });

    const prefs = store.get("prefs", {});
    $$("[data-pref]").forEach((c) => {
      if (c.dataset.pref in prefs) c.checked = prefs[c.dataset.pref];
      c.addEventListener("change", () => {
        prefs[c.dataset.pref] = c.checked;
        store.set("prefs", prefs);
        toast("Preferência atualizada.");
      });
    });
  }

  let registerMode = false;
  let lastFocus = null;

  function setMode(register) {
    registerMode = register;
    $("#modalEyebrow").textContent = register ? "Faça parte" : "Bem-vindo de volta";
    $("#modalTitle").textContent = register ? "Criar conta" : "Entrar";
    $("#nameField").hidden = !register;
    $("#loginSubmit").textContent = register ? "Criar minha conta" : "Entrar na minha conta";
    $("#toggleMode").textContent = register ? "Já tenho uma conta" : "Criar uma conta";
    $("#l-pass").autocomplete = register ? "new-password" : "current-password";
    $("#loginError").hidden = true;
  }

  function openModal() {
    if (user) { location.href = "perfil.html"; return; }
    lastFocus = document.activeElement;
    setMode(false);
    $("#loginModal").hidden = false;
    document.body.style.overflow = "hidden";
    setTimeout(() => $("#l-email").focus(), 30);
  }

  function closeModal() {
    $("#loginModal").hidden = true;
    document.body.style.overflow = "";
    $("#loginForm").reset();
    lastFocus?.focus?.();
  }

  function renderUser() {
    $("#loginLabel").textContent = user ? user.name.split(" ")[0] : "Entrar";
  }

  function initLogin() {
    $("#loginBtn").addEventListener("click", openModal);
    $$("[data-close]").forEach((el) => el.addEventListener("click", closeModal));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#loginModal").hidden) closeModal(); });
    $("#toggleMode").addEventListener("click", () => setMode(!registerMode));
    $("#forgotBtn").addEventListener("click", () => {
      const email = $("#l-email").value.trim();
      toast(email ? `Enviamos um link de recuperação para ${email}.` : "Digite seu e-mail para recuperar a senha.");
      if (!email) $("#l-email").focus();
    });

    $("#loginForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const email = $("#l-email").value.trim();
      const pass = $("#l-pass").value;
      const name = $("#l-nome").value.trim();
      const err = $("#loginError");
      let msg = "";
      if (registerMode && !name) msg = "Informe seu nome.";
      else if (!/^\S+@\S+\.\S+$/.test(email)) msg = "Digite um e-mail válido.";
      else if (pass.length < 6) msg = "A senha deve ter ao menos 6 caracteres.";
      if (msg) { err.textContent = msg; err.hidden = false; return; }

      // Demo: sem backend, a sessão fica só no navegador.
      user = { name: registerMode ? name : (profile.email === email ? profile.nome : email.split("@")[0]), email };
      store.set("user", user);
      renderUser();
      closeModal();
      toast(registerMode ? "Conta criada com sucesso!" : "Bem-vindo de volta!");
    });
  }

  /* ---------- Página atual ---------- */
  function markPage() {
    const page = document.body.dataset.page || "home";
    $$("[data-nav]").forEach((a) => a.classList.toggle("is-active", a.dataset.nav === page));
    $("#cartBtn").classList.toggle("is-active", page === "carrinho");
    const pending = sessionStorage.getItem("mokai:toast");
    if (pending) { sessionStorage.removeItem("mokai:toast"); setTimeout(() => toast(pending), 250); }
  }

  /* ---------- Eventos globais ---------- */
  document.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]");
    if (add) {
      const p = byId(add.dataset.add);
      addToCart(p.id);
      toast(`${p.name} adicionado ao carrinho.`);
      return;
    }
    const inc = e.target.closest("[data-inc]");
    if (inc) return setQty(inc.dataset.inc, (cart[inc.dataset.inc] || 0) + 1);
    const dec = e.target.closest("[data-dec]");
    if (dec) return setQty(dec.dataset.dec, (cart[dec.dataset.dec] || 0) - 1);
    const re = e.target.closest("[data-reorder]");
    if (re) return reorder(re.dataset.reorder);
  });

  /* ---------- Init ---------- */
  function init() {
    initTheme();
    renderFeatured();
    renderProducts();
    renderOrders();
    renderCart();
    renderCartBadge();
    renderUser();
    initProfile();
    initLogin();

    $("#chips")?.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      filter.cat = chip.dataset.cat;
      $$(".chip").forEach((c) => c.classList.toggle("is-active", c === chip));
      renderProducts();
    });
    $("#searchInput")?.addEventListener("input", (e) => { filter.q = e.target.value; renderProducts(); });

    $("#checkoutBtn")?.addEventListener("click", checkout);
    $("#clearCart")?.addEventListener("click", () => { cart = {}; saveCart(); renderCart(); toast("Carrinho esvaziado."); });

    window.addEventListener("storage", () => { cart = store.get("cart", {}); renderCart(); renderCartBadge(); });
    markPage();
  }

  init();
})();
