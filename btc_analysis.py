import requests
import pandas as pd
from datetime import datetime
import time

import yfinance as yf

def fetch_btc_data():
    """
    Fetches historical BTC data from Yahoo Finance.
    Returns a pandas DataFrame with 'date' and 'price'.
    """
    print("Fetching data from Yahoo Finance...")
    try:
        btc = yf.Ticker("BTC-USD")
        df = btc.history(period="max")
        
        if df.empty:
            print("No price data found.")
            return None
            
        # yfinance returns data with Date index already, but let's standardize
        df = df.reset_index()
        df["date"] = pd.to_datetime(df["Date"]).dt.tz_localize(None) # Remove timezone if present
        df = df.rename(columns={"Close": "price"})
        df = df[["date", "price"]]
        df.set_index("date", inplace=True)
        return df
    except Exception as e:
        print(f"Error fetching data: {e}")
        return None

def analyze_cycles(df):
    """
    Analyzes BTC cycles based on halving dates.
    """
    halvings = {
        "Cycle 1": {"start": "2009-01-03", "end": "2012-11-28"},
        "Cycle 2": {"start": "2012-11-28", "end": "2016-07-09"},
        "Cycle 3": {"start": "2016-07-09", "end": "2020-05-11"},
        "Cycle 4": {"start": "2020-05-11", "end": "2024-04-20"},
        "Cycle 5": {"start": "2024-04-20", "end": datetime.now().strftime("%Y-%m-%d")}
    }
    
    results = []
    
    for cycle_name, dates in halvings.items():
        start_date = dates["start"]
        end_date = dates["end"]
        
        # Filter data for this cycle
        cycle_data = df[(df.index >= start_date) & (df.index < end_date)]
        
        if cycle_data.empty:
            print(f"No data for {cycle_name}")
            continue
            
        cycle_high_price = cycle_data["price"].max()
        cycle_high_date = cycle_data["price"].idxmax()
        
        cycle_low_price = cycle_data["price"].min()
        cycle_low_date = cycle_data["price"].idxmin()
        
        # Calculate days from start of cycle (halving) to high/low
        start_dt = pd.to_datetime(start_date)
        days_to_high = (cycle_high_date - start_dt).days
        days_to_low = (cycle_low_date - start_dt).days
        
        results.append({
            "Cycle": cycle_name,
            "Start Date": start_date,
            "End Date": end_date,
            "High Price": cycle_high_price,
            "High Date": cycle_high_date.strftime("%Y-%m-%d"),
            "Days to High": days_to_high,
            "Low Price": cycle_low_price,
            "Low Date": cycle_low_date.strftime("%Y-%m-%d"),
            "Days to Low": days_to_low
        })
        
    return pd.DataFrame(results)

