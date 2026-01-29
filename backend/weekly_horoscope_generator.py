"""
Weekly Horoscope Generator
Generates horoscope content from transit analysis using LLM prompts
"""

import json
from datetime import datetime
from typing import Dict, List, Optional
from weekly_transit_analyzer import generate_weekly_analysis, SIGNS, NAKSHATRAS

# ============================================
# PROMPT TEMPLATES
# ============================================

MASTER_OVERVIEW_PROMPT = """You are an expert Vedic astrologer writing for a modern Western audience. Write a weekly transit overview for the week of {week_start} to {week_end}.

TRANSIT DATA:
{transit_data}

Write a 150-200 word overview that:
1. Opens with the dominant energy of the week (don't start with "This week")
2. Highlights 2-3 key transits or aspects
3. Notes the best days and what they're good for
4. Notes any challenging days and how to navigate them
5. Ends with actionable advice

Tone: Warm, grounded, practical. Not fatalistic or fluffy. Use "you" to address the reader.
Do NOT use bullet points. Write in flowing paragraphs.
Do NOT mention specific degrees or technical jargon.
"""

MOON_SIGN_PROMPT = """You are an expert Vedic astrologer writing personalized weekly horoscopes. Write a horoscope for {moon_sign_vedic} ({moon_sign_western}) Moon sign for the week of {week_start} to {week_end}.

TRANSIT DATA FOR THIS SIGN:
{sign_analysis}

GENERAL WEEK CONTEXT:
{week_context}

Write a 100-120 word horoscope that:
1. Opens with a specific insight (not a generic greeting)
2. Mentions which houses the Moon transits this week and what that activates
3. Notes the influence of slow planets (especially Saturn, Jupiter) in their current houses
4. Identifies the best day(s) and why
5. Gives one concrete suggestion for the week

Tone: Direct, specific, useful. Speak to this Moon sign's tendencies.
Do NOT use bullet points. Write in 2-3 short paragraphs.
Do NOT start with "This week" or "Dear [sign]".
"""

NAKSHATRA_SNIPPET_PROMPT = """You are an expert Vedic astrologer. Write a 1-2 sentence personalized snippet for someone with Moon in {nakshatra} nakshatra for the week of {week_start} to {week_end}.

This week, the Moon transits through their nakshatra on: {moon_in_nakshatra_day}

The ruling planet of {nakshatra} is {nakshatra_lord}. Current position of {nakshatra_lord}: {lord_position}

Write a brief, specific insight about this week for this nakshatra. Focus on:
- The day Moon transits their nakshatra (if applicable)
- How their nakshatra lord's current position affects them
- One actionable insight

Keep it to 1-2 sentences. Be specific, not generic.
"""

DASHA_CONTEXT_TEMPLATES = {
    "Sun": "You're in Sun mahadasha — a period emphasizing identity, authority, and self-expression. This week's transits interact with that solar energy.",
    "Moon": "You're in Moon mahadasha — a period of emotional processing, intuition, and inner development. This week's lunar journey is especially significant for you.",
    "Mars": "You're in Mars mahadasha — a period of action, courage, and drive. Pay attention to Mars-related transits this week.",
    "Mercury": "You're in Mercury mahadasha — a period favoring communication, learning, and adaptability. Mercury's movements matter more for you now.",
    "Jupiter": "You're in Jupiter mahadasha — a period of growth, wisdom, and expansion. Jupiter's position and aspects are especially relevant.",
    "Venus": "You're in Venus mahadasha — a period highlighting relationships, creativity, and pleasure. Venus transits carry extra weight.",
    "Saturn": "You're in Saturn mahadasha — a period of discipline, restructuring, and karmic lessons. Saturn's slow transit through your houses is your teacher.",
    "Rahu": "You're in Rahu mahadasha — a period of ambition, unconventional paths, and material pursuits. The nodes' positions shape your direction.",
    "Ketu": "You're in Ketu mahadasha — a period of release, spirituality, and letting go. Ketu's transit highlights what you're moving beyond.",
}


# ============================================
# DATA FORMATTERS (for prompts)
# ============================================

