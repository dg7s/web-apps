from django.shortcuts import render, get_object_or_404

POSTS = [
    {"pk": 1, "title": "Hello Django",    "body": "My first post."},
    {"pk": 2, "title": "URL Routing",     "body": "How include() works."},
    {"pk": 3, "title": "Template Tricks", "body": "Extends and blocks."},
]

def post_list(request):
    return render(request, "blog/post_list.html", {"posts": POSTS})

def post_detail(request, pk):
    post = next((p for p in POSTS if p["pk"] == pk), None)
    if not post:
        from django.http import Http404
        raise Http404("Post not found")
    return render(request, "blog/post_detail.html", {"post": post})