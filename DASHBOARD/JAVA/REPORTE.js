// Configuración inicial
document.addEventListener('DOMContentLoaded', function () {
    actualizarFechaHora();
    setInterval(actualizarFechaHora, 1000);

    configurarFechas();
    configurarEventListeners();
    generarReporte();
});

// Configurar fechas por defecto
function configurarFechas() {
    const hoy = new Date();
    const fechaMinima = new Date();
    fechaMinima.setMonth(fechaMinima.getMonth() - 3);

    // Configurar fecha día
    document.getElementById('fecha-dia').valueAsDate = hoy;
    document.getElementById('fecha-dia').min = fechaMinima.toISOString().split('T')[0];

    // Configurar semana (lunes de la semana actual)
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - hoy.getDay() + (hoy.getDay() === 0 ? -6 : 1));
    document.getElementById('fecha-semana').valueAsDate = lunes;
    document.getElementById('fecha-semana').min = fechaMinima.toISOString().split('T')[0];

    // Configurar mes
    document.getElementById('fecha-mes').value = hoy.toISOString().substring(0, 7);
    document.getElementById('fecha-mes').min = fechaMinima.toISOString().substring(0, 7);

    // Configurar rango personalizado (últimos 7 días por defecto)
    const hace7Dias = new Date();
    hace7Dias.setDate(hoy.getDate() - 7);
    document.getElementById('fecha-inicio').valueAsDate = hace7Dias;
    document.getElementById('fecha-fin').valueAsDate = hoy;
    document.getElementById('fecha-inicio').min = fechaMinima.toISOString().split('T')[0];
    document.getElementById('fecha-fin').min = fechaMinima.toISOString().split('T')[0];
}

// Configurar event listeners
function configurarEventListeners() {
    // Cambiar tipo de reporte
    document.getElementById('tipo-reporte').addEventListener('change', function () {
        const tipo = this.value;

        // Ocultar todos los filtros
        document.querySelectorAll('.filtro-group').forEach(el => {
            el.style.display = 'none';
        });

        // Mostrar el filtro correspondiente
        document.getElementById(`filtro-${tipo}`).style.display = 'block';

        // Mostrar/ocultar sección de analítica
        document.getElementById('seccion-analitica').style.display =
            (tipo === 'mes') ? 'block' : 'none';
    });

    // Generar reporte
    document.getElementById('generar-reporte').addEventListener('click', generarReporte);

    // Exportar a PDF
    document.getElementById('imprimir-pdf').addEventListener('click', generarPDF);
}

// Actualizar fecha y hora en tiempo real
function actualizarFechaHora() {
    const ahora = new Date();
    const opciones = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    document.getElementById('fecha-hora').textContent = ahora.toLocaleDateString('es-ES', opciones);
}

