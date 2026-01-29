"""
Weekly Transit Analyzer for Vedic Astrology
Analyzes planetary movements and generates summaries for horoscope generation
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional
from vedic_calculator import (
    get_all_planetary_positions,
    get_sign_from_longitude,
    get_nakshatra_from_longitude,
    SIGNS,
    NAKSHATRAS,
    DASHA_YEARS,
)

# Planetary aspects in Vedic astrology (from the planet's position)
# These are the houses a planet aspects (1st is conjunction)
ASPECTS = {
    "Sun": [1, 7],
    "Moon": [1, 7],
    "Mars": [1, 4, 7, 8],
    "Mercury": [1, 7],
    "Jupiter": [1, 5, 7, 9],
    "Venus": [1, 7],
    "Saturn": [1, 3, 7, 10],
    "Rahu": [1, 5, 7, 9],
    "Ketu": [1, 5, 7, 9],
}

# Planet natures
BENEFICS = ["Jupiter", "Venus", "Moon", "Mercury"]  # Mercury is conditional
MALEFICS = ["Saturn", "Mars", "Rahu", "Ketu", "Sun"]

# Day rulers (for muhurta/timing)
DAY_RULERS = {
    "Sunday": "Sun",
    "Monday": "Moon",
    "Tuesday": "Mars",
    "Wednesday": "Mercury",
    "Thursday": "Jupiter",
    "Friday": "Venus",
    "Saturday": "Saturn",
}


def get_week_dates(start_date: Optional[datetime] = None) -> List[datetime]:
    """Get list of dates for the week starting from given date (default: next Monday)"""
    if start_date is None:
        today = datetime.now()
        # Find next Monday
        days_until_monday = (7 - today.weekday()) % 7
        if days_until_monday == 0:
            days_until_monday = 7
        start_date = today + timedelta(days=days_until_monday)

    return [start_date + timedelta(days=i) for i in range(7)]


def get_moon_journey(week_dates: List[datetime]) -> List[Dict]:
    """Track Moon's journey through signs and nakshatras for the week"""
    journey = []

    for date in week_dates:
        # Get positions at 6 AM, noon, and 6 PM to catch sign changes
        times = [6, 12, 18]
        day_positions = []

        for hour in times:
            dt = date.replace(hour=hour, minute=0, second=0)
            positions = get_all_planetary_positions(dt)
            moon = positions["Moon"]
            day_positions.append({
                "time": f"{hour:02d}:00",
                "sign": moon["sign"],
                "nakshatra": moon["nakshatra"],
                "longitude": moon["longitude"],
            })

        # Check if Moon changes sign during the day
        signs_today = [p["sign"]["vedic"] for p in day_positions]
        nakshatras_today = [p["nakshatra"]["name"] for p in day_positions]

        sign_change = len(set(signs_today)) > 1
        nakshatra_change = len(set(nakshatras_today)) > 1

        journey.append({
            "date": date.strftime("%Y-%m-%d"),
            "weekday": date.strftime("%A"),
            "day_ruler": DAY_RULERS[date.strftime("%A")],
            "moon_sign": day_positions[1]["sign"],  # Noon position
            "moon_nakshatra": day_positions[1]["nakshatra"],
            "sign_change": sign_change,
            "nakshatra_change": nakshatra_change,
            "positions": day_positions,
        })

    return journey


def get_slow_planet_positions(date: datetime) -> Dict:
    """Get positions of slow-moving planets (Mars, Jupiter, Saturn, Rahu, Ketu)"""
    dt = date.replace(hour=12, minute=0, second=0)
    positions = get_all_planetary_positions(dt)

    slow_planets = {}
    for planet in ["Mars", "Jupiter", "Saturn", "Rahu", "Ketu"]:
        slow_planets[planet] = {
            "sign": positions[planet]["sign"],
            "nakshatra": positions[planet]["nakshatra"],
            "retrograde": positions[planet]["retrograde"],
            "longitude": positions[planet]["longitude"],
        }

    return slow_planets


def check_planet_aspects(positions: Dict) -> List[Dict]:
    """Check for significant planetary aspects this week"""
    aspects = []
    planets = list(positions.keys())

    for i, planet1 in enumerate(planets):
        for planet2 in planets[i+1:]:
            lon1 = positions[planet1]["longitude"]
            lon2 = positions[planet2]["longitude"]

            # Calculate angular distance
            diff = abs(lon1 - lon2)
            if diff > 180:
                diff = 360 - diff

            # Check for conjunction (within 10 degrees)
            if diff <= 10:
                aspects.append({
                    "type": "conjunction",
                    "planets": [planet1, planet2],
                    "orb": round(diff, 1),
                    "description": f"{planet1} conjunct {planet2}",
                })

            # Check for opposition (within 10 degrees of 180)
            elif abs(diff - 180) <= 10:
                aspects.append({
                    "type": "opposition",
                    "planets": [planet1, planet2],
                    "orb": round(abs(diff - 180), 1),
                    "description": f"{planet1} opposite {planet2}",
                })

            # Check for trine (within 8 degrees of 120)
            elif abs(diff - 120) <= 8:
                aspects.append({
                    "type": "trine",
                    "planets": [planet1, planet2],
                    "orb": round(abs(diff - 120), 1),
                    "description": f"{planet1} trine {planet2}",
                })

            # Check for square (within 8 degrees of 90)
            elif abs(diff - 90) <= 8:
                aspects.append({
                    "type": "square",
                    "planets": [planet1, planet2],
                    "orb": round(abs(diff - 90), 1),
                    "description": f"{planet1} square {planet2}",
                })

    return aspects


