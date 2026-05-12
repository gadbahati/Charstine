import json
import os

class Optimizer:
    def __init__(self, history_file="/home/ubuntu/Charstine/engine/optimization/history.json"):
        self.history_file = history_file
        if not os.path.exists(self.history_file):
            with open(self.history_file, 'w') as f:
                json.dump([], f)

    def record_performance(self, niche, platform, views):
        with open(self.history_file, 'r') as f:
            history = json.load(f)
        
        history.append({
            "niche": niche,
            "platform": platform,
            "views": views,
            "timestamp": "2024-05-12" # Simplified
        })
        
        with open(self.history_file, 'w') as f:
            json.dump(history, f, indent=2)

    def get_winning_niches(self):
        with open(self.history_file, 'r') as f:
            history = json.load(f)
        
        if not history:
            return []
            
        # Group by niche and sum views
        niche_stats = {}
        for entry in history:
            n = entry['niche']
            niche_stats[n] = niche_stats.get(n, 0) + entry['views']
            
        # Sort by views
        sorted_niches = sorted(niche_stats.items(), key=lambda x: x[1], reverse=True)
        return [n[0] for n in sorted_niches]
