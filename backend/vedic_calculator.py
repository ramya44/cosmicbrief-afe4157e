"""
Vedic Astrology Calculator using Swiss Ephemeris
Core functions for planetary positions, Moon sign, nakshatra, and dasha calculations
"""

import swisseph as swe
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import math

# Initialize Swiss Ephemeris
swe.set_ephe_path(None)  # Use built-in ephemeris

# Ayanamsa: Lahiri (most common for Vedic astrology)
AYANAMSA = swe.SIDM_LAHIRI

# Zodiac signs (Vedic names and Western equivalents)
SIGNS = [
    {"vedic": "Mesha", "western": "Aries", "lord": "Mars"},
    {"vedic": "Vrishabha", "western": "Taurus", "lord": "Venus"},
    {"vedic": "Mithuna", "western": "Gemini", "lord": "Mercury"},
    {"vedic": "Karka", "western": "Cancer", "lord": "Moon"},
    {"vedic": "Simha", "western": "Leo", "lord": "Sun"},
    {"vedic": "Kanya", "western": "Virgo", "lord": "Mercury"},
    {"vedic": "Tula", "western": "Libra", "lord": "Venus"},
    {"vedic": "Vrishchika", "western": "Scorpio", "lord": "Mars"},
    {"vedic": "Dhanu", "western": "Sagittarius", "lord": "Jupiter"},
    {"vedic": "Makara", "western": "Capricorn", "lord": "Saturn"},
    {"vedic": "Kumbha", "western": "Aquarius", "lord": "Saturn"},
    {"vedic": "Meena", "western": "Pisces", "lord": "Jupiter"},
]

# 27 Nakshatras with their ruling planets
NAKSHATRAS = [
    {"name": "Ashwini", "lord": "Ketu", "deity": "Ashwini Kumaras"},
    {"name": "Bharani", "lord": "Venus", "deity": "Yama"},
    {"name": "Krittika", "lord": "Sun", "deity": "Agni"},
    {"name": "Rohini", "lord": "Moon", "deity": "Brahma"},
    {"name": "Mrigashira", "lord": "Mars", "deity": "Soma"},
    {"name": "Ardra", "lord": "Rahu", "deity": "Rudra"},
    {"name": "Punarvasu", "lord": "Jupiter", "deity": "Aditi"},
    {"name": "Pushya", "lord": "Saturn", "deity": "Brihaspati"},
    {"name": "Ashlesha", "lord": "Mercury", "deity": "Nagas"},
    {"name": "Magha", "lord": "Ketu", "deity": "Pitris"},
    {"name": "Purva Phalguni", "lord": "Venus", "deity": "Bhaga"},
    {"name": "Uttara Phalguni", "lord": "Sun", "deity": "Aryaman"},
    {"name": "Hasta", "lord": "Moon", "deity": "Savitar"},
    {"name": "Chitra", "lord": "Mars", "deity": "Vishvakarma"},
    {"name": "Swati", "lord": "Rahu", "deity": "Vayu"},
    {"name": "Vishakha", "lord": "Jupiter", "deity": "Indra-Agni"},
    {"name": "Anuradha", "lord": "Saturn", "deity": "Mitra"},
    {"name": "Jyeshtha", "lord": "Mercury", "deity": "Indra"},
    {"name": "Mula", "lord": "Ketu", "deity": "Nirriti"},
    {"name": "Purva Ashadha", "lord": "Venus", "deity": "Apas"},
    {"name": "Uttara Ashadha", "lord": "Sun", "deity": "Vishvadevas"},
    {"name": "Shravana", "lord": "Moon", "deity": "Vishnu"},
    {"name": "Dhanishta", "lord": "Mars", "deity": "Vasus"},
    {"name": "Shatabhisha", "lord": "Rahu", "deity": "Varuna"},
    {"name": "Purva Bhadrapada", "lord": "Jupiter", "deity": "Aja Ekapada"},
    {"name": "Uttara Bhadrapada", "lord": "Saturn", "deity": "Ahir Budhnya"},
    {"name": "Revati", "lord": "Mercury", "deity": "Pushan"},
]

# Vimshottari Dasha periods (in years)
DASHA_YEARS = {
    "Ketu": 7,
    "Venus": 20,
    "Sun": 6,
    "Moon": 10,
    "Mars": 7,
    "Rahu": 18,
    "Jupiter": 16,
    "Saturn": 19,
    "Mercury": 17,
}

# Dasha sequence
DASHA_SEQUENCE = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"]

