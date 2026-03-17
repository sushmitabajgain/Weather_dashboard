from sqlalchemy import Column, Integer, Float, String, DateTime
from app.db.session import Base

class AQHI(Base):
    __tablename__ = "aqhi_data"

    id = Column(Integer, primary_key=True, index=True)
    location_name = Column(String, index=True)
    longitude = Column(Float)
    latitude = Column(Float)
    aqhi = Column(Float)
    category = Column(String)
    datetime = Column(DateTime, index=True)
    dataset_type = Column(String, index=True)