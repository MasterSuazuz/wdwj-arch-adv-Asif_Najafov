/* =========================================================
   DASTURXON — shared front-end logic (demo / mockup only)
   Persists to localStorage so the flow survives page loads:
   register -> login -> profile with an active subscription.
   No real backend: this simulates the MANAGERS / PAYMENT /
   ORDER / DISH / DELIVERY entities from the ERD for the demo.
   ========================================================= */

const DB_KEYS = {
  users: "dast_users",
  session: "dast_session"
};

/* Some browsers (notably Firefox) block localStorage on file:// pages
   and throw instead of failing quietly. We detect that once, keep an
   in-memory fallback so the current tab still works, and let pages
   show a clear warning instead of silently doing nothing. */
let STORAGE_OK = true;
const MEMORY_DB = {};

function safeGet(key){
  try{ return localStorage.getItem(key); }
  catch(e){ STORAGE_OK = false; return MEMORY_DB[key] ?? null; }
}
function safeSet(key, value){
  try{ localStorage.setItem(key, value); return true; }
  catch(e){ STORAGE_OK = false; MEMORY_DB[key] = value; return false; }
}
function safeRemove(key){
  try{ localStorage.removeItem(key); }
  catch(e){ STORAGE_OK = false; delete MEMORY_DB[key]; }
}
function isStorageBlocked(){ return !STORAGE_OK; }

const PLANS = {
  "7":  { id: "7",  label: "7-day plan",  days: 7,  price: 1120000 },
  "14": { id: "14", label: "14-day plan", days: 14, price: 2249000 },
  "30": { id: "30", label: "30-day plan", days: 30, price: 4270000 }
};

const DISH_BANK = [
  { name: "Steamed rice & grilled chicken", qty: 1, allergy: null },
  { name: "Lentil soup with herb oil", qty: 1, allergy: "Contains celery" },
  { name: "Buckwheat, beef & vegetables", qty: 1, allergy: null },
  { name: "Fresh salad with tahini dressing", qty: 1, allergy: "Contains sesame" }
];

function fmtSum(n){
  return n.toLocaleString("en-US").replace(/,/g, " ") + " UZS";
}

function readUsers(){
  try{ return JSON.parse(safeGet(DB_KEYS.users)) || []; }
  catch(e){ return []; }
}
function writeUsers(list){ return safeSet(DB_KEYS.users, JSON.stringify(list)); }

function getSession(){
  try{ return JSON.parse(safeGet(DB_KEYS.session)); }
  catch(e){ return null; }
}
function setSession(email){ return safeSet(DB_KEYS.session, JSON.stringify({ email })); }
function clearSession(){ safeRemove(DB_KEYS.session); }

function findUser(email){
  return readUsers().find(u => u.email.toLowerCase() === String(email).toLowerCase());
}

/* Builds a demo order (dishes + delivery) for a freshly bought plan,
   mirroring ORDER -> contains -> DISH and ORDER -> has -> DELIVERY */
function buildDemoOrder(planId){
  const plan = PLANS[planId] || PLANS["7"];
  const today = new Date();
  const dishes = DISH_BANK.slice(0, 3).map((d, i) => ({ ...d, seq: i + 1 }));
  return {
    orderId: "ORD-" + Math.floor(1000 + Math.random() * 9000),
    orderDate: today.toISOString().slice(0, 10),
    status: "In progress",
    dishes,
    delivery: {
      status: "Assigned to courier",
      assignedTime: "Today, 12:30",
      deliveredTime: "—",
      clientAddress: "Tashkent, Chilonzor district, house 14"
    }
  };
}

