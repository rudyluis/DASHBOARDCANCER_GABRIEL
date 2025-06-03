// static/js/crudcancer.js

$(document).ready(function () {
  // Cargar combos del formulario Editar y Agregar
  cargarOpcionesFormulario();

  // Al enviar formAgregar
  $('#formAgregar').on('submit', function (e) {
    e.preventDefault();
    const datos = {
      patient_id: this.patient_id.value,
      age: parseInt(this.age.value),
      gender: this.gender.value,
      country_region: this.country_region.value,
      year: parseInt(this.year.value),
      genetic_risk: parseFloat(this.genetic_risk.value),
      air_pollution: parseFloat(this.air_pollution.value),
      alcohol_use: parseFloat(this.alcohol_use.value),
      smoking: parseFloat(this.smoking.value),
      obesity_level: parseFloat(this.obesity_level.value),
      cancer_type: this.cancer_type.value,
      cancer_stage: this.cancer_stage.value,
      treatment_cost_usd: parseFloat(this.treatment_cost_usd.value),
      survival_years: parseFloat(this.survival_years.value),
      target_severity_score: parseFloat(this.target_severity_score.value)
    };

    $.ajax({
      url: '/api/add_cancer',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(datos),
      success: function (response) {
        $('#modalAgregar').modal('hide');
        $('#formAgregar')[0].reset();
        mostrarToast('✅ Paciente agregado con éxito', 'success');

        // RECOMENDACIÓN: recargar datos completos y volver a pintar
        cargarDatosIniciales();
      },
      error: function () {
        mostrarToast('❌ Error al agregar paciente', 'danger');
      }
    });
  });

  // Eliminar registro
  $('#tablaCancer').on('click', '.btn-eliminar', function () {
    const id = $(this).data('id');
    if (confirm("¿Estás seguro de eliminar este paciente?")) {
      $.ajax({
        url: `/api/del_cancer/${id}`,
        method: 'DELETE',
        success: function () {
          mostrarToast('❌ Paciente eliminado', 'warning');

          // recargar datos
          cargarDatosIniciales();
        },
        error: function () {
          mostrarToast('❌ Error al eliminar paciente', 'danger');
        }
      });
    }
  });

  // Editar registro: precarga datos en el modal
  $('#tablaCancer').on('click', '.btn-editar', function () {
    const id = $(this).data('id');
    $.ajax({
      url: `/api/get_cancer/${id}`,
      method: 'GET',
      dataType: 'json',
      success: function (data) {
        // Rellenar campos del modal
        $('#editarId').val(data.id);
        $('#editarPatientId').val(data.patient_id);
        $('#editarAge').val(data.age);
        $('#editarGender').val(data.gender);
        $('#editarCountryRegion').val(data.country_region);
        $('#editarYear').val(data.year);
        $('#editarGeneticRisk').val(data.genetic_risk);
        $('#editarAirPollution').val(data.air_pollution);
        $('#editarAlcoholUse').val(data.alcohol_use);
        $('#editarSmoking').val(data.smoking);
        $('#editarObesityLevel').val(data.obesity_level);
        $('#editarCancerType').val(data.cancer_type);
        $('#editarCancerStage').val(data.cancer_stage);
        $('#editarTreatmentCostUSD').val(data.treatment_cost_usd);
        $('#editarSurvivalYears').val(data.survival_years);
        $('#editarTargetSeverityScore').val(data.target_severity_score);

        // Mostramos el modal
        const modal = new bootstrap.Modal(document.getElementById('modalEditar'));
        modal.show();
      },
      error: function () {
        mostrarToast('❌ Error al obtener datos del paciente', 'danger');
      }
    });
  });

  // Guardar cambios edición
  $('#formEditar').on('submit', function (e) {
    e.preventDefault();
    const id = $('#editarId').val();
    const datos = {
      patient_id: $('#editarPatientId').val(),
      age: parseInt($('#editarAge').val()),
      gender: $('#editarGender').val(),
      country_region: $('#editarCountryRegion').val(),
      year: parseInt($('#editarYear').val()),
      genetic_risk: parseFloat($('#editarGeneticRisk').val()),
      air_pollution: parseFloat($('#editarAirPollution').val()),
      alcohol_use: parseFloat($('#editarAlcoholUse').val()),
      smoking: parseFloat($('#editarSmoking').val()),
      obesity_level: parseFloat($('#editarObesityLevel').val()),
      cancer_type: $('#editarCancerType').val(),
      cancer_stage: $('#editarCancerStage').val(),
      treatment_cost_usd: parseFloat($('#editarTreatmentCostUSD').val()),
      survival_years: parseFloat($('#editarSurvivalYears').val()),
      target_severity_score: parseFloat($('#editarTargetSeverityScore').val())
    };
    $.ajax({
      url: `/api/upd_cancer/${id}`,
      method: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify(datos),
      success: function () {
        $('#modalEditar').modal('hide');
        mostrarToast('✏️ Paciente actualizado', 'info');

        // recargar datos
        cargarDatosIniciales();
      },
      error: function () {
        mostrarToast('❌ Error al actualizar paciente', 'danger');
      }
    });
  });
});

// --------------------------------------------------------
// 7) Cargar opciones en los selects de Agregar/Editar
// --------------------------------------------------------
function cargarOpcionesFormulario() {
  $.ajax({
    url: '/api/opciones_cancer',
    method: 'GET',
    dataType: 'json',
    success: function (data) {
      // Asumimos que data = { regiones: [...], tipos_cancer: [...], anios: [...] }
      llenarComboSimple('#addRegion', data.regiones);
      llenarComboSimple('#addCancerType', data.tipos_cancer);
      llenarComboSimple('#addYear', data.anios);

      llenarComboSimple('#editarRegion', data.regiones);
      llenarComboSimple('#editarCancerType', data.tipos_cancer);
      llenarComboSimple('#editarYear', data.anios);
    },
    error: function () {
      console.error("Error al cargar combos del formulario");
    }
  });
}

function llenarComboSimple(selector, valores) {
  const select = $(selector);
  select.empty().append('<option value="">-- Seleccione --</option>');
  valores.forEach(v => {
    select.append(`<option value="${v}">${v}</option>`);
  });
}

// --------------------------------------------------------
// 8) Mostrar Toast dinámico
// --------------------------------------------------------
function mostrarToast(mensaje, tipo = 'primary') {
  const toastEl = $('#toastNotificacion');
  const toastBody = $('#toastMensaje');

  toastEl.removeClass('bg-primary bg-success bg-danger bg-warning bg-info');
  toastEl.addClass(`bg-${tipo}`);
  toastBody.text(mensaje);

  const toast = new bootstrap.Toast(toastEl[0]);
  toast.show();
}

// --------------------------------------------------------
// 9) Volver a cargar data completa (usa la misma función de dashboard)
// --------------------------------------------------------
function cargarDatosIniciales() {
  // Este es el mismo nombre de la función que definimos en dashboard.js
  // Para recargar: basta con llamarla si ambos scripts están incluidos en la misma página.
  if (typeof window.cargarDatosIniciales === 'function') {
    window.cargarDatosIniciales();
  } else {
    console.error("Función cargarDatosIniciales() no encontrada.");
  }
}
