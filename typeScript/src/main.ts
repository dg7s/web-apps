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