/* ============================================
   Точка входу Вітерця
   ============================================ */

document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("viterecz_player");
  if (saved && CHARACTERS.some(c => c.id === saved)) {
    UI.playerId = saved;
    engine.state[saved].online = true;
    UI.applyTheme();
    UI.refreshAll();
  } else {
    localStorage.removeItem("viterecz_player");
    UI.showCharacterSelect();
  }

  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => UI.switchView(btn.dataset.view));
  });

  document.querySelectorAll(".profile-tabs .tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".profile-tabs .tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      UI.renderProfileTab(tab.dataset.tab);
    });
  });

  const searchPosts = document.getElementById("search-posts");
  if (searchPosts) {
    let t;
    searchPosts.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(() => UI.renderFeed(searchPosts.value.trim()), 200);
    });
  }

  const searchPeople = document.getElementById("search-people");
  if (searchPeople) {
    let t2;
    searchPeople.addEventListener("input", () => {
      clearTimeout(t2);
      t2 = setTimeout(() => UI.renderMessagesList(searchPeople.value.trim()), 200);
    });
  }

  document.getElementById("modal-close").onclick = () => {
    document.getElementById("gallery-modal").hidden = true;
  };
  document.getElementById("gallery-modal").onclick = (e) => {
    if (e.target.id === "gallery-modal") e.target.hidden = true;
  };

  setInterval(() => {
    if (UI.playerId) {
      UI.renderMePanel();
      UI.renderOnlineFriends();
    }
  }, 28000);

  setInterval(() => {
    if (UI.playerId && Math.random() > 0.65) {
      engine.maybeAutoPost(UI.playerId);
      if (document.getElementById("view-feed").classList.contains("active")) {
        UI.renderFeed(document.getElementById("search-posts")?.value);
      }
    }
  }, 50000);
});
