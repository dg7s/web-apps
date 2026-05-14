"use strict";
(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // pages/static/pages/ts/api.ts
  function getCsrfToken() {
    const match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : "";
  }
  async function apiFetch(method, path, body) {
    try {
      const options = {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCsrfToken()
        }
      };
      if (body !== void 0) {
        options.body = JSON.stringify(body);
      }
      const res = await fetch(path, options);
      if (!res.ok) {
        let message = `HTTP ${res.status}`;
        try {
          const err = await res.json();
          message = err.error ?? message;
        } catch {
        }
        return { ok: false, error: message, status: res.status };
      }
      if (res.status === 204) {
        return { ok: true, data: {} };
      }
      const data = await res.json();
      return { ok: true, data };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  }
  var BlogApiClient, api;
  var init_api = __esm({
    "pages/static/pages/ts/api.ts"() {
      "use strict";
      BlogApiClient = class {
        async getPosts(search) {
          const qs = search ? `?search=${encodeURIComponent(search)}` : "";
          return apiFetch("GET", `/api/posts/${qs}`);
        }
        async getPost(id) {
          return apiFetch("GET", `/api/posts/${id}/`);
        }
        async getComments(postId) {
          return apiFetch("GET", `/api/posts/${postId}/comments/`);
        }
        async createComment(postId, payload) {
          return apiFetch("POST", `/api/posts/${postId}/comments/`, payload);
        }
        async updatePost(id, payload) {
          return apiFetch("PATCH", `/api/posts/${id}/`, payload);
        }
        async deleteComment(postId, commentId) {
          return apiFetch("DELETE", `/api/posts/${postId}/comments/${commentId}/`);
        }
      };
      api = new BlogApiClient();
    }
  });

  // pages/static/pages/ts/main.ts
  var require_main = __commonJS({
    "pages/static/pages/ts/main.ts"() {
      init_api();
      function getElement(id) {
        const el = document.getElementById(id);
        if (el === null) {
          throw new Error(`Element #${id} not found`);
        }
        return el;
      }
      var searchInput = getElement("search-input");
      var postList = getElement("post-list");
      var statusBar = getElement("status-bar");
      var sortSelect = getElement("sort-select");
      var state = {
        posts: [],
        query: "",
        status: "idle",
        error: "",
        sortBy: "date",
        focusedIndex: -1
      };
      async function fetchPosts(query = "") {
        const url = query ? `/api/posts/?search=${encodeURIComponent(query)}` : "/api/posts/";
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        const data = await res.json();
        return data.posts;
      }
      function sortPosts(posts, by) {
        return [...posts].sort((a, b) => {
          if (by === "title") return a.title.localeCompare(b.title);
          if (by === "date") return new Date(b.pub_date).getTime() - new Date(a.pub_date).getTime();
          if (by === "category") {
            const catA = a.category;
            const catB = b.category;
            if (!catA && !catB) return 0;
            if (!catA) return 1;
            if (!catB) return -1;
            return catA.localeCompare(catB);
          }
          return 0;
        });
      }
      function validateComment(author, body) {
        const errors = {};
        if (author.length < 2 || author.length > 50) errors.author = "Author must be 2-50 characters.";
        if (body.length < 10 || body.length > 500) errors.body = "Body must be 10-500 characters.";
        if (Object.keys(errors).length > 0) return { valid: false, errors };
        return { valid: true };
      }
      function renderPost(post, isFocused) {
        const article = document.createElement("article");
        article.dataset.id = String(post.id);
        if (isFocused) article.classList.add("focused");
        const heading = document.createElement("h2");
        heading.innerHTML = highlightMatch(post.title, state.query);
        const meta = document.createElement("small");
        const catName = post.category ? post.category : "None";
        meta.textContent = `Category: ${catName} | ${post.pub_date.substring(0, 10)}`;
        meta.style.color = "gray";
        const excerpt = document.createElement("p");
        excerpt.textContent = post.body.slice(0, 120) + "\u2026";
        const fullBody = document.createElement("p");
        fullBody.textContent = post.body;
        fullBody.hidden = true;
        const toggle = document.createElement("button");
        toggle.textContent = "Read more";
        const commentsSection = document.createElement("div");
        commentsSection.hidden = true;
        commentsSection.style.marginTop = "20px";
        commentsSection.style.borderTop = "1px solid #ccc";
        const commentsList = document.createElement("div");
        commentsSection.appendChild(commentsList);
        const renderCommentForm = (container) => {
          const form = document.createElement("form");
          form.style.marginTop = "15px";
          const authorInput = document.createElement("input");
          authorInput.type = "text";
          authorInput.placeholder = "Your name";
          authorInput.required = true;
          const bodyTextarea = document.createElement("textarea");
          bodyTextarea.placeholder = "Your comment";
          bodyTextarea.rows = 3;
          bodyTextarea.required = true;
          const submitBtn = document.createElement("button");
          submitBtn.type = "submit";
          submitBtn.textContent = "Post Comment";
          const feedback = document.createElement("div");
          form.append(authorInput, document.createElement("br"), bodyTextarea, document.createElement("br"), submitBtn, feedback);
          form.addEventListener("submit", async (e) => {
            e.preventDefault();
            feedback.innerHTML = "";
            const author = authorInput.value.trim();
            const body = bodyTextarea.value.trim();
            const validation = validateComment(author, body);
            if (!validation.valid) {
              feedback.innerHTML = `<span style="color: red; font-size: 0.85em;">
                    ${validation.errors.author || ""} <br> ${validation.errors.body || ""}
                </span>`;
              return;
            }
            submitBtn.disabled = true;
            feedback.textContent = "Posting...";
            const result = await api.createComment(post.id, { author, body });
            if (result.ok) {
              feedback.innerHTML = `<span style="color: green;">Comment posted!</span>`;
              form.reset();
              commentsList.appendChild(createCommentNode(result.data));
            } else {
              feedback.innerHTML = `<span style="color: red;">Error: ${result.error}</span>`;
            }
            submitBtn.disabled = false;
          });
          container.appendChild(form);
        };
        const createCommentNode = (comment) => {
          const div = document.createElement("div");
          div.style.padding = "10px";
          div.style.borderBottom = "1px dotted #eee";
          const text = document.createElement("span");
          text.innerHTML = `<strong>${comment.author}</strong>: ${comment.body} <small>(${new Date(comment.created).toLocaleTimeString()})</small>`;
          const delBtn = document.createElement("button");
          delBtn.textContent = "Delete";
          delBtn.style.marginLeft = "10px";
          delBtn.addEventListener("click", async () => {
            delBtn.textContent = "Deleting...";
            const originalNextSibling = div.nextSibling;
            div.remove();
            const res = await api.deleteComment(post.id, comment.id);
            if (!res.ok) {
              alert(`Failed to delete: ${res.error}`);
              delBtn.textContent = "Delete";
              if (originalNextSibling) {
                commentsList.insertBefore(div, originalNextSibling);
              } else {
                commentsList.appendChild(div);
              }
            }
          });
          div.append(text, delBtn);
          return div;
        };
        const lastUpdatedText = document.createElement("small");
        lastUpdatedText.style.color = "gray";
        lastUpdatedText.style.display = "block";
        lastUpdatedText.style.marginTop = "10px";
        commentsSection.append(commentsList, lastUpdatedText);
        renderCommentForm(commentsSection);
        let pollTimer;
        let timeUpdateTimer;
        let lastFetchTime = 0;
        const toggleContent = async () => {
          const isExpanded = !fullBody.hidden;
          fullBody.hidden = isExpanded;
          commentsSection.hidden = isExpanded;
          excerpt.hidden = !isExpanded;
          toggle.textContent = isExpanded ? "Read more" : "Show less";
          if (!isExpanded) {
            commentsList.innerHTML = "<p>Loading comments...</p>";
            const res = await api.getComments(post.id);
            commentsList.innerHTML = "";
            if (res.ok) {
              res.data.comments.forEach((c) => commentsList.appendChild(createCommentNode(c)));
              lastFetchTime = Date.now();
              lastUpdatedText.textContent = "Last updated: 0s ago";
            } else {
              commentsList.innerHTML = `<p style="color:red">Failed to load comments.</p>`;
            }
            pollTimer = setInterval(async () => {
              if (document.hidden) return;
              const pollRes = await api.getComments(post.id);
              if (pollRes.ok) {
                commentsList.innerHTML = "";
                pollRes.data.comments.forEach((c) => commentsList.appendChild(createCommentNode(c)));
                lastFetchTime = Date.now();
              }
            }, 1e4);
            timeUpdateTimer = setInterval(() => {
              if (lastFetchTime > 0) {
                const secondsAgo = Math.floor((Date.now() - lastFetchTime) / 1e3);
                lastUpdatedText.textContent = `Last updated: ${secondsAgo}s ago`;
              }
            }, 1e3);
          } else {
            clearInterval(pollTimer);
            clearInterval(timeUpdateTimer);
            lastFetchTime = 0;
          }
        };
        toggle.addEventListener("click", toggleContent);
        article.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            toggleContent();
          }
        });
        article.tabIndex = 0;
        article.append(heading, meta, excerpt, fullBody, toggle, commentsSection);
        return article;
      }
      function render() {
        postList.innerHTML = "";
        if (state.status === "loading") {
          statusBar.textContent = "Loading\u2026";
          return;
        }
        if (state.status === "error") {
          statusBar.textContent = `Error: ${state.error}`;
          return;
        }
        const sorted = sortPosts(state.posts, state.sortBy);
        statusBar.textContent = `${sorted.length} post(s) found`;
        sorted.forEach((post, index) => {
          const isFocused = index === state.focusedIndex;
          const postElement = renderPost(post, isFocused);
          postList.appendChild(postElement);
          if (isFocused) {
            postElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
          }
        });
      }
      async function loadPosts(query = "") {
        state = { ...state, status: "loading", query, focusedIndex: -1 };
        render();
        try {
          const posts = await fetchPosts(query);
          state = { ...state, posts, status: "success" };
        } catch (err) {
          state = { ...state, status: "error", error: String(err) };
        }
        render();
      }
      function isPersistedState(data) {
        if (typeof data !== "object" || data === null) return false;
        const d = data;
        const validSortFields = ["title", "date", "category"];
        return typeof d.query === "string" && typeof d.sortBy === "string" && validSortFields.includes(d.sortBy);
      }
      function savePrefs(prefs2) {
        localStorage.setItem("blog-prefs", JSON.stringify(prefs2));
      }
      function loadPrefs() {
        const json = localStorage.getItem("blog-prefs");
        if (!json) return null;
        try {
          const parsed = JSON.parse(json);
          if (isPersistedState(parsed)) {
            return parsed;
          }
        } catch (e) {
          console.error("Corrupted localStorage data");
        }
        return null;
      }
      var prefs = loadPrefs();
      if (prefs) {
        state = { ...state, query: prefs.query, sortBy: prefs.sortBy };
        searchInput.value = prefs.query;
        sortSelect.value = prefs.sortBy;
      }
      loadPosts(state.query);
      function debounce(fn, delay) {
        let timer;
        return (...args) => {
          clearTimeout(timer);
          timer = setTimeout(() => fn(...args), delay);
        };
      }
      var debouncedLoad = debounce((query) => {
        loadPosts(query);
        savePrefs({ query, sortBy: state.sortBy });
      }, 300);
      searchInput.addEventListener("input", () => {
        debouncedLoad(searchInput.value.trim());
      });
      sortSelect.addEventListener("change", () => {
        state = { ...state, sortBy: sortSelect.value, focusedIndex: -1 };
        savePrefs({ query: state.query, sortBy: state.sortBy });
        render();
      });
      function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, (tag) => ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "'": "&#39;",
          '"': "&quot;"
        })[tag] || tag);
      }
      function highlightMatch(text, query) {
        const safeText = escapeHTML(text);
        if (!query) return safeText;
        const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
        const regex = new RegExp(`(${escapedQuery})`, "gi");
        return safeText.replace(regex, `<mark>$1</mark>`);
      }
      document.addEventListener("keydown", (e) => {
        const totalPosts = state.posts.length;
        if (totalPosts === 0) return;
        if (e.key === "ArrowDown") {
          e.preventDefault();
          let newIndex = state.focusedIndex + 1;
          if (newIndex >= totalPosts) newIndex = 0;
          state = { ...state, focusedIndex: newIndex };
          render();
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          let newIndex = state.focusedIndex - 1;
          if (newIndex < 0) newIndex = totalPosts - 1;
          state = { ...state, focusedIndex: newIndex };
          render();
        } else if (e.key === "Escape") {
          state = { ...state, focusedIndex: -1 };
          render();
        } else if (e.key === "Enter" && state.focusedIndex !== -1) {
          e.preventDefault();
          const articleToToggle = postList.children[state.focusedIndex];
          if (articleToToggle) {
            articleToToggle.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
          }
        }
      });
    }
  });
  require_main();
})();
//# sourceMappingURL=main.js.map
