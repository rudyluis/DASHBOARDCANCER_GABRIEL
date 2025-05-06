// js/charts.js

// Funciones auxiliares
function logScale(v) {
  return v > 0 ? Math.log10(v) : 0;
}
function avg(arr) {
  return arr.length ? arr.reduce((sum, x) => sum + x, 0) / arr.length : 0;
}

function renderCharts(data) {
  // Destruye cualquier gráfico existente antes de crear nuevos
  [
    "barChart",
    "doughnutChart",
    "lineChart",
    "scatterChart",
    "radarChart",
    "histChart",
    "bubbleChart",
    "boxChart"
  ].forEach(id => Chart.getChart(id)?.destroy());

  //
  // 1) BARRAS: Conteo de pacientes por tipo de cáncer
  //
  const countByType = data.reduce((obj, p) => {
    obj[p.Cancer_Type] = (obj[p.Cancer_Type] || 0) + 1;
    return obj;
  }, {});

  new Chart(document.getElementById("barChart"), {
    type: "bar",
    data: {
      labels: Object.keys(countByType),
      datasets: [{
        label: "Pacientes",
        data: Object.values(countByType),
        backgroundColor: Object.keys(countByType).map((_, i) => `hsl(${(i * 40) % 360}, 70%, 60%)`)
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        x: { title: { display: true, text: "Tipo de Cáncer" } },
        y: { beginAtZero: true, title: { display: true, text: "Número de Pacientes" } }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.label}: ${ctx.parsed.y}`
          }
        }
      }
    }
  });

  //
  // 2) DONUT: Proporción de etapas de cáncer
  //
  const countByStage = data.reduce((obj, p) => {
    obj[p.Cancer_Stage] = (obj[p.Cancer_Stage] || 0) + 1;
    return obj;
  }, {});

  new Chart(document.getElementById("doughnutChart"), {
    type: "doughnut",
    data: {
      labels: Object.keys(countByStage),
      datasets: [{
        data: Object.values(countByStage),
        backgroundColor: Object.keys(countByStage).map((_, i) => `hsl(${(i * 60) % 360}, 50%, 50%)`)
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: "60%",
      plugins: {
        legend: { position: "right" },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.label}: ${ctx.raw}`
          }
        }
      }
    }
  });

  //
  // 3) LÍNEA: Supervivencia media por año
  //
  const years = [...new Set(data.map(p => p.Year))].sort();
  const survAvg = years.map(y =>
    avg(data.filter(p => p.Year === y).map(p => p.Survival_Years))
  );

  new Chart(document.getElementById("lineChart"), {
    type: "line",
    data: {
      labels: years,
      datasets: [{
        label: "Supervivencia media (años)",
        data: survAvg,
        borderColor: "#f9c74f",
        backgroundColor: "rgba(249,199,79,0.2)",
        tension: 0.3,
        fill: true,
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        x: { title: { display: true, text: "Año" } },
        y: { beginAtZero: true }
      }
    }
  });

  //
  // 4) DISPERSIÓN: Genetic_Risk vs Treatment_Cost_USD (log)
  //
  new Chart(document.getElementById("scatterChart"), {
    type: "scatter",
    data: {
      datasets: [{
        label: "Riesgo Genético vs Costo (log10 USD)",
        data: data.map(p => ({
          x: p.Genetic_Risk,
          y: logScale(p.Treatment_Cost_USD)
        })),
        backgroundColor: "#90be6d"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        x: { title: { display: true, text: "Genetic Risk" } },
        y: { title: { display: true, text: "Costo (log10 USD)" } }
      }
    }
  });

  //
  // 5) RADAR: Air_Pollution vs Obesity_Level por región
  //
  const regionGroups = {};
  data.forEach(p => {
    if (!regionGroups[p.Country_Region]) {
      regionGroups[p.Country_Region] = { air: [], obs: [] };
    }
    regionGroups[p.Country_Region].air.push(p.Air_Pollution);
    regionGroups[p.Country_Region].obs.push(p.Obesity_Level);
  });
  const regions = Object.keys(regionGroups);

  new Chart(document.getElementById("radarChart"), {
    type: "radar",
    data: {
      labels: regions,
      datasets: [
        {
          label: "Aire (media)",
          data: regions.map(r => avg(regionGroups[r].air)),
          borderColor: "#f94144",
          backgroundColor: "rgba(249,65,68,0.3)"
        },
        {
          label: "Obesidad (media)",
          data: regions.map(r => avg(regionGroups[r].obs)),
          borderColor: "#577590",
          backgroundColor: "rgba(87,117,144,0.3)"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      elements: { line: { borderWidth: 2 } }
    }
  });

  //
  // 6) HISTOGRAMA: Distribución de edades (bins de 10 años)
  //
  const ages = data.map(p => p.Age);
  const maxAge = Math.ceil(Math.max(...ages) / 10) * 10;
  const bins = Array.from({ length: maxAge / 10 }, (_, i) => i * 10);
  const ageCounts = bins.map(start =>
    ages.filter(a => a >= start && a < start + 10).length
  );

  new Chart(document.getElementById("histChart"), {
    type: "bar",
    data: {
      labels: bins.map(b => `${b}-${b + 9}`),
      datasets: [{
        label: "Pacientes",
        data: ageCounts,
        backgroundColor: "#43aa8b"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        x: { title: { display: true, text: "Rango de Edad" } },
        y: { beginAtZero: true }
      }
    }
  });

  //
  // 7) BURBUJA: Alcohol_Use vs Smoking vs Target_Severity_Score
  //
  new Chart(document.getElementById("bubbleChart"), {
    type: "bubble",
    data: {
      datasets: [{
        label: "Alcohol vs Fumar vs Sev.Score",
        data: data.map(p => ({
          x: p.Alcohol_Use,
          y: p.Smoking,
          r: p.Target_Severity_Score * 2
        })),
        backgroundColor: "rgba(255,99,132,0.5)"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        x: { title: { display: true, text: "Alcohol Use" } },
        y: { title: { display: true, text: "Smoking" } }
      }
    }
  });

  //
  // 8) BOX PLOT: Supervivencia por etapa de cáncer
  //
  const survivalByStage = data.reduce((obj, p) => {
    (obj[p.Cancer_Stage] = obj[p.Cancer_Stage] || []).push(p.Survival_Years);
    return obj;
  }, {});

  new Chart(document.getElementById("boxChart"), {
    type: "boxplot",
    data: {
      labels: Object.keys(survivalByStage),
      datasets: [{
        label: "Supervivencia (años)",
        data: Object.values(survivalByStage),
        backgroundColor: "#f3722c"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: "bottom" }
      },
      scales: {
        y: { title: { display: true, text: "Años de Supervivencia" } }
      }
    }
  });
}
