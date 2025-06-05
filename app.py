# app.py

from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import NoResultFound
from models.base import engine
from models.model import Usuario, CancerPatient, Base
from werkzeug.security import generate_password_hash, check_password_hash
import os

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev_key_fallback")

# -------------------------------------------------------------------
# 1) Configuración de SQLAlchemy y Flask-Login
# -------------------------------------------------------------------
Session = sessionmaker(bind=engine)
db_session = Session()

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'auth'  # Si no está autenticado, redirige a 'auth'


@login_manager.user_loader
def load_user(user_id):
    try:
        # SQLAlchemy 2.0: .get() es legacy, pero funciona. 
        # Podrías usar db_session.get(Usuario, int(user_id)) en lugar de query.get(...)
        return db_session.query(Usuario).get(int(user_id))
    except:
        return None


@app.context_processor
def inject_user():
    """
    Inyecta 'username' en TODOS los templates, para mostrar {{ username }} en pie de página, etc.
    """
    return dict(username=(current_user.username if current_user.is_authenticated else ""))


# -------------------------------------------------------------------
# 2) RUTAS DE AUTENTICACIÓN (login / register / logout)
# -------------------------------------------------------------------
@app.route('/', methods=['GET', 'POST'])
def auth():
    # ✔ Comentamos o borramos esta validación:
    # if current_user.is_authenticated:
    #     return redirect(url_for('dashboard'))

    if request.method == 'POST':
        action = request.form.get('action')
        username = request.form.get('username', "").strip()
        password = request.form.get('password', "").strip()

        if action == 'register':
            existente = db_session.query(Usuario).filter(Usuario.username == username).first()
            if existente:
                flash('El usuario ya existe', 'danger')
            else:
                nuevo = Usuario(username=username)
                nuevo.set_password(password)
                db_session.add(nuevo)
                db_session.commit()
                flash('Usuario creado exitosamente. Ahora inicia sesión.', 'success')
                return redirect(url_for('auth'))

        elif action == 'login':
            user = db_session.query(Usuario).filter(Usuario.username == username).first()
            if user and check_password_hash(user.password, password):
                login_user(user)
                flash('Sesión iniciada exitosamente', 'success')
                return redirect(url_for('dashboard'))
            else:
                flash('Usuario o contraseña incorrectos', 'danger')
                return redirect(url_for('auth'))

    return render_template('auth.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Has cerrado sesión', 'info')
    return redirect(url_for('auth'))


# -------------------------------------------------------------------
# 3) DASHBOARD PRINCIPAL (vista HTML)
# -------------------------------------------------------------------
@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')


# -------------------------------------------------------------------
# 4) ROUTE CRUD DE PACIENTES (solo HTML)
# -------------------------------------------------------------------
@app.route('/pacientes')
@login_required
def listcancer():
    return render_template('list.html')


# -------------------------------------------------------------------
# 5) API JSON PARA FRONTEND (dashboard.js y crudcancer.js)
# -------------------------------------------------------------------
@app.route('/api/list_cancer', methods=['GET'])
@login_required
def api_list_cancer():
    pacientes = db_session.query(CancerPatient).all()
    lista = [p.to_dict() for p in pacientes]
    return jsonify(lista)


@app.route('/api/get_cancer/<int:id>', methods=['GET'])
@login_required
def api_get_cancer(id):
    try:
        paciente = db_session.query(CancerPatient).filter(CancerPatient.id == id).one()
        return jsonify(paciente.to_dict())
    except NoResultFound:
        return jsonify({'error': 'Paciente no encontrado'}), 404


@app.route('/api/opciones_cancer', methods=['GET'])
@login_required
def api_opciones_cancer():
    all_p = db_session.query(CancerPatient).all()
    regiones = sorted({p.country_region for p in all_p if p.country_region})
    tipos_cancer = sorted({p.cancer_type for p in all_p if p.cancer_type})
    anios = sorted({p.year for p in all_p if p.year is not None})
    return jsonify({
        'regiones': regiones,
        'tipos_cancer': tipos_cancer,
        'anios': anios
    })