def analyze_pattern(df):
    """
    Analyzes specific ATL/ATH pattern:
    ATL 2015 -> ATH 2017 (1064d)
    ATH 2017 -> ATL 2018 (364d)
    ATL 2018 -> ATH 2021 (1064d)
    ATH 2021 -> ATL 2022 (364d)
    """
    # Define search windows for key points
    points = {
        "ATL_2015": {"start": "2014-01-01", "end": "2016-01-01", "type": "min"},
        "ATH_2017": {"start": "2017-01-01", "end": "2018-01-01", "type": "max"},
        "ATL_2018": {"start": "2018-01-01", "end": "2019-01-01", "type": "min"},
        "ATH_2021": {"start": "2021-01-01", "end": "2022-01-01", "type": "max"},
        "ATL_2022": {"start": "2022-01-01", "end": "2023-01-01", "type": "min"}
    }
    
    found_points = {}
    
    for name, criteria in points.items():
        window_data = df[(df.index >= criteria["start"]) & (df.index < criteria["end"])]
        if window_data.empty:
            print(f"No data for {name}")
            continue
            
        if criteria["type"] == "max":
            price = window_data["price"].max()
            date = window_data["price"].idxmax()
        else:
            price = window_data["price"].min()
            date = window_data["price"].idxmin()
            
        found_points[name] = {"date": date, "price": price}

    # Calculate durations
    pairs = [
        ("ATL_2015", "ATH_2017"),
        ("ATH_2017", "ATL_2018"),
        ("ATL_2018", "ATH_2021"),
        ("ATH_2021", "ATL_2022")
    ]
    
    print("\n--- Pattern Analysis (1064d / 364d) ---")
    for start_point, end_point in pairs:
        if start_point in found_points and end_point in found_points:
            d1 = found_points[start_point]["date"]
            d2 = found_points[end_point]["date"]
            days = (d2 - d1).days
            print(f"{start_point} ({d1.strftime('%Y-%m-%d')}) to {end_point} ({d2.strftime('%Y-%m-%d')}) = {days} days")
            
    # Projection
    if "ATL_2022" in found_points:
        atl_2022_date = found_points["ATL_2022"]["date"]
        
        # 1. Projected ATH 2025
        cycle_5_start = "2024-04-20"
        cycle_5_data = df[df.index >= cycle_5_start]
        current_cycle_high = cycle_5_data["price"].max() if not cycle_5_data.empty else 100000
        
        projected_ath_date = atl_2022_date + pd.Timedelta(days=1064)
        print(f"\nProjected ATH Date (ATL 2022 + 1064d): {projected_ath_date.strftime('%Y-%m-%d')}")
        found_points["Projected_ATH_2025"] = {"date": projected_ath_date, "price": current_cycle_high}
        
        # --- Ratio Analysis ---
        print("\n--- Ratio Analysis (High / Next Low) ---")
        
        # Cycle 2 High (2013) / Cycle 2 Low (2015)
        # Need to find these specific points if not already in found_points
        # We have ATL_2015. We need ATH_2013 (Cycle 2 High).
        # Cycle 2: Nov 2012 - July 2016.
        c2_data = df[(df.index >= "2012-11-28") & (df.index < "2016-07-09")]
        if not c2_data.empty:
            ath_2013_price = c2_data["price"].max()
            atl_2015_price = found_points["ATL_2015"]["price"]
            ratio_2013 = ath_2013_price / atl_2015_price
            print(f"2013 High (${ath_2013_price:.0f}) / 2015 Low (${atl_2015_price:.0f}) = {ratio_2013:.2f}")
        else:
            # Fallback if data missing (Yahoo starts Sep 2014)
            # Known values: High ~$1160, Low ~$152
            ath_2013_price = 1160
            atl_2015_price = 152
            ratio_2013 = ath_2013_price / atl_2015_price
            print(f"2013 High (~${ath_2013_price}) / 2015 Low (~${atl_2015_price}) = {ratio_2013:.2f} (Estimated)")

        # Cycle 3 High (2017) / Cycle 4 Low (2018)
        ath_2017_price = found_points["ATH_2017"]["price"]
        atl_2018_price = found_points["ATL_2018"]["price"]
        ratio_2017 = ath_2017_price / atl_2018_price
        print(f"2017 High (${ath_2017_price:.0f}) / 2018 Low (${atl_2018_price:.0f}) = {ratio_2017:.2f}")
        
        # Cycle 4 High (2021) / Cycle 5 Low (2022)
        ath_2021_price = found_points["ATH_2021"]["price"]
        atl_2022_price = found_points["ATL_2022"]["price"]
        ratio_2021 = ath_2021_price / atl_2022_price
        print(f"2021 High (${ath_2021_price:.0f}) / 2022 Low (${atl_2022_price:.0f}) = {ratio_2021:.2f}")
        
        # Trend: 7.63 -> 6.09 -> 4.71 (Example values, will verify with run)
        # It seems to be decreasing.
        # Let's project the next ratio.
        # Linear fit or simple decay?
        # 7.6 -> 6.1 (-1.5)
        # 6.1 -> 4.7 (-1.4)
        # Next drop might be ~1.3? -> Ratio ~3.4?
        # User suggested ~3.8 (65k/17k). Let's see what the data says.
        
        # Let's use a conservative decay.
        # If ratio_2021 is around 4.5, next might be 3.5 - 4.0.
        # Let's calculate the decay rate.
        decay_1 = ratio_2013 - ratio_2017
        decay_2 = ratio_2017 - ratio_2021
        avg_decay = (decay_1 + decay_2) / 2
        
        projected_ratio = ratio_2021 - avg_decay
        if projected_ratio < 2: projected_ratio = 2.5 # Floor
        
        print(f"Projected Ratio for 2025/2026: {projected_ratio:.2f} (Based on avg decay)")
        
        # 2. Projected Low 2026 (Ratio Based)
        projected_low_price = current_cycle_high / projected_ratio
        projected_low_date = projected_ath_date + pd.Timedelta(days=364)
        
        print(f"Projected Low Date (ATH 2025 + 364d): {projected_low_date.strftime('%Y-%m-%d')}")
        print(f"Projected Low Price (High ${current_cycle_high:.0f} / Ratio {projected_ratio:.2f}): ${projected_low_price:.2f}")
        
        found_points["Projected_Low_2026"] = {"date": projected_low_date, "price": projected_low_price}
        
        # 3. Projected High 2029
        # Calculate multiplier based on historical Low→High patterns
        
        print("\n--- Low → High Multiplier Analysis ---")
        
        # Cycle 2: 2015 Low → 2017 High
        atl_2015_price = found_points["ATL_2015"]["price"]
        ath_2017_price = found_points["ATH_2017"]["price"]
        multiplier_cycle2 = ath_2017_price / atl_2015_price
        print(f"Cycle 2: 2015 Low (${atl_2015_price:.0f}) → 2017 High (${ath_2017_price:.0f}) = {multiplier_cycle2:.2f}x")
        
        # Cycle 3: 2018 Low → 2021 High
        atl_2018_price = found_points["ATL_2018"]["price"]
        ath_2021_price = found_points["ATH_2021"]["price"]
        multiplier_cycle3 = ath_2021_price / atl_2018_price
        print(f"Cycle 3: 2018 Low (${atl_2018_price:.0f}) → 2021 High (${ath_2021_price:.0f}) = {multiplier_cycle3:.2f}x")
        
        # Cycle 4: 2022 Low → 2025 High (projected)
        atl_2022_price = found_points["ATL_2022"]["price"]
        multiplier_cycle4 = current_cycle_high / atl_2022_price
        print(f"Cycle 4: 2022 Low (${atl_2022_price:.0f}) → 2025 High (${current_cycle_high:.0f}) = {multiplier_cycle4:.2f}x")
        
        # Calculate decay pattern
        decay1 = multiplier_cycle2 - multiplier_cycle3
        decay2 = multiplier_cycle3 - multiplier_cycle4
        avg_decay = (decay1 + decay2) / 2
        
        print(f"\nDecay Analysis:")
        print(f"  Cycle 2→3 decay: {decay1:.2f}x")
        print(f"  Cycle 3→4 decay: {decay2:.2f}x")
        print(f"  Average decay: {avg_decay:.2f}x")
        
        # Cycle 5: 2026 Low → 2029 High (projection)
        multiplier_cycle5 = multiplier_cycle4 - avg_decay
        
        # Safety checks
        min_multiplier = (current_cycle_high * 1.1) / projected_low_price  # Must be 10% above 2025 ATH
        if multiplier_cycle5 < min_multiplier:
            print(f"  Adjusted multiplier from {multiplier_cycle5:.2f}x to {min_multiplier:.2f}x (10% above 2025 ATH)")
            multiplier_cycle5 = min_multiplier
        
        if multiplier_cycle5 < 2.0:  # Floor at 2x
            print(f"  Applied floor: {multiplier_cycle5:.2f}x → 2.0x")
            multiplier_cycle5 = 2.0
        
        print(f"\nCycle 5 Projected Multiplier: {multiplier_cycle5:.2f}x")
        
        projected_high_price = projected_low_price * multiplier_cycle5
        projected_high_2029_date = projected_low_date + pd.Timedelta(days=1064)
        
        print(f"Projected High Date (Low 2026 + 1064d): {projected_high_2029_date.strftime('%Y-%m-%d')}")
        print(f"Projected High Price (Low ${projected_low_price:.0f} * {multiplier_cycle5:.2f}x): ${projected_high_price:.2f}")
        
        found_points["Projected_High_2029"] = {"date": projected_high_2029_date, "price": projected_high_price}

    return found_points

    return found_points

