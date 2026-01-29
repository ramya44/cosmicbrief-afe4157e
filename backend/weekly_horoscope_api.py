"""
Weekly Horoscope API Caller
Sends prompts to Claude Haiku API and generates horoscope content
Optionally uploads to Supabase for distribution via email
"""

import os
import json
import time
import requests
from datetime import datetime
from typing import Dict, List, Optional
from anthropic import Anthropic
from weekly_transit_analyzer import generate_weekly_analysis, SIGNS, NAKSHATRAS
from weekly_horoscope_generator import (
    generate_all_prompts,
    DASHA_CONTEXT_TEMPLATES,
)

# Initialize Anthropic client
# Expects ANTHROPIC_API_KEY environment variable
client = Anthropic()

# Model to use - Haiku 4.5 for cost efficiency
MODEL = "claude-haiku-4-5-20251001"

# Rate limiting - be nice to the API
DELAY_BETWEEN_CALLS = 0.5  # seconds


def call_claude(prompt: str, max_tokens: int = 300) -> str:
    """Call Claude API with a prompt and return the response"""
    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=max_tokens,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        return response.content[0].text
    except Exception as e:
        print(f"API Error: {e}")
        return f"[Error generating content: {e}]"


def generate_master_overview(prompts: Dict) -> str:
    """Generate the master weekly overview"""
    print("Generating master overview...")
    content = call_claude(prompts["master_overview"], max_tokens=400)
    time.sleep(DELAY_BETWEEN_CALLS)
    return content


def generate_moon_sign_horoscopes(prompts: Dict) -> Dict[str, str]:
    """Generate horoscopes for all 12 Moon signs"""
    horoscopes = {}

    for i, (sign, prompt) in enumerate(prompts["moon_signs"].items()):
        print(f"Generating {sign} horoscope... ({i+1}/12)")
        horoscopes[sign] = call_claude(prompt, max_tokens=250)
        time.sleep(DELAY_BETWEEN_CALLS)

    return horoscopes


def generate_nakshatra_snippets(prompts: Dict) -> Dict[str, str]:
    """Generate snippets for all 27 nakshatras"""
    snippets = {}

    for i, (nakshatra, prompt) in enumerate(prompts["nakshatras"].items()):
        print(f"Generating {nakshatra} snippet... ({i+1}/27)")
        snippets[nakshatra] = call_claude(prompt, max_tokens=100)
        time.sleep(DELAY_BETWEEN_CALLS)

    return snippets


def generate_weekly_content(weekly_data: Optional[Dict] = None) -> Dict:
    """Generate all weekly horoscope content"""

    start_time = time.time()

    # Generate transit data if not provided
    if weekly_data is None:
        print("Analyzing weekly transits...")
        weekly_data = generate_weekly_analysis()

    # Generate prompts
    print("Generating prompts...")
    prompts = generate_all_prompts(weekly_data)

    # Call API for each component
    content = {
        "week_start": weekly_data["week_start"],
        "week_end": weekly_data["week_end"],
        "generated_at": datetime.now().isoformat(),
        "master_overview": generate_master_overview(prompts),
        "moon_signs": generate_moon_sign_horoscopes(prompts),
        "nakshatras": generate_nakshatra_snippets(prompts),
        "dasha_contexts": DASHA_CONTEXT_TEMPLATES,  # Pre-written, no API call
    }

    elapsed = time.time() - start_time
    print(f"\nCompleted in {elapsed:.1f} seconds")
    print(f"Total API calls: 40 (1 overview + 12 signs + 27 nakshatras)")

    return content


def save_content_to_file(content: Dict, filename: str = None) -> str:
    """Save generated content to JSON file"""
    if filename is None:
        filename = f"weekly_horoscope_{content['week_start']}.json"

    with open(filename, 'w') as f:
        json.dump(content, f, indent=2)

    print(f"Saved to {filename}")
    return filename


def upload_to_supabase(content: Dict) -> bool:
    """Upload weekly content to Supabase for email distribution"""
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        print("Supabase credentials not found. Skipping upload.")
        print("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable.")
        return False

    try:
        # Prepare the payload
        payload = {
            "week_start": content["week_start"],
            "week_end": content["week_end"],
            "content": content,
        }

        # Upsert to weekly_horoscope_content table
        response = requests.post(
            f"{supabase_url}/rest/v1/weekly_horoscope_content",
            headers={
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}",
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates",
            },
            json=payload,
        )

        if response.status_code in (200, 201):
            print(f"Uploaded to Supabase successfully")
            return True
        else:
            print(f"Supabase upload failed: {response.status_code} - {response.text}")
            return False

    except Exception as e:
        print(f"Supabase upload error: {e}")
        return False


