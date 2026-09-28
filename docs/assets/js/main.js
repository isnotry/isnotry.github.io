/* kingsir.blog — 交互脚本 */
(function () {
  "use strict";

  /* 主题切换：默认浅色，记忆用户选择 */
  var root = document.documentElement;
  var saved = localStorage.getItem("theme");
  if (saved) {
    root.setAttribute("data-theme", saved);
  }
  // 同步按钮图标
  function syncIcon() {
    var t = root.getAttribute("data-theme");
    var sun = document.getElementById("icon-sun");
    var moon = document.getElementById("icon-moon");
    if (!sun || !moon) return;
    if (t === "dark") {
      sun.style.display = "none";
      moon.style.display = "block";
    } else {
      sun.style.display = "block";
      moon.style.display = "none";
    }
  }
  syncIcon();

  var toggle = document.getElementById("theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var cur = root.getAttribute("data-theme");
      var next = cur === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
      syncIcon();
    });
  }

  /* 文章页 TOC：根据正文标题自动生成目录并高亮 */
  var tocList = document.getElementById("toc-list");
  if (tocList) {
    var headings = Array.prototype.slice.call(document.querySelectorAll(".prose h2, .prose h3"));
    if (headings.length) {
      var tocLinks = [];
      headings.forEach(function (h) {
        if (!h.id) {
          h.id = h.textContent.trim().toLowerCase()
            .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
            .replace(/^-+|-+$/g, "");
        }
        var li = document.createElement("li");
        if (h.tagName === "H3") li.style.paddingLeft = "12px";
        var a = document.createElement("a");
        a.href = "#" + h.id;
        a.textContent = h.textContent;
        li.appendChild(a);
        tocList.appendChild(li);
        tocLinks.push(a);
      });
      if ("IntersectionObserver" in window) {
        var obs = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) {
              var id = e.target.id;
              tocLinks.forEach(function (a) {
                a.classList.toggle("active", a.getAttribute("href") === "#" + id);
              });
            }
          });
        }, { rootMargin: "-80px 0px -70% 0px" });
        headings.forEach(function (h) { obs.observe(h); });
      }
    } else {
      var tocEl = document.querySelector(".toc");
      if (tocEl) tocEl.style.display = "none";
    }
  }

  /* 当前导航高亮 */
  var path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach(function (a) {
    var href = a.getAttribute("href");
    if (href === path || (path === "index.html" && href === "index.html")) {
      a.classList.add("active");
    }
  });
})();
