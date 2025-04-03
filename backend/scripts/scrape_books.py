import asyncio
import json
import os

import aiohttp


async def scrape_books():
    # Get the directory of the current script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(script_dir, "aladin_books.json")

    # Read URLs from aladin_books.json
    with open(json_path, "r") as f:
        data = json.load(f)
        urls = data["url"]

    # Make requests to the API
    async with aiohttp.ClientSession() as session:
        for url in urls:
            try:
                async with session.post(
                    "http://localhost:8012/api/books/scrape",
                    json={"url": url},
                    headers={"Content-Type": "application/json"},
                ) as response:
                    if response.status == 200:
                        print(f"Successfully queued scraping for: {url}")
                    else:
                        print(f"Failed to queue scraping for: {url}")
            except Exception as e:
                print(f"Error processing {url}: {str(e)}")


def main():
    # Properly run the async function
    asyncio.run(scrape_books())


if __name__ == "__main__":
    main()