# Planet IDs in Swiss Ephemeris
PLANETS = {
    "Sun": swe.SUN,
    "Moon": swe.MOON,
    "Mars": swe.MARS,
    "Mercury": swe.MERCURY,
    "Jupiter": swe.JUPITER,
    "Venus": swe.VENUS,
    "Saturn": swe.SATURN,
    "Rahu": swe.MEAN_NODE,  # North Node
}


def datetime_to_jd(dt: datetime) -> float:
    """Convert datetime to Julian Day"""
    return swe.julday(dt.year, dt.month, dt.day,
                      dt.hour + dt.minute/60.0 + dt.second/3600.0)


def get_ayanamsa(jd: float) -> float:
    """Get Lahiri ayanamsa for a given Julian Day"""
    swe.set_sid_mode(AYANAMSA)
    return swe.get_ayanamsa(jd)


def get_sidereal_position(jd: float, planet_id: int) -> float:
    """Get sidereal (Vedic) longitude for a planet"""
    # Get tropical position
    result = swe.calc_ut(jd, planet_id)
    tropical_lon = result[0][0]

    # Convert to sidereal
    ayanamsa = get_ayanamsa(jd)
    sidereal_lon = tropical_lon - ayanamsa

    # Normalize to 0-360
    if sidereal_lon < 0:
        sidereal_lon += 360

    return sidereal_lon


def get_sign_from_longitude(longitude: float) -> Dict:
    """Get zodiac sign from longitude"""
    sign_index = int(longitude / 30)
    degree_in_sign = longitude % 30
    return {
        "index": sign_index,
        "vedic": SIGNS[sign_index]["vedic"],
        "western": SIGNS[sign_index]["western"],
        "lord": SIGNS[sign_index]["lord"],
        "degree": round(degree_in_sign, 2),
    }


def get_nakshatra_from_longitude(longitude: float) -> Dict:
    """Get nakshatra from longitude"""
    # Each nakshatra spans 13°20' (13.333... degrees)
    nakshatra_span = 360 / 27
    nakshatra_index = int(longitude / nakshatra_span)
    degree_in_nakshatra = longitude % nakshatra_span
    pada = int(degree_in_nakshatra / (nakshatra_span / 4)) + 1

    return {
        "index": nakshatra_index,
        "name": NAKSHATRAS[nakshatra_index]["name"],
        "lord": NAKSHATRAS[nakshatra_index]["lord"],
        "deity": NAKSHATRAS[nakshatra_index]["deity"],
        "pada": pada,
        "degree": round(degree_in_nakshatra, 2),
    }


def get_all_planetary_positions(dt: datetime) -> Dict:
    """Get positions of all planets for a given datetime"""
    jd = datetime_to_jd(dt)
    positions = {}

    for planet_name, planet_id in PLANETS.items():
        longitude = get_sidereal_position(jd, planet_id)
        sign = get_sign_from_longitude(longitude)
        nakshatra = get_nakshatra_from_longitude(longitude)

        # Check if retrograde (not applicable to Sun/Moon/Nodes)
        is_retrograde = False
        if planet_name not in ["Sun", "Moon", "Rahu"]:
            result = swe.calc_ut(jd, planet_id)
            is_retrograde = result[0][3] < 0

        # Rahu/Ketu are always retrograde
        if planet_name == "Rahu":
            is_retrograde = True

        positions[planet_name] = {
            "longitude": round(longitude, 2),
            "sign": sign,
            "nakshatra": nakshatra,
            "retrograde": is_retrograde,
        }

    # Calculate Ketu (opposite to Rahu)
    ketu_longitude = (positions["Rahu"]["longitude"] + 180) % 360
    positions["Ketu"] = {
        "longitude": round(ketu_longitude, 2),
        "sign": get_sign_from_longitude(ketu_longitude),
        "nakshatra": get_nakshatra_from_longitude(ketu_longitude),
        "retrograde": True,
    }

    return positions


def calculate_ascendant(dt: datetime, latitude: float, longitude: float) -> Dict:
    """Calculate the Ascendant (Lagna) for a given datetime and location"""
    jd = datetime_to_jd(dt)

    # Get houses using Placidus (common) or Whole Sign
    # swe.houses returns (cusps, ascmc) where ascmc[0] is Ascendant
    cusps, ascmc = swe.houses(jd, latitude, longitude, b'P')

    # Convert to sidereal
    ayanamsa = get_ayanamsa(jd)
    sidereal_asc = ascmc[0] - ayanamsa
    if sidereal_asc < 0:
        sidereal_asc += 360

    sign = get_sign_from_longitude(sidereal_asc)
    nakshatra = get_nakshatra_from_longitude(sidereal_asc)

    return {
        "longitude": round(sidereal_asc, 2),
        "sign": sign,
        "nakshatra": nakshatra,
    }


