class AffiliateManager:
    def __init__(self, affiliate_id="YOUR_ID"):
        self.affiliate_id = affiliate_id
        # Example mapping of niches to affiliate products
        self.product_links = {
            "productivity": "https://amazon.com/productivity-planner?tag=",
            "tech": "https://amazon.com/ergonomic-keyboard?tag=",
            "default": "https://amazon.com/best-sellers?tag="
        }

    def inject_links(self, content, platform="default", niche_category="default"):
        base_link = self.product_links.get(niche_category, self.product_links["default"])
        full_link = f"{base_link}{self.affiliate_id}"
        
        disclaimer = "\n\n*Disclosure: This post contains affiliate links. I may earn a commission at no extra cost to you.*"
        
        if platform == "tiktok" or platform == "youtube_shorts":
            # For short-form video, we usually refer to the Link-in-Bio
            cta = f"\n\n🔗 Get the tools mentioned here: Link in Bio! ({full_link})"
        elif platform == "facebook":
            cta = f"\n\n👉 Check this out: {full_link}"
        else:
            cta = f"\n\nCheck out our top recommendation for this niche: {full_link}"
        
        return content + cta + disclaimer

    def monitor_performance(self):
        # Placeholder for monitoring "Link-in-Bio" performance
        # This would typically fetch data from a link shortener API (e.g., Bitly)
        return {"clicks": 0, "conversions": 0}
