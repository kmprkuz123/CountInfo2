const select = document.getElementById('Select');
const info = document.getElementById('Country');

const API_BASE = 'https://api.restcountries.com/countries/v5';
const API_KEY = 'rc_live_bb7a43b3f12c44daaf347f59bc356464';

const headers = {
    'Authorization': `Bearer ${API_KEY}`
};

function getCountryName(country) {
    return (
        country?.name?.common ||
        country?.names?.common ||
        country?.common_name ||
        (typeof country?.name === 'string' ? country.name : null)
    );
}

function extractCountries(result) {
    const raw = result?.data ?? result;

    if (Array.isArray(raw)) {
        return raw;
    }

    if (raw && typeof raw === 'object') {
        const nestedArray = Object.values(raw).find(val => Array.isArray(val));
        if (nestedArray) return nestedArray;

        const values = Object.values(raw);
        if (values.length > 0 && values.every(v => v && typeof v === 'object')) {
            return values;
        }

        return [raw];
    }

    return [];
}

function formatError(result, status) {
    if (Array.isArray(result?.errors) && result.errors.length > 0) {
        return result.errors
            .map(e => e.message || e.detail || JSON.stringify(e))
            .join(', ');
    }
    return `HTTP ${status}`;
}

// 1. Завантаження списку країн у #Select
async function loadCountries() {
    try {
        const response = await fetch(`${API_BASE}?limit=100`, { headers });
        const result = await response.json();

        if (!response.ok || result?.errors) {
            const msg = formatError(result, response.status);
            if (info) info.innerHTML = `<p style="color: #ffcccc;">Помилка API: ${msg}</p>`;
            return;
        }

        const countries = extractCountries(result)
            .map(country => ({ country, name: getCountryName(country) }))
            .filter(item => Boolean(item.name))
            .sort((a, b) => a.name.localeCompare(b.name));

        countries.forEach(({ name }) => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error(error);
        if (info) {
            info.innerHTML = `<p style="color: #ffcccc;">Помилка завантаження списку країн: ${error.message}</p>`;
        }
    }
}

// 2. Отримання даних про обрану країну та вивід у #Country
async function loadCountryInfo(countryName) {
    if (!countryName) return;

    if (info) info.innerHTML = '<p>Завантаження даних...</p>';

    try {
        const response = await fetch(
            `${API_BASE}?q=${encodeURIComponent(countryName)}`,
            { headers }
        );
        const result = await response.json();

        if (!response.ok || result?.errors) {
            const msg = formatError(result, response.status);
            if (info) info.innerHTML = `<p style="color: #ffcccc;">Помилка API: ${msg}</p>`;
            return;
        }

        const list = extractCountries(result);
        const country = list[0];

        if (!country) {
            if (info) info.innerHTML = '<p>Дані про країну не знайдено.</p>';
            return;
        }

        const name = getCountryName(country) || countryName;
        const capital = Array.isArray(country?.capital)
            ? country.capital.join(', ')
            : (country?.capital || 'Немає даних');
        const population = typeof country?.population === 'number'
            ? country.population.toLocaleString('uk-UA')
            : 'Немає даних';
        const flagUrl =
            country?.flags?.png ||
            country?.flags?.svg ||
            country?.assets?.flag_png ||
            country?.assets?.flag_svg ||
            '';

        const region = country?.region || 'Немає даних';
        const area = typeof country?.area === 'number'
            ? `${country.area.toLocaleString('uk-UA')} км²`
            : 'Немає даних';
        const currencies = country?.currencies && typeof country.currencies === 'object'
            ? Object.values(country.currencies)
                .map(c => `${c.name}${c.symbol ? ` (${c.symbol})` : ''}`)
                .join(', ')
            : 'Немає даних';

        if (info) {
            info.innerHTML = `
                <p>Країна: ${name}</p>
                <p>Столиця: ${capital}</p>
                <p>Населення: ${population}</p>
                <p>Регіон: ${region}</p>
                <p>Площа: ${area}</p>
                <p>Валюта: ${currencies}</p>
                ${flagUrl ? `<img src="${flagUrl}" alt="Прапор ${name}">` : ''}
            `;
        }
    } catch (error) {
        console.error(error);
        if (info) {
            info.innerHTML = `<p style="color: #ffcccc;">Не вдалося отримати дані про країну: ${error.message}</p>`;
        }
    }
}

select?.addEventListener('change', (event) => {
    loadCountryInfo(event.target.value);
});

loadCountries();