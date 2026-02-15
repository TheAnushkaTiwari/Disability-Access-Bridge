import os
import django
import json
from dotenv import load_dotenv
from groq import Groq
from tavily import TavilyClient

#Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'disability_bridge.settings')
django.setup()

from core.models import Resource, Category

load_dotenv()

def fetch_and_save_resources():
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

    # --- SETTINGS: CHANGE THESE AS NEEDED ---
    SEARCH_QUERY = "Free vocational training centers for disabled in Rajasthan"
    TARGET_CATEGORY_NAME = "Education & Training" 
    # ----------------------------------------

    #Get or Create the Category
    #ensures this category exists before adding resources to it
    category_obj, created = Category.objects.get_or_create(name=TARGET_CATEGORY_NAME)
    if created:
        print(f"Created new category: '{TARGET_CATEGORY_NAME}'")

    print(f"Searching for: {SEARCH_QUERY}...")
    
    #Search the Web
    try:
        search_result = tavily.search(query=SEARCH_QUERY, search_depth="advanced", max_results=5)
    except Exception as e:
        print(f"Search Error: {e}")
        return

    #Ask AI to Format Data
    prompt = f"""
    Based on these search results: {search_result}
    Extract 3 distinct resources (organizations, centers, or websites).
    Return ONLY a valid JSON object with a single key "resources".
    Each item in the list must have these exact keys:
    - "title": Name of the resource
    - "description": A helpful summary (max 2 sentences)
    - "website_url": Link to the website (if found, else empty string)
    - "contact_info": Phone number or email (if found, else empty string)
    """

    try:
        completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant",
            response_format={"type": "json_object"}
        )
        data = json.loads(completion.choices[0].message.content)
    except Exception as e:
        print(f"AI/Parsing Error: {e}")
        return

    # Save to Database
    resources_list = data.get('resources', [])
    
    for item in resources_list:
        # Use 'website_url' to check for duplicates
        url_to_check = item.get('website_url', '')
        
        # Only check duplicate if URL exists, otherwise check Title
        is_duplicate = False
        if url_to_check:
            if Resource.objects.filter(website_url=url_to_check).exists():
                is_duplicate = True
        else:
            if Resource.objects.filter(title=item.get('title')).exists():
                is_duplicate = True

        if not is_duplicate:
            # Create resource
            Resource.objects.create(
                title=item.get('title'),
                description=item.get('description', ''),
                website_url=url_to_check,
                contact_info=item.get('contact_info', ''),
                category=category_obj,  # Link to the category found/created
                is_verified=False       # Force to False so it's a draft
            )
            print(f"SUCCESS: Drafted '{item.get('title')}'")
        else:
            print(f"SKIPPED: '{item.get('title')}' (Already exists)")

if __name__ == "__main__":
    fetch_and_save_resources()