def export_to_json(df, found_points, filename="btc-cycle-app/public/btc_data.json"):
    """
    Exports data to JSON for the web app.
    """
    import json
    import os
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    
    # Prepare History Data
    # Resample to reduce size if needed, but daily is fine for 4000 points.
    history = []
    for date, row in df.iterrows():
        history.append({
            "date": date.strftime("%Y-%m-%d"),
            "price": row["price"]
        })
        
    # Prepare Cycles/Points Data
    cycles = []
    forecast = {}
    
    for name, data in found_points.items():
        point_data = {
            "name": name,
            "date": data["date"].strftime("%Y-%m-%d"),
            "price": data["price"]
        }
        
        if "Projected" in name:
            key = name.lower().replace("projected_", "")
            forecast[key] = point_data
        else:
            cycles.append(point_data)
            
    output = {
        "history": history,
        "cycles": cycles,
        "forecast": forecast
    }
    
    with open(filename, "w") as f:
        json.dump(output, f)
    
    print(f"Data exported to {filename}")

def plot_cycles(df, found_points):
    """
    Generates a plot of BTC price with cycles and patterns annotated.
    """
    import matplotlib.pyplot as plt
    import matplotlib.dates as mdates
    import numpy as np
    
    plt.figure(figsize=(16, 9))
    
    # Plot Price
    plt.plot(df.index, df["price"], label="BTC Price", color="black", linewidth=1)
    plt.yscale("log")
    
    # Determine y-limits to place text/lines nicely
    y_min, y_max = df["price"].min(), df["price"].max()
    
    # Plot Points
    for name, data in found_points.items():
        date = data["date"]
        price = data["price"]
        
        if "Projected" in name:
            # For projection, we don't have a price, so we plot a vertical line
            color = "purple" if "High" in name or "ATH" in name else "orange"
            linestyle = "--"
            
            plt.axvline(x=date, color=color, linestyle=linestyle, alpha=0.8)
            
            # Label at the top
            label_y = y_max * 1.5 if "High" in name or "ATH" in name else y_min * 0.5
            # Adjust label text to be cleaner
            clean_name = name.replace("Projected_", "").replace("_", " ")
            plt.text(date, y_max, f" {clean_name}\n {date.strftime('%Y-%m-%d')}", 
                     color=color, rotation=90, verticalalignment="top")
            continue
            
        color = "green" if "ATH" in name else "red"
        plt.scatter(date, price, color=color, s=100, zorder=5)
        plt.text(date, price, f" {name}\n {date.strftime('%Y-%m-%d')}", color=color, fontsize=9, verticalalignment="bottom")

    # Draw Pattern Lines
    pairs = [
        ("ATL_2015", "ATH_2017", "1064d"),
        ("ATH_2017", "ATL_2018", "364d"),
        ("ATL_2018", "ATH_2021", "1064d"),
        ("ATH_2021", "ATL_2022", "364d"),
        ("ATL_2022", "Projected_ATH_2025", "1064d"),
        ("Projected_ATH_2025", "Projected_Low_2026", "364d"),
        ("Projected_Low_2026", "Projected_High_2029", "1064d")
    ]
    
    for start, end, label in pairs:
        if start in found_points and end in found_points:
            d1 = found_points[start]["date"]
            d2 = found_points[end]["date"]
            
            # For historical points, we use actual prices.
            # For projections, we don't have prices. We can draw lines at a fixed y-level or just text.
            # To make it look connected, let's define "visual" prices for the projections.
            # We'll use the last known price or a heuristic.
            
            p1 = found_points[start]["price"]
            p2 = found_points[end]["price"]
            
            # Heuristics for projection visualization (purely for graph aesthetics)
            if p1 is None:
                # If start is projected
                if "ATH" in start or "High" in start: p1 = y_max
                elif "Low" in start: p1 = y_min * 10 # Arbitrary low
            
            if p2 is None:
                # If end is projected
                if "ATH" in end or "High" in end: p2 = y_max
                elif "Low" in end: p2 = y_min * 10
                
            # If both are historical, draw the line
            if found_points[start]["price"] is not None and found_points[end]["price"] is not None:
                plt.plot([d1, d2], [p1, p2], color="blue", linestyle=":", alpha=0.6)
                mid_date = d1 + (d2 - d1) / 2
                mid_price = np.exp((np.log(p1) + np.log(p2)) / 2)
                plt.text(mid_date, mid_price, label, color="blue", fontsize=10, fontweight="bold", 
                         bbox=dict(facecolor='white', alpha=0.7, edgecolor='none'))
            else:
                # For projections, just put the text in the middle of the time range
                mid_date = d1 + (d2 - d1) / 2
                # Place text at a consistent height
                text_y = y_max if "ATH" in start or "High" in start else y_min * 5
                plt.text(mid_date, text_y, label, color="purple", fontsize=10, fontweight="bold", ha="center",
                         bbox=dict(facecolor='white', alpha=0.7, edgecolor='none'))


    plt.title("BTC 4-Year Cycle Forecast (Log Scale)")
    plt.xlabel("Date")
    plt.ylabel("Price (USD)")
    plt.grid(True, which="both", linestyle="--", alpha=0.3)
    plt.legend()
    
    # Extend x-axis to show 2029
    plt.xlim(df.index.min(), found_points["Projected_High_2029"]["date"] + pd.Timedelta(days=365))
    
    plt.tight_layout()
    plt.savefig("btc_cycles.png")
    print("Graph saved to btc_cycles.png")

def main():
    df = fetch_btc_data()
    if df is not None:
        print(f"Data fetched successfully. Rows: {len(df)}")
        print(f"Date range: {df.index.min()} to {df.index.max()}")
        
        analysis = analyze_cycles(df)
        
        pd.set_option('display.max_columns', None)
        pd.set_option('display.width', 1000)
        
        print("\n--- BTC 4-Year Cycle Analysis ---")
        print(analysis)
        
        found_points = analyze_pattern(df)
        plot_cycles(df, found_points)
        export_to_json(df, found_points)
        
        # Optional: Save to CSV
        # analysis.to_csv("btc_cycle_analysis.csv", index=False)

if __name__ == "__main__":
    main()
