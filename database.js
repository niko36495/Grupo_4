
const couchbase = require('couchbase');

async function conectarBaseDatos() {
    let cluster;

    try {
        cluster = await couchbase.connect(
            process.env.CB_CONN_STR,
            {
                username: process.env.CB_USERNAME,
                password: process.env.CB_PASSWORD,
                configProfile: 'wanDevelopment'
            }
        );

        console.log('Conexión exitosa con Couchbase Capella');

        const bucket = cluster.bucket('student_manager');

        const collection = bucket
            .scope('_default')
            .collection('students');

        // Crear un estudiante de prueba
        const estudiante = {
            nombre: 'Nicolas',
            apellido: 'Garcia',
            edad: 22,
            carrera: 'Ingenieria Multimedia',
            semestre: 6,
            estado: 'Activo'
        };

        // Guardar estudiante
        await collection.upsert('student::001', estudiante);

        console.log('Estudiante registrado correctamente');

        // Consultar estudiante
        const resultado = await collection.get('student::001');

        console.log('Datos del estudiante:');
        console.log(resultado.content);

    } catch (error) {
        console.error('Error:', error);

    } finally {
        if (cluster) {
            await cluster.close();
        }
    }
}

conectarBaseDatos();
