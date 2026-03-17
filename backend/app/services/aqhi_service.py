from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import SessionLocal
from app.db.models import AQHI


def apply_filters(query, year=None, locations=None, dataset_type=None):

    # existing filters
    if year:
        query = query.filter(
            AQHI.datetime.between(f"{year}-01-01", f"{year}-12-31")
        )

    if locations:
        query = query.filter(AQHI.location_name.in_(locations))

    if dataset_type:
        query = query.filter(AQHI.dataset_type == dataset_type)

    return query


def get_data(year=None, locations=None, dataset_type=None, limit=1000, offset=0):
    db: Session = SessionLocal()

    try:
        query = db.query(AQHI)
        query = apply_filters(query, year, locations, dataset_type)

        return query.offset(offset).limit(limit).all()

    finally:
        db.close()


def get_kpis(year=None, locations=None, dataset_type=None):
    db: Session = SessionLocal()

    try:
        query = db.query(AQHI)
        query = apply_filters(query, year, locations, dataset_type)

        total = query.count()

        avg = query.with_entities(func.avg(AQHI.aqhi)).scalar() or 0
        max_val = query.with_entities(func.max(AQHI.aqhi)).scalar() or 0

        locations_count = query.with_entities(AQHI.location_name).distinct().count()

        return {
            "total": total,
            "avg": round(avg, 2),
            "max": round(max_val, 2),
            "locations": locations_count
        }

    finally:
        db.close()


def get_hourly_avg(year=None, locations=None, dataset_type=None):
    db = SessionLocal()
    try:
        query = db.query(
            func.extract("hour", AQHI.datetime).label("hour"),
            func.avg(AQHI.aqhi).label("avg")
        )

        query = apply_filters(query, year, locations, dataset_type)

        results = query.group_by("hour").order_by("hour").all()

        return [
            {"hour": int(r.hour), "avg": round(r.avg, 2)}
            for r in results
        ]
    finally:
        db.close()


def get_category_distribution(year=None, locations=None, dataset_type=None):
    db = SessionLocal()
    try:
        query = db.query(
            AQHI.category,
            func.count().label("count")
        )

        query = apply_filters(query, year, locations, dataset_type)

        results = query.group_by(AQHI.category).all()

        categories = ["Low", "Moderate", "High", "Very High", "Unknown"]
        result_dict = {r.category: r.count for r in results}

        return [
            {"category": cat, "count": result_dict.get(cat, 0)}
            for cat in categories
        ]
    finally:
        db.close()


def get_latest_locations(year=None, locations=None, dataset_type=None):
    db = SessionLocal()
    try:
        subquery = (
            db.query(
                AQHI.location_name,
                func.max(AQHI.datetime).label("max_time")
            )
            .group_by(AQHI.location_name)
            .subquery()
        )

        query = (
            db.query(AQHI)
            .join(
                subquery,
                (AQHI.location_name == subquery.c.location_name) &
                (AQHI.datetime == subquery.c.max_time)
            )
        )

        query = apply_filters(query, year, locations, dataset_type)

        results = query.all()

        return [
            {
                "locationName": r.location_name,
                "latitude": r.latitude,
                "longitude": r.longitude,
                "aqhi": r.aqhi,
                "category": r.category
            }
            for r in results
        ]
    finally:
        db.close()