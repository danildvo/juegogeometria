// --- helpers para dibujar plano ---
const canvas = document.getElementById('plano');
const ctx = canvas.getContext('2d');
const gridSize = 25; 
const origin = { x: canvas.width / 2, y: canvas.height / 2 };

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#e8e8ee';
  ctx.lineWidth = 1;

  // líneas de la cuadrícula
  for (let x = 0; x <= canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  for (let y = 0; y <= canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // ejes principales
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(origin.x, 0);
  ctx.lineTo(origin.x, canvas.height);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, origin.y);
  ctx.lineTo(canvas.width, origin.y);
  ctx.stroke();

  // números
  ctx.fillStyle = '#333';
  ctx.font = '12px Arial';

  for (let i = -10; i <= 10; i++) {
    const px = origin.x + i * gridSize;
    const py = origin.y + i * gridSize;

    if (i !== 0) {
      ctx.fillText(i, px - 6, origin.y + 14);
      ctx.fillText(-i, origin.x - 18, py + 4);
    }
  }
}

function plotPoint(x, y, color = 'red') {
  const px = origin.x + x * gridSize;
  const py = origin.y - y * gridSize;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(px, py, 5, 0, Math.PI * 2);
  ctx.fill();
}

function plotCircle(h, k, r, color = 'green') {
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(origin.x + h * gridSize, origin.y - k * gridSize, r * gridSize, 0, Math.PI * 2);
  ctx.stroke();
}

function plotLine(a, b, c, color = 'blue') {
  ctx.strokeStyle = color;
  ctx.beginPath();

  let first = true;
  for (let x = -20; x <= 20; x += 0.1) {
    let y = (c - a * x) / b;
    let px = origin.x + x * gridSize;
    let py = origin.y - y * gridSize;

    if (first) {
      ctx.moveTo(px, py);
      first = false;
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.stroke();
}

// --- estado del juego ---
let currentProblem = null;
let stepIndex = 0;

const problemaTexto = document.getElementById('problemaTexto');
const stepsList = document.getElementById('stepsList');
const usuarioNombre = document.getElementById('usuarioNombre');

// generar problema
function generateProblem(modo, dificultad) {
  if (modo === 'construye') {
    let center = { h: 0, k: 0 }, r = 0;

    if (dificultad === 'facil') { center = { h: 0, k: 0 }; r = 4; }
    if (dificultad === 'medio') { center = { h: 2, k: -1 }; r = 3; }
    if (dificultad === 'dificil') { center = { h: -3, k: 2 }; r = 5; }

    return {
      type: 'circulo',
      data: { h: center.h, k: center.k, r },
      text: `Dibuja el círculo de centro (h,k) y radio r. Escribe la ecuación estándar.`,
      steps: [
        { label: 'Centro h', formula: 'h = ...', key: 'h' },
        { label: 'Centro k', formula: 'k = ...', key: 'k' },
        { label: 'Radio r', formula: 'r = ...', key: 'r' },
        { label: 'Ecuación estándar', formula: '(x - h)^2 + (y - k)^2 = r^2', key: 'eq' }
      ]
    };
  }

  if (modo === 'identifica') {
    return {
      type: 'recta',
      data: { a: 2, b: 1, c: 4 },
      text: `Determina la ecuación de la recta en la forma ax + by = c.`,
      steps: [
        { label: 'a', formula: 'a = ...', key: 'a' },
        { label: 'b', formula: 'b = ...', key: 'b' },
        { label: 'c', formula: 'c = ...', key: 'c' },
        { label: 'Ecuación', formula: 'ax + by = c', key: 'eq' }
      ]
    };
  }

  return null;
}

function renderProblem(problem) {
  currentProblem = problem;
  stepIndex = 0;

  stepsList.innerHTML = '';
  problemaTexto.textContent = problem.text;

  drawGrid();

  if (problem.type === 'circulo') {
    plotCircle(problem.data.h, problem.data.k, problem.data.r);
  }

  if (problem.type === 'recta') {
    plotLine(problem.data.a, problem.data.b, problem.data.c);
  }

  // crear pasos
  problem.steps.forEach((s, i) => {
    const div = document.createElement('div');
    div.className = 'step';

    const label = document.createElement('div');
    label.style.minWidth = '120px';
    label.textContent = s.label + ':';

    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'step-input-' + i;
    input.placeholder = s.formula;

    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = 'Verificar';
    btn.onclick = () => verifyStep(i);

    const verdict = document.createElement('div');
    verdict.id = 'verdict-' + i;
    verdict.className = 'verdict';

    div.appendChild(label);
    div.appendChild(input);
    div.appendChild(btn);
    div.appendChild(verdict);

    stepsList.appendChild(div);
  });
}

function verifyStep(i) {
  const val = document.getElementById('step-input-' + i).value.trim();
  const key = currentProblem.steps[i].key;
  const verdict = document.getElementById('verdict-' + i);

  if (key === 'eq') {
    if (currentProblem.type === 'circulo') {
      let h = currentProblem.data.h;
      let k = currentProblem.data.k;
      let r = currentProblem.data.r;

      let expected = `(x-${h})^2+(y-${k})^2=${r * r}`.replace(/\s+/g, '');

      if (val.replace(/\s+/g, '') === expected) {
        verdict.textContent = '✔ Correcto';
        verdict.style.color = 'green';
        enableNextStep(i);
      } else {
        verdict.textContent = '❌ Incorrecto';
        verdict.style.color = 'crimson';
      }
    }

    if (currentProblem.type === 'recta') {
      let { a, b, c } = currentProblem.data;
      let expected = `${a}x+${b}y=${c}`.replace(/\s+/g, '');

      if (val.replace(/\s+/g, '') === expected) {
        verdict.textContent = '✔ Correcto';
        verdict.style.color = 'green';
        enableNextStep(i);
      } else {
        verdict.textContent = '❌ Incorrecto';
        verdict.style.color = 'crimson';
      }
    }

    return;
  }

  // claves simples: h, k, r, a, b, c
  if (String(val) === String(currentProblem.data[key])) {
    verdict.textContent = '✔ Correcto';
    verdict.style.color = 'green';
    enableNextStep(i);
  } else {
    verdict.textContent = '❌ Incorrecto';
    verdict.style.color = 'crimson';
  }
}

function enableNextStep(i) {
  const input = document.getElementById('step-input-' + i);
  input.disabled = true;

  const allDone = currentProblem.steps.every((s, idx) => {
    const v = document.getElementById('verdict-' + idx);
    return v && v.textContent.startsWith('✔');
  });

  if (allDone) {
    document.getElementById('nextProblem').classList.remove('hidden');
  }
}

// botones UI
document.getElementById('startBtn').addEventListener('click', () => {
  const nombre = document.getElementById('inputNombre').value.trim();
  usuarioNombre.textContent = nombre || '(sin nombre)';

  const modo = document.getElementById('modo').value;
  const dif = document.getElementById('dificultad').value;

  if (!modo) {
    alert('Selecciona un modo');
    return;
  }

  renderProblem(generateProblem(modo, dif));
  document.getElementById('nextProblem').classList.add('hidden');
});

document.getElementById('nextProblem').addEventListener('click', () => {
  const modo = document.getElementById('modo').value;
  const dif = document.getElementById('dificultad').value;

  renderProblem(generateProblem(modo, dif));
  document.getElementById('nextProblem').classList.add('hidden');
});

document.getElementById('resetBtn').addEventListener('click', () => {
  location.reload();
});

// iniciar plano vacío
drawGrid();
