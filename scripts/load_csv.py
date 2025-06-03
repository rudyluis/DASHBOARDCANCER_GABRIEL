import pandas as pd
from sqlalchemy import create_engine
import os
import sys

# Agrega el path al directorio raíz del proyecto para poder importar el modelo
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from models.model import Base, CancerPatient
from sqlalchemy.orm import sessionmaker

# URL del CSV de cáncer
CSV_URL = "https://raw.githubusercontent.com/rudyluis/DashboardJS/refs/heads/main/global_cancer.csv"
DATABASE_URL = "postgresql://postgres:241210@localhost:5432/cancer_db"

# Crear engine y sesión
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

# Crear tablas si no existen
Base.metadata.create_all(engine)

# Leer el CSV con pandas
df = pd.read_csv(CSV_URL)

# Asegurar que las columnas numéricas sean de tipo numérico
df['Year'] = pd.to_numeric(df['Year'], errors='coerce')
df['Genetic_Risk'] = pd.to_numeric(df['Genetic_Risk'], errors='coerce')
df['Air_Pollution'] = pd.to_numeric(df['Air_Pollution'], errors='coerce')
df['Alcohol_Use'] = pd.to_numeric(df['Alcohol_Use'], errors='coerce')
df['Smoking'] = pd.to_numeric(df['Smoking'], errors='coerce')
df['Obesity_Level'] = pd.to_numeric(df['Obesity_Level'], errors='coerce')
df['Treatment_Cost_USD'] = pd.to_numeric(df['Treatment_Cost_USD'], errors='coerce')
df['Survival_Years'] = pd.to_numeric(df['Survival_Years'], errors='coerce')
df['Target_Severity_Score'] = pd.to_numeric(df['Target_Severity_Score'], errors='coerce')

# Convertir DataFrame en lista de objetos CancerPatient
records = []
for _, row in df.iterrows():
    if pd.isna(row['Patient_ID']): 
        continue
    record = CancerPatient(
        patient_id=row['Patient_ID'],
        age=int(row['Age']) if not pd.isna(row['Age']) else None,
        gender=row['Gender'],
        country_region=row['Country_Region'],
        year=int(row['Year']) if not pd.isna(row['Year']) else None,
        genetic_risk=float(row['Genetic_Risk']) if not pd.isna(row['Genetic_Risk']) else 0.0,
        air_pollution=float(row['Air_Pollution']) if not pd.isna(row['Air_Pollution']) else 0.0,
        alcohol_use=float(row['Alcohol_Use']) if not pd.isna(row['Alcohol_Use']) else 0.0,
        smoking=float(row['Smoking']) if not pd.isna(row['Smoking']) else 0.0,
        obesity_level=float(row['Obesity_Level']) if not pd.isna(row['Obesity_Level']) else 0.0,
        cancer_type=row['Cancer_Type'],
        cancer_stage=row['Cancer_Stage'],
        treatment_cost_usd=float(row['Treatment_Cost_USD']) if not pd.isna(row['Treatment_Cost_USD']) else 0.0,
        survival_years=float(row['Survival_Years']) if not pd.isna(row['Survival_Years']) else 0.0,
        target_severity_score=float(row['Target_Severity_Score']) if not pd.isna(row['Target_Severity_Score']) else 0.0
    )
    records.append(record)

# Insertar en la base de datos
session.bulk_save_objects(records)
session.commit()
print("✅ Migración de datos de cáncer completada")
session.close()