def trigger_email_send(test_mode: bool = False, test_email: str = None) -> bool:
    """Trigger the Supabase edge function to send weekly emails"""
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        print("Supabase credentials not found. Cannot trigger email send.")
        return False

    try:
        payload = {}
        if test_mode:
            payload["test_mode"] = True
            if test_email:
                payload["test_email"] = test_email

        response = requests.post(
            f"{supabase_url}/functions/v1/send-weekly-horoscope",
            headers={
                "Authorization": f"Bearer {supabase_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )

        if response.status_code == 200:
            result = response.json()
            print(f"Email send triggered: {result.get('sent', 0)} sent, {result.get('failed', 0)} failed")
            return True
        else:
            print(f"Email trigger failed: {response.status_code} - {response.text}")
            return False

    except Exception as e:
        print(f"Email trigger error: {e}")
        return False


def assemble_personalized_horoscope(
    content: Dict,
    moon_sign: str,
    nakshatra: str,
    mahadasha: str,
) -> str:
    """Assemble a personalized horoscope from pre-generated blocks"""

    # Validate inputs
    if moon_sign not in content["moon_signs"]:
        raise ValueError(f"Unknown Moon sign: {moon_sign}")
    if nakshatra not in content["nakshatras"]:
        raise ValueError(f"Unknown nakshatra: {nakshatra}")
    if mahadasha not in content["dasha_contexts"]:
        raise ValueError(f"Unknown mahadasha: {mahadasha}")

    # Assemble the horoscope
    horoscope = f"""YOUR WEEK: {content['week_start']} to {content['week_end']}

{content['master_overview']}

---

FOR {moon_sign.upper()} MOON

{content['moon_signs'][moon_sign]}

---

YOUR NAKSHATRA: {nakshatra.upper()}

{content['nakshatras'][nakshatra]}

---

YOUR CURRENT CYCLE

{content['dasha_contexts'][mahadasha]}

---

Want deeper insights? Get your personalized 2026 Cosmic Brief
"""

    return horoscope


# ============================================
# EXAMPLE: Generate and test
# ============================================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Generate weekly horoscope content")
    parser.add_argument("--upload", action="store_true", help="Upload to Supabase after generating")
    parser.add_argument("--send-emails", action="store_true", help="Trigger email send after uploading")
    parser.add_argument("--test-email", type=str, help="Send test email to this address only")
    args = parser.parse_args()

    print("=" * 60)
    print("WEEKLY HOROSCOPE GENERATOR")
    print("Using Claude Haiku 4.5")
    print("=" * 60)

    # Check for API key
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("\n  ANTHROPIC_API_KEY not found in environment")
        print("Set it with: export ANTHROPIC_API_KEY='your-key-here'")
        print("\nGenerating prompts only (no API calls)...\n")

        # Just show what would be generated
        weekly_data = generate_weekly_analysis()
        prompts = generate_all_prompts(weekly_data)

        print("Sample master overview prompt:")
        print("-" * 40)
        print(prompts["master_overview"][:500] + "...")

    else:
        print("\n API key found. Generating content...\n")

        # Generate all content
        content = generate_weekly_content()

        # Save to file
        save_content_to_file(content)

        # Upload to Supabase if requested
        if args.upload:
            print("\n" + "=" * 60)
            print("UPLOADING TO SUPABASE")
            print("=" * 60)
            upload_to_supabase(content)

        # Trigger email send if requested
        if args.send_emails:
            print("\n" + "=" * 60)
            print("TRIGGERING EMAIL SEND")
            print("=" * 60)
            trigger_email_send(
                test_mode=bool(args.test_email),
                test_email=args.test_email
            )

        # Show sample output
        print("\n" + "=" * 60)
        print("SAMPLE: MASTER OVERVIEW")
        print("=" * 60)
        print(content["master_overview"])

        print("\n" + "=" * 60)
        print("SAMPLE: KUMBHA (AQUARIUS) HOROSCOPE")
        print("=" * 60)
        print(content["moon_signs"]["Kumbha"])

        print("\n" + "=" * 60)
        print("SAMPLE: PURVA BHADRAPADA SNIPPET")
        print("=" * 60)
        print(content["nakshatras"]["Purva Bhadrapada"])

        # Assemble a personalized horoscope (for you!)
        print("\n" + "=" * 60)
        print("ASSEMBLED HOROSCOPE FOR RAMYA")
        print("(Kumbha Moon, Purva Bhadrapada, Mercury Mahadasha)")
        print("=" * 60)
        personalized = assemble_personalized_horoscope(
            content,
            moon_sign="Kumbha",
            nakshatra="Purva Bhadrapada",
            mahadasha="Mercury",
        )
        print(personalized)

        print("\n" + "=" * 60)
        print("USAGE")
        print("=" * 60)
        print("To upload to Supabase:    python weekly_horoscope_api.py --upload")
        print("To send emails:           python weekly_horoscope_api.py --upload --send-emails")
        print("To test with one email:   python weekly_horoscope_api.py --upload --send-emails --test-email you@example.com")
