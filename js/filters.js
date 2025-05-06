// js/filters.js
const csvUrl = "https://raw.githubusercontent.com/rudyluis/DashboardJS/refs/heads/main/global_cancer.csv";
let dataAll = [];

$(document).ready(() => {
  Papa.parse(csvUrl, {
    download: true, header: true, skipEmptyLines: true, dynamicTyping: true,
    complete: ({ data, errors }) => {
      if (errors.length) return console.error(errors);
      dataAll = data.filter(r => r.Patient_ID);
      initFilters();
      applyFilters();
    },
    error: err => console.error(err)
  });

  $("#filterRegion, #filterCancer, #filterYear").on("change", applyFilters);
});

function initFilters() {
  const fR = $("#filterRegion").empty().append("<option value=''>Todas Regiones</option>");
  const fC = $("#filterCancer").empty().append("<option value=''>Todos Tipos</option>");
  const fY = $("#filterYear").empty().append("<option value=''>Todos Años</option>");

  const uniq = (arr, key) => [...new Set(arr.map(x => x[key]).filter(Boolean))].sort();
  uniq(dataAll, "Country_Region").forEach(v => fR.append(`<option>${v}</option>`));
  uniq(dataAll, "Cancer_Type").forEach(v => fC.append(`<option>${v}</option>`));
  uniq(dataAll, "Year").forEach(v => fY.append(`<option>${v}</option>`));
}
