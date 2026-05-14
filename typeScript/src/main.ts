// A helper to display results in the page instead of the console.
function show(label: string, value: unknown): void {
    const output = document.getElementById("output")!;
    const line = document.createElement("p");
    line.textContent = `${label}: ${String(value)}`;
    output.appendChild(line);
}

// TODO: Write a function greet(name: string, times: number): string
// that returns "Hello, <name>! ".repeat(times).trim()
// Try calling it with greet("Alice", "3") — TypeScript should error.

function greet(name: string, times: number): string {
    return `Hello, ${name}! `.repeat(times).trim();
}

// TODO: Write a function clamp(value: number, min: number, max: number): number
// that returns value clamped to [min, max].

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

show("greet", greet("World", 2));
show("clamp(15, 0, 10)", clamp(15, 0, 10));   // → 10
show("clamp(-5, 0, 10)", clamp(-5, 0, 10));   // → 0


// TODO: Write a function formatDuration(totalSeconds: number): string
// that converts seconds to a human-readable string.
// Examples:
//   formatDuration(0)     → "0s"
//   formatDuration(62)    → "1m 2s"
//   formatDuration(3661)  → "1h 1m 1s"
//   formatDuration(86400) → "24h 0m 0s"
// Do not show hours if totalSeconds < 3600.
// Do not show minutes if totalSeconds < 60.

function formatDuration(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    let result = "";
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0 || hours > 0) result += `${minutes}m `;
    result += `${seconds}s`;
    return result.trim();
}

// Render a table of test cases in the page:
const testCases: Array<[number, string]> = [
    [0, "0s"], [5, "5s"], [62, "1m 2s"],
    [3661, "1h 1m 1s"], [86400, "24h 0m 0s"],
];

const table = document.createElement("table");
table.innerHTML = "<tr><th>Input</th><th>Expected</th><th>Got</th><th>✓</th></tr>";
for (const [input, expected] of testCases) {
    const got = formatDuration(input);
    const pass = got === expected;
    const row = document.createElement("tr");
    row.innerHTML = `<td>${input}</td><td>${expected}</td><td>${got}</td>
                     <td>${pass ? "✅" : "❌"}</td>`;
    if (!pass) row.classList.add("error");
    table.appendChild(row);
}
document.getElementById("output")!.appendChild(table);

import { delay, countdown } from "./async";

const counter = document.createElement("h2");
document.getElementById("output")!.appendChild(counter);
countdown(counter);

import { fetchTodo, Todo, fetchWithTimeout } from "./async";

async function renderTodos(): Promise<void> {
    const container = document.createElement("div");
    container.innerHTML = "<h3>Todos from API</h3>";
    document.getElementById("output")!.appendChild(container);

    for (const id of [1, 2, 3]) {
        const todo = await fetchTodo(id);
        const p = document.createElement("p");
        p.textContent = `${todo.completed ? "✅" : "⬜"} ${todo.title}`;
        container.appendChild(p);
    }
}

renderTodos();

async function testTimeouts() {
    try {
        await fetchWithTimeout<Todo>("https://jsonplaceholder.typicode.com/todos/1", 5000);
        show("fetchWithTimeout (5000ms)", "✅ Succeeded");
    } catch (e) {
        show("fetchWithTimeout (5000ms)", "❌ Timed out");
    }

    try {
        await fetchWithTimeout<Todo>("https://jsonplaceholder.typicode.com/todos/1", 1);
        show("fetchWithTimeout (1ms)", "✅ Succeeded");
    } catch (e) {
        show("fetchWithTimeout (1ms)", "❌ Timed out");
    }
}
testTimeouts();

async function fetchParallelVsSequential() {
    const ids = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    const startSeq = performance.now();
    for (const id of ids) {
        await fetchTodo(id);
    }
    const timeSeq = performance.now() - startSeq;

    const startPar = performance.now();
    await Promise.all(ids.map(id => fetchTodo(id)));
    const timePar = performance.now() - startPar;

    show("Sequential fetch time", `${Math.round(timeSeq)}ms`);
    show("Parallel fetch time", `${Math.round(timePar)}ms`);
}
fetchParallelVsSequential();