def calculate_dasha(moon_longitude: float, birth_dt: datetime, target_dt: datetime = None) -> Dict:
    """
    Calculate Vimshottari Dasha based on Moon's nakshatra at birth
    Returns current Mahadasha and Bhukti (Antardasha)
    """
    if target_dt is None:
        target_dt = datetime.now()

    # Get birth nakshatra
    nakshatra = get_nakshatra_from_longitude(moon_longitude)
    nakshatra_lord = nakshatra["lord"]

    # Find starting position in dasha sequence
    start_index = DASHA_SEQUENCE.index(nakshatra_lord)

    # Calculate how much of the first dasha has elapsed at birth
    # Based on position within nakshatra (each nakshatra = full dasha cycle proportionally)
    nakshatra_span = 360 / 27
    progress_in_nakshatra = (moon_longitude % nakshatra_span) / nakshatra_span

    first_dasha_lord = nakshatra_lord
    first_dasha_total_years = DASHA_YEARS[first_dasha_lord]
    first_dasha_remaining_years = first_dasha_total_years * (1 - progress_in_nakshatra)

    # Calculate dasha periods from birth
    dasha_periods = []
    current_date = birth_dt

    # First (partial) dasha
    end_date = current_date + timedelta(days=first_dasha_remaining_years * 365.25)
    dasha_periods.append({
        "lord": first_dasha_lord,
        "start": current_date,
        "end": end_date,
        "years": first_dasha_remaining_years,
    })
    current_date = end_date

    # Subsequent full dashas (cycle through 120 years total)
    for i in range(1, 10):  # Cover full 120-year cycle
        dasha_index = (start_index + i) % 9
        dasha_lord = DASHA_SEQUENCE[dasha_index]
        dasha_years = DASHA_YEARS[dasha_lord]
        end_date = current_date + timedelta(days=dasha_years * 365.25)
        dasha_periods.append({
            "lord": dasha_lord,
            "start": current_date,
            "end": end_date,
            "years": dasha_years,
        })
        current_date = end_date

    # Find current Mahadasha
    current_mahadasha = None
    for period in dasha_periods:
        if period["start"] <= target_dt < period["end"]:
            current_mahadasha = period
            break

    if not current_mahadasha:
        return {"error": "Target date outside calculated range"}

    # Calculate Bhukti (Antardasha) within current Mahadasha
    mahadasha_lord = current_mahadasha["lord"]
    mahadasha_start = current_mahadasha["start"]
    mahadasha_years = current_mahadasha["years"]

    bhukti_start = mahadasha_start
    bhukti_lord_index = DASHA_SEQUENCE.index(mahadasha_lord)

    current_bhukti = None
    for i in range(9):
        bhukti_index = (bhukti_lord_index + i) % 9
        bhukti_lord = DASHA_SEQUENCE[bhukti_index]
        # Bhukti duration is proportional to its dasha years within the mahadasha period
        bhukti_years = (DASHA_YEARS[bhukti_lord] / 120) * mahadasha_years
        bhukti_end = bhukti_start + timedelta(days=bhukti_years * 365.25)

        if bhukti_start <= target_dt < bhukti_end:
            current_bhukti = {
                "lord": bhukti_lord,
                "start": bhukti_start,
                "end": bhukti_end,
                "years": bhukti_years,
            }
            break

        bhukti_start = bhukti_end

    return {
        "mahadasha": {
            "lord": current_mahadasha["lord"],
            "start": current_mahadasha["start"].strftime("%Y-%m-%d"),
            "end": current_mahadasha["end"].strftime("%Y-%m-%d"),
        },
        "bhukti": {
            "lord": current_bhukti["lord"],
            "start": current_bhukti["start"].strftime("%Y-%m-%d"),
            "end": current_bhukti["end"].strftime("%Y-%m-%d"),
        } if current_bhukti else None,
        "birth_nakshatra": nakshatra["name"],
    }


def get_full_birth_chart(
    birth_dt: datetime,
    latitude: float,
    longitude: float,
    target_dt: datetime = None
) -> Dict:
    """Generate a complete Vedic birth chart"""

    positions = get_all_planetary_positions(birth_dt)
    ascendant = calculate_ascendant(birth_dt, latitude, longitude)

    moon_longitude = positions["Moon"]["longitude"]
    dasha = calculate_dasha(moon_longitude, birth_dt, target_dt)

    return {
        "birth_time": birth_dt.strftime("%Y-%m-%d %H:%M:%S"),
        "location": {"latitude": latitude, "longitude": longitude},
        "ascendant": ascendant,
        "moon_sign": positions["Moon"]["sign"],
        "moon_nakshatra": positions["Moon"]["nakshatra"],
        "sun_sign": positions["Sun"]["sign"],
        "sun_nakshatra": positions["Sun"]["nakshatra"],
        "planets": positions,
        "current_dasha": dasha,
    }


