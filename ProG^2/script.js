const playground = document.getElementById('playground');

function makeDraggable(el) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

  el.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    el.style.top = (el.offsetTop - pos2) + "px";
    el.style.left = (el.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

function createElement(type, x, y) {
  const el = document.createElement('div');
  el.className = 'element';
  el.style.left = x + 'px';
  el.style.top = y + 'px';

  const symbols = {
    source: '🚰',
    pipe: '🟦',
    and: '🔗',
    not: '⭯',
    sink: '🪣'
  };

  el.textContent = symbols[type] || '❓';
  makeDraggable(el);
  playground.appendChild(el);
}

// === KEINE automatischen Test-Elemente mehr ===
window.onload = () => {
  // Hier bleibt es leer → sauberes Spielfeld
  console.log("Wasser-Logik bereit. Spielfeld ist leer.");
};