import { Post, summarise, filterByCategory, sortPosts} from "./blog";

const posts: Post[] = [
    {
        id: 1, title: "Hello TypeScript", slug: "hello-ts",
        body: "TypeScript is JavaScript with types. It compiles to plain JS.",
        pubDate: "2025-01-01",
        category: { id: 1, name: "Tech", slug: "tech" },
    },
    {
        id: 2, title: "CSS Grid", slug: "css-grid",
        body: "CSS Grid is a two-dimensional layout system for the web.",
        pubDate: "2025-01-15",
        category: { id: 2, name: "Frontend", slug: "frontend" },
    },
    {
        id: 3, title: "Django REST", slug: "django-rest",
        body: "Build a REST API with Django and serve JSON to any client.",
        pubDate: "2025-02-01",
        category: { id: 1, name: "Tech", slug: "tech" },
    },
];

const blogSection = document.createElement("div");
blogSection.innerHTML = `
    <h3>Blog Posts</h3>
    <select id="sortSelect">
        <option value="title">Sort by Title</option>
        <option value="date">Sort by Date (Newest)</option>
        <option value="category">Sort by Category</option>
    </select>
    <div id="postsContainer"></div>
`;
document.getElementById("output")!.appendChild(blogSection);


function renderPostCards(postsToRender: Post[]) {
    const container = document.getElementById("postsContainer")!;
    container.innerHTML = "";
    for (const post of postsToRender) {
        const card = document.createElement("article");
        card.innerHTML = `<h4>${post.title}</h4><p>${summarise(post)}</p>`;
        container.appendChild(card);
    }
}


// Show filtered results
const techPosts = filterByCategory(posts, "tech");
const filteredSection = document.createElement("div");
filteredSection.innerHTML = `<h3>Tech posts: ${techPosts.map(p => p.title).join(", ")}</h3>`;
document.getElementById("output")!.appendChild(filteredSection);

renderPostCards(sortPosts(posts, "title"));

document.getElementById("sortSelect")!.addEventListener("change", (e) => {
    const sortBy = (e.target as HTMLSelectElement).value as "title" | "date" | "category";
    renderPostCards(sortPosts(posts, sortBy));
});

import { area, Shape, renderShape } from "./status";

const gallerySection = document.createElement("div");
gallerySection.innerHTML = "<h3>SVG Shapes Gallery</h3>";
const gallery = document.createElement("div");
gallery.style.display = "flex";
gallery.style.gap = "20px";
gallerySection.appendChild(gallery);

const myShapes: Shape[] = [
    { kind: "circle", radius: 50 },
    { kind: "rectangle", width: 100, height: 60 },
    { kind: "triangle", base: 90, height: 80 }
];

for (const shape of myShapes) {
    const card = document.createElement("div");
    card.style.textAlign = "center";

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "120");
    svg.setAttribute("height", "120");
    svg.setAttribute("viewBox", "0 0 120 120");

    const renderedElement = renderShape(shape);
    svg.appendChild(renderedElement);

    const calculatedArea = area(shape);
    const label = document.createElement("p");
    label.textContent = `Area: ${Math.round(calculatedArea)}`;

    card.appendChild(svg);
    card.appendChild(label);
    
    gallery.appendChild(card);
}

document.getElementById("output")!.appendChild(gallerySection);

import { validatePost } from "./status";

const validatorSection = document.createElement("div");
validatorSection.innerHTML = `
    <hr>
    <h3>JSON Post Validator</h3>
    <textarea id="jsonInput" rows="10" cols="60" placeholder='Paste JSON...' style="font-family: monospace;"></textarea>
    <br>
    <button id="validateBtn" style="margin-top: 10px; padding: 5px 15px;">Validate</button>
    <div id="validatorResult" style="margin-top: 15px;"></div>
`;
document.getElementById("output")!.appendChild(validatorSection);

