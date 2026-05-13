import os
from openai import OpenAI

class ContentFactory:
    def __init__(self):
        # Using the pre-configured OpenAI client in the sandbox which uses gemini-2.5-flash
        self.client = OpenAI()
        self.model = "gemini-2.5-flash"

    def generate_content(self, niche_topic):
        prompts = {
            "pinterest": f"Generate a catchy Pinterest Pin title and description for the topic: {niche_topic}. Focus on productivity or tech hacks.",
            "youtube_shorts": f"Write a 50-second high-retention script for a YouTube Short about: {niche_topic}. Include a hook, 3 quick tips, and a call to action.",
            "medium": f"Write a professional, long-form educational article (800 words) about: {niche_topic}. Use a structured format with headings and a conclusion.",
            "tiktok": f"Write a viral-style 30-second TikTok script about: {niche_topic}. Start with a strong hook, use high-energy language, and end with a trend-based CTA.",
            "facebook": f"Write an engaging Facebook post about: {niche_topic}. Include emojis, ask a question to encourage comments, and provide a helpful tip."
        }
        
        generated_content = {}
        for platform, prompt in prompts.items():
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are an expert content creator specializing in Productivity and Tech."},
                        {"role": "user", "content": prompt}
                    ]
                )
                generated_content[platform] = response.choices[0].message.content
            except Exception as e:
                print(f"Error generating content for {platform}: {e}")
                generated_content[platform] = None
        
        return generated_content

if __name__ == "__main__":
    factory = ContentFactory()
    content = factory.generate_content("AI automation for small businesses")
    for platform, text in content.items():
        print(f"--- {platform.upper()} ---")
        print(text[:200] + "...")
