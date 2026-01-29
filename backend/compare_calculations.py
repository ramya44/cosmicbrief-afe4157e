"""
Compare Internal Swiss Ephemeris calculations vs Prokerala API
Run with: python compare_calculations.py

Set environment variables first:
  export PROKERALA_CLIENT_ID=your_client_id
  export PROKERALA_CLIENT_SECRET=your_client_secret
"""

import os
import requests
from datetime import datetime
from vedic_calculator import get_full_birth_chart

# Prokerala API endpoints
TOKEN_URL = "https://api.prokerala.com/token"
BIRTH_DETAILS_URL = "https://api.prokerala.com/v2/astrology/birth-details"
PLANET_POSITION_URL = "https://api.prokerala.com/v2/astrology/planet-position"


def get_prokerala_token():
    """Get OAuth2 access token from Prokerala"""
    client_id = os.environ.get("PROKERALA_CLIENT_ID")
    client_secret = os.environ.get("PROKERALA_CLIENT_SECRET")

    if not client_id or not client_secret:
        raise ValueError("Set PROKERALA_CLIENT_ID and PROKERALA_CLIENT_SECRET environment variables")

    response = requests.post(TOKEN_URL, data={
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret,
    })

    if not response.ok:
        raise Exception(f"Failed to get token: {response.text}")

    return response.json()["access_token"]


def get_prokerala_data(datetime_str: str, lat: float, lon: float):
    """Call Prokerala API for birth details and planet positions"""
    token = get_prokerala_token()
    headers = {"Authorization": f"Bearer {token}"}

    params = {
        "datetime": datetime_str,
        "coordinates": f"{lat},{lon}",
        "ayanamsa": "1",  # Lahiri
        "la": "en",
    }

    # Get birth details
    birth_resp = requests.get(BIRTH_DETAILS_URL, params=params, headers=headers)
    if not birth_resp.ok:
        raise Exception(f"Birth details error: {birth_resp.text}")
    birth_data = birth_resp.json()["data"]

    # Get planet positions
    planet_resp = requests.get(PLANET_POSITION_URL, params=params, headers=headers)
    if not planet_resp.ok:
        raise Exception(f"Planet position error: {planet_resp.text}")
    planet_data = planet_resp.json()["data"]

    return birth_data, planet_data


