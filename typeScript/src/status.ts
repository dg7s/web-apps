// src/status.ts
import { Post } from "./blog";

// An enum compiles to a real JavaScript object.
enum PostStatus {
    Draft     = "draft",
    Published = "published",
    Archived  = "archived",
}

// A union type: the value must be one of these strings.
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiRequest {
    method:  HttpMethod;
    path:    string;
    body?:   unknown;    // ? makes the field optional
}

// A type guard narrows a wide type to a specific one.
function isPost(value: unknown): value is Post {
    return (
        typeof value === "object" &&
        value !== null &&
        "title" in value &&
        "slug"  in value
    );
}

// TODO: Write a function describeRequest(req: ApiRequest): string
// that returns e.g. "GET /api/posts/" or "POST /api/posts/ (has body)"

function describeRequest(req: ApiRequest): string {
    if (req.body !== undefined) {
        return `${req.method} ${req.path} (has body)`;
    } else {
        return `${req.method} ${req.path}`;
    }
}

export { PostStatus, HttpMethod, ApiRequest, isPost, describeRequest };


interface Circle { kind: "circle"; radius: number; }
interface Rectangle { kind: "rectangle"; width: number; height: number; }
interface Triangle { kind: "triangle"; base: number; height: number; }

type Shape = Circle | Rectangle | Triangle;

function area(shape: Shape): number {
    switch (shape.kind) {
        case "circle": return Math.PI * shape.radius ** 2;
        case "rectangle": return shape.width * shape.height;
        case "triangle": return (shape.base * shape.height) / 2;
    }
}

function renderShape(shape: Shape): SVGElement {
    switch (shape.kind) {
        case "circle": return svgEl("circle", { cx: 60, cy: 60, r: shape.radius, fill: "steelblue" });
        case "rectangle": return svgEl("rect", { width: shape.width, height: shape.height, fill: "coral" });
        case "triangle": return svgEl("polygon", { points: `0,${shape.height} ${shape.base},${shape.height} ${shape.base/2},0`, fill: "seagreen" });
    }
}

function svgEl(
       tag: string,
       attrs: Record<string, string | number>
   ): SVGElement {
       const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
       for (const [k, v] of Object.entries(attrs)) {
           el.setAttribute(k, String(v));
       }
       return el as SVGElement;
   }

const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svg.setAttribute("width", "120");
svg.setAttribute("height", "120");
svg.setAttribute("viewBox", "0 0 120 120");
svg.appendChild(svgEl("circle", { cx: 60, cy: 60, r: 50, fill: "steelblue" }));

function validatePost(data: unknown): { ok: true; post: Post } | { ok: false; reason: string } {
    if (typeof data !== "object" || data === null) return { ok: false, reason: "Not an object" };
    
    const d = data as Record<string, unknown>;
    
    if (typeof d.id !== "number") return { ok: false, reason: "id must be a number" };
    if (typeof d.title !== "string") return { ok: false, reason: "title must be a string" };
    if (typeof d.slug !== "string") return { ok: false, reason: "slug must be a string" };
    if (typeof d.body !== "string") return { ok: false, reason: "body must be a string" };
    if (typeof d.pubDate !== "string") return { ok: false, reason: "pubDate must be a string" };

    if (d.category !== null) {
        if (typeof d.category !== "object") return { ok: false, reason: "category must be null or object" };
        const c = d.category as Record<string, unknown>;
        if (typeof c.id !== "number") return { ok: false, reason: "category.id must be a number" };
        if (typeof c.name !== "string") return { ok: false, reason: "category.name must be a string" };
        if (typeof c.slug !== "string") return { ok: false, reason: "category.slug must be a string" };
    }

    return { ok: true, post: data as Post };
}
export { area, Shape, renderShape, svgEl, validatePost };