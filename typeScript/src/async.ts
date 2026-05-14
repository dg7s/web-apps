// src/async.ts

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// async/await makes Promise code read top-to-bottom:
async function countdown(element: HTMLElement): Promise<void> {
    for (let i = 5; i >= 0; i--) {
        element.textContent = `${i}…`;
        await delay(1000);
    }
    element.textContent = "Go!";
}

interface Todo {
    userId:    number;
    id:        number;
    title:     string;
    completed: boolean;
}

async function fetchTodo(id: number): Promise<Todo> {
    const res = await fetch(`https://jsonplaceholder.typicode.com/todos/${id}`);
    if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
    }
    const data: Todo = await res.json();
    return data;
}

// TODO: Write a function fetchWithTimeout<T>(url: string, ms: number): Promise<T>
// that rejects if the request takes longer than `ms` milliseconds.
// Hint: use Promise.race() with delay() that throws after the timeout.
//
// Test it:
//   fetchWithTimeout<Todo>("https://jsonplaceholder.typicode.com/todos/1", 5000)
//     → should succeed
//   fetchWithTimeout<Todo>("https://jsonplaceholder.typicode.com/todos/1", 1)
//     → should reject with a timeout error
//
// Display "✅ Succeeded" or "❌ Timed out" in the page for each test.

async function fetchWithTimeout<T>(url: string, ms: number): Promise<T> {
    const timeoutPromise = delay(ms).then(() => {
        throw new Error("Timeout");
    });

    const fetchPromise = fetch(url).then(res => {
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }
        return res.json() as Promise<T>;
    });

    return Promise.race([fetchPromise, timeoutPromise]);
}

export { delay, countdown, fetchTodo, Todo, fetchWithTimeout };