def compare_calculations(
    birth_date: str,
    birth_time: str,
    timezone_offset: float,
    lat: float,
    lon: float,
    location_name: str = ""
):
    """Compare internal calculations vs Prokerala"""

    print("=" * 70)
    print(f"COMPARISON: Internal Calculator vs Prokerala API")
    print(f"Birth: {birth_date} {birth_time} ({location_name})")
    print("=" * 70)

    # Parse birth datetime
    local_dt = datetime.strptime(f"{birth_date} {birth_time}", "%Y-%m-%d %H:%M")

    # Convert to UTC for internal calculations
    utc_hour = local_dt.hour - int(timezone_offset)
    utc_minute = local_dt.minute - int((timezone_offset % 1) * 60)
    if utc_minute < 0:
        utc_minute += 60
        utc_hour -= 1
    utc_day = local_dt.day
    utc_month = local_dt.month
    utc_year = local_dt.year
    if utc_hour < 0:
        utc_hour += 24
        utc_day -= 1
    elif utc_hour >= 24:
        utc_hour -= 24
        utc_day += 1

    birth_utc = datetime(utc_year, utc_month, utc_day, utc_hour, utc_minute, 0)

    # Run internal calculation
    print("\n[1] Running internal Swiss Ephemeris calculation...")
    internal = get_full_birth_chart(birth_utc, lat, lon)

    # Get Prokerala data
    print("[2] Calling Prokerala API...")
    # Prokerala expects ISO format with timezone
    tz_sign = "+" if timezone_offset >= 0 else "-"
    tz_hours = int(abs(timezone_offset))
    tz_mins = int((abs(timezone_offset) % 1) * 60)
    datetime_str = f"{birth_date}T{birth_time}:00{tz_sign}{tz_hours:02d}:{tz_mins:02d}"

    try:
        birth_data, planet_data = get_prokerala_data(datetime_str, lat, lon)
    except Exception as e:
        print(f"\nERROR calling Prokerala: {e}")
        print("\nShowing internal calculation results only:")
        print_internal_results(internal)
        return

    # Vedic to Western sign mapping
    vedic_to_western = {
        "mesha": "aries", "vrishabha": "taurus", "mithuna": "gemini",
        "karka": "cancer", "simha": "leo", "kanya": "virgo",
        "tula": "libra", "vrischika": "scorpio", "vrishchika": "scorpio",
        "dhanu": "sagittarius", "makara": "capricorn",
        "kumbha": "aquarius", "meena": "pisces"
    }

    # Planet lord name mapping (Vedic to standard)
    lord_name_map = {
        "guru": "jupiter", "shani": "saturn", "budha": "mercury",
        "shukra": "venus", "mangal": "mars", "surya": "sun",
        "chandra": "moon"
    }

    def normalize_sign(name):
        """Convert Vedic sign name to Western equivalent"""
        return vedic_to_western.get(name.lower(), name.lower())

    def normalize_lord(name):
        """Normalize planet lord name"""
        return lord_name_map.get(name.lower(), name.lower())

    # Compare results
    print("\n" + "=" * 70)
    print("COMPARISON RESULTS")
    print("=" * 70)

    # Moon Sign
    internal_moon = internal["moon_sign"]["western"]
    prokerala_moon = birth_data.get("chandra_rasi", {}).get("name", "N/A")
    moon_match = "✓" if internal_moon.lower() == normalize_sign(prokerala_moon) else "✗"
    print(f"\n{'MOON SIGN':<20} {'Internal':<20} {'Prokerala':<20} {'Match'}")
    print(f"{'':<20} {internal_moon:<20} {prokerala_moon:<20} {moon_match}")

    # Moon Nakshatra
    internal_nakshatra = internal["moon_nakshatra"]["name"]
    prokerala_nakshatra = birth_data.get("nakshatra", {}).get("name", "N/A")
    nakshatra_match = "✓" if internal_nakshatra.lower().replace(" ", "") == prokerala_nakshatra.lower().replace(" ", "") else "✗"
    print(f"\n{'MOON NAKSHATRA':<20} {'Internal':<20} {'Prokerala':<20} {'Match'}")
    print(f"{'':<20} {internal_nakshatra:<20} {prokerala_nakshatra:<20} {nakshatra_match}")

    # Nakshatra Pada
    internal_pada = internal["moon_nakshatra"]["pada"]
    prokerala_pada = birth_data.get("nakshatra", {}).get("pada", "N/A")
    pada_match = "✓" if str(internal_pada) == str(prokerala_pada) else "✗"
    print(f"\n{'NAKSHATRA PADA':<20} {'Internal':<20} {'Prokerala':<20} {'Match'}")
    print(f"{'':<20} {internal_pada:<20} {prokerala_pada:<20} {pada_match}")

    # Nakshatra Lord
    internal_lord = internal["moon_nakshatra"]["lord"]
    prokerala_lord_data = birth_data.get("nakshatra", {}).get("lord", {})
    prokerala_lord = prokerala_lord_data.get("vedic_name") or prokerala_lord_data.get("name", "N/A")
    lord_match = "✓" if normalize_lord(internal_lord) == normalize_lord(prokerala_lord) else "✗"
    print(f"\n{'NAKSHATRA LORD':<20} {'Internal':<20} {'Prokerala':<20} {'Match'}")
    print(f"{'':<20} {internal_lord:<20} {prokerala_lord:<20} {lord_match}")

    # Sun Sign
    internal_sun = internal["sun_sign"]["western"]
    prokerala_sun = birth_data.get("soorya_rasi", {}).get("name", "N/A")
    sun_match = "✓" if internal_sun.lower() == normalize_sign(prokerala_sun) else "✗"
    print(f"\n{'SUN SIGN':<20} {'Internal':<20} {'Prokerala':<20} {'Match'}")
    print(f"{'':<20} {internal_sun:<20} {prokerala_sun:<20} {sun_match}")

    # Ascendant
    internal_asc = internal["ascendant"]["sign"]["western"]
    prokerala_planets = planet_data.get("planet_position", [])
    prokerala_asc = "N/A"
    for p in prokerala_planets:
        if p.get("id") == 100 or p.get("name") == "Ascendant":
            prokerala_asc = p.get("rasi", {}).get("name", "N/A")
            break
    asc_match = "✓" if internal_asc.lower() == normalize_sign(prokerala_asc) else "✗"
    print(f"\n{'ASCENDANT':<20} {'Internal':<20} {'Prokerala':<20} {'Match'}")
    print(f"{'':<20} {internal_asc:<20} {prokerala_asc:<20} {asc_match}")

    # Planetary Positions
    print(f"\n{'='*70}")
    print("PLANETARY POSITIONS")
    print(f"{'='*70}")
    print(f"{'Planet':<12} {'Internal Sign':<15} {'Prokerala Sign':<15} {'Match':<6} {'Internal°':<12} {'Prokerala°':<12} {'Diff'}")
    print("-" * 80)

    for planet_name in ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"]:
        internal_planet = internal["planets"].get(planet_name, {})
        internal_sign = internal_planet.get("sign", {}).get("western", "N/A")
        internal_degree = internal_planet.get("longitude", 0)

        # Find in Prokerala by name (case-insensitive)
        prokerala_sign = "N/A"
        prokerala_degree = 0
        for p in prokerala_planets:
            p_name = p.get("name", "").lower()
            if p_name == planet_name.lower():
                prokerala_sign = p.get("rasi", {}).get("name", "N/A")
                prokerala_degree = p.get("longitude", 0)
                break

        # Convert Vedic sign to Western for comparison
        prokerala_sign_western = normalize_sign(prokerala_sign)
        signs_match = internal_sign.lower() == prokerala_sign_western

        degree_diff = abs(internal_degree - prokerala_degree)
        if degree_diff > 180:
            degree_diff = 360 - degree_diff

        match = "✓" if signs_match and degree_diff < 1 else "✗"
        print(f"{planet_name:<12} {internal_sign:<15} {prokerala_sign:<15} {match:<6} {internal_degree:<12.2f} {prokerala_degree:<12.2f} {degree_diff:.2f}°")

    # Dasha
    print(f"\n{'='*70}")
    print("DASHA (Current)")
    print(f"{'='*70}")
    print(f"Internal Mahadasha: {internal['current_dasha']['mahadasha']['lord']}")
    print(f"  Period: {internal['current_dasha']['mahadasha']['start']} to {internal['current_dasha']['mahadasha']['end']}")
    if internal['current_dasha']['bhukti']:
        print(f"Internal Antardasha: {internal['current_dasha']['bhukti']['lord']}")
        print(f"  Period: {internal['current_dasha']['bhukti']['start']} to {internal['current_dasha']['bhukti']['end']}")
    print("\n(Note: Prokerala dasha requires separate API call - not compared here)")


