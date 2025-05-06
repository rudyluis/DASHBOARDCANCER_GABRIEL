// js/ui-toggle.js
$(document).ready(() => {
    $("#toggleTable").click(() => {
      $("#sectionTable").toggleClass("d-none");
      $("#tableTitle").toggleClass("d-none");
      $("#toggleTable").text(
        $("#sectionTable").hasClass("d-none")
          ? "Ver Tabla de Datos"
          : "Ocultar Tabla de Datos"
      );
    });
    $("#toggleCharts").click(() => {
      $("#sectionCharts").toggleClass("d-none");
      $("#chartsTitle").toggleClass("d-none");
      $("#toggleCharts").text(
        $("#sectionCharts").hasClass("d-none")
          ? "Ver Gráficos Representativos"
          : "Ocultar Gráficos Representativos"
      );
    });
  });
  