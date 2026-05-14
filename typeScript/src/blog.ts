interface Category {
    id:   number;
    name: string;
    slug: string;
}

interface Post {
    id:       number;
    title:    string;
    slug:     string;
    body:     string;
    pubDate:  string;
    category: Category | null;   // a field that is either a Category or nothing — union types are introduced in Phase 4
}

interface Comment {
    id:      number;
    author:  string;
    body:    string;
    created: string;
}

// TODO: Write a function summarise(post: Post): string that returns
// "<title> (<category name or 'Uncategorised'>) — <first 50 chars of body>..."

function summarise(post: Post): string {
    const categoryName = post.category ? post.category.name : "Uncategorised";
    const bodyPreview = post.body.length > 50 ? post.body.slice(0, 50) + "..." : post.body;
    return `${post.title} (${categoryName}) — ${bodyPreview}`;
}

// TODO: Write a function filterByCategory(posts: Post[], categoryName: string): Post[]
// that returns only posts whose category.name matches (case-insensitive).
function filterByCategory(posts: Post[], categoryName: string): Post[] {
    return posts.filter(post => post.category && post.category.name.toLowerCase() === categoryName.toLowerCase());
}

function sortPosts(posts: Post[], by: "title" | "date" | "category"): Post[] {
        return [...posts].sort((a, b) => {
        if (by === "title") return a.title.localeCompare(b.title);
        if (by === "date") return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
        if (by === "category") {
            const catA = a.category?.name;
            const catB = b.category?.name;

            if (catA === undefined && catB === undefined) return 0;
            if (catA === undefined) return 1;
            if (catB === undefined) return -1;
            
            return catA.localeCompare(catB);
        }
        
        return 0;
    });
}

export { Post, Comment, Category, summarise, filterByCategory, sortPosts };