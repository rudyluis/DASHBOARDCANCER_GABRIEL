// static/js/dashboard.js

let allData = [];
let filteredData = [];

// --------------------------------------------------------
// 1) Al cargar la página
// --------------------------------------------------------
$(document).ready(function () {
  // 1.1) Verificar que el loader y los indicadores existen (puedes quitar estos console.log una vez funcione)
  console.log("#loader encontrado?", $('#loader').length);
  console.log("#totalPacientes encontrado?", $('#totalPacientes').length);
  console.log("#tipoComun encontrado?", $('#tipoComun').length);
  console.log("#regionTop encontrado?", $('#regionTop').length);
  console.log("#topYear encontrado?", $('#topYear').length);

  // 1.2) Inicializar Select2 en filtros
  $('#filterRegion, #filterCancerType, #filterYear').select2({
    placeholder: "Seleccionar...",
    multiple: true,
    allowClear: true,
    width: '100%',
    closeOnSelect: true,
    minimumResultsForSearch: 0,
    theme: 'bootstrap-5'
  }).on('select2:select select2:unselect', function () {
    aplicarFiltrosYGraficos();
  });

  // 1.3) Búsqueda por Patient_ID
  $('#searchPatientId').on('input', function () {
    aplicarFiltrosYGraficos();
  });

  // 1.4) Toggle de tema
  $('#toggleTheme').on('click', function () {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-bs-theme') === 'dark';
    html.setAttribute('data-bs-theme', isDark ? 'light' : 'dark');
    this.textContent = isDark ? 'Modo Oscuro 🌙' : 'Modo Claro 🌞';
  });

  // 1.5) Mostrar/Ocultar tabla completa (incluyendo título)
  $('#toggleTable').on('click', function () {
    $('#tablaContainer, #tableTitle').toggleClass('d-none');
    const oculto = $('#tablaContainer').hasClass('d-none');
    $(this).text(oculto ? 'Mostrar Tabla de Datos' : 'Ocultar Tabla de Datos');
  });

  // 1.6) Mostrar/Ocultar sección de gráficos (y título)
  $('#toggleCharts').on('click', function () {
    $('#sectionCharts, #chartsTitle').toggleClass('d-none');
    const ocultoCharts = $('#sectionCharts').hasClass('d-none');
    $(this).text(ocultoCharts ? 'Ver Gráficos Representativos' : 'Ocultar Gráficos Representativos');
  });

  // 1.7) Cargar datos por primera vez
  cargarDatosIniciales();
});

// --------------------------------------------------------
// 2) Cargar datos del backend y renderizar todo
// --------------------------------------------------------
function cargarDatosIniciales() {
  // Mostrar loader
  $('#loader').removeClass('d-none');
  console.log("Iniciando AJAX /api/list_cancer…");

  $.ajax({
    url: "/api/list_cancer",
    method: "GET",
    dataType: "json",

    success: function (data) {
      try {
        allData      = data;
        filteredData = [...allData];

        // Llenar filtros con valores únicos
        popularFiltros();

        // Actualizar indicadores, tabla y gráficos
        actualizarStatsCards();
        cargarTabla(filteredData);
        renderGraficos(filteredData);

      } catch (e) {
        console.error("Error en success() al procesar datos:", e);
      }
    },

    error: function (xhr, status, error) {
      console.error("Error al cargar los datos:", error);
    },

    complete: function () {
      // Ocultar loader
      $('#loader').addClass('d-none');
    }
  });
}

// --------------------------------------------------------
// 3) Popular filtros: región, tipo de cáncer, año
// --------------------------------------------------------
function popularFiltros() {
  const regiones    = [...new Set(allData.map(d => d.country_region).filter(Boolean))].sort();
  const tiposCancer = [...new Set(allData.map(d => d.cancer_type).filter(Boolean))].sort();
  const anios       = [...new Set(allData.map(d => d.year).filter(v => v != null))].sort();

  llenarCombo('#filterRegion', regiones);
  llenarCombo('#filterCancerType', tiposCancer);
  llenarCombo('#filterYear', anios);
}

function llenarCombo(selector, valores) {
  const select = $(selector);
  select.empty().append('<option value=""></option>');
  valores.forEach(v => {
    select.append(`<option value="${v}">${v}</option>`);
  });
  // disparar el evento de Select2 para refrescar la lista
  select.trigger('change.select2');
}

