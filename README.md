# Student Manager – Sistema de Gestión de Estudiantes

## Descripción del proyecto

Student Manager es una aplicación web para la gestión de estudiantes, conectada a una base de datos NoSQL mediante Couchbase Capella.

El sistema permite administrar los registros de estudiantes desde una interfaz web, facilitando las operaciones de creación, consulta, edición y eliminación de información.

## Funcionalidades

- **Registrar estudiantes:** permite agregar nuevos estudiantes.
- **Consultar estudiantes:** muestra los registros almacenados en la base de datos.
- **Buscar estudiantes:** permite localizar registros mediante el buscador.
- **Filtrar estudiantes:** permite organizar la información por programa académico.
- **Editar estudiantes:** permite actualizar la información de un registro.
- **Eliminar estudiantes:** permite eliminar registros de la base de datos.

## Tecnologías utilizadas

- HTML5
- CSS3
- JavaScript
- Node.js
- Express.js
- Couchbase Capella
- Couchbase Node.js SDK

## Estructura del proyecto

```text
Couchbase_Student_Manager/
│
├── package.json
├── package-lock.json
├── database.js
│
└── Couchbase_Student_Manager/
    ├── .env
    ├── server.js
    ├── public/
    │   ├── index.html
    │   ├── css/
    │   │   └── styles.css
    │   └── js/
    │       └── app.js
    │
    └── server_backup.js
```

## Requisitos previos

Antes de ejecutar el proyecto es necesario contar con:

- Node.js instalado.
- npm instalado.
- Una cuenta en Couchbase Capella.
- Un clúster activo en Couchbase Capella.
- Un usuario de base de datos con los permisos necesarios.

## Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone URL_DEL_REPOSITORIO
```

Ingresar a la carpeta principal:

```bash
cd Couchbase_Student_Manager
```

### 2. Instalar las dependencias

Desde la carpeta principal del proyecto, ejecutar:

```bash
npm install
```

### 3. Configurar las variables de entorno

Dentro de la carpeta `Couchbase_Student_Manager`, crear un archivo llamado `.env` con la siguiente estructura:

```env
PORT=3000

COUCHBASE_CONNECTION_STRING=couchbases://cb.TU_ENDPOINT.cloud.couchbase.com
COUCHBASE_USERNAME=TU_USUARIO
COUCHBASE_PASSWORD=TU_CONTRASEÑA

COUCHBASE_BUCKET=student_manager
COUCHBASE_SCOPE=_default
COUCHBASE_COLLECTION=students
```

Reemplazar los valores de ejemplo por los datos correspondientes al clúster de Couchbase Capella.

**Importante:** las credenciales son personales y no deben publicarse en GitHub.

### 4. Configurar el acceso de red en Couchbase Capella

Couchbase Capella utiliza una lista de direcciones IP permitidas para controlar las conexiones externas.

Para consultar la IP pública actual desde PowerShell, ejecutar:

```powershell
(Invoke-RestMethod -Uri "https://api.ipify.org")
```

Si la dirección obtenida es diferente de la registrada en Couchbase Capella, es necesario actualizarla.

Para hacerlo:

1. Ingresar a Couchbase Capella.
2. Abrir el clúster correspondiente.
3. Entrar en Settings.
4. Buscar Allowed IP Addresses.
5. Agregar la nueva dirección IP con el formato `/32`.

Por ejemplo:

```text
191.107.130.54/32
```

La dirección anterior es solamente un ejemplo. Se debe utilizar la IP obtenida mediante el comando.

**Nota:** si la IP pública cambia, será necesario actualizar la lista de direcciones permitidas nuevamente.

### 5. Iniciar el servidor

Desde la carpeta principal del proyecto, ejecutar:

```powershell
node .\Couchbase_Student_Manager\server.js
```

Si la conexión se establece correctamente, aparecerá un mensaje similar a:

```text
Student Manager disponible en http://localhost:3000
```

### 6. Abrir la aplicación

Abrir el siguiente enlace en el navegador:

http://localhost:3000

La aplicación estará disponible mientras el servidor Node.js permanezca ejecutándose.

## Base de datos

El proyecto utiliza Couchbase Capella como sistema de almacenamiento NoSQL.

Configuración utilizada:

| Elemento | Valor |
|---|---|
| Bucket | student_manager |
| Scope | _default |
| Collection | students |
| Índice | #primary |

Para permitir las consultas SQL++ sobre la colección, se utiliza el siguiente índice primario:

```sql
CREATE PRIMARY INDEX ON `student_manager`.`_default`.`students`;

## Seguridad

Para mantener protegida la información del proyecto:

- No publicar el archivo `.env`.
- No subir contraseñas ni credenciales a GitHub.
- No subir la carpeta `node_modules`.
- Utilizar un archivo `.env.example` con valores de ejemplo para documentar las variables necesarias.
