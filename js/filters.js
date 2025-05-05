// js/filters.js (versión corregida)

const csvUrl = "https://raw.githubusercontent.com/rudyluis/DashboardJS/refs/heads/main/global_cancer.csv";
let dataAll = [];

$(document).ready(() => {
  // 1) Carga y parseo del CSV
  Papa.parse(csvUrl, {
    download: true,
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
    complete: ({ data, errors }) => {
      if (errors.length) {
        console.error("Errores al parsear CSV:", errors);
        return;
      }
      // Filtrar solo filas válidas
      dataAll = data.filter(r => r.Patient_ID);

      // 2) Inicializar filtros con opciones únicas
      initFilters();

      // 3) Primer render de tabla y gráficos
      applyFilters();
    },
    error: err => console.error("Error al cargar CSV:", err)
  });

  // 4) Cuando cambie cualquiera de los selects, vuelvo a filtrar y renderizar
  $("#filterRegion, #filterCancer, #filterYear").on("change", () => {
    applyFilters();
  });
});

function initFilters() {
  const fR = $("#filterRegion").empty().append("<option value=''>Todas Regiones</option>");
  const fC = $("#filterCancer").empty().append("<option value=''>Todos Tipos</option>");
  const fY = $("#filterYear").empty().append("<option value=''>Todos Años</option>");

  // Sacar listas únicas
  const uniq = (arr, key) => [...new Set(arr.map(x => x[key]).filter(Boolean))].sort();

  // Poblar selects
  uniq(dataAll, "Country_Region").forEach(v => fR.append(`<option value="${v}">${v}</option>`));
  uniq(dataAll, "Cancer_Type").   forEach(v => fC.append(`<option value="${v}">${v}</option>`));
  uniq(dataAll, "Year").          forEach(v => fY.append(`<option value="${v}">${v}</option>`));
}
