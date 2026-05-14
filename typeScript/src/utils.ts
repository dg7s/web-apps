// src/utils.ts

// A generic identity function — T is inferred from the argument.
function identity<T>(value: T): T {
    return value;
}

// TODO: Write a generic function first<T>(arr: T[]): T | undefined
// that returns the first element of an array, or undefined if empty.
function first<T>(arr: T[]): T | undefined {
    return arr.length > 0 ? arr[0] : undefined;
}

// TODO: Write a generic function groupBy<T>(
//     items: T[],
//     keyFn: (item: T) => string
// ): Record<string, T[]>
// that groups items into an object by the string key returned by keyFn.
function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
    const result: Record<string, T[]> = {};
    for (const item of items) {
        const key = keyFn(item);
        if (!result[key]) result[key] = [];
        result[key].push(item);
    }
    return result;
}
// Example usage (should work without any type annotations at the call site):
// groupBy(posts, p => p.category?.name ?? "none")
// → { "Tech": [post1, post3], "Frontend": [post2] }

function pipe<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
    return (arg: T) => fns.reduce((acc, fn) => fn(acc), arg);
}

function memoize<A extends PropertyKey, R>(fn: (arg: A) => Promise<R>): (arg: A) => Promise<R> {
    const cache = {} as Record<A, Promise<R>>;
    return (arg: A) => {
        if (arg in cache) {
            return cache[arg];
        }
        const promise = fn(arg);
        cache[arg] = promise;
        return promise;
    };
}

export { identity, first, groupBy, pipe, memoize };