def print_internal_results(internal):
    """Print just internal calculation results"""
    print(f"\nAscendant: {internal['ascendant']['sign']['western']} at {internal['ascendant']['sign']['degree']}°")
    print(f"Moon Sign: {internal['moon_sign']['western']} at {internal['moon_sign']['degree']}°")
    print(f"Moon Nakshatra: {internal['moon_nakshatra']['name']} Pada {internal['moon_nakshatra']['pada']}")
    print(f"Sun Sign: {internal['sun_sign']['western']}")
    print(f"\nMahadasha: {internal['current_dasha']['mahadasha']['lord']}")
    if internal['current_dasha']['bhukti']:
        print(f"Antardasha: {internal['current_dasha']['bhukti']['lord']}")


if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("TEST 1: April 4, 1989, 9:04 PM IST, Hyderabad, India")
    print("=" * 70)
    compare_calculations(
        birth_date="1989-04-04",
        birth_time="21:04",
        timezone_offset=5.5,  # IST
        lat=17.3850,
        lon=78.4867,
        location_name="Hyderabad, India"
    )

    print("\n\n")

    print("=" * 70)
    print("TEST 2: December 26, 1986, 11:50 PM PST, Orange, California")
    print("=" * 70)
    compare_calculations(
        birth_date="1986-12-26",
        birth_time="23:50",
        timezone_offset=-8,  # PST
        lat=33.7879,
        lon=-117.8531,
        location_name="Orange, California"
    )
