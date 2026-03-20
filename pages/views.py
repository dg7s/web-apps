from django.shortcuts import render
from django.http import HttpResponse
import datetime

def home(request):
    context = {
        # TODO: Add "page_title", "heading", and "server_time" keys
        # server_time should be datetime.datetime.now()
        "page_title": "Hello",
        "heading": "wlrd",
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
    # TODO: render pages/greet.html passing the name
    context = {
        "name": name
    }
    return render(request, "pages/greet.html", context)