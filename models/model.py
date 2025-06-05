# models/model.py

from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.orm import declarative_base
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin

Base = declarative_base()

class CancerPatient(Base):
    __tablename__ = 'cancer_data'
    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(String(20), unique=True, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(10), nullable=False)
    country_region = Column(String(100), nullable=False)
    year = Column(Integer, nullable=False)
    genetic_risk = Column(Float, nullable=False)
    air_pollution = Column(Float, nullable=False)
    alcohol_use = Column(Float, nullable=False)
    smoking = Column(Float, nullable=False)
    obesity_level = Column(Float, nullable=False)
    cancer_type = Column(String(100), nullable=False)
    cancer_stage = Column(String(50), nullable=False)
    treatment_cost_usd = Column(Float, nullable=False)
    survival_years = Column(Float, nullable=False)
    target_severity_score = Column(Float, nullable=False)

    def __repr__(self):
        return f"<CancerPatient(patient_id='{self.patient_id}', cancer_type='{self.cancer_type}')>"
    
# ───────────────────────────────────────────────────────────────────────────────
# MÉTODO AUXILIAR NECESARIO PARA SERIALIZAR A JSON DESDE app.py:
# ───────────────────────────────────────────────────────────────────────────────
    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "age": self.age,
            "gender": self.gender,
            "country_region": self.country_region,
            "year": self.year,
            "genetic_risk": self.genetic_risk,
            "air_pollution": self.air_pollution,
            "alcohol_use": self.alcohol_use,
            "smoking": self.smoking,
            "obesity_level": self.obesity_level,
            "cancer_type": self.cancer_type,
            "cancer_stage": self.cancer_stage,
            "treatment_cost_usd": self.treatment_cost_usd,
            "survival_years": self.survival_years,
            "target_severity_score": self.target_severity_score
        }


class Usuario(Base, UserMixin):
    __tablename__ = 'usuarios'

    id = Column(Integer, primary_key=True)
    username = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)