document.getElementById("validateBtn")!.addEventListener("click", () => {
    const input = (document.getElementById("jsonInput") as HTMLTextAreaElement).value;
    const resultContainer = document.getElementById("validatorResult")!;
    
    resultContainer.innerHTML = ""; 

    try {
        const parsedData = JSON.parse(input);
        
        const validationResult = validatePost(parsedData);

        if (validationResult.ok) {
            resultContainer.innerHTML = `<p style="color: green; font-weight: bold;">✅ Valid Post</p>`;
            
            const post = validationResult.post;
            const card = document.createElement("article");
            card.style.border = "1px solid #aaa";
            card.style.padding = "10px";
            card.style.marginTop = "10px";
            card.innerHTML = `<h4>${post.title}</h4><p>${post.body}</p><small>ID: ${post.id}</small>`;
            
            resultContainer.appendChild(card);
        } else {
            resultContainer.innerHTML = `<p style="color: red; font-weight: bold;">❌ Invalid: ${validationResult.reason}</p>`;
        }

    } catch (error) {
        resultContainer.innerHTML = `<p style="color: red; font-weight: bold;">❌ Parse Error: The provided text is not valid JSON.</p>`;
    }
});

import {pipe, memoize} from "./utils";

const processPosts = pipe<Post[]>(
    posts => posts.filter(p => p.category !== null),
    posts => posts.filter(p => p.pubDate >= "2025-01-10"),
    posts => [...posts].sort((a, b) => a.title.localeCompare(b.title)),
    posts => posts.slice(0, 5),
);

const processedPosts = processPosts(posts);

const pipeSection = document.createElement("div");
pipeSection.innerHTML = "<hr><h3>Pipeline: Input vs Output</h3>";

const flexContainer = document.createElement("div");
flexContainer.style.display = "flex";
flexContainer.style.gap = "20px";

const inputCol = document.createElement("div");
inputCol.style.flex = "1";
inputCol.innerHTML = "<h4>Input (Raw Posts)</h4>";
inputCol.innerHTML += `<pre style="background: #eee; padding: 10px;">${JSON.stringify(posts.map(p => p.title), null, 2)}</pre>`;

const outputCol = document.createElement("div");
outputCol.style.flex = "1";
outputCol.innerHTML = "<h4>Output (Processed)</h4>";
outputCol.innerHTML += `<pre style="background: #d4edda; padding: 10px;">${JSON.stringify(processedPosts.map(p => p.title), null, 2)}</pre>`;

flexContainer.appendChild(inputCol);
flexContainer.appendChild(outputCol);
pipeSection.appendChild(flexContainer);

document.getElementById("output")!.appendChild(pipeSection);

const memoizeSection = document.createElement("div");
memoizeSection.innerHTML = "<hr><h3>Memoize Cache Test</h3>";
document.getElementById("output")!.appendChild(memoizeSection);

async function runMemoizeTest() {
    const cachedFetch = memoize(fetchTodo);

    const start1 = performance.now();
    await cachedFetch(1);
    const time1 = Math.round(performance.now() - start1);
    
    const p1 = document.createElement("p");
    p1.innerHTML = `Fetch ID: 1 (First call) -> <span style="color: red; font-weight: bold;">Cache MISS (${time1}ms)</span>`;
    memoizeSection.appendChild(p1);

    const start2 = performance.now();
    await cachedFetch(1);
    const time2 = Math.round(performance.now() - start2);
    
    const p2 = document.createElement("p");
    p2.innerHTML = `Fetch ID: 1 (Second call) -> <span style="color: green; font-weight: bold;">Cache HIT (${time2}ms)</span>`;
    memoizeSection.appendChild(p2);
}

runMemoizeTest();