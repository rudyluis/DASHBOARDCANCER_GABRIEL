// js/charts.js

// js/charts.js

// Helpers
function logScale(v) {
  return v > 0 ? Math.log10(v) : 0;
}
function avg(arr) {
  return arr.length ? arr.reduce((s,v)=>s+v,0)/arr.length : 0;
}

function renderCharts(data) {
  ["barChart","doughnutChart","lineChart","scatterChart","radarChart","histChart","bubbleChart","boxChart"]
    .forEach(id => Chart.getChart(id)?.destroy());

  // 1) BARRAS: conteo por Cancer_Type
  const countByType = data.reduce((o,p) => {
    o[p.Cancer_Type] = (o[p.Cancer_Type]||0) + 1;
    return o;
  }, {});
  new Chart(
    document.getElementById("barChart"),
    {
      type: "bar",
      data: {
        labels: Object.keys(countByType),
        datasets: [{
          label: "Pacientes por Tipo",
          data: Object.values(countByType),
          backgroundColor: Object.keys(countByType)
            .map((_,i) => `hsl(${i*40 % 360},70%,60%)`),
          borderColor: "#fff",
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed.y}` } }
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: "Pacientes" } },
          x: { title: { display: true, text: "Tipo de Cáncer" } }
        },
        animation: { duration: 800 }
      }
    }
  );

  // 2) DOUGHNUT: proporción por Cancer_Stage
  const countByStage = data.reduce((o,p) => {
    o[p.Cancer_Stage] = (o[p.Cancer_Stage]||0) + 1;
    return o;
  }, {});
  new Chart(
    document.getElementById("doughnutChart"),
    {
      type: "doughnut",
      data: {
        labels: Object.keys(countByStage),
        datasets: [{
          data: Object.values(countByStage),
          backgroundColor: Object.keys(countByStage)
            .map((_,i) => `hsl(${i*60 % 360},50%,50%)`)
        }]
      },
      options: {
        responsive: true,
        cutout: "60%",
        plugins: {
          legend: { position: "right" },
          tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.raw}` } }
        }
      }
    }
  );

  // 3) LINE: supervivencia media por Year
  const years = [...new Set(data.map(p=>p.Year))].sort();
  const survAvg = years.map(y =>
    avg(data.filter(p=>p.Year===y).map(p=>p.Survival_Years))
  );
  new Chart(
    document.getElementById("lineChart"),
    {
      type: "line",
      data: {
        labels: years,
        datasets: [{
          label: "Supervivencia media (años)",
          data: survAvg,
          borderColor: "#f9c74f",
          backgroundColor: "rgba(249,199,79,0.2)",
          tension: 0.3,
          pointRadius: 4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true },
          x: { title: { display: true, text: "Año" } }
        }
      }
    }
  );

  // 4) SCATTER: Genetic_Risk vs Treatment_Cost_USD (log)
  new Chart(
    document.getElementById("scatterChart"),
    {
      type: "scatter",
      data: {
        datasets: [{
          label: "Riesgo Genético vs Costo (log)",
          data: data.map(p=>({
            x: p.Genetic_Risk,
            y: logScale(p.Treatment_Cost_USD)
          })),
          backgroundColor: "#90be6d"
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: { title: { display: true, text: "Genetic Risk" } },
          y: { title: { display: true, text: "Costo (log10 USD)" } }
        }
      }
    }
  );

  // 5) RADAR: promedio Air_Pollution y Obesity_Level por región
  const regGroups = {};
  data.forEach(p => {
    if (!regGroups[p.Country_Region]) regGroups[p.Country_Region] = { air: [], obs: [] };
    regGroups[p.Country_Region].air.push(p.Air_Pollution);
    regGroups[p.Country_Region].obs.push(p.Obesity_Level);
  });
  const regs = Object.keys(regGroups);
  new Chart(
    document.getElementById("radarChart"),
    {
      type: "radar",
      data: {
        labels: regs,
        datasets: [
          {
            label: "Air Pollution (media)",
            data: regs.map(r=>avg(regGroups[r].air)),
            borderColor: "#f94144",
            backgroundColor: "rgba(249,65,68,0.3)"
          },
          {
            label: "Obesidad (media)",
            data: regs.map(r=>avg(regGroups[r].obs)),
            borderColor: "#577590",
            backgroundColor: "rgba(87,117,144,0.3)"
          }
        ]
      },
      options: { responsive: true, elements: { line: { borderWidth: 2 } } }
    }
  );

  // 6) HISTOGRAMA: distribución de Age
  // creamos bins de 10 años
  const ages = data.map(p=>p.Age);
  const maxAge = Math.ceil(Math.max(...ages)/10)*10;
  const bins = Array.from({length: maxAge/10}, (_,i)=>i*10);
  const histCounts = bins.map(start =>
    ages.filter(a=>a>=start && a<start+10).length
  );
  new Chart(
    document.getElementById("histChart"),
    {
      type: "bar",
      data: {
        labels: bins.map(b=>`${b}-${b+9}`),
        datasets: [{
          label: "Pacientes por rango de edad",
          data: histCounts,
          backgroundColor: "#43aa8b"
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: { title: { display: true, text: "Edad" } },
          y: { beginAtZero: true }
        }
      }
    }
  );

  // 7) BURBUJA: Alcohol_Use vs Smoking vs Target_Severity_Score
  new Chart(
    document.getElementById("bubbleChart"),
    {
      type: "bubble",
      data: {
        datasets: [{
          label: "Alcohol vs Fumar vs Sev.Score",
          data: data.map(p=>({
            x: p.Alcohol_Use,
            y: p.Smoking,
            r: p.Target_Severity_Score * 2  // escala de radio
          })),
          backgroundColor: "rgba(255,99,132,0.5)"
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: { title: { display: true, text: "Alcohol Use" } },
          y: { title: { display: true, text: "Smoking" } }
        }
      }
    }
  );

  // 8) BOXPLOT: Supervivencia por etapa (requiere plugin)
  // Asume que ya cargaste chartjs-chart-box-and-violin-plot.js en index.html
  const survivalByStage = data.reduce((o,p) => {
    if (!o[p.Cancer_Stage]) o[p.Cancer_Stage] = [];
    o[p.Cancer_Stage].push(p.Survival_Years);
    return o;
  }, {});
  new Chart(
    document.getElementById("boxChart"),
    {
      type: "boxplot",
      data: {
        labels: Object.keys(survivalByStage),
        datasets: [{
          label: "Supervivencia (años) por Etapa",
          data: Object.values(survivalByStage),
          backgroundColor: "#f3722c"
        }]
      },
      options: { responsive: true }
    }
  );
}

