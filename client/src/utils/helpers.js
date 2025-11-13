// Theme Handling
export const applyTheme = (theme) => {
    document.body.classList.remove('theme-light', 'theme-dark', 'theme-pastel');
    document.body.classList.add(`theme-${theme}`);
    localStorage.setItem('theme', theme);
    console.log(`%c✨ Theme set to ${theme}`, 'color: #ff7f50; font-weight: bold; text-shadow: 0 0 6px #0d6efd');
};

// Load saved theme
export const loadSavedTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    return savedTheme;
};

// Chart configurations
export const getChartConfig = (type = 'line') => {
    const configs = {
        line: {
            options: {
                scales: { y: { beginAtZero: true } },
                plugins: { legend: { display: true } }
            },
            defaultDataset: {
                borderColor: '#00d4ff',
                backgroundColor: 'rgba(0,212,255,0.15)',
                tension: 0.35,
                fill: true,
                pointRadius: 4,
                pointBackgroundColor: '#6c63ff'
            }
        },
        bar: {
            options: {
                scales: { y: { beginAtZero: true } },
                plugins: { legend: { display: false } }
            },
            defaultDataset: {
                backgroundColor: ['#6c63ff', '#00d4ff', '#a3c4f3']
            }
        }
    };

    return configs[type] || configs.line;
};

// Format chart data
export const formatTermData = (rawData) => {
    const labels = ['Term 1', 'Term 2', 'Term 3'];
    const values = [
        rawData?.['1'] || 0,
        rawData?.['2'] || 0,
        rawData?.['3'] || 0
    ];

    return { labels, values };
};

// API Helpers
export const handleApiError = (error) => {
    console.error('API Error:', error);
    return error.response?.data?.error || 'An error occurred';
};

// Animation Helpers
export const fadeOut = (element, callback) => {
    if (!element) return;
    
    element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    element.style.opacity = '0';
    element.style.transform = 'translateY(-12px) scale(0.98)';
    
    setTimeout(() => {
        if (callback) callback();
        element.remove();
    }, 600);
};