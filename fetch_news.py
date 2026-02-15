import os
import django
import json
from dotenv import load_dotenv
from groq import Groq
from tavily import TavilyClient

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'disability_bridge.settings')
django.setup()
from core.models import NewsArticle

load_dotenv()

def fetch_and_save_news():
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

    print("Searching for latest disability news in India...")
    
    # 1. Check Tavily Results
    try:
        search_result = tavily.search(query="latest news disability accessibility India Rajasthan 2026", search_depth="advanced", max_results=5)
        print(f"### DEBUG: Tavily found {len(search_result.get('results', []))} results.")
    except Exception as e:
        print(f"Error fetching from Tavily: {e}")
        return

    prompt = f"""
    Based on these search results: {search_result}
    Extract 3 relevant news articles. 
    Return ONLY a valid JSON object with a single key "articles" containing a list. 
    Each item in the list must have keys: "title", "content", "url".
    """
    
    # 2. Check Groq Response
    try:
        completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant",
            response_format={"type": "json_object"}
        )
        raw_content = completion.choices[0].message.content
        print("### DEBUG: Raw Groq Response:\n", raw_content) # See what the AI actually wrote
        
        data = json.loads(raw_content)
    except Exception as e:
        print(f"Error communicating with Groq: {e}")
        return

    # 3. Parse and Save
    articles = data.get('articles', data.get('news', []))
    
    if not articles:
        print("### DEBUG: No articles found in the JSON 'articles' key.")
        print(f"Keys found: {data.keys()}")

    for item in articles:
        if not NewsArticle.objects.filter(source_url=item.get('url')).exists():
            NewsArticle.objects.create(
                title=item.get('title'),
                content=item.get('content'),
                source_url=item.get('url'),
                is_approved=False 
            )
            print(f"SUCCESS: Drafted '{item.get('title')}'")
        else:
            print(f"SKIPPED: '{item.get('title')}' (Already exists)")

if __name__ == "__main__":
    fetch_and_save_news()