def check_sign_changes(week_dates: List[datetime]) -> List[Dict]:
    """Check if any planet changes signs this week"""
    changes = []

    start_positions = get_all_planetary_positions(week_dates[0].replace(hour=12))
    end_positions = get_all_planetary_positions(week_dates[-1].replace(hour=12))

    for planet in start_positions.keys():
        start_sign = start_positions[planet]["sign"]["vedic"]
        end_sign = end_positions[planet]["sign"]["vedic"]

        if start_sign != end_sign:
            # Find approximate day of change
            for date in week_dates:
                day_positions = get_all_planetary_positions(date.replace(hour=12))
                if day_positions[planet]["sign"]["vedic"] != start_sign:
                    changes.append({
                        "planet": planet,
                        "from_sign": start_sign,
                        "to_sign": end_sign,
                        "approximate_date": date.strftime("%Y-%m-%d"),
                        "weekday": date.strftime("%A"),
                    })
                    break

    return changes


def get_house_from_moon(transit_sign_index: int, natal_moon_sign_index: int) -> int:
    """Calculate which house a transiting planet is in relative to natal Moon sign"""
    house = (transit_sign_index - natal_moon_sign_index) % 12 + 1
    return house


def analyze_week_for_moon_sign(moon_sign_index: int, weekly_data: Dict) -> Dict:
    """Analyze the week's transits for a specific Moon sign"""

    moon_sign = SIGNS[moon_sign_index]
    analysis = {
        "moon_sign": moon_sign,
        "moon_journey_houses": [],
        "slow_planet_houses": {},
        "key_days": [],
        "challenges": [],
        "opportunities": [],
    }

    # Analyze Moon's journey through houses
    for day in weekly_data["moon_journey"]:
        transit_moon_index = day["moon_sign"]["index"]
        house = get_house_from_moon(transit_moon_index, moon_sign_index)
        analysis["moon_journey_houses"].append({
            "date": day["date"],
            "weekday": day["weekday"],
            "house": house,
            "nakshatra": day["moon_nakshatra"]["name"],
        })

        # Flag significant Moon transits
        if house in [1, 4, 7, 10]:  # Angular houses
            analysis["key_days"].append({
                "date": day["date"],
                "weekday": day["weekday"],
                "reason": f"Moon transits your {house}{'st' if house == 1 else 'th'} house (angular)",
            })

    # Analyze slow planet positions relative to Moon sign
    for planet, data in weekly_data["slow_planets"].items():
        transit_index = data["sign"]["index"]
        house = get_house_from_moon(transit_index, moon_sign_index)

        analysis["slow_planet_houses"][planet] = {
            "house": house,
            "sign": data["sign"]["vedic"],
            "retrograde": data["retrograde"],
        }

        # Note challenging or supportive placements
        if planet == "Saturn":
            if house in [1, 4, 7, 10]:
                analysis["challenges"].append(f"Saturn in {house}{'st' if house == 1 else 'th'} house demands discipline")
            elif house in [3, 6, 11]:
                analysis["opportunities"].append(f"Saturn in {house}{'th'} house supports steady effort")

        if planet == "Jupiter":
            if house in [1, 5, 9]:
                analysis["opportunities"].append(f"Jupiter in {house}{'st' if house == 1 else 'th'} house brings expansion")
            elif house in [2, 11]:
                analysis["opportunities"].append(f"Jupiter in {house}{'th'} house favors finances")

    return analysis


def generate_weekly_analysis(start_date: Optional[datetime] = None) -> Dict:
    """Generate complete weekly transit analysis"""

    week_dates = get_week_dates(start_date)

    # Core data collection
    moon_journey = get_moon_journey(week_dates)
    slow_planets = get_slow_planet_positions(week_dates[0])

    # Get all positions for aspect checking
    mid_week = week_dates[3]
    all_positions = get_all_planetary_positions(mid_week.replace(hour=12))
    aspects = check_planet_aspects(all_positions)
    sign_changes = check_sign_changes(week_dates)

    weekly_data = {
        "week_start": week_dates[0].strftime("%Y-%m-%d"),
        "week_end": week_dates[-1].strftime("%Y-%m-%d"),
        "moon_journey": moon_journey,
        "slow_planets": slow_planets,
        "aspects": aspects,
        "sign_changes": sign_changes,
    }

    # Generate analysis for each Moon sign
    moon_sign_analyses = {}
    for i, sign in enumerate(SIGNS):
        moon_sign_analyses[sign["vedic"]] = analyze_week_for_moon_sign(i, weekly_data)

    weekly_data["by_moon_sign"] = moon_sign_analyses

    return weekly_data


