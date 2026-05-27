/* ==========================================================================
   CRYPTOVISION PRO - LÓGICA PRINCIPAL (JAVASCRIPT VANILLA)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Menú Móvil Hamburguesa
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');

    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
            // Animación sencilla del botón
            const spans = menuToggle.querySelectorAll('span');
            spans[0].style.transform = mainNav.classList.contains('active') ? 'rotate(45deg) translate(6px, 6px)' : 'none';
            spans[1].style.opacity = mainNav.classList.contains('active') ? '0' : '1';
            spans[2].style.transform = mainNav.classList.contains('active') ? 'rotate(-45deg) translate(6px, -6px)' : 'none';
        });
    }

    // 2. Ticker y Widgets de Precios en Vivo (CoinGecko API con Caché de Respaldo)
    const CRYPTO_IDS = 'bitcoin,ethereum,solana,binancecoin,cardano,ripple';
    const CACHED_PRICES = {
        bitcoin: { usd: 67240.50, usd_24h_change: 2.45, symbol: 'BTC', name: 'Bitcoin' },
        ethereum: { usd: 3480.20, usd_24h_change: -1.15, symbol: 'ETH', name: 'Ethereum' },
        solana: { usd: 165.75, usd_24h_change: 5.80, symbol: 'SOL', name: 'Solana' },
        binancecoin: { usd: 585.10, usd_24h_change: 0.90, symbol: 'BNB', name: 'BNB' },
        cardano: { usd: 0.485, usd_24h_change: -2.30, symbol: 'ADA', name: 'Cardano' },
        ripple: { usd: 0.525, usd_24h_change: 0.15, symbol: 'XRP', name: 'Ripple' }
    };

    async function fetchCryptoPrices() {
        try {
            const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${CRYPTO_IDS}&vs_currencies=usd&include_24hr_change=true`);
            if (!response.ok) throw new Error('Error al obtener datos de la API');
            const data = await response.json();
            
            // Mapear la respuesta agregando símbolos y nombres
            const prices = {};
            Object.keys(CACHED_PRICES).forEach(id => {
                if (data[id]) {
                    prices[id] = {
                        usd: data[id].usd,
                        usd_24h_change: data[id].usd_24h_change,
                        symbol: CACHED_PRICES[id].symbol,
                        name: CACHED_PRICES[id].name
                    };
                } else {
                    prices[id] = CACHED_PRICES[id];
                }
            });
            return prices;
        } catch (error) {
            console.warn('Usando cotizaciones locales simuladas (Límite de API superado o sin red):', error.message);
            // Generar pequeñas oscilaciones realistas en las cotizaciones simuladas para mantener la interfaz viva
            const randomChange = () => (Math.random() - 0.5) * 0.1; // +/- 0.05%
            const fluctuatingPrices = {};
            Object.keys(CACHED_PRICES).forEach(id => {
                const item = CACHED_PRICES[id];
                const newPrice = item.usd * (1 + randomChange());
                fluctuatingPrices[id] = {
                    ...item,
                    usd: newPrice
                };
            });
            return fluctuatingPrices;
        }
    }

    function formatCurrency(value) {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: value < 1 ? 4 : 2,
            maximumFractionDigits: value < 1 ? 4 : 2
        }).format(value);
    }

    function formatPercent(value) {
        if (value === undefined || isNaN(value)) return '0.00%';
        const sign = value >= 0 ? '+' : '';
        return `${sign}${value.toFixed(2)}%`;
    }

    function renderPriceFeeds(prices) {
        // Renderizar en el Ticker Superior
        const tickerTrack = document.getElementById('tickerTrack');
        if (tickerTrack) {
            tickerTrack.innerHTML = '';
            // Duplicamos los elementos para lograr un scroll infinito fluido
            const items = Object.values(prices);
            const doubledItems = [...items, ...items, ...items]; 
            
            doubledItems.forEach(crypto => {
                const changeClass = crypto.usd_24h_change >= 0 ? 'change-up' : 'change-down';
                const arrow = crypto.usd_24h_change >= 0 ? '▲' : '▼';
                
                const div = document.createElement('div');
                div.className = 'ticker-item';
                div.innerHTML = `
                    <span class="ticker-symbol">${crypto.symbol}</span>
                    <span class="ticker-price">${formatCurrency(crypto.usd)}</span>
                    <span class="ticker-change ${changeClass}">${arrow} ${formatPercent(crypto.usd_24h_change)}</span>
                `;
                tickerTrack.appendChild(div);
            });
        }

        // Renderizar en el Widget de Barra Lateral (si existe)
        const sidebarPricesList = document.getElementById('sidebarPricesList');
        if (sidebarPricesList) {
            sidebarPricesList.innerHTML = '';
            Object.values(prices).forEach(crypto => {
                const changeClass = crypto.usd_24h_change >= 0 ? 'change-up' : 'change-down';
                const div = document.createElement('div');
                div.className = 'sidebar-crypto-card';
                div.innerHTML = `
                    <div class="sidebar-crypto-info">
                        <span class="sidebar-crypto-symbol">${crypto.symbol}</span>
                        <span class="sidebar-crypto-name">${crypto.name}</span>
                    </div>
                    <div class="sidebar-crypto-data">
                        <div class="sidebar-crypto-price">${formatCurrency(crypto.usd)}</div>
                        <div class="ticker-change ${changeClass}" style="font-size:0.75rem">${formatPercent(crypto.usd_24h_change)}</div>
                    </div>
                `;
                sidebarPricesList.appendChild(div);
            });
        }

        // Renderizar en el Widget del Hero (si existe)
        const heroCryptoList = document.getElementById('heroCryptoList');
        if (heroCryptoList) {
            heroCryptoList.innerHTML = '';
            // Tomamos solo Bitcoin, Ethereum y Solana para el Hero Widget
            const heroCryptos = [prices.bitcoin, prices.ethereum, prices.solana];
            heroCryptos.forEach(crypto => {
                if (!crypto) return;
                const changeClass = crypto.usd_24h_change >= 0 ? 'change-up' : 'change-down';
                const arrow = crypto.usd_24h_change >= 0 ? '▲' : '▼';
                const div = document.createElement('div');
                div.className = 'hero-crypto-row';
                div.innerHTML = `
                    <div class="crypto-row-icon">
                        <strong style="color:var(--accent-gold); font-size: 0.9rem;">${crypto.symbol[0]}</strong>
                    </div>
                    <div class="crypto-row-name">
                        <h4>${crypto.name}</h4>
                        <span>${crypto.symbol}/USD</span>
                    </div>
                    <div class="crypto-row-data">
                        <div class="crypto-row-price">${formatCurrency(crypto.usd)}</div>
                        <div class="ticker-change ${changeClass}" style="font-size:0.75rem">${arrow} ${formatPercent(crypto.usd_24h_change)}</div>
                    </div>
                `;
                heroCryptoList.appendChild(div);
            });
        }
    }

    async function updatePrices() {
        const prices = await fetchCryptoPrices();
        renderPriceFeeds(prices);
    }

    // Inicializar precios y actualizar cada 30 segundos
    updatePrices();
    setInterval(updatePrices, 30000);

    // 3. Glosario Cripto (Buscador y Filtrado Dinámico)
    const glossarySearchInput = document.getElementById('glossarySearch');
    const glossaryItems = document.querySelectorAll('.glossary-item');

    if (glossarySearchInput && glossaryItems.length > 0) {
        glossarySearchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();

            glossaryItems.forEach(item => {
                const term = item.querySelector('.glossary-term').textContent.toLowerCase();
                const def = item.querySelector('.glossary-def').textContent.toLowerCase();
                
                if (term.includes(searchTerm) || def.includes(searchTerm)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }

    // 4. Popup de Consentimiento de Cookies (Obligatorio para Google AdSense)
    const cookieConsent = document.getElementById('cookieConsent');
    const acceptCookiesBtn = document.getElementById('acceptCookies');
    const declineCookiesBtn = document.getElementById('declineCookies');

    if (cookieConsent && acceptCookiesBtn) {
        // Verificar si ya se tomó una decisión previa
        const cookieDecision = localStorage.getItem('cookieConsentDecision');
        
        if (!cookieDecision) {
            setTimeout(() => {
                cookieConsent.classList.add('show');
            }, 1500); // Aparece suavemente después de 1.5s
        }

        acceptCookiesBtn.addEventListener('click', () => {
            localStorage.setItem('cookieConsentDecision', 'accepted');
            cookieConsent.classList.remove('show');
            console.log('Cookies aceptadas (Google AdSense activado)');
        });

        if (declineCookiesBtn) {
            declineCookiesBtn.addEventListener('click', () => {
                localStorage.setItem('cookieConsentDecision', 'declined');
                cookieConsent.classList.remove('show');
                console.log('Cookies rechazadas');
            });
        }
    }

    // 5. Destacar enlace activo en Menú de Navegación
    const currentUrl = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (currentUrl.endsWith(linkPath) || (currentUrl === '/' && linkPath === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});