def format_transit_data_for_prompt(weekly_data: Dict) -> str:
    """Format weekly transit data as readable text for the LLM prompt"""

    lines = []

    # Moon's journey
    lines.append("MOON'S JOURNEY:")
    for day in weekly_data["moon_journey"]:
        lines.append(f"- {day['weekday']}: {day['moon_sign']['vedic']} ({day['moon_sign']['western']}) in {day['moon_nakshatra']['name']}")

    # Slow planets
    lines.append("\nSLOW PLANET POSITIONS:")
    for planet, data in weekly_data["slow_planets"].items():
        retro = " (retrograde)" if data["retrograde"] else ""
        lines.append(f"- {planet}: {data['sign']['vedic']} ({data['sign']['western']}) in {data['nakshatra']['name']}{retro}")

    # Aspects
    if weekly_data["aspects"]:
        lines.append("\nKEY ASPECTS:")
        for aspect in weekly_data["aspects"]:
            lines.append(f"- {aspect['description']}")

    # Sign changes
    if weekly_data["sign_changes"]:
        lines.append("\nSIGN CHANGES THIS WEEK:")
        for change in weekly_data["sign_changes"]:
            lines.append(f"- {change['planet']} moves from {change['from_sign']} to {change['to_sign']} on {change['weekday']}")

    return "\n".join(lines)


def format_sign_analysis_for_prompt(analysis: Dict) -> str:
    """Format Moon sign analysis for the LLM prompt"""

    lines = []

    # Moon through houses
    lines.append("MOON TRANSITS YOUR HOUSES:")
    for day in analysis["moon_journey_houses"]:
        lines.append(f"- {day['weekday']}: House {day['house']} ({day['nakshatra']})")

    # Slow planets in houses
    lines.append("\nSLOW PLANETS IN YOUR HOUSES:")
    for planet, data in analysis["slow_planet_houses"].items():
        retro = " (retrograde)" if data["retrograde"] else ""
        lines.append(f"- {planet}: House {data['house']}{retro}")

    # Opportunities and challenges
    if analysis["opportunities"]:
        lines.append("\nOPPORTUNITIES:")
        for opp in analysis["opportunities"]:
            lines.append(f"- {opp}")

    if analysis["challenges"]:
        lines.append("\nCHALLENGES:")
        for challenge in analysis["challenges"]:
            lines.append(f"- {challenge}")

    return "\n".join(lines)


def find_nakshatra_transit_day(nakshatra_name: str, weekly_data: Dict) -> Optional[str]:
    """Find which day (if any) the Moon transits a given nakshatra"""
    for day in weekly_data["moon_journey"]:
        if day["moon_nakshatra"]["name"] == nakshatra_name:
            return day["weekday"]
    return None


def get_nakshatra_lord_position(nakshatra_name: str, weekly_data: Dict) -> str:
    """Get the current position of a nakshatra's ruling planet"""
    # Find the nakshatra's lord
    nakshatra_info = next((n for n in NAKSHATRAS if n["name"] == nakshatra_name), None)
    if not nakshatra_info:
        return "unknown"

    lord = nakshatra_info["lord"]

    # Get lord's position from slow planets or calculate
    if lord in weekly_data["slow_planets"]:
        data = weekly_data["slow_planets"][lord]
        retro = " (retrograde)" if data["retrograde"] else ""
        return f"{data['sign']['vedic']} in {data['nakshatra']['name']}{retro}"

    # For Sun, Moon, Mercury, Venus - would need to calculate
    return f"transiting (check daily positions)"


# ============================================
# PROMPT GENERATORS
# ============================================

def generate_master_overview_prompt(weekly_data: Dict) -> str:
    """Generate the prompt for the master weekly overview"""

    transit_data = format_transit_data_for_prompt(weekly_data)

    return MASTER_OVERVIEW_PROMPT.format(
        week_start=weekly_data["week_start"],
        week_end=weekly_data["week_end"],
        transit_data=transit_data,
    )


