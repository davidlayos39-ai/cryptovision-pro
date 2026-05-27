/* ==========================================================================
   CRYPTOVISION PRO - CALCULADORA E INTEGRACIÓN CON CHART.JS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Referencias a los elementos del DOM de la calculadora
    const calcAmount = document.getElementById('calcAmount');
    const calcCrypto = document.getElementById('calcCrypto');
    const calcStrategy = document.getElementById('calcStrategy');
    const calcYears = document.getElementById('calcYears');

    const resultInitial = document.getElementById('resultInitial');
    const resultProfit = document.getElementById('resultProfit');
    const resultTotal = document.getElementById('resultTotal');
    const resultMultiplier = document.getElementById('resultMultiplier');

    let investmentChart = null;

    if (calcAmount && calcCrypto && calcStrategy && calcYears) {
        // Escuchar cambios en los inputs
        [calcAmount, calcCrypto, calcStrategy, calcYears].forEach(element => {
            element.addEventListener('input', calculateProjections);
        });

        // Carga inicial
        calculateProjections();
    }

    function calculateProjections() {
        const initialUSD = parseFloat(calcAmount.value) || 0;
        const cryptoSelected = calcCrypto.value;
        const strategyMultiplier = parseFloat(calcStrategy.value) || 0.15;
        const totalYears = parseInt(calcYears.value) || 3;

        // Tasas de crecimiento anual proyectadas (porcentaje decimal compuesto)
        // BTC: multiplicador de estrategia básico + 5% por robustez
        // ETH: multiplicador + 10% por volatilidad
        // SOL: multiplicador + 25% por alto beta (riesgo/recompensa)
        let premiumFactor = 0;
        if (cryptoSelected === 'ethereum') premiumFactor = 0.05;
        else if (cryptoSelected === 'solana') premiumFactor = 0.15;

        const annualRate = strategyMultiplier + premiumFactor;

        // Calcular proyección año tras año
        const yearlyData = [];
        const labels = ['Inicio'];
        
        yearlyData.push(initialUSD);

        let currentTotal = initialUSD;
        for (let year = 1; year <= totalYears; year++) {
            currentTotal = currentTotal * (1 + annualRate);
            yearlyData.push(Math.round(currentTotal));
            labels.push(`Año ${year}`);
        }

        const finalTotal = currentTotal;
        const netProfit = finalTotal - initialUSD;
        const totalMultiplier = finalTotal / (initialUSD || 1);

        // Actualizar valores de texto en pantalla
        if (resultInitial) resultInitial.textContent = formatUSD(initialUSD);
        if (resultProfit) {
            resultProfit.textContent = formatUSD(netProfit);
            resultProfit.className = netProfit >= 0 ? 'calc-result-value change-up' : 'calc-result-value change-down';
        }
        if (resultTotal) resultTotal.textContent = formatUSD(finalTotal);
        if (resultMultiplier) resultMultiplier.textContent = `${totalMultiplier.toFixed(2)}x`;

        // Dibujar o actualizar gráfico interactivo con Chart.js
        updateChart(labels, yearlyData, cryptoSelected);
    }

    function formatUSD(value) {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }

    function updateChart(labels, data, crypto) {
        const ctx = document.getElementById('investmentChartCanvas');
        if (!ctx) return;

        // Si ya hay un gráfico, destruirlo antes de crear uno nuevo para evitar superposiciones
        if (investmentChart) {
            investmentChart.destroy();
        }

        // Configuración de colores dinámicos basados en la moneda elegida
        let accentColor = '#00D4FF'; // Azul Eléctrico para Ethereum/General
        let accentGlow = 'rgba(0, 212, 255, 0.15)';
        
        if (crypto === 'bitcoin') {
            accentColor = '#FFD700'; // Dorado para Bitcoin
            accentGlow = 'rgba(255, 215, 0, 0.15)';
        } else if (crypto === 'solana') {
            accentColor = '#a855f7'; // Púrpura elegante para Solana
            accentGlow = 'rgba(168, 85, 247, 0.15)';
        }

        // Crear gradiente de relleno debajo de la línea
        const chartCtx = ctx.getContext('2d');
        const gradient = chartCtx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, accentGlow);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        // Inicialización de Chart.js
        // @ts-ignore
        investmentChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Proyección de Portafolio ($)',
                    data: data,
                    borderColor: accentColor,
                    backgroundColor: gradient,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: accentColor,
                    pointBorderColor: '#07090E',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    shadowColor: accentColor,
                    shadowBlur: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#0D1017',
                        titleColor: '#FFD700',
                        bodyColor: '#F0F4F8',
                        borderColor: 'rgba(255,255,255,0.08)',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return `Valor: ${formatUSD(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.03)',
                            borderColor: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: '#8E9BAE',
                            font: {
                                family: 'Outfit',
                                size: 11
                            }
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.03)',
                            borderColor: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: '#8E9BAE',
                            font: {
                                family: 'Outfit',
                                size: 11
                            },
                            callback: function(value) {
                                return '$' + value.toLocaleString('es-ES');
                            }
                        }
                    }
                }
            }
        });
    }
});
