from django.shortcuts import render
from django.http import HttpResponse
from django.http import HttpResponseRedirect
from django.urls import reverse

import datetime

def home(request):
    count = request.session.get("visit_count", 0) + 1
    request.session["visit_count"] = count

    context = {
        "page_title": "Hello",
        "heading": f"Welcome! You have visited this page {count} time(s) this session.",
        "server_time": datetime.datetime.now(),
    }
    return render(request, "pages/home.html", context)

def about(request):
    # TODO: render pages/about.html with a context containing a list of skills
    # skills = ["Python", "HTTP", "HTML", "CSS"]
    context = {
        "skills": ["Python", "HTTP", "HTML", "CSS"]
    }
    return render(request, "pages/about.html", context)

def greet(request, name):
    message = ""
    if request.method == "POST":
        note = request.POST.get("note", "")
        message = f'Thanks, {name}! Your note: "{note}"'
    return render(request, "pages/greet.html", {"name": name, "message": message})

ALL_PROJECTS = [
    {"name": "Socket Server",    "lang": "Python",     "year": 2025, "done": True},
    {"name": "HTML Profile",     "lang": "HTML",       "year": 2025, "done": True},
    {"name": "CSS Layout",       "lang": "CSS",        "year": 2025, "done": True},
    {"name": "Django App",       "lang": "Python",     "year": 2025, "done": False},
    {"name": "REST API",         "lang": "Python",     "year": 2024, "done": True},
    {"name": "React Dashboard",  "lang": "JavaScript", "year": 2024, "done": True},
    {"name": "SQL Queries Lab",  "lang": "SQL",        "year": 2024, "done": True},
    {"name": "CLI Tool",         "lang": "Python",     "year": 2023, "done": True},
]

def projects(request):
    q = request.GET.get("q", "").lower()
    # TODO: if q is   -empty, filter ALL_PROJECTS so only entries whose name
    #       or lang contains q (case-insensitive) are kept; otherwise show all
    if q:
        project_list = [
            p for p in ALL_PROJECTS
            if q in p["name"].lower() or q in p["lang"].lower()
        ]
    else:
        project_list = ALL_PROJECTS

    done_count = sum(1 for p in project_list if p["done"])

    context = {
        "projects": project_list,
        "done_count": done_count,
        "q": q,
    }
    return render(request, "pages/projects.html", context)

ENTRIES = []

def guestbook(request):
    if request.method == "POST":
        name = request.POST.get("name", "").strip()
        message = request.POST.get("message", "").strip()

        if name and message:
            ENTRIES.append({"name": name, "message": message})
            return HttpResponseRedirect(reverse("guestbook"))

    return render(request, "pages/guestbook.html", {"entries": ENTRIES})

def api_demo(request):
    return render(request, "pages/api_demo.html")

def blog_browser(request):
    return render(request, "pages/blog_browser.html")