// Transit data utilities for Vedic forecast generation

from datetime import datetime

# ============================================
# DATABASE QUERY HELPER
# ============================================

def get_transit_data(category, year, transits_lookup_table):
    """
    Query transit data from your table
    
    Args:
        category: 'rahu_ketu', 'jupiter', 'saturn', 'eclipses', 'mercury_retrograde'
        year: 2025 or 2026
        transits_lookup_table: your database table/dataframe
    
    Returns:
        transit_data dict/list
    """
    result = transits_lookup_table[
        (transits_lookup_table['category'] == category) & 
        (transits_lookup_table['year'] == year)
    ]
    
    if result.empty:
        return None
    
    # Return the transit_data JSON
    return result.iloc[0]['transit_data']