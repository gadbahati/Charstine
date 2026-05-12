# Autonomous Content-to-Commerce Engine

This is an autonomous system designed to operate with $0 initial capital, researching trending niches, generating content, and distributing it across multiple platforms with integrated affiliate marketing.

## Architecture

1.  **Research Module (`research/niche_finder.py`)**: Uses Google Trends and Reddit RSS/JSON feeds to identify daily trending topics in the Productivity and Tech sectors.
2.  **Content Factory (`factory/content_generator.py`)**: Integrates with the Gemini-2.5-flash API (via the OpenAI-compatible client) to generate platform-specific content (Pinterest, YouTube Shorts, Medium).
3.  **Distribution Engine (`distribution/publisher.py`)**: Simulates automated posting to social platforms with human-like delays to avoid spam filters.
4.  **Financial Routing (`routing/affiliate_manager.py`)**: Injects affiliate IDs into content metadata and provides a structure for monitoring performance.
5.  **Self-Optimization (`optimization/feedback_loop.py`)**: Analyzes performance data (simulated for now) to double down on high-performing niches in subsequent cycles.
6.  **Orchestrator (`main.py`)**: Coordinates the entire workflow.

## Zero-Touch Execution

The system is configured to run via a **Manus Schedule** (cron job) 3 times daily (08:00, 14:00, 20:00).

## Deployment

To deploy this on a free-tier VPS or cloud-based cron job:
1.  Clone this repository.
2.  Install dependencies: `pip install -r engine/requirements.txt`.
3.  Set up a cron job to run `python3 engine/main.py`.

## Success Considerations

-   **Mimic Human Behavior**: The system includes random delays between posts.
-   **Micro-Niche Focus**: The research module filters for specific high-conversion keywords.
-   **Exponential Growth**: The system implements a feedback loop to improve niche selection over time.
