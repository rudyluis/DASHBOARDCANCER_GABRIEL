from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, abort
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from models.model import CancerPatient, Usuario
import os

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev_secret_key")

# ----------------------------
# Configuración de Base de Datos
# ----------------------------
# Ajusta tu conexión a PostgreSQL (nombre DB: cancer_db, usuario: postgres, contraseña: 241210)
engine = create_engine('postgresql://postgres:241210@localhost:5432/cancer_db')
Session = sessionmaker(bind=engine)
db_session = Session()

# ----------------------------
# Setup Flask-Login
# ----------------------------
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'auth'

@login_manager.user_loader
def load_user(user_id):
    return db_session.query(Usuario).get(int(user_id))

# ----------------------------
# RUTA RAÍZ: Redirige a /auth
# ----------------------------
@app.route('/', methods=['GET'])
def raiz():
    return redirect(url_for('auth'))


# ----------------------------
# RUTA: Página de Login / Registro
# ----------------------------
@app.route('/auth', methods=['GET', 'POST'])
def auth():
    if request.method == 'POST':
        action = request.form.get('action')
        username = request.form.get('username')
        password = request.form.get('password')

        if action == 'register':
            # Verificar si ya existe el usuario
            if db_session.query(Usuario).filter(Usuario.username == username).first():
                flash('El usuario ya existe.', 'danger')
                return redirect(url_for('auth'))

            # Crear nuevo usuario
            new_user = Usuario(username=username)
            new_user.set_password(password)
            db_session.add(new_user)
            db_session.commit()
            flash('Usuario creado exitosamente. Ahora inicia sesión.', 'success')
            return redirect(url_for('auth'))

        elif action == 'login':
            user = db_session.query(Usuario).filter(Usuario.username == username).first()
            if user and user.check_password(password):
                login_user(user)
                flash('Sesión iniciada exitosamente.', 'success')
                return redirect(url_for('dashboard'))
            else:
                flash('Usuario o contraseña incorrectos.', 'danger')
                return redirect(url_for('auth'))

    # Si es GET, solo renderiza el formulario
    return render_template('auth.html')


# ----------------------------
# RUTA: Logout
# ----------------------------
@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Sesión cerrada.', 'info')
    return redirect(url_for('auth'))


# ----------------------------
# RUTA: Dashboard (solo para usuarios autenticados)
# ----------------------------
@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html', username=current_user.username)


# ============================
# API PARA EL DASHBOARD CÁNCER
# ============================

@app.route('/api/list_cancer', methods=['GET'])
@login_required
def list_cancer():
    pacientes = db_session.query(CancerPatient).all()
    lista = [p.to_dict() for p in pacientes]
    return jsonify(lista)


@app.route('/api/opciones_cancer', methods=['GET'])
@login_required
def opciones_cancer():
    # Obtener valores únicos para filtros
    regiones_q = db_session.query(CancerPatient.country_region).distinct().all()
    tipos_q   = db_session.query(CancerPatient.cancer_type).distinct().all()
    anios_q   = db_session.query(CancerPatient.year).distinct().all()

    regiones = sorted([r[0] for r in regiones_q if r[0]])
    tipos_cancer = sorted([t[0] for t in tipos_q if t[0]])
    anios = sorted([y[0] for y in anios_q if y[0] is not None])

    return jsonify({
        "regiones": regiones,
        "tipos_cancer": tipos_cancer,
        "anios": anios
    })


@app.route('/api/get_cancer/<int:id>', methods=['GET'])
@login_required
def get_cancer(id):
    paciente = db_session.query(CancerPatient).get(id)
    if not paciente:
        return abort(404)
    return jsonify(paciente.to_dict())


@app.route('/api/add_cancer', methods=['POST'])
@login_required
def add_cancer():
    data = request.get_json()
    if not data:
        return abort(400)

    nuevo = CancerPatient(
        patient_id=data.get('patient_id'),
        age=data.get('age'),
        gender=data.get('gender'),
        country_region=data.get('country_region'),
        year=data.get('year'),
        genetic_risk=data.get('genetic_risk'),
        air_pollution=data.get('air_pollution'),
        alcohol_use=data.get('alcohol_use'),
        smoking=data.get('smoking'),
        obesity_level=data.get('obesity_level'),
        cancer_type=data.get('cancer_type'),
        cancer_stage=data.get('cancer_stage'),
        treatment_cost_usd=data.get('treatment_cost_usd'),
        survival_years=data.get('survival_years'),
        target_severity_score=data.get('target_severity_score')
    )
    db_session.add(nuevo)
    db_session.commit()
    return jsonify({"mensaje": "Paciente agregado"}), 201


@app.route('/api/upd_cancer/<int:id>', methods=['PUT'])
@login_required
def upd_cancer(id):
    paciente = db_session.query(CancerPatient).get(id)
    if not paciente:
        return abort(404)

    data = request.get_json()
    if not data:
        return abort(400)

    paciente.patient_id            = data.get('patient_id')
    paciente.age                   = data.get('age')
    paciente.gender                = data.get('gender')
    paciente.country_region        = data.get('country_region')
    paciente.year                  = data.get('year')
    paciente.genetic_risk          = data.get('genetic_risk')
    paciente.air_pollution         = data.get('air_pollution')
    paciente.alcohol_use           = data.get('alcohol_use')
    paciente.smoking               = data.get('smoking')
    paciente.obesity_level         = data.get('obesity_level')
    paciente.cancer_type           = data.get('cancer_type')
    paciente.cancer_stage          = data.get('cancer_stage')
    paciente.treatment_cost_usd     = data.get('treatment_cost_usd')
    paciente.survival_years         = data.get('survival_years')
    paciente.target_severity_score = data.get('target_severity_score')

    db_session.commit()
    return jsonify({"mensaje": "Paciente actualizado"}), 200


@app.route('/api/del_cancer/<int:id>', methods=['DELETE'])
@login_required
def del_cancer(id):
    paciente = db_session.query(CancerPatient).get(id)
    if not paciente:
        return abort(404)

    db_session.delete(paciente)
    db_session.commit()
    return jsonify({"mensaje": "Paciente eliminado"}), 200


# ============================
# MÉTODO AUXILIAR en el modelo para to_dict()
# ============================
# Asegúrate de que en tu modelo CancerPatient hayas definido lo siguiente:
#
#    def to_dict(self):
#        return {
#            "id": self.id,
#            "patient_id": self.patient_id,
#            "age": self.age,
#            "gender": self.gender,
#            "country_region": self.country_region,
#            "year": self.year,
#            "genetic_risk": self.genetic_risk,
#            "air_pollution": self.air_pollution,
#            "alcohol_use": self.alcohol_use,
#            "smoking": self.smoking,
#            "obesity_level": self.obesity_level,
#            "cancer_type": self.cancer_type,
#            "cancer_stage": self.cancer_stage,
#            "treatment_cost_usd": self.treatment_cost_usd,
#            "survival_years": self.survival_years,
#            "target_severity_score": self.target_severity_score
#        }
#
# Sin ese método en tu modelo, jsonify(p.to_dict()) no funcionará.

if __name__ == '__main__':
    app.run(debug=True)
