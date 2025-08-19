from .models import Category

def resource_categories(request):
    """Makes all resource categories available to all templates."""
    return {
        'ALL_CATEGORIES': Category.objects.all().order_by('name')
    }