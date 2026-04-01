import ast

import pandas as pd
from sqlalchemy import create_engine

from app.core.config import DATABASE_URL

engine = create_engine(DATABASE_URL)


def parse_coordinates(coord_text):
    try:
        coords = ast.literal_eval(coord_text)
        return coords[0], coords[1]
    except (SyntaxError, TypeError, ValueError):
        return None, None


def classify_aqhi(value):
    if pd.isna(value):
        return "Unknown"
    elif value <= 3:
        return "Low"
    elif value <= 6:
        return "Moderate"
    elif value <= 10:
        return "High"
    else:
        return "Very High"


def load_csv(file_path, dataset_type):
    print(f"Loading {dataset_type}...")

    df = pd.read_csv(file_path)

    if dataset_type == "Forecast":
        time_col = "properties.forecast_datetime"
    else:
        time_col = "properties.observation_datetime"

    df[time_col] = pd.to_datetime(df[time_col], errors="coerce")
    df["properties.aqhi"] = pd.to_numeric(df["properties.aqhi"], errors="coerce")

    df[["longitude", "latitude"]] = df["geometry.coordinates"].apply(
        lambda x: pd.Series(parse_coordinates(x))
    )

    df["category"] = df["properties.aqhi"].apply(classify_aqhi)

    final_df = pd.DataFrame({
        "location_name": df["properties.location_name_en"],
        "longitude": df["longitude"],
        "latitude": df["latitude"],
        "aqhi": df["properties.aqhi"],
        "category": df["category"],
        "datetime": df[time_col],
        "dataset_type": dataset_type,
    })

    final_df = final_df.dropna(subset=["aqhi", "datetime"])

    final_df.to_sql(
        "aqhi_data",
        engine,
        if_exists="append",
        index=False,
        method="multi",
        chunksize=1000,
    )

    print(f"{dataset_type} loaded: {len(final_df)} rows")


if __name__ == "__main__":
    load_csv("./data/aqhi_forecast.csv", "Forecast")
    load_csv("./data/aqhi_observations.csv", "Observation")
