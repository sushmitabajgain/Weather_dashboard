import strawberry
from typing import List, Optional

from app.services.aqhi_service import (
    get_data,
    get_kpis,
    get_hourly_avg,
    get_category_distribution,
    get_latest_locations
)


@strawberry.type
class AQHIType:
    locationName: str
    latitude: float
    longitude: float
    aqhi: float
    category: str
    datetime: str
    datasetType: str


@strawberry.type
class KPIType:
    total: int
    avg: float
    max: float
    locations: int


@strawberry.type
class HourlyType:
    hour: int
    avg: float


@strawberry.type
class CategoryType:
    category: str
    count: int


@strawberry.type
class MapPointType:
    locationName: str
    latitude: float
    longitude: float
    aqhi: float
    category: str


@strawberry.type
class Query:

    @strawberry.field
    def aqhi_data(
        self,
        year: Optional[int] = None,
        locations: Optional[List[str]] = None,
        dataset_type: Optional[str] = None,
        last_hours: Optional[int] = None,
        limit: int = 1000,
        offset: int = 0
    ) -> List[AQHIType]:

        result = get_data(year, locations, dataset_type, limit, offset, last_hours)

        return [
            AQHIType(
                locationName=r.location_name,
                latitude=r.latitude,
                longitude=r.longitude,
                aqhi=r.aqhi,
                category=r.category,
                datetime=str(r.datetime),
                datasetType=r.dataset_type
            )
            for r in result
        ]


    @strawberry.field
    def kpis(
        self,
        year: Optional[int] = None,
        locations: Optional[List[str]] = None,
        dataset_type: Optional[str] = None,
        last_hours: Optional[int] = None
    ) -> KPIType:

        data = get_kpis(year, locations, dataset_type, last_hours)

        return KPIType(**data)

    @strawberry.field
    def hourly_avg(
        self,
        year: Optional[int] = None,
        locations: Optional[List[str]] = None,
        dataset_type: Optional[str] = None,
        last_hours: Optional[int] = None
    ) -> List[HourlyType]:

        result = get_hourly_avg(year, locations, dataset_type, last_hours)

        return [
            HourlyType(
                hour=int(r["hour"]),
                avg=r["avg"]
            )
            for r in result
        ]


    @strawberry.field
    def category_distribution(
        self,
        year: Optional[int] = None,
        locations: Optional[List[str]] = None,
        dataset_type: Optional[str] = None,
        last_hours: Optional[int] = None
    ) -> List[CategoryType]:

        result = get_category_distribution(year, locations, dataset_type, last_hours)

        return [
            CategoryType(
                category=r["category"],
                count=r["count"]
            )
            for r in result
        ]
        
    @strawberry.field
    def map_points(
        self,
        year: Optional[int] = None,
        locations: Optional[List[str]] = None,
        dataset_type: Optional[str] = None,
        last_hours: Optional[int] = None
    ) -> List[MapPointType]:

        result = get_latest_locations(year, locations, dataset_type, last_hours)

        return [
            MapPointType(**r)
            for r in result
        ]
        
    @strawberry.field
    def locations(self) -> List[str]:
        from app.db.session import SessionLocal
        from app.db.models import AQHI

        db = SessionLocal()

        result = (
            db.query(AQHI.location_name)
            .distinct()
            .order_by(AQHI.location_name)
            .all()
        )

        return [r[0] for r in result]
        


schema = strawberry.Schema(query=Query)