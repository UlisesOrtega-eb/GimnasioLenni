document.addEventListener('DOMContentLoaded', function () {
    // Elementos DOM
    const cuerpoTabla = document.getElementById('cuerpo-tabla');
    const busquedaInput = document.getElementById('busqueda');
    const filtroSexo = document.getElementById('filtro-sexo');
    const btnLimpiar = document.getElementById('btn-limpiar');
    const btnRefresh = document.getElementById('btn-refresh');
    const contadorMiembros = document.getElementById('contador-miembros');
    const totalMiembrosSpan = document.getElementById('total-miembros');
    const proximosVencerSpan = document.getElementById('proximos-vencer');
    const ratioGeneroSpan = document.getElementById('ratio-genero');

    // Variables globales
    let miembros = [];
    let miembrosFiltrados = [];

    // Inicializar
    cargarMiembros();

    // Event Listeners
    busquedaInput.addEventListener('input', filtrarMiembros);
    filtroSexo.addEventListener('change', filtrarMiembros);
    btnLimpiar.addEventListener('click', limpiarFiltros);
    btnRefresh.addEventListener('click', cargarMiembros);

    // Función para cargar miembros desde el servidor
    function cargarMiembros() {
        cuerpoTabla.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <p class="mt-2">Cargando miembros...</p>
                </td>
            </tr>
        `;

        fetch('MIEMBROS.php')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al cargar los miembros');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    miembros = data.miembros;
                    miembrosFiltrados = [...miembros];
                    actualizarTabla();
                    actualizarEstadisticas();
                } else {
                    throw new Error(data.message || 'Error en los datos recibidos');
                }
            })
            .catch(error => {
                cuerpoTabla.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center text-danger">
                            <i class="bi bi-exclamation-triangle-fill"></i>
                            <p>Error al cargar los miembros: ${error.message}</p>
                            <button class="btn btn-primary btn-sm" onclick="cargarMiembros()">
                                <i class="bi bi-arrow-clockwise"></i> Reintentar
                            </button>
                        </td>
                    </tr>
                `;
                console.error('Error:', error);
            });
    }

    // Función para filtrar miembros
    function filtrarMiembros() {
        const textoBusqueda = busquedaInput.value.toLowerCase();
        const sexoFiltro = filtroSexo.value;

        miembrosFiltrados = miembros.filter(miembro => {
            const coincideTexto = textoBusqueda === '' ||
                miembro.nombre.toLowerCase().includes(textoBusqueda) ||
                miembro.apellido_paterno.toLowerCase().includes(textoBusqueda) ||
                miembro.apellido_materno.toLowerCase().includes(textoBusqueda);

            const coincideSexo = sexoFiltro === '' || miembro.sexo === sexoFiltro;

            return coincideTexto && coincideSexo;
        });

        actualizarTabla();
    }

    // Función para limpiar filtros
    function limpiarFiltros() {
        busquedaInput.value = '';
        filtroSexo.value = '';
        filtrarMiembros();
    }

    // Función para actualizar la tabla
    function actualizarTabla() {
        if (miembrosFiltrados.length === 0) {
            cuerpoTabla.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-muted">
                        <i class="bi bi-search"></i>
                        <p>No se encontraron miembros que coincidan con los filtros.</p>
                    </td>
                </tr>
            `;
            contadorMiembros.textContent = '0 miembros';
            return;
        }

        contadorMiembros.textContent = `${miembrosFiltrados.length} miembro(s)`;

        cuerpoTabla.innerHTML = miembrosFiltrados.map(miembro => {
            const fechaRegistro = new Date(miembro.fecha_registro);
            const fechaVencimiento = new Date(fechaRegistro);
            fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 1); // 1 mes de membresía

            const hoy = new Date();
            const diffTime = fechaVencimiento - hoy;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let diasClase = 'dias-muchos';
            let filaClase = '';

            if (diffDays < 0) {
                diasClase = 'dias-pocos';
                filaClase = 'membresia-proxima-vencer';
            } else if (diffDays <= 7) {
                diasClase = 'dias-pocos';
                filaClase = 'membresia-proxima-vencer';
            } else if (diffDays <= 15) {
                diasClase = 'dias-medios';
            }

            return `
                <tr class="${filaClase}" data-id="${miembro.id}">
                    <td>${miembro.nombre}</td>
                    <td>${miembro.apellido_paterno}</td>
                    <td>${miembro.apellido_materno || '-'}</td>
                    <td>${miembro.edad}</td>
                    <td>
                        <span class="badge ${miembro.sexo === 'M' ? 'bg-info' : 'bg-danger'}">
                            ${miembro.sexo === 'M' ? 'Masculino' : 'Femenino'}
                        </span>
                    </td>
                    <td>${formatearFecha(fechaRegistro)}</td>
                    <td>
                        <span class="dias-restantes ${diasClase}">
                            ${diffDays < 0 ? 'Vencida' : `${diffDays} días`}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-success btn-renovar" title="Renovar membresía" data-id="${miembro.id}">
                            <i class="bi bi-arrow-repeat"></i>
                        </button>
                       
                        <button class="btn btn-sm btn-outline-danger btn-eliminar" title="Eliminar" data-id="${miembro.id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        // Agregar event listeners a los botones
        agregarEventListenersBotones();
    }

    // Función para agregar event listeners a los botones
    function agregarEventListenersBotones() {
        // Botones de renovar
        document.querySelectorAll('.btn-renovar').forEach(btn => {
            btn.addEventListener('click', function () {
                const id = this.getAttribute('data-id');
                renovarMembresia(id);
            });
        });

        // Botones de editar
        document.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', function () {
                const id = this.getAttribute('data-id');
                editarMiembro(id);
            });
        });

        // Botones de eliminar
        document.querySelectorAll('.btn-eliminar').forEach(btn => {
            btn.addEventListener('click', function () {
                const id = this.getAttribute('data-id');
                const miembro = miembros.find(m => m.id == id);
                eliminarMiembro(id, miembro);
            });
        });
    }

    // Función para renovar membresía
    function renovarMembresia(id) {
        const miembro = miembros.find(m => m.id == id);

        Swal.fire({
            title: 'Renovar Membresía',
            html: `¿Deseas renovar la membresía de <strong>${miembro.nombre} ${miembro.apellido_paterno}</strong>?<br>
                  <span class="text-muted">Esta acción actualizará la fecha de registro a hoy.</span>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, renovar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                // Mostrar loading
                Swal.fire({
                    title: 'Renovando...',
                    text: 'Actualizando la membresía',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                // Enviar solicitud al servidor
                fetch('ACTUALIZAR_MEMBRESIA.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ id: id })
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            Swal.fire({
                                title: '¡Éxito!',
                                text: 'Membresía renovada correctamente',
                                icon: 'success',
                                confirmButtonColor: '#28a745'
                            });
                            cargarMiembros(); // Recargar la tabla
                        } else {
                            throw new Error(data.message);
                        }
                    })
                    .catch(error => {
                        Swal.fire({
                            title: 'Error',
                            text: 'No se pudo renovar la membresía: ' + error.message,
                            icon: 'error',
                            confirmButtonColor: '#dc3545'
                        });
                    });
            }
        });
    }

    // Función para editar miembro
    // Función para editar miembro
    function editarMiembro(id) {
        const miembro = miembros.find(m => m.id == id);

        Swal.fire({
            title: 'Editar Miembro',
            html: `
            <div class="container-fluid">
                <form id="form-editar">
                    <div class="row">
                        <div class="col-12 mb-3">
                            <label class="form-label"><strong>Nombre *</strong></label>
                            <input type="text" class="form-control" value="${miembro.nombre || ''}" required>
                        </div>
                        <div class="col-12 mb-3">
                            <label class="form-label"><strong>Apellido Paterno *</strong></label>
                            <input type="text" class="form-control" value="${miembro.apellido_paterno || ''}" required>
                        </div>
                        <div class="col-12 mb-3">
                            <label class="form-label">Apellido Materno</label>
                            <input type="text" class="form-control" value="${miembro.apellido_materno || ''}">
                        </div>
                        <div class="col-12 mb-3">
                            <label class="form-label"><strong>Edad *</strong></label>
                            <input type="number" class="form-control" value="${miembro.edad || ''}" min="15" max="100" required>
                        </div>
                    </div>
                </form>
            </div>
            <small class="text-muted">Los campos marcados con * son obligatorios</small>
        `,
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#007bff',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Actualizar',
            cancelButtonText: 'Cancelar',
            width: '600px',
            preConfirm: () => {
                const form = document.getElementById('form-editar');
                const inputs = form.querySelectorAll('input[required]');
                let valid = true;

                inputs.forEach(input => {
                    if (!input.value.trim()) {
                        valid = false;
                        input.classList.add('is-invalid');
                    } else {
                        input.classList.remove('is-invalid');
                    }
                });

                if (!valid) {
                    Swal.showValidationMessage('Por favor, completa todos los campos obligatorios');
                    return false;
                }

                return {
                    id: id,
                    nombre: form.querySelector('input:nth-child(1)').value.trim(),
                    apellido_paterno: form.querySelector('input:nth-child(2)').value.trim(),
                    apellido_materno: form.querySelector('input:nth-child(3)').value.trim(),
                    edad: parseInt(form.querySelector('input:nth-child(4)').value)
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const datos = result.value;

                // Mostrar loading
                Swal.fire({
                    title: 'Actualizando...',
                    text: 'Guardando cambios del miembro',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                // Enviar datos al servidor
                fetch('EDITAR_MIEMBRO.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(datos)
                })
                    .then(response => {
                        console.log('Respuesta del servidor:', response);

                        // Verificar si la respuesta es JSON
                        const contentType = response.headers.get('content-type');
                        if (!contentType || !contentType.includes('application/json')) {
                            return response.text().then(text => {
                                console.error('Respuesta no JSON:', text);
                                throw new Error(`El servidor devolvió un formato incorrecto`);
                            });
                        }
                        return response.json();
                    })
                    .then(data => {
                        console.log('Datos recibidos:', data);

                        if (data.success) {
                            Swal.fire({
                                title: '¡Éxito!',
                                text: data.message || 'Miembro actualizado correctamente',
                                icon: 'success',
                                confirmButtonColor: '#28a745'
                            });
                            cargarMiembros();
                        } else {
                            throw new Error(data.message || 'Error desconocido');
                        }
                    })
                    .catch(error => {
                        console.error('Error completo:', error);
                        Swal.fire({
                            title: 'Error',
                            html: `No se pudo actualizar el miembro:<br><small>${error.message}</small>`,
                            icon: 'error',
                            confirmButtonColor: '#dc3545'
                        });
                    });
            }
        });
    }

    // Función para eliminar miembro
    function eliminarMiembro(id, miembro) {
        Swal.fire({
            title: '¿Estás seguro?',
            html: `Vas a eliminar a <strong>${miembro.nombre} ${miembro.apellido_paterno}</strong> permanentemente.<br>
                  <span class="text-danger">Esta acción no se puede deshacer.</span>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                // Mostrar loading
                Swal.fire({
                    title: 'Eliminando...',
                    text: 'Eliminando el miembro',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                // Enviar solicitud al servidor
                fetch('ELIMINAR_MIEMBRO.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ id: id })
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            Swal.fire({
                                title: '¡Eliminado!',
                                text: 'El miembro ha sido eliminado correctamente',
                                icon: 'success',
                                confirmButtonColor: '#28a745'
                            });
                            cargarMiembros(); // Recargar la tabla
                        } else {
                            throw new Error(data.message);
                        }
                    })
                    .catch(error => {
                        Swal.fire({
                            title: 'Error',
                            text: 'No se pudo eliminar el miembro: ' + error.message,
                            icon: 'error',
                            confirmButtonColor: '#dc3545'
                        });
                    });
            }
        });
    }

    // Función para actualizar estadísticas
    function actualizarEstadisticas() {
        totalMiembrosSpan.textContent = miembros.length;

        // Calcular membresías por vencer (menos de 7 días)
        const hoy = new Date();
        const proximosVencer = miembros.filter(miembro => {
            const fechaRegistro = new Date(miembro.fecha_registro);
            const fechaVencimiento = new Date(fechaRegistro);
            fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 1);

            const diffTime = fechaVencimiento - hoy;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return diffDays <= 7 && diffDays >= 0;
        }).length;

        proximosVencerSpan.textContent = proximosVencer;

        // Calcular ratio de géneros
        const hombres = miembros.filter(m => m.sexo === 'M').length;
        const mujeres = miembros.filter(m => m.sexo === 'F').length;
        ratioGeneroSpan.textContent = `${hombres}:${mujeres}`;
    }

    // Función para formatear fecha
    function formatearFecha(fecha) {
        return fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
});