@app.route('/api/add_cancer', methods=['POST'])
@login_required
def api_add_cancer():
    data = request.get_json()
    try:
        nuevo = CancerPatient(
            patient_id=data['patient_id'],
            age=int(data['age']),
            gender=data['gender'],
            country_region=data['country_region'],
            year=int(data['year']),
            genetic_risk=float(data['genetic_risk']),
            air_pollution=float(data['air_pollution']),
            alcohol_use=float(data['alcohol_use']),
            smoking=float(data['smoking']),
            obesity_level=float(data['obesity_level']),
            cancer_type=data['cancer_type'],
            cancer_stage=data['cancer_stage'],
            treatment_cost_usd=float(data['treatment_cost_usd']),
            survival_years=float(data['survival_years']),
            target_severity_score=float(data['target_severity_score'])
        )
        db_session.add(nuevo)
        db_session.commit()
        return jsonify({'mensaje': 'Paciente agregado correctamente'}), 201

    except Exception as e:
        db_session.rollback()
        return jsonify({'error': 'Error al agregar paciente', 'detalle': str(e)}), 400


@app.route('/api/upd_cancer/<int:id>', methods=['PUT'])
@login_required
def api_upd_cancer(id):
    data = request.get_json()
    try:
        paciente = db_session.query(CancerPatient).filter(CancerPatient.id == id).one()
        paciente.patient_id = data['patient_id']
        paciente.age = int(data['age'])
        paciente.gender = data['gender']
        paciente.country_region = data['country_region']
        paciente.year = int(data['year'])
        paciente.genetic_risk = float(data['genetic_risk'])
        paciente.air_pollution = float(data['air_pollution'])
        paciente.alcohol_use = float(data['alcohol_use'])
        paciente.smoking = float(data['smoking'])
        paciente.obesity_level = float(data['obesity_level'])
        paciente.cancer_type = data['cancer_type']
        paciente.cancer_stage = data['cancer_stage']
        paciente.treatment_cost_usd = float(data['treatment_cost_usd'])
        paciente.survival_years = float(data['survival_years'])
        paciente.target_severity_score = float(data['target_severity_score'])
        db_session.commit()
        return jsonify({'mensaje': 'Paciente actualizado correctamente'})

    except NoResultFound:
        return jsonify({'error': 'Paciente no encontrado'}), 404

    except Exception as e:
        db_session.rollback()
        return jsonify({'error': 'Error al actualizar paciente', 'detalle': str(e)}), 400


@app.route('/api/del_cancer/<int:id>', methods=['DELETE'])
@login_required
def api_del_cancer(id):
    try:
        paciente = db_session.query(CancerPatient).filter(CancerPatient.id == id).one()
        db_session.delete(paciente)
        db_session.commit()
        return jsonify({'mensaje': 'Paciente eliminado correctamente'})

    except NoResultFound:
        return jsonify({'error': 'Paciente no encontrado'}), 404

    except Exception as e:
        db_session.rollback()
        return jsonify({'error': 'Error al eliminar paciente', 'detalle': str(e)}), 400


# -------------------------------------------------------------------
# 6) Manejo básico de errores (sin templates faltantes)
# -------------------------------------------------------------------
@app.errorhandler(404)
def page_not_found(e):
    return "Página no encontrada (404)", 404

@app.errorhandler(500)
def server_error(e):
    return "Error interno del servidor (500)", 500


# -------------------------------------------------------------------
# 7) Entry point
# -------------------------------------------------------------------
if __name__ == '__main__':
    # Si la tabla aún no existe, la primera vez descomenta:
    # Base.metadata.create_all(bind=engine)

    ##app.run(debug=True)
    port = int(os.environ.get("PORT", 5000))  # Render asigna el puerto dinámicamente
    app.run(host='0.0.0.0', port=port)