def format_weekly_summary(weekly_data: Dict) -> str:
    """Format weekly analysis as readable summary"""

    output = []
    output.append("=" * 60)
    output.append(f"WEEKLY TRANSIT ANALYSIS")
    output.append(f"{weekly_data['week_start']} to {weekly_data['week_end']}")
    output.append("=" * 60)

    # Moon's journey
    output.append("\n MOON'S JOURNEY THIS WEEK")
    output.append("-" * 40)
    for day in weekly_data["moon_journey"]:
        sign_change = " *" if day["sign_change"] else ""
        output.append(
            f"{day['weekday'][:3]} {day['date']}: "
            f"{day['moon_sign']['vedic']} ({day['moon_nakshatra']['name']}){sign_change}"
        )

    # Slow planets
    output.append("\n SLOW PLANET POSITIONS")
    output.append("-" * 40)
    for planet, data in weekly_data["slow_planets"].items():
        retro = " (R)" if data["retrograde"] else ""
        output.append(f"{planet}: {data['sign']['vedic']} - {data['nakshatra']['name']}{retro}")

    # Significant aspects
    if weekly_data["aspects"]:
        output.append("\n SIGNIFICANT ASPECTS")
        output.append("-" * 40)
        for aspect in weekly_data["aspects"]:
            output.append(f"{aspect['description']} (orb: {aspect['orb']})")

    # Sign changes
    if weekly_data["sign_changes"]:
        output.append("\n SIGN CHANGES THIS WEEK")
        output.append("-" * 40)
        for change in weekly_data["sign_changes"]:
            output.append(
                f"{change['planet']}: {change['from_sign']} -> {change['to_sign']} "
                f"(~{change['weekday']})"
            )

    return "\n".join(output)


def format_moon_sign_analysis(analysis: Dict) -> str:
    """Format analysis for a specific Moon sign"""

    output = []
    sign = analysis["moon_sign"]
    output.append(f"\n{'='*60}")
    output.append(f"ANALYSIS FOR {sign['vedic'].upper()} ({sign['western'].upper()}) MOON")
    output.append("=" * 60)

    # Moon transit through houses
    output.append("\n Moon transits your houses:")
    for day in analysis["moon_journey_houses"]:
        output.append(f"  {day['weekday'][:3]}: House {day['house']} ({day['nakshatra']})")

    # Slow planet houses
    output.append("\n Slow planets in your houses:")
    for planet, data in analysis["slow_planet_houses"].items():
        retro = " (R)" if data["retrograde"] else ""
        output.append(f"  {planet}: House {data['house']}{retro}")

    # Key days
    if analysis["key_days"]:
        output.append("\n Key days:")
        for day in analysis["key_days"]:
            output.append(f"  {day['weekday']}: {day['reason']}")

    # Opportunities
    if analysis["opportunities"]:
        output.append("\n Opportunities:")
        for opp in analysis["opportunities"]:
            output.append(f"  - {opp}")

    # Challenges
    if analysis["challenges"]:
        output.append("\n Challenges:")
        for challenge in analysis["challenges"]:
            output.append(f"  - {challenge}")

    return "\n".join(output)


# ============================================
# TEST: Generate this week's analysis
# ============================================

if __name__ == "__main__":
    print("Generating weekly transit analysis...")
    print("(This may take a moment)\n")

    # Generate for current week
    weekly = generate_weekly_analysis()

    # Print general summary
    print(format_weekly_summary(weekly))

    # Print analysis for a few Moon signs
    for sign in ["Kumbha", "Mesha", "Tula"]:  # Aquarius, Aries, Libra
        print(format_moon_sign_analysis(weekly["by_moon_sign"][sign]))

    print("\n" + "=" * 60)
    print("DATA STRUCTURE AVAILABLE FOR HOROSCOPE GENERATION:")
    print("=" * 60)
    print(f"\nweekly['moon_journey'] - List of {len(weekly['moon_journey'])} days with Moon positions")
    print(f"weekly['slow_planets'] - Dict with {len(weekly['slow_planets'])} slow planet positions")
    print(f"weekly['aspects'] - List of {len(weekly['aspects'])} significant aspects")
    print(f"weekly['sign_changes'] - List of {len(weekly['sign_changes'])} sign changes")
    print(f"weekly['by_moon_sign'] - Dict with analysis for all 12 Moon signs")
