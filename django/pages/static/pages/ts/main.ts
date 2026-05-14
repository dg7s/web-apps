// pages/static/pages/ts/main.ts

// A helper that throws if the element is missing —
// better than silently failing at runtime.
function getElement<T extends HTMLElement>(id: string): T {
    const el = document.getElementById(id);
    if (el === null) {
        throw new Error(`Element #${id} not found`);
    }
    return el as T;
}

const searchInput = getElement<HTMLInputElement>("search-input");
const postList    = getElement<HTMLDivElement>("post-list");
const statusBar   = getElement<HTMLParagraphElement>("status-bar");
const sortSelect  = getElement<HTMLSelectElement>("sort-select");

type PageStatus = "idle" | "loading" | "success" | "error";
type SortField  = "title" | "date" | "category";

interface PostsResponse {
    posts: Post[];
}

interface AppState {
    posts:        Post[];
    query:        string;
    status:       PageStatus;
    error:        string;
    sortBy:       SortField;
    focusedIndex: number; 
}

let state: AppState = {
    posts:        [],
    query:        "",
    status:       "idle",
    error:        "",
    sortBy:       "date",
    focusedIndex: -1,
};

async function fetchPosts(query: string = ""): Promise<Post[]> {
    const url = query
        ? `/api/posts/?search=${encodeURIComponent(query)}`
        : "/api/posts/";
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
    }
    const data: PostsResponse = await res.json();
    return data.posts;
}

function sortPosts(posts: Post[], by: SortField): Post[] {
    return [...posts].sort((a, b) => {
        if (by === "title") return a.title.localeCompare(b.title);
        if (by === "date")  return new Date(b.pub_date).getTime() - new Date(a.pub_date).getTime();
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

type ValidationResult = 
    | { valid: true } 
    | { valid: false; errors: Record<string, string> };

function validateComment(author: string, body: string): ValidationResult {
    const errors: Record<string, string> = {};
    if (author.length < 2 || author.length > 50) errors.author = "Author must be 2-50 characters.";
    if (body.length < 10 || body.length > 500) errors.body = "Body must be 10-500 characters.";
    
    if (Object.keys(errors).length > 0) return { valid: false, errors };
    return { valid: true };
}

function renderPost(post: Post, isFocused: boolean): HTMLElement {
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
    excerpt.textContent = post.body.slice(0, 120) + "…";

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

    const renderCommentForm = (container: HTMLElement) => {
        const form = document.createElement("form");
        form.style.marginTop = "15px";

        const authorInput = document.createElement("input");
        authorInput.type = "text";
        authorInput.placeholder = "Your name";
        authorInput.required    = true;

        const bodyTextarea = document.createElement("textarea");
        bodyTextarea.placeholder = "Your comment";
        bodyTextarea.rows = 3;
        bodyTextarea.required    = true;

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

    const createCommentNode = (comment: Comment): HTMLElement => {
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

    let pollTimer: ReturnType<typeof setInterval>;
    let timeUpdateTimer: ReturnType<typeof setInterval>;
    let lastFetchTime: number = 0;

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
                res.data.comments.forEach(c => commentsList.appendChild(createCommentNode(c)));
                lastFetchTime = Date.now();
                lastUpdatedText.textContent = "Last updated: 0s ago";
            } else {
                commentsList.innerHTML = `<p style="color:red">Failed to load comments.</p>`;
            }

            // Real-time polling
            pollTimer = setInterval(async () => {
                if (document.hidden) return; 
                const pollRes = await api.getComments(post.id);
                if (pollRes.ok) {
                    commentsList.innerHTML = ""; 
                    pollRes.data.comments.forEach(c => commentsList.appendChild(createCommentNode(c)));
                    lastFetchTime = Date.now();
                }
            }, 10000);

            timeUpdateTimer = setInterval(() => {
                if (lastFetchTime > 0) {
                    const secondsAgo = Math.floor((Date.now() - lastFetchTime) / 1000);
                    lastUpdatedText.textContent = `Last updated: ${secondsAgo}s ago`;
                }
            }, 1000);

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

function render(): void {
    postList.innerHTML = "";

    if (state.status === "loading") {
        statusBar.textContent = "Loading…";
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

async function loadPosts(query: string = ""): Promise<void> {
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


interface PersistedState {
    query:  string;
    sortBy: SortField;
}

function isPersistedState(data: unknown): data is PersistedState {
    if (typeof data !== "object" || data === null) return false;
    const d = data as Record<string, unknown>;
    
    const validSortFields = ["title", "date", "category"];
    
    return typeof d.query === "string" && 
           typeof d.sortBy === "string" && 
           validSortFields.includes(d.sortBy);
}

function savePrefs(prefs: PersistedState): void {
    localStorage.setItem("blog-prefs", JSON.stringify(prefs));
}

function loadPrefs(): PersistedState | null {
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

const prefs = loadPrefs();

if (prefs) {
    state = { ...state, query: prefs.query, sortBy: prefs.sortBy };
    searchInput.value = prefs.query;
    sortSelect.value = prefs.sortBy;
}

loadPosts(state.query);

function debounce<T extends (...args: any[]) => void>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timer: ReturnType<typeof setTimeout>;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

const debouncedLoad = debounce((query: string) => {
    loadPosts(query);
    savePrefs({ query: query, sortBy: state.sortBy });
}, 300);

searchInput.addEventListener("input", () => {
    debouncedLoad(searchInput.value.trim());
});

sortSelect.addEventListener("change", () => {
    state = { ...state, sortBy: sortSelect.value as SortField, focusedIndex: -1 };
    savePrefs({ query: state.query, sortBy: state.sortBy });
    render();
});

function escapeHTML(str: string): string {
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
}

function highlightMatch(text: string, query: string): string {
    const safeText = escapeHTML(text);
    if (!query) return safeText;

    const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
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
    } 
    else if (e.key === "ArrowUp") {
        e.preventDefault();
        let newIndex = state.focusedIndex - 1;
        if (newIndex < 0) newIndex = totalPosts - 1;
        state = { ...state, focusedIndex: newIndex };
        render();
    }
    else if (e.key === "Escape") {
        state = { ...state, focusedIndex: -1 };
        render();
    }
    else if (e.key === "Enter" && state.focusedIndex !== -1) {
        e.preventDefault();
        const articleToToggle = postList.children[state.focusedIndex] as HTMLElement;
        if (articleToToggle) {
            articleToToggle.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
        }
    }
});

import { api, Post, Comment, CreateCommentPayload } from "./api";

async function loadAndRender(query?: string): Promise<void> {
    const result = await api.getPosts(query);

    if (!result.ok) {
        statusBar.textContent = `Error: ${result.error}`;
        return;
    }

    const { posts } = result.data;

    state = { ...state, posts: posts };

    statusBar.textContent = `${posts.length} post(s)`;
    postList.innerHTML = "";
    posts.forEach((post, index) => {
        const isFocused = index === state.focusedIndex;
        
        const postElement = renderPost(post, isFocused);
        postList.appendChild(postElement);
        
        if (isFocused) {
            postElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
    });
}

async function withRetry<T>(
    fn: () => Promise<import("./api").Result<T>>,
    retries: number,
    delayMs: number
): Promise<import("./api").Result<T>> {
    
    const result = await fn();
    
    if (result.ok) return result;

    if (retries > 0) {
        statusBar.textContent = `Retry ${retries} left (waiting ${delayMs}ms)...`;
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return withRetry(fn, retries - 1, delayMs * 2);
    }

    return result;
}