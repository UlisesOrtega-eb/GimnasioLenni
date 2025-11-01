document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.querySelector('form');

    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Validación básica
        if (username.trim() === '' || password.trim() === '') {
            showError('Por favor complete todos los campos');
            return;
        }

        // Mostrar efecto de carga
        const btnLogin = document.querySelector('.btn-login');
        const originalText = btnLogin.innerHTML;
        btnLogin.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Autenticando...';
        btnLogin.disabled = true;

        // Enviar datos al servidor PHP
        authenticateUser(username, password, btnLogin, originalText);
    });

    function authenticateUser(username, password, btnLogin, originalText) {
        // Crear FormData para enviar los datos
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        // Enviar solicitud al servidor
        fetch('<?= htmlspecialchars($_SERVER["PHP_SELF"]) ?>', {
            method: 'POST',
            body: formData
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error en la red');
                }
                return response.text();
            })
            .then(data => {
                // Verificar si la respuesta contiene el dashboard (redirección exitosa)
                if (data.includes('MIEMBROS.html') || window.location.href.includes('MIEMBROS.html')) {
                    showSuccess('¡Bienvenido! Redirigiendo...');
                    // Recargar para mostrar el dashboard (en caso de que la redirección no haya funcionado)
                    setTimeout(() => {
                        window.location.href = 'http://localhost/GYM/DASHBOARD/MIEMBROS.html';
                    }, 1000);
                } else {
                    // Buscar mensajes de error en la respuesta
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(data, 'text/html');
                    const errorMsg = doc.querySelector('.error-message');

                    if (errorMsg) {
                        showError(errorMsg.textContent);
                    } else {
                        showError('Error de autenticación. Intente nuevamente.');
                    }

                    btnLogin.innerHTML = originalText;
                    btnLogin.disabled = false;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showError('Error de conexión. Intente nuevamente.');
                btnLogin.innerHTML = originalText;
                btnLogin.disabled = false;
            });
    }

    function showError(message) {
        // Eliminar notificaciones previas
        const oldAlert = document.querySelector('.custom-alert');
        if (oldAlert) oldAlert.remove();

        const alert = document.createElement('div');
        alert.className = 'custom-alert error';
        alert.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;

        // Insertar después del formulario
        loginForm.parentNode.insertBefore(alert, loginForm.nextSibling);

        setTimeout(() => {
            alert.classList.add('show');
        }, 10);

        // Eliminar después de 5 segundos
        setTimeout(() => {
            alert.classList.remove('show');
            setTimeout(() => {
                alert.remove();
            }, 300);
        }, 5000);
    }

    function showSuccess(message) {
        const alert = document.createElement('div');
        alert.className = 'custom-alert success';
        alert.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;

        // Insertar después del formulario
        loginForm.parentNode.insertBefore(alert, loginForm.nextSibling);

        setTimeout(() => {
            alert.classList.add('show');
        }, 10);

        // Eliminar después de 3 segundos (ya que se redirigirá)
        setTimeout(() => {
            alert.classList.remove('show');
            setTimeout(() => {
                alert.remove();
            }, 300);
        }, 3000);
    }
});

// Añadir estilos dinámicos para las alertas
const style = document.createElement('style');
style.textContent = `
    .custom-alert {
        position: relative;
        padding: 15px 20px;
        margin: 15px 0;
        border-radius: 8px;
        font-size: 0.9rem;
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        z-index: 1000;
    }
    
    .custom-alert.show {
        opacity: 1;
        transform: translateY(0);
    }
    
    .custom-alert i {
        margin-right: 10px;
        font-size: 1.2rem;
    }
    
    .custom-alert.error {
        background-color: #f8d7da;
        color: #721c24;
        border-left: 4px solid #f5c6cb;
    }
    
    .custom-alert.success {
        background-color: #d4edda;
        color: #155724;
        border-left: 4px solid #c3e6cb;
    }
`;
document.head.appendChild(style);