// --------------------------------------------------------
// 4) Aplicar filtros + búsqueda + re-render de todo
// --------------------------------------------------------
function aplicarFiltrosYGraficos() {
  const region = $('#filterRegion').val() || [];
  const tipo   = $('#filterCancerType').val() || [];
  const anio   = $('#filterYear').val() || [];
  const search = $('#searchPatientId').val().toLowerCase();

  filteredData = allData.filter(d =>
    (region.length === 0 || region.includes(d.country_region)) &&
    (tipo.length   === 0 || tipo.includes(d.cancer_type)) &&
    (anio.length   === 0 || anio.includes(String(d.year))) &&
    (!search || (d.patient_id && d.patient_id.toLowerCase().includes(search)))
  );

  actualizarStatsCards();
  cargarTabla(filteredData);
  renderGraficos(filteredData);
}

// --------------------------------------------------------
// 5) Actualizar los 4 indicadores superiores
// --------------------------------------------------------
function actualizarStatsCards() {
  // Total de pacientes
  const total = filteredData.length;

  // Tipo de cáncer más común
  const countTipo = {};
  filteredData.forEach(d => {
    const t = d.cancer_type || 'Desconocido';
    countTipo[t] = (countTipo[t] || 0) + 1;
  });
  const tipoComun = Object.keys(countTipo).length
    ? Object.keys(countTipo).reduce((a, b) => countTipo[a] > countTipo[b] ? a : b)
    : 'N/A';

  // Región con más pacientes
  const countRegion = {};
  filteredData.forEach(d => {
    const r = d.country_region || 'Desconocido';
    countRegion[r] = (countRegion[r] || 0) + 1;
  });
  const regionTop = Object.keys(countRegion).length
    ? Object.keys(countRegion).reduce((a, b) => countRegion[a] > countRegion[b] ? a : b)
    : 'N/A';

  // Año con mayor promedio de supervivencia
  const sumaPorYear  = {};
  const countPorYear = {};
  filteredData.forEach(d => {
    if (d.year != null && !isNaN(d.survival_years)) {
      sumaPorYear[d.year]  = (sumaPorYear[d.year]  || 0) + d.survival_years;
      countPorYear[d.year] = (countPorYear[d.year] || 0) + 1;
    }
  });
  const promedioPorYear = {};
  Object.keys(sumaPorYear).forEach(y => {
    promedioPorYear[y] = sumaPorYear[y] / countPorYear[y];
  });
  const topYear = Object.keys(promedioPorYear).length
    ? Object.keys(promedioPorYear).reduce((a, b) => promedioPorYear[a] > promedioPorYear[b] ? a : b)
    : 'N/A';

  // Inyectar en el DOM
  $('#totalPacientes').text(total);
  $('#tipoComun').text(tipoComun);
  $('#regionTop').text(regionTop);
  $('#topYear').text(topYear);
}

// --------------------------------------------------------
// 6) Cargar tabla (DataTables) con “filteredData”
// --------------------------------------------------------
function cargarTabla(data) {
  if ($.fn.DataTable.isDataTable('#tablaCancer')) {
    $('#tablaCancer').DataTable().clear().destroy();
  }

  const rows = data.map(p => [
    p.id,
    p.patient_id,
    p.age,
    p.gender,
    p.country_region,
    p.year,
    p.genetic_risk.toFixed(2),
    p.air_pollution.toFixed(2),
    p.alcohol_use.toFixed(2),
    p.smoking.toFixed(2),
    p.obesity_level.toFixed(2),
    p.cancer_type,
    p.cancer_stage,
    p.treatment_cost_usd.toFixed(2),
    p.survival_years.toFixed(2),
    p.target_severity_score.toFixed(2),
    p.id // para los botones
  ]);

  $('#tablaCancer').DataTable({
    data: rows,
    columns: [
      { title: "ID", visible: false },
      { title: "Patient_ID" },
      { title: "Edad", className: "text-end" },
      { title: "Género" },
      { title: "Región" },
      { title: "Año", className: "text-end" },
      { title: "Genético", className: "text-end" },
      { title: "Aire", className: "text-end" },
      { title: "Alcohol", className: "text-end" },
      { title: "Fumar", className: "text-end" },
      { title: "Obesidad", className: "text-end" },
      { title: "Tipo Cáncer" },
      { title: "Etapa" },
      { title: "Costo USD", className: "text-end" },
      { title: "Supervivencia", className: "text-end" },
      { title: "Severity Score", className: "text-end" },
      {
        title: "Acciones",
        orderable: false,
        searchable: false,
        className: "text-center",
        render: function (data, type, row, meta) {
          const id = row[0];
          return `
            <button class="btn btn-sm btn-warning btn-editar me-1" data-id="${id}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger btn-eliminar" data-id="${id}">
              <i class="fas fa-trash-alt"></i>
            </button>`;
        }
      }
    ],
    pageLength: 10,
    lengthMenu: [10, 20, 50],
    responsive: true,
    autoWidth: false,
    language: {
      search: "Filtrar:",
      lengthMenu: "Mostrar _MENU_ registros",
      info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
      paginate: {
        next: "Siguiente",
        previous: "Anterior"
      }
    }
  });
}

