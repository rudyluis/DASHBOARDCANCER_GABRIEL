// js/charts.js

// Registrar plugin boxplot (aunque esté eliminado)
Chart.register(Chart.BoxPlotController, Chart.BoxAndWhiskers);

function logScale(v) { return v > 0 ? Math.log10(v) : 0; }
function avg(arr) { return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0; }

function renderCharts(data) {
  // 1) Destruye los charts previos
  ["barChart","doughnutChart","lineChart","scatterChart","radarChart","histChart","bubbleChart"]
    .forEach(id => Chart.getChart(id)?.destroy());

  //
  // 2) BARRAS: Tipo de Cáncer con colores eléctricos
  //
  const byType = data.reduce((o,p)=>{
    o[p.Cancer_Type]=(o[p.Cancer_Type]||0)+1; return o;
  },{});
  const types = Object.keys(byType);
  const barColors = [
    '#FF00FF','#00FFFF','#FFFF00','#FF4500',
    '#00FF00','#1E90FF','#FFD700','#FF1493',
    '#00CED1','#7CFC00'
  ];
  new Chart(document.getElementById("barChart"), {
    type: "bar",
    data: {
      labels: types,
      datasets: [{
        label: "Pacientes",
        data: types.map(t => byType[t]),
        // un color distinto por barra
        backgroundColor: types.map((_,i)=>barColors[i % barColors.length]),
        borderColor: '#FFFFFF',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: { color: '#FFFFFF', font: { weight: 'bold' } },
          grid: { display: false }
        },
        y: {
          ticks: { color: '#FFFFFF', font: { weight: 'bold' } },
          grid: { color: 'rgba(255,255,255,0.2)' }
        }
      },
      plugins: {
        legend: { labels: { color: '#FFFFFF', font: { size: 14 } } },
        tooltip: {
          titleColor: '#000',
          bodyColor: '#000',
          backgroundColor: '#FFFFFF'
        }
      }
    }
  });

  //
  // 3) DONUT: Etapa Cáncer con neones intensos
  //
  const byStage = data.reduce((o,p)=>{
    o[p.Cancer_Stage]=(o[p.Cancer_Stage]||0)+1; return o;
  },{});
  const stages = Object.keys(byStage);
  const neonColors = ['#FF1493','#00FF7F','#7B68EE','#00BFFF','#FF8C00','#ADFF2F'];
  new Chart(document.getElementById("doughnutChart"), {
    type: "doughnut",
    data: {
      labels: stages,
      datasets: [{
        data: stages.map(s=>byStage[s]),
        backgroundColor: stages.map((_,i)=>neonColors[i % neonColors.length]),
        hoverOffset: 12
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'right',
          labels: { color: '#FFFFFF', boxWidth: 16, padding: 12 }
        },
        tooltip: { 
          titleColor: '#000', 
          bodyColor: '#000', 
          backgroundColor: '#FFFFFF' 
        }
      }
    }
  });

  //
  // 4) LÍNEA: Supervivencia media con neón azul
  //
  const years = [...new Set(data.map(p=>p.Year))].sort();
  const survAvg = years.map(y => avg(data.filter(p=>p.Year===y).map(p=>p.Survival_Years)));
  new Chart(document.getElementById("lineChart"), {
    type: "line",
    data: {
      labels: years,
      datasets: [{
        label: "Supervivencia media",
        data: survAvg,
        borderColor: '#00FFFF',
        backgroundColor: 'rgba(0,255,255,0.4)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#FFFFFF',
        pointBorderColor: '#00FFFF',
        pointRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { ticks:{ color:'#FFFFFF' }, grid:{ color:'rgba(255,255,255,0.2)' } },
        y: { ticks:{ color:'#FFFFFF' }, grid:{ color:'rgba(255,255,255,0.2)' } }
      },
      plugins: {
        legend:{ labels:{ color:'#FFFFFF', font:{ size:14 } } }
      }
    }
  });

  //
  // 5) DISPERSIÓN: Riesgo vs Costo con neón verde/amarillo
  //
  new Chart(document.getElementById("scatterChart"), {
    type: "scatter",
    data: {
      datasets: [{
        label: "Risk vs Costo",
        data: data.map(p=>({x:p.Genetic_Risk,y:logScale(p.Treatment_Cost_USD)})),
        pointBackgroundColor: '#ADFF2F',
        pointBorderColor: '#00FF00',
        pointRadius: 8,
        pointHoverRadius: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { title:{ display:true,text:'Genetic Risk', color:'#FFFFFF' }, ticks:{ color:'#FFFFFF' }, grid:{ color:'rgba(255,255,255,0.2)' } },
        y: { title:{ display:true,text:'Costo (log10)', color:'#FFFFFF' }, ticks:{ color:'#FFFFFF' }, grid:{ color:'rgba(255,255,255,0.2)' } }
      },
      plugins: {
        legend:{ labels:{ color:'#FFFFFF' } }
      }
    }
  });

  //
  // 6) RADAR: Aire vs Obesidad con púrpura y magenta
  //
  const groups = {};
  data.forEach(p=>{ 
    (groups[p.Country_Region]=groups[p.Country_Region]||{air:[],obs:[]}).air.push(p.Air_Pollution);
    groups[p.Country_Region].obs.push(p.Obesity_Level);
  });
  const regs = Object.keys(groups);
  new Chart(document.getElementById("radarChart"), {
    type: "radar",
    data: {
      labels: regs,
      datasets: [{
        label: "Aire (media)",
        data: regs.map(r=>avg(groups[r].air)),
        borderColor: '#DA70D6',
        backgroundColor: 'rgba(218,112,214,0.4)'
      },{
        label: "Obesidad (media)",
        data: regs.map(r=>avg(groups[r].obs)),
        borderColor: '#FF00FF',
        backgroundColor: 'rgba(255,0,255,0.4)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: { 
          angleLines: { color:'rgba(255,255,255,0.2)' },
          grid: { color:'rgba(255,255,255,0.2)' },
          pointLabels: { color:'#FFFFFF' },
          ticks: { color:'#FFFFFF' }
        }
      },
      plugins: {
        legend:{ labels:{ color:'#FFFFFF' } }
      }
    }
  });

  //
  // 7) HISTOGRAMA: Edades con barras arcoíris
  //
  const agesArr = data.map(p=>p.Age);
  const maxAge = Math.ceil(Math.max(...agesArr)/10)*10;
  const bins = Array.from({length:maxAge/10},(_,i)=>i*10);
  const ageCounts = bins.map(s=>agesArr.filter(a=>a>=s&&a<s+10).length);
  const rainbow = ['#FF0000','#FF7F00','#FFFF00','#00FF00','#0000FF','#4B0082','#8F00FF','#FF1493'];
  new Chart(document.getElementById("histChart"), {
    type: "bar",
    data: {
      labels: bins.map(b=>`${b}-${b+9}`),
      datasets: [{
        label: "Pacientes",
        data: ageCounts,
        backgroundColor: bins.map((_,i)=>rainbow[i % rainbow.length]),
        borderColor: '#FFFFFF',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { ticks:{ color:'#FFFFFF' }, grid:{ display:false } },
        y: { ticks:{ color:'#FFFFFF' }, grid:{ color:'rgba(255,255,255,0.2)' } }
      },
      plugins: {
        legend:{ labels:{ color:'#FFFFFF' } }
      }
    }
  });

  //
  // 8) BURBUJA: Alcohol vs Fumar con neón rojo/rosa
  //
  new Chart(document.getElementById("bubbleChart"), {
    type: "bubble",
    data: {
      datasets: [{
        label: "Alcohol vs Fumar",
        data: data.map(p=>({x:p.Alcohol_Use,y:p.Smoking,r:p.Target_Severity_Score*2})),
        backgroundColor: 'rgba(255,20,147,0.6)',
        borderColor: '#FF1493'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { title:{ display:true,text:'Alcohol Use', color:'#FFFFFF' }, ticks:{ color:'#FFFFFF' }, grid:{ color:'rgba(255,255,255,0.2)' } },
        y: { title:{ display:true,text:'Smoking', color:'#FFFFFF' }, ticks:{ color:'#FFFFFF' }, grid:{ color:'rgba(255,255,255,0.2)' } }
      },
      plugins: {
        legend:{ labels:{ color:'#FFFFFF' } }
      }
    }
  });

}
