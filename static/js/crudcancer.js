// static/js/crudcancer.js

$(document).ready(function () {
  // 1) Cargar combos del formulario (Add/Edit)
  cargarOpcionesFormulario();

  // 2) Al enviar formAgregar (modal “Agregar Paciente”)
  $('#formAgregar').on('submit', function (e) {
    e.preventDefault();

    // Construimos el objeto datos usando los IDs de cada input/select:
    const datos = {
      patient_id: $('#addPatientId').val(),
      age: parseInt($('#addAge').val()),
      gender: $('#addGender').val(),
      country_region: $('#addRegion').val(),
      year: parseInt($('#addYear').val()),
      genetic_risk: parseFloat($('#addGeneticRisk').val()),
      air_pollution: parseFloat($('#addAirPollution').val()),
      alcohol_use: parseFloat($('#addAlcoholUse').val()),
      smoking: parseFloat($('#addSmoking').val()),
      obesity_level: parseFloat($('#addObesityLevel').val()),
      cancer_type: $('#addCancerType').val(),
      cancer_stage: $('#addCancerStage').val(),
      treatment_cost_usd: parseFloat($('#addTreatmentCost').val()),
      survival_years: parseFloat($('#addSurvivalYears').val()),
      target_severity_score: parseFloat($('#addSeverityScore').val())
    };

    $.ajax({
      url: '/api/add_cancer',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(datos),
      success: function (response) {
        // Cerrar modal, resetear formulario y recargar toda la data
        $('#modalAgregar').modal('hide');
        $('#formAgregar')[0].reset();
        mostrarToast('✅ Paciente agregado con éxito', 'success');
        window.cargarDatosIniciales();
      },
      error: function () {
        mostrarToast('❌ Error al agregar paciente', 'danger');
      }
    });
  });

  // 3) Eliminar registro
  $('#tablaCancer').on('click', '.btn-eliminar', function () {
    const id = $(this).data('id');
    if (confirm("¿Estás seguro de eliminar este paciente?")) {
      $.ajax({
        url: `/api/del_cancer/${id}`,
        method: 'DELETE',
        success: function () {
          mostrarToast('❌ Paciente eliminado', 'warning');
          window.cargarDatosIniciales();
        },
        error: function () {
          mostrarToast('❌ Error al eliminar paciente', 'danger');
        }
      });
    }
  });

  // 4) Editar registro: precarga datos en el modal
  $('#tablaCancer').on('click', '.btn-editar', function () {
    const id = $(this).data('id');
    $.ajax({
      url: `/api/get_cancer/${id}`,
      method: 'GET',
      dataType: 'json',
      success: function (data) {
        // Rellenar campos del modal con lo recibido del backend
        $('#editarId').val(data.id);
        $('#editarPatientId').val(data.patient_id);
        $('#editarAge').val(data.age);
        $('#editarGender').val(data.gender);
        $('#editarRegion').val(data.country_region);
        $('#editarYear').val(data.year);
        $('#editarGeneticRisk').val(data.genetic_risk);
        $('#editarAirPollution').val(data.air_pollution);
        $('#editarAlcoholUse').val(data.alcohol_use);
        $('#editarSmoking').val(data.smoking);
        $('#editarObesityLevel').val(data.obesity_level);
        $('#editarCancerType').val(data.cancer_type);
        $('#editarCancerStage').val(data.cancer_stage);
        $('#editarTreatmentCost').val(data.treatment_cost_usd);
        $('#editarSurvivalYears').val(data.survival_years);
        $('#editarSeverityScore').val(data.target_severity_score);

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('modalEditar'));
        modal.show();
      },
      error: function () {
        mostrarToast('❌ Error al obtener datos del paciente', 'danger');
      }
    });
  });

  // 5) Guardar cambios edición
  $('#formEditar').on('submit', function (e) {
    e.preventDefault();
    const id = $('#editarId').val();

    // Construimos el objeto con los nuevos valores
    const datos = {
      patient_id: $('#editarPatientId').val(),
      age: parseInt($('#editarAge').val()),
      gender: $('#editarGender').val(),
      country_region: $('#editarRegion').val(),
      year: parseInt($('#editarYear').val()),
      genetic_risk: parseFloat($('#editarGeneticRisk').val()),
      air_pollution: parseFloat($('#editarAirPollution').val()),
      alcohol_use: parseFloat($('#editarAlcoholUse').val()),
      smoking: parseFloat($('#editarSmoking').val()),
      obesity_level: parseFloat($('#editarObesityLevel').val()),
      cancer_type: $('#editarCancerType').val(),
      cancer_stage: $('#editarCancerStage').val(),
      treatment_cost_usd: parseFloat($('#editarTreatmentCost').val()),
      survival_years: parseFloat($('#editarSurvivalYears').val()),
      target_severity_score: parseFloat($('#editarSeverityScore').val())
    };

    $.ajax({
      url: `/api/upd_cancer/${id}`,
      method: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify(datos),
      success: function () {
        $('#modalEditar').modal('hide');
        mostrarToast('✏️ Paciente actualizado', 'info');
        window.cargarDatosIniciales();
      },
      error: function () {
        mostrarToast('❌ Error al actualizar paciente', 'danger');
      }
    });
  });
});

// --------------------------------------------------------
// 6) Cargar opciones en los selects de Agregar/Editar
// --------------------------------------------------------
function cargarOpcionesFormulario() {
  $.ajax({
    url: '/api/opciones_cancer',
    method: 'GET',
    dataType: 'json',
    success: function (data) {
      // data = { regiones: [...], tipos_cancer: [...], anios: [...] }
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
// 7) Mostrar Toast dinámico
// --------------------------------------------------------
function mostrarToast(mensaje, tipo = 'primary') {
  const toastEl   = $('#toastNotificacion');
  const toastBody = $('#toastMensaje');

  toastEl.removeClass('bg-primary bg-success bg-danger bg-warning bg-info');
  toastEl.addClass(`bg-${tipo}`);
  toastBody.text(mensaje);

  const toast = new bootstrap.Toast(toastEl[0]);
  toast.show();
}
