from sqlalchemy import create_engine

# Cambiamos el nombre de la base de datos a 'cancer_db'
engine = create_engine('postgresql://postgres:241210@localhost:5432/cancer_db')