// Generar reporte
async function generarReporte() {
    const tipo = document.getElementById('tipo-reporte').value;
    let url = 'REPORTE.php?';
    let titulo = '';

    // Mostrar loader
    const btnGenerar = document.getElementById('generar-reporte');
    const btnOriginal = btnGenerar.innerHTML;
    btnGenerar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
    btnGenerar.disabled = true;

    try {
        // Validar y construir URL según el tipo de reporte
        switch (tipo) {
            case 'dia':
                const fechaDia = document.getElementById('fecha-dia').value;
                if (!fechaDia) throw new Error('Selecciona una fecha válida');
                url += `tipo=dia&fecha=${encodeURIComponent(fechaDia)}`;
                titulo = `Reporte del día ${formatFecha(fechaDia)}`;
                break;

            case 'semana':
                const fechaSemana = document.getElementById('fecha-semana').value;
                if (!fechaSemana) throw new Error('Selecciona una fecha válida');
                const fechaDomingo = new Date(fechaSemana);
                fechaDomingo.setDate(fechaDomingo.getDate() + 6);
                url += `tipo=semana&fecha=${encodeURIComponent(fechaSemana)}`;
                titulo = `Reporte de la semana ${formatFecha(fechaSemana)} al ${formatFecha(fechaDomingo.toISOString().split('T')[0])}`;
                break;

            case 'mes':
                const fechaMes = document.getElementById('fecha-mes').value;
                if (!fechaMes) throw new Error('Selecciona un mes válido');
                url += `tipo=mes&fecha=${encodeURIComponent(fechaMes)}`;
                const mesNombre = new Date(fechaMes + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
                titulo = `Reporte del mes ${mesNombre}`;
                break;

            case 'personalizado':
                const fechaInicio = document.getElementById('fecha-inicio').value;
                const fechaFin = document.getElementById('fecha-fin').value;
                if (!fechaInicio || !fechaFin) throw new Error('Selecciona un rango de fechas válido');
                if (fechaInicio > fechaFin) throw new Error('La fecha de inicio no puede ser mayor a la fecha final');
                url += `tipo=personalizado&inicio=${encodeURIComponent(fechaInicio)}&fin=${encodeURIComponent(fechaFin)}`;
                titulo = `Reporte del ${formatFecha(fechaInicio)} al ${formatFecha(fechaFin)}`;
                break;
        }

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            const errorMsg = errorData?.message || `Error HTTP ${response.status}`;
            throw new Error(errorMsg);
        }

        const data = await response.json();

        if (!data || data.success === false) {
            throw new Error(data?.message || 'Respuesta inválida del servidor');
        }

        // Procesar datos exitosos
        actualizarVista(data, titulo);
        mostrarNotificacion('Datos cargados correctamente', 'success');

    } catch (error) {
        console.error("Error en generarReporte:", error);
        mostrarNotificacion(`Error: ${error.message}`, 'error');
    } finally {
        // Restaurar botón
        btnGenerar.innerHTML = btnOriginal;
        btnGenerar.disabled = false;
    }
}

// Actualizar la vista con los datos del reporte
function actualizarVista(data, titulo) {
    // Verificar datos antes de actualizar
    if (!data) {
        console.error("No hay datos para actualizar la vista");
        return;
    }

    // Actualizar título
    document.querySelector('.header h1').textContent = data.titulo || titulo || 'Reporte del Gimnasio';

    // Actualizar resumen
    if (data.totales) {
        actualizarResumenVentas(data.totales);
    }

    // Actualizar tablas
    if (data.ventas) {
        actualizarTablaVentas(data.ventas);
    }

    if (data.miembros) {
        actualizarTablaMiembros(data.miembros);
    }

    if (data.movimientos) {
        actualizarTablaMovimientos(data.movimientos, data.estructura_tabla || {});
    }

    // Actualizar analítica si está disponible
    if (data.analitica) {
        actualizarAnalitica(data.analitica);
    }
}

// Actualizar resumen de ventas
function actualizarResumenVentas(totales) {
    const elementos = {
        'ventas-efectivo': totales.ventas?.efectivo || 0,
        'ventas-tarjetas': totales.ventas?.tarjeta || 0,
        'ventas-transferencias': totales.ventas?.transferencia || 0,
        'total-inscripciones': totales.inscripciones?.total_ingresos || 0,
        'total-general': (totales.ventas?.total || 0) + (totales.inscripciones?.total_ingresos || 0),
        'efectivo-caja': totales.efectivo_caja || 0
    };

    for (const [id, valor] of Object.entries(elementos)) {
        const elemento = document.getElementById(id);
        if (elemento) {
            // Animación de cambio de valor
            elemento.style.transform = 'scale(1.1)';
            setTimeout(() => {
                elemento.textContent = formatearMoneda(valor);
                elemento.style.transform = 'scale(1)';
            }, 200);
        }
    }

    // Actualizar contadores de miembros
    if (totales.inscripciones) {
        document.getElementById('total-hombres').textContent = totales.inscripciones.hombres || 0;
        document.getElementById('total-mujeres').textContent = totales.inscripciones.mujeres || 0;
        document.getElementById('total-miembros').textContent = totales.inscripciones.total_miembros || 0;
    }
}

