// js/table.js
function applyFilters() {
  const r = $("#filterRegion").val(),
        c = $("#filterCancer").val(),
        y = $("#filterYear").val();

  const filtered = dataAll.filter(p =>
    (!r || p.Country_Region === r) &&
    (!c || p.Cancer_Type     === c) &&
    (!y || String(p.Year)     === y)
  );

  if ($.fn.DataTable.isDataTable("#tablaCancer")) {
    $("#tablaCancer").DataTable().clear().destroy();
  }

  // Usar valores originales del CSV
  const rows = filtered.map(p => [
    p.Age, p.Gender, p.Country_Region, p.Year,
    p.Genetic_Risk, p.Air_Pollution,
    p.Alcohol_Use, p.Smoking,
    p.Obesity_Level, p.Cancer_Type,
    p.Cancer_Stage, p.Treatment_Cost_USD,
    p.Survival_Years, p.Target_Severity_Score
  ]);

  $("#tablaCancer").DataTable({
    data: rows,
    columns: [
      { title:"Edad", className:"text-end" },
      { title:"Género" },
      { title:"Región" },
      { title:"Año", className:"text-end" },
      { title:"Genético", className:"text-end" },
      { title:"Aire", className:"text-end" },
      { title:"Alcohol", className:"text-end" },
      { title:"Fumar", className:"text-end" },
      { title:"Obesidad", className:"text-end" },
      { title:"Cáncer" },
      { title:"Etapa" },
      { title:"Costo", className:"text-end" },
      { title:"Superv.", className:"text-end" },
      { title:"Sev.Score", className:"text-end" }
    ],
    responsive: true,
    pageLength: 10,
    lengthMenu: [10,25,50]
  });

  renderCharts(filtered);
}