def get_weekly_transits(start_date: datetime, days: int = 7) -> Dict:
    """Get planetary transits for a week"""
    transits = []

    for day in range(days):
        current_date = start_date + timedelta(days=day)
        # Get positions at noon
        dt = current_date.replace(hour=12, minute=0, second=0)
        positions = get_all_planetary_positions(dt)

        transits.append({
            "date": current_date.strftime("%Y-%m-%d"),
            "weekday": current_date.strftime("%A"),
            "moon": {
                "sign": positions["Moon"]["sign"],
                "nakshatra": positions["Moon"]["nakshatra"],
            },
            "planets": positions,
        })

    return {
        "week_start": start_date.strftime("%Y-%m-%d"),
        "week_end": (start_date + timedelta(days=days-1)).strftime("%Y-%m-%d"),
        "daily_transits": transits,
    }


# ============================================
# TEST: Run with your birth details
# ============================================

if __name__ == "__main__":
    # Example: December 26, 1986, 11:50 PM PST, Orange, California
    # IMPORTANT: Swiss Ephemeris expects UTC time
    # PST is UTC-8, so 11:50 PM PST = 7:50 AM UTC next day

    # Local birth time
    local_hour = 23  # 11:50 PM
    local_minute = 50

    # Convert to UTC (add 8 hours for PST)
    utc_hour = local_hour + 8
    utc_day = 26
    if utc_hour >= 24:
        utc_hour -= 24
        utc_day += 1  # Next day

    birth_datetime = datetime(1986, 12, utc_day, utc_hour, local_minute, 0)  # UTC time

    # Orange, California coordinates
    lat = 33.7879
    lon = -117.8531

    print("=" * 60)
    print("VEDIC BIRTH CHART CALCULATOR")
    print("=" * 60)

    # Generate full chart
    chart = get_full_birth_chart(birth_datetime, lat, lon)

    print(f"\nBirth Time: {chart['birth_time']} UTC")
    print(f"(Local: December 26, 1986, 11:50 PM PST)")
    print(f"Location: {chart['location']}")

    print(f"\n--- ASCENDANT (LAGNA) ---")
    print(f"Sign: {chart['ascendant']['sign']['vedic']} ({chart['ascendant']['sign']['western']})")
    print(f"Degree: {chart['ascendant']['sign']['degree']}°")
    print(f"Nakshatra: {chart['ascendant']['nakshatra']['name']} (Pada {chart['ascendant']['nakshatra']['pada']})")
    print(f"Lord: {chart['ascendant']['sign']['lord']}")

    print(f"\n--- MOON ---")
    print(f"Sign: {chart['moon_sign']['vedic']} ({chart['moon_sign']['western']})")
    print(f"Degree: {chart['moon_sign']['degree']}°")
    print(f"Nakshatra: {chart['moon_nakshatra']['name']} (Pada {chart['moon_nakshatra']['pada']})")
    print(f"Lord: {chart['moon_nakshatra']['lord']}")

    print(f"\n--- SUN ---")
    print(f"Sign: {chart['sun_sign']['vedic']} ({chart['sun_sign']['western']})")
    print(f"Nakshatra: {chart['sun_nakshatra']['name']} (Pada {chart['sun_nakshatra']['pada']})")

    print(f"\n--- CURRENT DASHA ---")
    print(f"Mahadasha: {chart['current_dasha']['mahadasha']['lord']}")
    print(f"  ({chart['current_dasha']['mahadasha']['start']} to {chart['current_dasha']['mahadasha']['end']})")
    if chart['current_dasha']['bhukti']:
        print(f"Bhukti: {chart['current_dasha']['bhukti']['lord']}")
        print(f"  ({chart['current_dasha']['bhukti']['start']} to {chart['current_dasha']['bhukti']['end']})")

    print(f"\n--- ALL PLANETARY POSITIONS ---")
    for planet, data in chart['planets'].items():
        retro = " (R)" if data['retrograde'] else ""
        print(f"{planet}: {data['sign']['vedic']} {data['sign']['degree']}° - {data['nakshatra']['name']}{retro}")

    print("\n" + "=" * 60)
    print("WEEKLY TRANSITS (Next 7 Days)")
    print("=" * 60)

    weekly = get_weekly_transits(datetime.now())
    for day in weekly['daily_transits']:
        print(f"\n{day['weekday']} ({day['date']})")
        print(f"  Moon: {day['moon']['sign']['vedic']} - {day['moon']['nakshatra']['name']}")
