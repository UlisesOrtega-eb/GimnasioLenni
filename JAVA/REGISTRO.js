$(document).ready(function() {
    // Validación del formulario con jQuery
    $('#registroForm').on('submit', function(e) {
        e.preventDefault();
        
        if (validarFormulario()) {
            registrarMiembro();
        }
    });

    // Validación en tiempo real
    $('.gym-input').on('blur', function() {
        validarCampo($(this));
    });

    // Función de validación completa
    function validarFormulario() {
        let esValido = true;
        
        $('.gym-input').each(function() {
            if (!validarCampo($(this))) {
                esValido = false;
            }
        });
        
        return esValido;
    }

    // Validación individual de campos
    function validarCampo(campo) {
        const valor = campo.val().trim();
        const id = campo.attr('id');
        let esValido = true;
        
        // Remover estilos de error previos
        campo.removeClass('is-invalid');
        campo.next('.invalid-feedback').remove();
        
        // Validaciones específicas por campo
        switch(id) {
            case 'nombre':
            case 'apellido_paterno':
                if (valor === '') {
                    mostrarError(campo, 'Este campo es obligatorio');
                    esValido = false;
                } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(valor)) {
                    mostrarError(campo, 'Solo se permiten letras y espacios');
                    esValido = false;
                }
                break;
                
            case 'apellido_materno':
                if (valor !== '' && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(valor)) {
                    mostrarError(campo, 'Solo se permiten letras y espacios');
                    esValido = false;
                }
                break;
                
            case 'edad':
                if (valor === '') {
                    mostrarError(campo, 'La edad es obligatoria');
                    esValido = false;
                } else if (valor < 15 || valor > 100) {
                    mostrarError(campo, 'La edad debe estar entre 15 y 100 años');
                    esValido = false;
                }
                break;
                
            case 'sexo':
                if (valor === '') {
                    mostrarError(campo, 'Debe seleccionar un sexo');
                    esValido = false;
                }
                break;
                
            case 'monto_inscripcion':
                if (valor === '' || parseFloat(valor) <= 0) {
                    mostrarError(campo, 'El monto debe ser mayor a 0');
                    esValido = false;
                }
                break;
        }
        
        if (esValido) {
            campo.addClass('is-valid');
        }
        
        return esValido;
    }

    function mostrarError(campo, mensaje) {
        campo.addClass('is-invalid');
        campo.after(`<div class="invalid-feedback">${mensaje}</div>`);
    }

    // Función para registrar miembro
    function registrarMiembro() {
        const formData = {
            nombre: $('#nombre').val().trim(),
            apellido_paterno: $('#apellido_paterno').val().trim(),
            apellido_materno: $('#apellido_materno').val().trim(),
            edad: $('#edad').val(),
            sexo: $('#sexo').val(),
            monto_inscripcion: $('#monto_inscripcion').val(),
            fecha_registro: new Date().toISOString().split('T')[0]
        };

        // Simular guardado en localStorage
        let miembros = JSON.parse(localStorage.getItem('miembros') || '[]');
        miembros.push({
            ...formData,
            id: Date.now(),
            dias_restantes: 30 // Por defecto 30 días
        });
        localStorage.setItem('miembros', JSON.stringify(miembros));

        // Mostrar mensaje de éxito
        $('#registroForm').hide();
        $('#mensajeExito').removeClass('d-none');
        
        // Mostrar datos del registro
        $('#successData').html(`
            <div class="row">
                <div class="col-md-6">
                    <p><strong>Nombre:</strong> ${formData.nombre}</p>
                    <p><strong>Apellido Paterno:</strong> ${formData.apellido_paterno}</p>
                    <p><strong>Apellido Materno:</strong> ${formData.apellido_materno || 'N/A'}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>Edad:</strong> ${formData.edad}</p>
                    <p><strong>Sexo:</strong> ${formData.sexo === 'M' ? 'Masculino' : 'Femenino'}</p>
                    <p><strong>Monto:</strong> $${parseFloat(formData.monto_inscripcion).toFixed(2)}</p>
                </div>
            </div>
        `);
    }

    // Botón cancelar
    $('#btnCancelar').on('click', function() {
        if (confirm('¿Está seguro de cancelar el registro? Los datos ingresados se perderán.')) {
            window.location.href = 'MIEMBROS.html';
        }
    });

    // Botón nuevo registro
    $('#btnNuevoRegistro').on('click', function() {
        $('#mensajeExito').addClass('d-none');
        $('#registroForm').show().trigger('reset');
        $('.gym-input').removeClass('is-valid is-invalid');
        $('.invalid-feedback').remove();
    });

    // Formatear input de monto
    $('#monto_inscripcion').on('input', function() {
        let value = $(this).val();
        if (value && !isNaN(value)) {
            $(this).val(parseFloat(value).toFixed(2));
        }
    });
});