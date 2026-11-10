const form = document.getElementById("studentForm");
const studentsBody = document.getElementById("studentsBody");
const messageBox = document.getElementById("message");
const searchInput = document.getElementById("search");
const programFilter = document.getElementById("programFilter");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEdit");
let editingId = null;
let allStudents = [];

function showMessage(text, type = "success") {
  messageBox.textContent = text;
  messageBox.className = `message ${type}`;
  if (!text) messageBox.className = "message";
}
function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}
async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Ocurrió un error en la solicitud.");
  return data;
}
function renderStudents(students) {
  if (!students.length) {
    studentsBody.innerHTML = '<tr><td colspan="6" class="empty">No hay estudiantes que coincidan.</td></tr>';
  } else {
    studentsBody.innerHTML = students.map(s => `
      <tr>
        <td>${escapeHtml(s.id)}</td>
        <td><div class="student-name">${escapeHtml(s.nombre)}</div><div class="student-email">${escapeHtml(s.correo || "Sin correo")}</div></td>
        <td>${escapeHtml(s.programa)}</td>
        <td>${escapeHtml(s.semestre)}</td>
        <td><span class="badge ${s.activo ? "" : "inactive"}">${s.activo ? "Activo" : "Inactivo"}</span></td>
        <td><button class="action-btn" data-action="edit" data-id="${escapeHtml(s.id)}">Editar</button><button class="action-btn delete" data-action="delete" data-id="${escapeHtml(s.id)}">Eliminar</button></td>
      </tr>`).join("");
  }
  document.getElementById("resultCount").textContent = `${students.length} resultado${students.length === 1 ? "" : "s"}`;
}
function updateProgramOptions(students) {
  const current = programFilter.value;
  const programs = [...new Set(students.map(s => s.programa).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"es"));
  programFilter.innerHTML = '<option value="">Todos los programas</option>' + programs.map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join("");
  if (programs.includes(current)) programFilter.value = current;
}
async function loadStudents() {
  try {
    const params = new URLSearchParams();
    if (searchInput.value.trim()) params.set("search", searchInput.value.trim());
    if (programFilter.value) params.set("programa", programFilter.value);
    const students = await api(`/api/students?${params}`);
    allStudents = students;
    renderStudents(students);
    // Las tarjetas resumen se calculan sobre el resultado visible.
    document.getElementById("totalCount").textContent = students.length;
    document.getElementById("programCount").textContent = new Set(students.map(s => s.programa)).size;
    updateProgramOptions(students);
    showMessage("");
  } catch (error) {
    renderStudents([]);
    showMessage(error.message, "error");
  }
}
function resetForm() {
  form.reset();
  document.getElementById("activo").checked = true;
  document.getElementById("id").disabled = false;
  editingId = null;
  document.getElementById("formTitle").textContent = "Registrar estudiante";
  submitBtn.textContent = "＋ Registrar estudiante";
  cancelEditBtn.hidden = true;
}
form.addEventListener("submit", async event => {
  event.preventDefault();
  const student = {
    id: document.getElementById("id").value.trim(),
    nombre: document.getElementById("nombre").value.trim(),
    programa: document.getElementById("programa").value.trim(),
    semestre: Number(document.getElementById("semestre").value),
    correo: document.getElementById("correo").value.trim(),
    activo: document.getElementById("activo").checked
  };
  try {
    if (editingId) {
      await api(`/api/students/${encodeURIComponent(editingId)}`, { method: "PUT", body: JSON.stringify(student) });
      showMessage("Estudiante actualizado correctamente.");
    } else {
      await api("/api/students", { method: "POST", body: JSON.stringify(student) });
      showMessage("Estudiante registrado correctamente.");
    }
    resetForm();
    await loadStudents();
  } catch (error) {
    showMessage(error.message, "error");
  }
});
cancelEditBtn.addEventListener("click", resetForm);
document.getElementById("refreshBtn").addEventListener("click", loadStudents);
searchInput.addEventListener("input", () => {
  clearTimeout(window.searchTimer);
  window.searchTimer = setTimeout(loadStudents, 250);
});
programFilter.addEventListener("change", loadStudents);
studentsBody.addEventListener("click", async event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = button.dataset.id;
  if (button.dataset.action === "edit") {
    try {
      const s = await api(`/api/students/${encodeURIComponent(id)}`);
      editingId = s.id;
      document.getElementById("id").value = s.id;
      document.getElementById("id").disabled = true;
      document.getElementById("nombre").value = s.nombre || "";
      document.getElementById("programa").value = s.programa || "";
      document.getElementById("semestre").value = s.semestre || "";
      document.getElementById("correo").value = s.correo || "";
      document.getElementById("activo").checked = Boolean(s.activo);
      document.getElementById("formTitle").textContent = "Editar estudiante";
      submitBtn.textContent = "Guardar cambios";
      cancelEditBtn.hidden = false;
      form.scrollIntoView({ behavior: "smooth", block: "start" });
      showMessage(`Editando a ${s.nombre}.`);
    } catch (error) { showMessage(error.message, "error"); }
  }
  if (button.dataset.action === "delete") {
    const student = allStudents.find(s => s.id === id);
    if (!confirm(`¿Seguro que deseas eliminar a ${student?.nombre || id}? Esta acción no se puede deshacer.`)) return;
    try {
      await api(`/api/students/${encodeURIComponent(id)}`, { method: "DELETE" });
      showMessage("Estudiante eliminado correctamente.");
      await loadStudents();
    } catch (error) { showMessage(error.message, "error"); }
  }
});
loadStudents();
