document.addEventListener('DOMContentLoaded', function() {
    // Efecto hover mejorado para las tarjetas
    const accessCards = document.querySelectorAll('.access-card');
    
    accessCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
            this.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.2)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
        });
        
        // Efecto de clic
        card.addEventListener('mousedown', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseup', function() {
            this.style.transform = 'translateY(-10px)';
        });
    });
    
    // Animación de carga
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// Transición suave al cambiar de página
function navigateTo(url) {
    document.body.style.opacity = '0';
    setTimeout(() => {
        window.location.href = url;
    }, 300);
}