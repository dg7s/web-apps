from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("about/", views.about, name="about"),
    path("projects/", views.projects, name="projects"),
    path("greet/<str:name>/", views.greet, name="greet"),
    path("guestbook/", views.guestbook, name="guestbook"),
    path("api-demo/", views.api_demo, name="api-demo"),
    path("browse/", views.blog_browser, name="blog-browser"),
]