from django import forms
from .models import ContactSubmission

class ContactForm(forms.ModelForm):
    class Meta:
        model = ContactSubmission
        fields = ['name', 'email', 'subject', 'message']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'Your Full Name'}),
            'email': forms.EmailInput(attrs={'class': 'form-input', 'placeholder': 'Your Email Address'}),
            'subject': forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'Message Subject'}),
            'message': forms.Textarea(attrs={'class': 'form-input', 'rows': 5, 'placeholder': 'Your Message'}),
        }
