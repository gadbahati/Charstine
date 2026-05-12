import sys
import os
import random
import time

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from research.niche_finder import NicheFinder
from factory.content_generator import ContentFactory
from distribution.publisher import Publisher
from routing.affiliate_manager import AffiliateManager
from optimization.feedback_loop import Optimizer

def run_cycle():
    print("--- Starting Content-to-Commerce Cycle ---")
    
    finder = NicheFinder()
    factory = ContentFactory()
    publisher = Publisher()
    affiliate = AffiliateManager(affiliate_id="charstine_01")
    optimizer = Optimizer()

    # 1. Research
    print("Step 1: Researching niches...")
    niches = finder.identify_daily_niche()
    
    # 2. Check for winning niches from previous cycles
    winning_niches = optimizer.get_winning_niches()
    if winning_niches:
        print(f"Doubling down on winning niche: {winning_niches[0]}")
        target_niche = winning_niches[0]
    else:
        target_niche = niches[0]['topic'] if niches else "Productivity Hacks"

    print(f"Target Niche: {target_niche}")

    # 3. Content Factory
    print("Step 2: Generating content...")
    content_package = factory.generate_content(target_niche)

    # 4. Financial Routing (Inject Affiliate Links)
    print("Step 3: Injecting affiliate links...")
    for platform in content_package:
        if content_package[platform]:
            content_package[platform] = affiliate.inject_links(content_package[platform], niche_category="productivity")

    # 5. Distribution
    print("Step 4: Distributing content...")
    # Randomize start time to mimic human behavior
    time.sleep(random.randint(1, 60))
    results = publisher.distribute_all(content_package)
    print(f"Distribution Results: {results}")

    # 6. Optimization (Simulate view recording for the feedback loop)
    # In a real system, this would be a separate process fetching analytics
    simulated_views = random.randint(100, 1000)
    optimizer.record_performance(target_niche, "all", simulated_views)
    
    print("--- Cycle Complete ---")

if __name__ == "__main__":
    run_cycle()