// --------------------------------------------------------
// 7) Función renderGraficos(data): dibujar TODOS los charts
// --------------------------------------------------------
function renderGraficos(data) {
  // 1) Determinar color de texto según tema actual
  const isDark   = document.documentElement.getAttribute('data-bs-theme') === 'dark';
  const fontColor = isDark ? '#f2ece4' : '#333333';

  // 2) Destruir todos los charts previos (si existen)
  [
    'barChart',
    'doughnutChart',
    'lineChart',
    'scatterChart',
    'heatmapChart',
    'histChart',
    'bubbleChart',
    'pieGenero',
    'barYear'
  ].forEach(id => {
    const existing = Chart.getChart(id);
    if (existing) existing.destroy();
  });

  // ------------------------------------------------------------------------
  // 3) Bar: Pacientes por Tipo de Cáncer
  // ------------------------------------------------------------------------
  const countTipo = {};
  data.forEach(d => {
    const t = d.cancer_type || 'Desconocido';
    countTipo[t] = (countTipo[t] || 0) + 1;
  });
  const tipos         = Object.keys(countTipo);
  const valoresTipo   = tipos.map(t => countTipo[t]);
  const coloresBar    = tipos.map((_, i) =>
    `rgba(${50 + i * 20}, ${10 + i * 15}, ${30 + i * 25}, 0.7)`
  );

  new Chart(document.getElementById('barChart'), {
    type: 'bar',
    data: {
      labels: tipos,
      datasets: [{
        label: 'Pacientes por Tipo',
        data: valoresTipo,
        backgroundColor: coloresBar,
        borderColor: '#f2ece4',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Pacientes por Tipo de Cáncer',
          font: { size: 18, weight: '600' },
          color: fontColor
        },
        legend: { display: false }
      },
      scales: {
        x: {
          ticks: {
            color: fontColor
          },
          grid: { display: false }
        },
        y: {
          ticks: {
            color: fontColor
          },
          grid: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }
        }
      }
    }
  });

  // ------------------------------------------------------------------------
  // 4) Doughnut: Etapas de Cáncer
  // ------------------------------------------------------------------------
  const countStage   = {};
  data.forEach(d => {
    const s = d.cancer_stage || 'Desconocido';
    countStage[s] = (countStage[s] || 0) + 1;
  });
  const stages       = Object.keys(countStage);
  const valoresStage = stages.map(s => countStage[s]);
  const coloresDonut = ['#c94f6d','#ff7f50','#d4af37','#7b0d2b','#531c29','#f2ece4'];

  new Chart(document.getElementById('doughnutChart'), {
    type: 'doughnut',
    data: {
      labels: stages,
      datasets: [{
        data: valoresStage,
        backgroundColor: stages.map((_, i) => coloresDonut[i % coloresDonut.length]),
        hoverOffset: 12
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        title: {
          display: true,
          text: 'Distribución por Etapa de Cáncer',
          font: { size: 18 },
          color: fontColor
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? ((context.raw / total) * 100).toFixed(2) : 0;
              return `${context.label}: ${context.raw} (${pct}%)`;
            }
          }
        },
        legend: {
          position: 'bottom',
          labels: {
            color: fontColor
          }
        }
      }
    }
  });

  // ------------------------------------------------------------------------
  // 5) Line: Supervivencia Media por Año
  // ------------------------------------------------------------------------
  const years   = [...new Set(data.map(d => d.year))].sort((a,b) => a - b);
  const avgSurv = years.map(y => {
    const arr = data.filter(d => d.year === y).map(d => d.survival_years);
    return arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : 0;
  });

  new Chart(document.getElementById('lineChart'), {
    type: 'line',
    data: {
      labels: years,
      datasets: [{
        label: 'Supervivencia Media',
        data: avgSurv,
        borderColor: isDark ? '#c94f6d' : '#7b0d2b',
        backgroundColor: isDark ? 'rgba(201, 79, 109, 0.4)' : 'rgba(123, 13, 43, 0.3)',
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointBackgroundColor: isDark ? '#f2ece4' : '#ffffff',
        pointBorderColor: isDark ? '#c94f6d' : '#7b0d2b'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Supervivencia Media por Año',
          font: { size: 18 },
          color: fontColor
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.raw} años`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: fontColor
          },
          grid: { color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: fontColor
          },
          grid: { color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
        }
      }
    }
  });

  // ------------------------------------------------------------------------
  // 6) Scatter: Riesgo Genético vs Costo (log10 USD)
  // ------------------------------------------------------------------------
  new Chart(document.getElementById('scatterChart'), {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Riesgo vs Costo (USD)',
        data: data.map(p => ({
          x: p.genetic_risk,
          y: Math.log10(p.treatment_cost_usd > 0 ? p.treatment_cost_usd : 1)
        })),
        pointBackgroundColor: isDark ? '#d4af37' : '#7b0d2b',
        pointBorderColor: '#ffffff',
        pointRadius: 6,
        pointHoverRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: true,
            text: 'Riesgo Genético',
            color: fontColor
          },
          ticks: {
            color: fontColor
          },
          grid: {
            color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
          }
        },
        y: {
          title: {
            display: true,
            text: 'log₁₀(Costo USD)',
            color: fontColor
          },
          ticks: {
            color: fontColor
          },
          grid: {
            color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Riesgo Genético vs Costo (log₁₀)',
          font: { size: 18 },
          color: fontColor
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Gen.Riesgo: ${context.raw.x}, log₁₀(Costo): ${context.raw.y.toFixed(2)}`;
            }
          }
        },
        legend: {
          labels: {
            color: fontColor
          }
        }
      }
    }
  });

  // ------------------------------------------------------------------------
  // 7) Heatmap: Correlación Aire vs Obesidad por Región
  // ------------------------------------------------------------------------
  const regionesSet = [...new Set(data.map(d => d.country_region).filter(Boolean))].sort();
  const valoresAire = regionesSet.map(r => {
    const arr = data.filter(d => d.country_region === r).map(d => d.air_pollution);
    return arr.length ? (arr.reduce((a,b) => a + b, 0) / arr.length).toFixed(2) : 0;
  });
  const valoresObesidad = regionesSet.map(r => {
    const arr = data.filter(d => d.country_region === r).map(d => d.obesity_level);
    return arr.length ? (arr.reduce((a,b) => a + b, 0) / arr.length).toFixed(2) : 0;
  });

  const matrixData = [];
  regionesSet.forEach((r, i) => {
    regionesSet.forEach((c, j) => {
      const value = parseFloat(valoresAire[j]) + parseFloat(valoresObesidad[i]);
      matrixData.push({ x: j, y: i, v: value });
    });
  });

  new Chart(document.getElementById('heatmapChart'), {
    type: 'matrix',
    data: {
      datasets: [{
        label: 'Heatmap Aire+Obesidad',
        data: matrixData,
        backgroundColor: function(ctx) {
          const v = ctx.dataset.data[ctx.dataIndex].v;
          const alpha = Math.min(1, v / (Math.max(...matrixData.map(m=>m.v)) + 1));
          return `rgba(201,79,109, ${alpha})`;
        },
        borderColor: '#2b1a1f',
        borderWidth: 1,
        width: ({chart}) => (chart.scales.x.width / regionesSet.length) - 1,
        height: ({chart}) => (chart.scales.y.height / regionesSet.length) - 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'category',
          labels: regionesSet,
          offset: true,
          grid: { display: false },
          ticks: {
            color: fontColor
          }
        },
        y: {
          type: 'category',
          labels: regionesSet,
          offset: true,
          grid: { display: false },
          ticks: {
            color: fontColor
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Heatmap Promedio Aire vs Obesidad por Región',
          font: { size: 18 },
          color: fontColor
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const d = context.raw;
              return `${regionesSet[d.y]} / ${regionesSet[d.x]}: ${d.v.toFixed(2)}`;
            }
          }
        },
        legend: { display: false }
      }
    }
  });

  // ------------------------------------------------------------------------
  // 8) Histograma de Edades (Bar “arcoíris”)
  // ------------------------------------------------------------------------
  const ages     = data.map(p => p.age);
  const maxAge   = Math.ceil(Math.max(...ages) / 10) * 10;
  const bins     = Array.from({ length: maxAge / 10 }, (_, i) => 10 * i);
  const ageCounts = bins.map(start => ages.filter(a => a >= start && a < start + 10).length);
  const rainbow   = ['#c94f6d','#ff7f50','#d4af37','#7b0d2b','#531c29','#f2ece4','#a83232','#ffb3b3'];

  new Chart(document.getElementById('histChart'), {
    type: 'bar',
    data: {
      labels: bins.map(b => `${b}-${b + 9}`),
      datasets: [{
        label: "Pacientes",
        data: ageCounts,
        backgroundColor: bins.map((_, i) => rainbow[i % rainbow.length]),
        borderColor: '#000000',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Distribución de Edades',
          font: { size: 18 },
          color: fontColor
        },
        legend: { display: false }
      },
      scales: {
        x: {
          ticks: {
            color: fontColor,
            autoSkip: false,
            maxRotation: 45,
            minRotation: 45
          },
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: fontColor
          },
          grid: {
            color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
          }
        }
      }
    }
  });

  // ------------------------------------------------------------------------
  // 9) Bubble: Alcohol vs Fumar (radio = severity * 3)
  // ------------------------------------------------------------------------
  new Chart(document.getElementById('bubbleChart'), {
    type: 'bubble',
    data: {
      datasets: [{
        label: 'Alcohol vs Fumar',
        data: data.map(p => ({
          x: p.alcohol_use,
          y: p.smoking,
          r: Math.min(p.target_severity_score * 3, 25),
          name: p.patient_id
        })),
        backgroundColor: isDark ? 'rgba(201, 79, 109, 0.6)' : 'rgba(123, 13, 43, 0.6)',
        borderColor: isDark ? '#f2ece4' : '#333333',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Alcohol vs Fumar (Severity Score como Radio)',
          font: { size: 18 },
          color: fontColor
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const d = context.raw;
              return `${d.name}: Alcohol ${d.x}, Fumar ${d.y}, Radio ${d.r}`;
            }
          }
        },
        legend: {
          labels: {
            color: fontColor
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Alcohol Use',
            color: fontColor
          },
          ticks: {
            color: fontColor
          },
          grid: {
            color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Fumar',
            color: fontColor
          },
          ticks: {
            color: fontColor
          },
          grid: {
            color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
          }
        }
      }
    }
  });

  // ------------------------------------------------------------------------
  // 10) Pie: Distribución por Género
  // ------------------------------------------------------------------------
  const countGenero  = {};
  data.forEach(p => {
    const g = p.gender || 'Desconocido';
    countGenero[g] = (countGenero[g] || 0) + 1;
  });
  const generos       = Object.keys(countGenero);
  const valoresGenero = generos.map(g => countGenero[g]);
  const coloresPie    = ['#c94f6d', '#7b0d2b', '#ffa07a', '#d4af37'];

  new Chart(document.getElementById('pieGenero'), {
    type: 'pie',
    data: {
      labels: generos,
      datasets: [{
        data: valoresGenero,
        backgroundColor: generos.map((_, i) => coloresPie[i % coloresPie.length]),
        borderColor: '#ffffff',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Distribución de Pacientes por Género',
          font: { size: 18 },
          color: fontColor
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const total = context.dataset.data.reduce((a,b) => a + b, 0);
              const pct   = total > 0 ? ((context.raw / total) * 100).toFixed(2) : 0;
              return `${context.label}: ${context.raw} (${pct}%)`;
            }
          }
        },
        legend: {
          position: 'bottom',
          labels: {
            color: fontColor
          }
        }
      }
    }
  });

  // ------------------------------------------------------------------------
  // 11) Bar: Número de Pacientes por Año
  // ------------------------------------------------------------------------
  const countYear   = {};
  data.forEach(p => {
    const y = p.year || 'Desconocido';
    countYear[y] = (countYear[y] || 0) + 1;
  });
  const anos        = Object.keys(countYear).sort((a, b) => a - b);
  const valoresYear = anos.map(y => countYear[y]);
  const coloresBarYear = anos.map((_, i) =>
    isDark
      ? `rgba(212, 175, 55, 0.7)`
      : `rgba(201, 79, 109, 0.7)`
  );

  new Chart(document.getElementById('barYear'), {
    type: 'bar',
    data: {
      labels: anos,
      datasets: [{
        label: 'Pacientes por Año',
        data: valoresYear,
        backgroundColor: coloresBarYear,
        borderColor: '#f2ece4',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Número de Pacientes por Año',
          font: { size: 18 },
          color: fontColor
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.raw}`;
            }
          }
        },
        legend: { display: false }
      },
      scales: {
        x: {
          ticks: {
            color: fontColor
          },
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: fontColor
          },
          grid: {
            color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
          }
        }
      }
    }
  });
}

