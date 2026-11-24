/* ORBITA bulut qatlami: Google bilan kirish, profilni saqlash va umumiy reyting (Firebase). */
(function () {
  var STATE_KEY = "orbita-profile-v1", SESSION_KEY = "orbita-session-v1";
  var FB = "https://www.gstatic.com/firebasejs/10.14.1/";
  var cfg = window.ORBITA_FIREBASE || {};
  var enabled = !!(cfg.apiKey && cfg.projectId && cfg.authDomain && cfg.appId);
  window.__orbitaPlayers = [];
  var api = null, user = null, ready = false, timer = null, wantGoogleLogin = false;

  // localStorage yozuvlarini kuzatish (ilova boshlanishidan oldin ulanadi)
  var nativeSet = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) {
    nativeSet.call(this, k, v);
    if (this === window.localStorage && k === STATE_KEY) schedule();
  };
  if (!enabled) return;

  function readState() { try { return JSON.parse(localStorage.getItem(STATE_KEY) || "null"); } catch (e) { return null; } }
  function schedule() { if (!user || !ready) return; clearTimeout(timer); timer = setTimeout(push, 1800); }

  function push() {
    var s = readState(); if (!s || !s.profile || !user) return;
    var p = s.profile;
    var cloud = JSON.parse(JSON.stringify(s)); if (cloud.profile) cloud.profile.avatarImage = null;
    var json = JSON.stringify(cloud);
    if (json.length < 800000) api.setDoc(api.doc(api.db, "users", user.uid), { state: json, updatedAt: Date.now() }).catch(warn);
    var ref = api.doc(api.db, "players", user.uid);
    if (p.hideFromRating || !p.name) { api.deleteDoc(ref).catch(warn); return; }
    api.setDoc(ref, {
      name: String(p.name).slice(0, 16), title: String(p.title || "").slice(0, 40),
      level: Math.max(1, Math.min(100, p.level | 0)), xp: Math.max(0, Math.min(1e7, p.xp | 0)),
      avatar: String(p.avatar || "").slice(0, 8), avatarFrame: String(p.avatarFrame || "rounded").slice(0, 24),
      rankIndex: Math.max(0, Math.min(20, p.rankIndex | 0)), updatedAt: Date.now()
    }).catch(warn);
  }
  function warn(e) { console.warn("[ORBITA cloud]", e && e.code || e); }

  function publish(docs) {
    var me = user && user.uid;
    window.__orbitaPlayers = docs.filter(function (d) { return d.id !== me; }).map(function (d) {
      var x = d.data(); return { id: d.id, name: x.name, title: x.title, level: x.level, xp: x.xp, avatar: x.avatar, avatarFrame: x.avatarFrame, rankIndex: x.rankIndex };
    });
    window.dispatchEvent(new Event("orbita-players"));
  }

  async function restore() {
    try {
      var snap = await api.getDoc(api.doc(api.db, "users", user.uid));
      if (snap.exists()) {
        var cloud = JSON.parse(snap.data().state), local = readState();
        var cx = cloud && cloud.profile ? cloud.profile.xp | 0 : -1, lx = local && local.profile ? local.profile.xp | 0 : -1;
        var guard = "orbita-restored-" + user.uid;
        if (cx > lx && !sessionStorage.getItem(guard)) {
          sessionStorage.setItem(guard, "1");
          if (local && local.profile && local.profile.avatarImage) cloud.profile.avatarImage = local.profile.avatarImage;
          nativeSet.call(localStorage, STATE_KEY, JSON.stringify(cloud));
          nativeSet.call(localStorage, SESSION_KEY, String(cloud.profile.name || user.displayName || "Sayyoh").slice(0, 16));
          location.reload(); return false;
        }
      }
    } catch (e) { warn(e); }
    return true;
  }

  function googleLogin() {
    wantGoogleLogin = true;
    api.signInWithPopup(api.auth, new api.GoogleAuthProvider()).catch(function (e) {
      wantGoogleLogin = false; toast(e && e.code === "auth/popup-closed-by-user" ? "" : "Google orqali kirib bo‘lmadi. Qayta urinib ko‘ring.");
    });
  }
  function toast(msg) {
    if (!msg) return;
    var t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg;
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3200);
  }
  var GICON = '<svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z"/><path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 010-9.4l-7.9-6.1a24 24 0 000 21.6l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.9 2.3-8.5 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>';

  function tick() {
    if (!api) return;
    var login = document.querySelector(".login-screen");
    if (login) {
      var submit = login.querySelector(".login-submit");
      if (submit && !login.querySelector("[data-g-login]")) {
        var b = document.createElement("button"); b.className = "btn-secondary login-submit"; b.setAttribute("data-g-login", "1");
        b.style.marginTop = "10px"; b.style.width = "100%"; b.type = "button"; b.innerHTML = GICON + " Google bilan kirish";
        b.onclick = googleLogin; submit.insertAdjacentElement("afterend", b);
      }
      if (user && ready && (wantGoogleLogin || !sessionStorage.getItem("orbita-signed-out"))) {
        var input = login.querySelector("#login-nickname");
        if (input && submit && !input.dataset.filled) {
          input.dataset.filled = "1";
          var saved = readState(); var nick = (saved && saved.profile && saved.profile.name) || user.displayName || (user.email || "Sayyoh").split("@")[0];
          Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, String(nick).slice(0, 16));
          input.dispatchEvent(new Event("input", { bubbles: true }));
          setTimeout(function () { submit.click(); wantGoogleLogin = false; }, 50);
        }
      }
    } else {
      var right = document.querySelector(".topbar-right");
      var chip = document.getElementById("g-link");
      if (right && !user && !chip) {
        chip = document.createElement("button"); chip.id = "g-link"; chip.className = "currency-chip"; chip.type = "button";
        chip.innerHTML = GICON + " <span>Google bilan ulash</span>"; chip.title = "Natijalaringiz saqlanadi va reytingda ko‘rinasiz";
        chip.onclick = googleLogin; right.insertBefore(chip, right.firstChild);
      } else if (chip && user) chip.remove();
    }
  }

  document.addEventListener("click", function (e) {
    var so = e.target.closest && e.target.closest(".profile-signout");
    if (so && api && user) { sessionStorage.setItem("orbita-signed-out", "1"); api.signOut(api.auth).catch(warn); }
  }, true);

  Promise.all([import(FB + "firebase-app.js"), import(FB + "firebase-auth.js"), import(FB + "firebase-firestore.js")]).then(function (m) {
    var app = m[0].initializeApp(cfg), A = m[1], F = m[2];
    api = {
      auth: A.getAuth(app), db: F.getFirestore(app), GoogleAuthProvider: A.GoogleAuthProvider, signInWithPopup: A.signInWithPopup, signOut: A.signOut,
      doc: F.doc, getDoc: F.getDoc, setDoc: F.setDoc, deleteDoc: F.deleteDoc
    };
    api.auth.languageCode = "uz";
    F.onSnapshot(F.query(F.collection(api.db, "players"), F.orderBy("xp", "desc"), F.limit(100)), function (s) { publish(s.docs); }, warn);
    A.onAuthStateChanged(api.auth, async function (u) {
      user = u; ready = false;
      if (u) { sessionStorage.removeItem("orbita-signed-out"); ready = await restore(); if (ready) { push(); } }
      publish([]); tick();
    });
    new MutationObserver(function () { requestAnimationFrame(tick); }).observe(document.getElementById("root") || document.body, { childList: true, subtree: true });
    tick();
  }).catch(warn);
})();