// Actualizar tabla de ventas
function actualizarTablaVentas(ventas) {
    const tbody = document.querySelector('#tabla-ventas tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!ventas || ventas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">No hay ventas registradas en este período</td>
            </tr>
        `;
        return;
    }

    ventas.forEach(venta => {
        const tr = document.createElement('tr');
        tr.style.animation = 'fadeIn 0.3s ease-out';

        const fechaHora = new Date(venta.fecha_venta);
        const fechaFormateada = fechaHora.toLocaleDateString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        const horaFormateada = fechaHora.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
        });

        tr.innerHTML = `
            <td>${fechaFormateada}<br><small>${horaFormateada}</small></td>
            <td>${venta.producto}</td>
            <td>${venta.cantidad}</td>
            <td>${formatearMoneda(venta.precio_unitario)}</td>
            <td>${formatearMoneda(venta.monto_total)}</td>
            <td>${venta.metodo_pago ? venta.metodo_pago.charAt(0).toUpperCase() + venta.metodo_pago.slice(1) : 'Efectivo'}</td>
        `;

        tbody.appendChild(tr);
    });
}

// Actualizar tabla de miembros
function actualizarTablaMiembros(miembros) {
    const tbody = document.querySelector('#tabla-miembros tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!miembros || miembros.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">No hay miembros registrados en este período</td>
            </tr>
        `;
        return;
    }

    miembros.forEach(miembro => {
        const tr = document.createElement('tr');
        tr.style.animation = 'fadeIn 0.3s ease-out';

        const fechaRegistro = new Date(miembro.fecha_registro);
        const fechaFormateada = fechaRegistro.toLocaleDateString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        tr.innerHTML = `
            <td>${fechaFormateada}</td>
            <td>${miembro.nombre_completo}</td>
            <td>${miembro.edad}</td>
            <td>${miembro.sexo === 'M' ? 'Masculino' : 'Femenino'}</td>
            <td>${formatearMoneda(miembro.monto_inscripcion)}</td>
        `;

        tbody.appendChild(tr);
    });
}