def generate_moon_sign_prompt(moon_sign_vedic: str, weekly_data: Dict) -> str:
    """Generate the prompt for a specific Moon sign horoscope"""

    sign_info = next((s for s in SIGNS if s["vedic"] == moon_sign_vedic), None)
    if not sign_info:
        raise ValueError(f"Unknown sign: {moon_sign_vedic}")

    analysis = weekly_data["by_moon_sign"][moon_sign_vedic]
    sign_analysis = format_sign_analysis_for_prompt(analysis)
    week_context = format_transit_data_for_prompt(weekly_data)

    return MOON_SIGN_PROMPT.format(
        moon_sign_vedic=moon_sign_vedic,
        moon_sign_western=sign_info["western"],
        week_start=weekly_data["week_start"],
        week_end=weekly_data["week_end"],
        sign_analysis=sign_analysis,
        week_context=week_context,
    )


def generate_nakshatra_snippet_prompt(nakshatra_name: str, weekly_data: Dict) -> str:
    """Generate the prompt for a nakshatra-specific snippet"""

    nakshatra_info = next((n for n in NAKSHATRAS if n["name"] == nakshatra_name), None)
    if not nakshatra_info:
        raise ValueError(f"Unknown nakshatra: {nakshatra_name}")

    moon_day = find_nakshatra_transit_day(nakshatra_name, weekly_data)
    lord_position = get_nakshatra_lord_position(nakshatra_name, weekly_data)

    return NAKSHATRA_SNIPPET_PROMPT.format(
        nakshatra=nakshatra_name,
        week_start=weekly_data["week_start"],
        week_end=weekly_data["week_end"],
        moon_in_nakshatra_day=moon_day or "Moon does not transit this nakshatra this week",
        nakshatra_lord=nakshatra_info["lord"],
        lord_position=lord_position,
    )


def generate_all_prompts(weekly_data: Dict) -> Dict:
    """Generate all prompts needed for weekly horoscope generation"""

    prompts = {
        "master_overview": generate_master_overview_prompt(weekly_data),
        "moon_signs": {},
        "nakshatras": {},
        "dasha_contexts": DASHA_CONTEXT_TEMPLATES,
    }

    # Generate prompts for all 12 Moon signs
    for sign in SIGNS:
        prompts["moon_signs"][sign["vedic"]] = generate_moon_sign_prompt(
            sign["vedic"], weekly_data
        )

    # Generate prompts for all 27 nakshatras
    for nakshatra in NAKSHATRAS:
        prompts["nakshatras"][nakshatra["name"]] = generate_nakshatra_snippet_prompt(
            nakshatra["name"], weekly_data
        )

    return prompts


# ============================================
# EXAMPLE: Generate prompts for this week
# ============================================

if __name__ == "__main__":
    print("Generating weekly transit data...")
    weekly_data = generate_weekly_analysis()

    print("Generating prompts...")
    prompts = generate_all_prompts(weekly_data)

    print("\n" + "=" * 60)
    print("MASTER OVERVIEW PROMPT")
    print("=" * 60)
    print(prompts["master_overview"])

    print("\n" + "=" * 60)
    print("EXAMPLE: KUMBHA (AQUARIUS) MOON SIGN PROMPT")
    print("=" * 60)
    print(prompts["moon_signs"]["Kumbha"])

    print("\n" + "=" * 60)
    print("EXAMPLE: PURVA BHADRAPADA NAKSHATRA PROMPT")
    print("=" * 60)
    print(prompts["nakshatras"]["Purva Bhadrapada"])

    print("\n" + "=" * 60)
    print("DASHA CONTEXT (pre-written, no LLM needed)")
    print("=" * 60)
    print(prompts["dasha_contexts"]["Mercury"])

    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Generated {len(prompts['moon_signs'])} Moon sign prompts")
    print(f"Generated {len(prompts['nakshatras'])} nakshatra prompts")
    print(f"Pre-written {len(prompts['dasha_contexts'])} dasha context templates")
    print("\nTo generate content: Send each prompt to Claude API")
    print("Total API calls needed per week: 1 (overview) + 12 (signs) + 27 (nakshatras) = 40")
    print("Estimated cost: ~$0.40-0.80 per week")
