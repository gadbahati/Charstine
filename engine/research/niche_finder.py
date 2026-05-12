import requests
from bs4 import BeautifulSoup
import json
import time

class NicheFinder:
    def __init__(self):
        self.trending_sources = [
            "https://trends.google.com/trends/trendingsearches/daily/rss?geo=US",
            "https://www.reddit.com/r/productivity/rising.json",
            "https://www.reddit.com/r/technology/rising.json"
        ]
        self.keywords = ["productivity", "tech", "automation", "AI", "workflow"]

    def get_google_trends(self):
        try:
            response = requests.get(self.trending_sources[0])
            soup = BeautifulSoup(response.content, 'xml')
            items = soup.find_all('item')
            trends = []
            for item in items:
                title = item.find('title').text
                approx_traffic = item.find('ht:approx_traffic').text if item.find('ht:approx_traffic') else "Unknown"
                trends.append({"topic": title, "traffic": approx_traffic, "source": "Google Trends"})
            return trends
        except Exception as e:
            print(f"Error fetching Google Trends: {e}")
            return []

    def get_reddit_trends(self, url):
        try:
            headers = {'User-Agent': 'Mozilla/5.0'}
            response = requests.get(url, headers=headers)
            data = response.json()
            posts = data.get('data', {}).get('children', [])
            trends = []
            for post in posts:
                post_data = post.get('data', {})
                trends.append({
                    "topic": post_data.get('title'),
                    "score": post_data.get('score'),
                    "url": f"https://www.reddit.com{post_data.get('permalink')}",
                    "source": "Reddit"
                })
            return trends
        except Exception as e:
            print(f"Error fetching Reddit trends: {e}")
            return []

    def identify_daily_niche(self):
        all_trends = []
        all_trends.extend(self.get_google_trends())
        all_trends.extend(self.get_reddit_trends(self.trending_sources[1]))
        all_trends.extend(self.get_reddit_trends(self.trending_sources[2]))
        
        # Simple filtering for Productivity/Tech relevance
        relevant_niches = []
        for trend in all_trends:
            topic = trend['topic'].lower()
            if any(kw in topic for kw in self.keywords):
                relevant_niches.append(trend)
        
        # Return top 3 niches
        return relevant_niches[:3] if relevant_niches else all_trends[:3]

if __name__ == "__main__":
    finder = NicheFinder()
    niches = finder.identify_daily_niche()
    print(json.dumps(niches, indent=2))