// Actualizar tabla de movimientos
function actualizarTablaMovimientos(movimientos) {
    const tbody = document.querySelector('#tabla-movimientos tbody');
    const thead = document.querySelector('#tabla-movimientos thead');
    if (!tbody || !thead) return;

    tbody.innerHTML = '';

    if (!movimientos || movimientos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">No hay movimientos registrados en este período</td>
            </tr>
        `;
        return;
    }

    // Construir encabezados de tabla
    thead.innerHTML = `
        <tr>
            <th>FECHA/HORA</th>
            <th>TIPO</th>
            <th>MONTO</th>
            <th>MOTIVO</th>
        </tr>
    `;

    // Llenar tabla con datos
    movimientos.forEach(movimiento => {
        const tr = document.createElement('tr');
        tr.style.animation = 'fadeIn 0.3s ease-out';

        const fecha = new Date(movimiento.fecha);
        const fechaFormateada = fecha.toLocaleDateString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        const horaFormateada = fecha.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
        });

        tr.innerHTML = `
            <td>${fechaFormateada}<br><small>${horaFormateada}</small></td>
            <td>${movimiento.tipo === 'egreso' ? 'Retiro' : 'Ingreso'}</td>
            <td class="${movimiento.tipo === 'egreso' ? 'text-danger' : 'text-success'}">${formatearMoneda(movimiento.monto)}</td>
            <td>${movimiento.motivo || 'N/A'}</td>
        `;

        tbody.appendChild(tr);
    });
}
// Actualizar analítica
function actualizarAnalitica(analitica) {
    const crecimientoElement = document.getElementById('porcentaje-crecimiento');
    const mesAnteriorElement = document.getElementById('miembros-mes-anterior');

    if (crecimientoElement && mesAnteriorElement) {
        crecimientoElement.textContent = `${analitica.crecimiento > 0 ? '+' : ''}${analitica.crecimiento.toFixed(2)}%`;
        crecimientoElement.className = analitica.crecimiento > 0 ? 'crecimiento positivo' : analitica.crecimiento < 0 ? 'crecimiento negativo' : 'crecimiento';
        mesAnteriorElement.textContent = analitica.miembros_mes_anterior;
    }
}

// Generar PDF
function generarPDF() {
    // Mostrar loader
    const btnPDF = document.getElementById('imprimir-pdf');
    const originalContent = btnPDF.innerHTML;
    btnPDF.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparando PDF...';
    btnPDF.disabled = true;

    // Crear un clon del contenido que queremos imprimir
    const printContainer = document.createElement('div');
    printContainer.className = 'print-container';

    // Clonar el contenedor principal
    const mainContent = document.querySelector('.container').cloneNode(true);

    // Ocultar elementos que no queremos en el PDF
    const elementsToHide = mainContent.querySelectorAll('.no-print, button, .filtro-group, #generar-reporte, #imprimir-pdf');
    elementsToHide.forEach(el => el.style.display = 'none');

    // Agregar estilos específicos para impresión
    const printStyles = document.createElement('style');
    printStyles.textContent = `
        @media print {
            body, html {
                margin: 0;
                padding: 0;
                background: white;
            }
            .print-container {
                width: 100%;
                padding: 20px;
                box-sizing: border-box;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                page-break-inside: auto;
            }
            tr {
                page-break-inside: avoid;
                page-break-after: auto;
            }
            th, td {
                border: 1px solid #ddd;
                padding: 8px;
            }
            th {
                background-color: #f2f2f2;
            }
            .header {
                text-align: center;
                margin-bottom: 20px;
            }
            .resumen-ventas {
                display: flex;
                justify-content: space-between;
                margin-bottom: 20px;
                flex-wrap: wrap;
            }
            .resumen-box {
                border: 1px solid #ddd;
                padding: 10px;
                margin: 5px;
                min-width: 150px;
                text-align: center;
            }
        }
    `;

    // Agregar fecha y hora de generación
    const fechaGeneracion = document.createElement('div');
    fechaGeneracion.style.textAlign = 'center';
    fechaGeneracion.style.marginBottom = '15px';
    fechaGeneracion.style.fontStyle = 'italic';
    fechaGeneracion.textContent = `Generado el: ${new Date().toLocaleString('es-ES')}`;

    printContainer.appendChild(fechaGeneracion);
    printContainer.appendChild(mainContent);
    printContainer.appendChild(printStyles);

    // Agregar al cuerpo del documento temporalmente
    document.body.appendChild(printContainer);

    // Esperar un momento para que se renderice el contenido
    setTimeout(() => {
        // Activar la función de impresión del navegador
        window.print();

        // Limpiar después de imprimir
        document.body.removeChild(printContainer);

        // Restaurar botón
        btnPDF.innerHTML = originalContent;
        btnPDF.disabled = false;
    }, 500);
}

// Formatear moneda
function formatearMoneda(valor) {
    return '$' + parseFloat(valor || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Formatear fecha
function formatFecha(fechaStr) {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Mostrar notificación
function mostrarNotificacion(mensaje, tipo) {
    // Eliminar notificaciones anteriores
    const notificacionesAnteriores = document.querySelectorAll('.notificacion');
    notificacionesAnteriores.forEach(el => el.remove());

    // Crear nueva notificación
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion ${tipo}`;
    notificacion.innerHTML = `
        <i class="fas ${tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        ${mensaje}
    `;

    document.body.appendChild(notificacion);

    // Mostrar con animación
    setTimeout(() => {
        notificacion.classList.add('show');
    }, 10);

    // Ocultar después de 3 segundos
    setTimeout(() => {
        notificacion.classList.remove('show');
        setTimeout(() => {
            notificacion.remove();
        }, 300);
    }, 3000);
}