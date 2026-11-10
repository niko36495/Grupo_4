require("dotenv").config();

const express = require("express");
const path = require("path");
const { connect } = require("@couchbase/sdk");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let cluster;
let collection;

function getStudentKey(id) {
  return `student::${id}`;
}

function validateStudent(data) {
  const required = ["id", "nombre", "programa", "semestre"];
  for (const field of required) {
    if (data[field] === undefined || String(data[field]).trim() === "") {
      return `El campo "${field}" es obligatorio.`;
    }
  }

  const semester = Number(data.semestre);
  if (!Number.isInteger(semester) || semester < 1 || semester > 20) {
    return "El semestre debe ser un número entero entre 1 y 20.";
  }

  return null;
}

function normalizeStudent(data) {
  return {
    id: String(data.id).trim(),
    nombre: String(data.nombre).trim(),
    programa: String(data.programa).trim(),
    semestre: Number(data.semestre),
    correo: String(data.correo || "").trim(),
    activo: data.activo === undefined ? true : Boolean(data.activo),
    updatedAt: new Date().toISOString()
  };
}

// Listar y filtrar estudiantes
app.get("/api/students", async (req, res) => {
  try {
    const programa = String(req.query.programa || "").trim();
    const search = String(req.query.search || "").trim().toLowerCase();

    // La demo consulta documentos de la colección y filtra en el servidor.
    // Para grandes volúmenes, crear índices y usar SQL++ con parámetros.
    const result = await collection.getAll();
    let students = result.map(item => item.content);

    if (programa) {
      students = students.filter(s => s.programa.toLowerCase() === programa.toLowerCase());
    }
    if (search) {
      students = students.filter(s =>
        s.id.toLowerCase().includes(search) ||
        s.nombre.toLowerCase().includes(search)
      );
    }

    students.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    res.json(students);
  } catch (error) {
    console.error("GET /api/students:", error);
    res.status(500).json({ error: "No se pudieron consultar estudiantes. Verifica la conexión con Capella." });
  }
});

// Buscar estudiante por ID
app.get("/api/students/:id", async (req, res) => {
  try {
    const result = await collection.get(getStudentKey(req.params.id));
    res.json(result.content);
  } catch (error) {
    if (error.name === "DocumentNotFoundError") {
      return res.status(404).json({ error: "Estudiante no encontrado." });
    }
    console.error("GET /api/students/:id:", error);
    res.status(500).json({ error: "No se pudo consultar el estudiante." });
  }
});

// Registrar estudiante
app.post("/api/students", async (req, res) => {
  const error = validateStudent(req.body);
  if (error) return res.status(400).json({ error });

  const student = normalizeStudent(req.body);
  student.createdAt = new Date().toISOString();

  try {
    await collection.insert(getStudentKey(student.id), student);
    res.status(201).json(student);
  } catch (error) {
    if (error.name === "DocumentExistsError") {
      return res.status(409).json({ error: "Ya existe un estudiante con ese ID." });
    }
    console.error("POST /api/students:", error);
    res.status(500).json({ error: "No se pudo registrar el estudiante." });
  }
});

// Editar estudiante
app.put("/api/students/:id", async (req, res) => {
  const studentId = String(req.params.id);
  const data = { ...req.body, id: studentId };
  const error = validateStudent(data);
  if (error) return res.status(400).json({ error });

  const student = normalizeStudent(data);
  try {
    const existing = await collection.get(getStudentKey(studentId));
    student.createdAt = existing.content.createdAt || new Date().toISOString();
    await collection.replace(getStudentKey(studentId), student);
    res.json(student);
  } catch (error) {
    if (error.name === "DocumentNotFoundError") {
      return res.status(404).json({ error: "Estudiante no encontrado." });
    }
    console.error("PUT /api/students/:id:", error);
    res.status(500).json({ error: "No se pudo actualizar el estudiante." });
  }
});

// Eliminar estudiante
app.delete("/api/students/:id", async (req, res) => {
  try {
    await collection.remove(getStudentKey(req.params.id));
    res.json({ message: "Estudiante eliminado correctamente." });
  } catch (error) {
    if (error.name === "DocumentNotFoundError") {
      return res.status(404).json({ error: "Estudiante no encontrado." });
    }
    console.error("DELETE /api/students/:id:", error);
    res.status(500).json({ error: "No se pudo eliminar el estudiante." });
  }
});

async function start() {
  try {
    const required = [
      "COUCHBASE_CONNECTION_STRING",
      "COUCHBASE_USERNAME",
      "COUCHBASE_PASSWORD",
      "COUCHBASE_BUCKET"
    ];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length) {
      console.error(`Faltan variables en .env: ${missing.join(", ")}`);
      console.error("Copia .env.example a .env y completa los datos de Capella.");
      process.exit(1);
    }

    cluster = await connect(process.env.COUCHBASE_CONNECTION_STRING, {
      username: process.env.COUCHBASE_USERNAME,
      password: process.env.COUCHBASE_PASSWORD
    });

    const bucket = cluster.bucket(process.env.COUCHBASE_BUCKET);
    const scope = bucket.scope(process.env.COUCHBASE_SCOPE || "_default");
    collection = scope.collection(process.env.COUCHBASE_COLLECTION || "students");

    app.listen(PORT, () => {
      console.log(`Student Manager disponible en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("No se pudo iniciar o conectar con Couchbase:", error.message);
    console.error("Revisa endpoint, credenciales, red permitida y bucket/collection.");
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  try {
    if (cluster) await cluster.close();
  } finally {
    process.exit(0);
  }
});

start();
