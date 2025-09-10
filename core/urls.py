from django.urls import path
from . import views
from django.contrib.auth import views as auth_views

urlpatterns = [
    path('', views.home_view, name='home'),
    path('resources/', views.resources_view, name='resources'),
    path('news/', views.news_list_view, name='news_list'),
    path('news/<int:pk>/', views.news_detail_view, name='news_detail'),
    path('contact/', views.contact_view, name='contact'),
    path('resources/<str:disability_name>/', views.disability_resources_view, name='disability_resources'),
    
    # Auth
    path('signup/', views.signup_view, name='signup'),
    path('login/', auth_views.LoginView.as_view(template_name='core/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
]
