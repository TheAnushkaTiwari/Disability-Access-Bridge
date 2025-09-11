from django.contrib import admin
from .models import Category, Resource, NewsArticle, ContactSubmission, Disability

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'is_verified', 'updated_at')
    list_filter = ('category', 'is_verified')
    search_fields = ('title', 'description')
    list_editable = ('is_verified',)

@admin.register(NewsArticle)
class NewsArticleAdmin(admin.ModelAdmin):
    list_display = ('title', 'published_date', 'author')
    search_fields = ('title', 'content')

@admin.register(ContactSubmission)
class ContactSubmissionAdmin(admin.ModelAdmin):
    list_display = ('subject', 'name', 'submitted_at', 'is_read')
    list_filter = ('is_read',)
    readonly_fields = ('name', 'email', 'subject', 'message', 'submitted_at')

@admin.register(Disability)
class DisabilityAdmin(admin.ModelAdmin):
    list_display = ('name',)
