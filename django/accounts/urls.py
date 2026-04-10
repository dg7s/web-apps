from django.urls import include, path
from . import views

urlpatterns = [
    path("", include("allauth.urls")), # Daje nam gotowe ścieżki logowania/wylogowywania i GitHuba
    path("register/", views.register, name="register"),
    path("profile/", views.profile, name="profile"),
]