from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth import login
from django.contrib.auth.forms import UserCreationForm
from .models import Resource, NewsArticle, Category, Disability
from .forms import ContactForm

def home_view(request):
    latest_news = NewsArticle.objects.all()[:3]
    context = {'latest_news': latest_news}
    return render(request, 'core/home.html', context)

def resources_view(request):
    query = request.GET.get('q', '')
    category_id = request.GET.get('category', '')
    
    resources = Resource.objects.filter(is_verified=True).order_by('-updated_at')
    
    if query:
        resources = resources.filter(title__icontains=query)
    
    if category_id:
        resources = resources.filter(category_id=category_id)

    all_categories = Category.objects.all().order_by('name')
    all_disabilities = Disability.objects.all().order_by('name')
        
    context = {
        'resources': resources,
        'query': query,
        'selected_category_id': int(category_id) if category_id else None,
        'all_categories': all_categories,
        'all_disabilities': all_disabilities,
    }
    return render(request, 'core/resources.html', context)

def disability_resources_view(request, disability_name):
    # Fetch the disability object using the name from the URL
    disability = get_object_or_404(Disability, name__iexact=disability_name.replace('-', ' '))
    
    # Get resources related to that disability
    resources = disability.resources.filter(is_verified=True).order_by('-updated_at')

    context = {
        'disability': disability,
        'resources': resources,
    }
    return render(request, 'core/disability_resources.html', context)

def news_list_view(request):
    news_list = NewsArticle.objects.all()
    return render(request, 'core/news_list.html', {'news_list': news_list})

def news_detail_view(request, pk):
    article = get_object_or_404(NewsArticle, pk=pk)
    return render(request, 'core/news_detail.html', {'article': article})

def contact_view(request):
    if request.method == 'POST':
        form = ContactForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Thank you for your message! We will get back to you soon.')
            return redirect('contact')
    else:
        form = ContactForm()
    return render(request, 'core/contact.html', {'form': form})

def signup_view(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, f'Welcome, {user.username}! Your account has been created.')
            return redirect('home')
    else:
        form = UserCreationForm()
    return render(request, 'core/signup.html', {'form': form})