function registerUser({ fullName, email, phone, password, planId }){
  if (isStorageBlocked()){
    return { ok: false, error: "Your browser is blocking local storage for this page (see the banner above), so the account can't be saved. Open the project through a local server instead." };
  }

  const users = readUsers();
  if (findUser(email)) return { ok: false, error: "An account with this email already exists." };

  const plan = PLANS[planId] || PLANS["7"];
  const startDate = new Date();
  const user = {
    fullName, email, phone, password, // demo only — never do this in production
    createdAt: startDate.toISOString().slice(0, 10),
    subscription: {
      planId: plan.id,
      planLabel: plan.label,
      days: plan.days,
      price: plan.price,
      startDate: startDate.toISOString().slice(0, 10),
      daysUsed: 1
    },
    order: buildDemoOrder(plan.id)
  };
  users.push(user);
  const savedUsers = writeUsers(users);
  const savedSession = setSession(email);
  if (!savedUsers || !savedSession){
    return { ok: false, error: "Couldn't save the account in this browser. Open the project through a local server and try again." };
  }
  return { ok: true };
}

function loginUser({ email, password }){
  if (isStorageBlocked()){
    return { ok: false, error: "Your browser is blocking local storage for this page (see the banner above), so we can't check saved accounts here." };
  }
  const user = findUser(email);
  if (!user) return { ok: false, error: "We couldn't find an account with that email." };
  if (user.password !== password) return { ok: false, error: "Incorrect password. Please try again." };
  const saved = setSession(email);
  if (!saved) return { ok: false, error: "Couldn't start a session in this browser. Open the project through a local server and try again." };
  return { ok: true };
}

function subscribeCurrentUser(planId){
  const session = getSession();
  if (!session) return { ok: false };
  const users = readUsers();
  const user = users.find(u => u.email.toLowerCase() === session.email.toLowerCase());
  if (!user) return { ok: false };
  const plan = PLANS[planId] || PLANS["7"];
  user.subscription = {
    planId: plan.id, planLabel: plan.label, days: plan.days, price: plan.price,
    startDate: new Date().toISOString().slice(0, 10), daysUsed: 1
  };
  user.order = buildDemoOrder(plan.id);
  writeUsers(users);
  return { ok: true };
}

function logout(){ clearSession(); window.location.href = "main.html"; }

/* Runs once per page load: writes and reads back a throwaway key to
   find out — before the person fills any form — whether this browser
   will actually let register/login persist across pages. */
function checkStorageAvailable(){
  try{
    localStorage.setItem("dast_probe", "1");
    localStorage.removeItem("dast_probe");
    return true;
  }catch(e){
    STORAGE_OK = false;
    return false;
  }
}

function renderStorageWarningIfNeeded(){
  if (checkStorageAvailable()) return;
  const bar = document.createElement("div");
  bar.style.cssText =
    "background:#C6572A;color:#F4EFE3;font:600 13px/1.5 var(--sans),sans-serif;" +
    "text-align:center;padding:10px 16px;position:sticky;top:0;z-index:200;";
  bar.textContent =
    "This browser is blocking local storage for files opened directly (file://). " +
    "Registration/profile data won't be saved. Open the project through a local " +
    "server instead — see uid/readme.md — or try Chrome/Edge.";
  document.body.prepend(bar);
}

/* ---------- shared UI wiring, runs on every page ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderStorageWarningIfNeeded();

  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector("nav.main-nav");
  if (toggle && nav){
    toggle.addEventListener("click", () => nav.classList.toggle("open"));
  }

  // Highlight current page in nav
  const here = window.location.pathname.split("/").pop() || "main.html";
  document.querySelectorAll("nav.main-nav a[data-nav]").forEach(a => {
    if (a.getAttribute("data-nav") === here.replace(".html", "")) a.classList.add("active");
  });

  // Swap "My Profile" nav target isn't needed — profile.html itself
  // shows the logged-out state, so every page can link there directly.
});

function showToast(msg){
  let toast = document.querySelector(".toast");
  if (!toast){
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 2600);
}

function openModal(id){ document.getElementById(id)?.classList.add("open"); }
function closeModal(id){ document.getElementById(id)?.classList.remove("open"); }
