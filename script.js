// Chave de API do OpenWeatherMap.
// Observacao: em apps 100% front-end, qualquer chave colocada no JS fica visivel no navegador.
const API_KEY = '1064fb42234e2f83329960b8888b9998';

const $ = id => document.getElementById(id);

// Emojis usados pelo app.
// Eles estao escritos com Unicode para evitar bug de codificacao no arquivo.
// Para adicionar mais emotes:
// 1. Crie uma nova chave aqui, como hail: '\uXXXX'.
// 2. Use essa chave dentro de getIcon() ou getForecastIcon().
// 3. Se precisar, crie uma nova regra usando o codigo da API.
const ICONES_CLIMA = {
  thunder: '\u26C8\uFE0F',
  drizzle: '\uD83C\uDF26\uFE0F',
  rain: '\uD83C\uDF27\uFE0F',
  snow: '\u2744\uFE0F',
  fog: '\uD83C\uDF2B\uFE0F',
  sun: '\u2600\uFE0F',
  moon: '\uD83C\uDF19',
  partlyCloudyDay: '\uD83C\uDF24\uFE0F',
  partlyCloudyNight: '\uD83C\uDF19\u2601\uFE0F',
  cloud: '\u2601\uFE0F',
  thermometer: '\uD83C\uDF21\uFE0F'
};

function estaDeNoite(agora, nascerDoSol, porDoSol) {
  return agora < nascerDoSol || agora >= porDoSol;
}

// Mapeia o codigo de clima da OpenWeather para um emoji.
// id: codigo do clima. Ex: 800 = ceu limpo, 500-599 = chuva.
// agora/nascerDoSol/porDoSol: timestamps em segundos. Comparar esses
// timestamps permite saber se ja e noite na cidade pesquisada.
function getIcon(id, agora, nascerDoSol, porDoSol) {
  const noite = estaDeNoite(agora, nascerDoSol, porDoSol);

  if (id >= 200 && id < 300) return ICONES_CLIMA.thunder;
  if (id >= 300 && id < 400) return ICONES_CLIMA.drizzle;
  if (id >= 500 && id < 600) return ICONES_CLIMA.rain;
  if (id >= 600 && id < 700) return ICONES_CLIMA.snow;
  if (id >= 700 && id < 800) return ICONES_CLIMA.fog;

  if (id === 800) return noite ? ICONES_CLIMA.moon : ICONES_CLIMA.sun;
  if (id === 801) return noite ? ICONES_CLIMA.partlyCloudyNight : ICONES_CLIMA.partlyCloudyDay;
  if (id >= 802 && id < 900) return noite ? ICONES_CLIMA.partlyCloudyNight : ICONES_CLIMA.cloud;

  return ICONES_CLIMA.thermometer;
}

// Open-Meteo usa outros codigos de clima. Esta funcao traduz esses codigos
// para os mesmos emojis do app, inclusive respeitando dia/noite na previsao.
function getForecastIcon(weatherCode, isDay) {
  const dia = isDay === 1;

  if (weatherCode === 0) return dia ? ICONES_CLIMA.sun : ICONES_CLIMA.moon;
  if ([1, 2].includes(weatherCode)) return dia ? ICONES_CLIMA.partlyCloudyDay : ICONES_CLIMA.partlyCloudyNight;
  if (weatherCode === 3) return dia ? ICONES_CLIMA.cloud : ICONES_CLIMA.partlyCloudyNight;
  if ([45, 48].includes(weatherCode)) return ICONES_CLIMA.fog;
  if ([51, 53, 55, 56, 57].includes(weatherCode)) return ICONES_CLIMA.drizzle;
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) return ICONES_CLIMA.rain;
  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) return ICONES_CLIMA.snow;
  if ([95, 96, 99].includes(weatherCode)) return ICONES_CLIMA.thunder;

  return ICONES_CLIMA.thermometer;
}

function formatarHora(timestamp, timezoneOffset) {
  const horarioNaCidade = new Date((timestamp + timezoneOffset) * 1000);

  return horarioNaCidade.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  });
}

function capitalizarPrimeiraLetra(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function formatarDataLocal(timezoneOffset) {
  const dataNaCidade = new Date(Date.now() + timezoneOffset * 1000);
  const opcoesDeData = { timeZone: 'UTC' };

  const dia = dataNaCidade.toLocaleDateString('pt-BR', {
    ...opcoesDeData,
    day: 'numeric'
  });
  const mes = dataNaCidade.toLocaleDateString('pt-BR', {
    ...opcoesDeData,
    month: 'long'
  });
  const diaDaSemana = dataNaCidade.toLocaleDateString('pt-BR', {
    ...opcoesDeData,
    weekday: 'long'
  });

  return `${dia} de ${mes}, ${capitalizarPrimeiraLetra(diaDaSemana)}`;
}

function formatarHorarioForecast(isoLocal) {
  const [data, hora] = isoLocal.split('T');
  const [, mes, dia] = data.split('-');
  const dataSemFuso = new Date(`${data}T12:00:00Z`);
  const diaSemana = dataSemFuso.toLocaleDateString('pt-BR', {
    weekday: 'long',
    timeZone: 'UTC'
  });

  return `${capitalizarPrimeiraLetra(diaSemana)}, ${hora.slice(0, 5)}`;
}

function formatarDiaForecast(isoLocal) {
  const dataSemFuso = new Date(`${isoLocal}T12:00:00Z`);
  const diaSemana = dataSemFuso.toLocaleDateString('pt-BR', {
    weekday: 'short',
    timeZone: 'UTC'
  });

  return capitalizarPrimeiraLetra(diaSemana.replace('.', ''));
}

function getHoraLocalAtualISO(timezoneOffset) {
  const dataLocal = new Date(Date.now() + timezoneOffset * 1000);
  return `${dataLocal.toISOString().slice(0, 13)}:00`;
}

function mostrarErro(msg) {
  $('loading').classList.remove('visible');
  const el = $('error');
  el.textContent = msg;
  el.classList.add('visible');
}

function esconderResultados() {
  $('wth-grid').classList.remove('visible');
  $('card').classList.remove('visible');
  $('hourly-forecast-section').classList.remove('visible');
  $('weekly-forecast-card').classList.remove('visible');
  $('error').classList.remove('visible');
  $('local-date').textContent = '';
  $('hourly-forecast-list').innerHTML = '';
  $('weekly-forecast-list').innerHTML = '';
}

function renderizarClimaAtual(data, unidade) {
  const tempUnidade = unidade === 'imperial' ? '\u00B0F' : '\u00B0C';
  const ventoUnidade = unidade === 'imperial' ? 'mph' : 'km/h';
  const vento = unidade === 'imperial'
    ? Math.round(data.wind.speed)
    : Math.round(data.wind.speed * 3.6);

  $('city').textContent = `${data.name}, ${data.sys.country}`;
  $('temp').textContent = `${Math.round(data.main.temp)}${tempUnidade}`;
  $('icon').textContent = getIcon(
    data.weather[0].id,
    data.dt,
    data.sys.sunrise,
    data.sys.sunset
  );
  $('desc').textContent = data.weather[0].description;
  $('feels').textContent = `${Math.round(data.main.feels_like)}${tempUnidade}`;
  $('humidity').textContent = `${data.main.humidity}%`;
  $('wind').textContent = `${vento} ${ventoUnidade}`;
  $('visibility').textContent = `${(data.visibility / 1000).toFixed(1)} km`;
  $('temp-min').textContent = `${Math.round(data.main.temp_min)}${tempUnidade}`;
  $('temp-max').textContent = `${Math.round(data.main.temp_max)}${tempUnidade}`;
  $('pressure').textContent = `${data.main.pressure} hPa`;
  $('clouds').textContent = `${data.clouds?.all ?? 0}%`;
  $('sunrise').textContent = formatarHora(data.sys.sunrise, data.timezone);
  $('sunset').textContent = formatarHora(data.sys.sunset, data.timezone);
  $('local-date').textContent = formatarDataLocal(data.timezone);

  $('card').classList.add('visible');
  $('wth-grid').classList.add('visible');
}

async function buscarPrevisao({ latitude, longitude, timezoneOffset, unidade }) {
  const temperatura = unidade === 'imperial' ? 'fahrenheit' : 'celsius';
  const url = new URL('https://api.open-meteo.com/v1/forecast');

  url.search = new URLSearchParams({
    latitude,
    longitude,
    hourly: 'temperature_2m,weather_code,precipitation_probability,is_day',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    temperature_unit: temperatura,
    forecast_days: '7',
    timezone: 'auto'
  });

  const resposta = await fetch(url);

  if (!resposta.ok) {
    throw new Error('Falha ao buscar previsao.');
  }

  return resposta.json();
}

function renderizarPrevisaoHoraria(previsao, timezoneOffset, unidade) {
  const lista = $('hourly-forecast-list');
  const tempUnidade = unidade === 'imperial' ? '\u00B0F' : '\u00B0C';
  const horaLocalAtual = getHoraLocalAtualISO(timezoneOffset);
  const horas = previsao.hourly.time;
  let inicio = horas.findIndex(hora => hora >= horaLocalAtual);

  if (inicio === -1) inicio = 0;

  const proximasHoras = horas.slice(inicio, inicio + 23);

  lista.innerHTML = proximasHoras.map((hora, index) => {
    const posicao = inicio + index;
    const temp = Math.round(previsao.hourly.temperature_2m[posicao]);
    const chuva = previsao.hourly.precipitation_probability?.[posicao] ?? 0;
    const codigo = previsao.hourly.weather_code[posicao];
    const isDay = previsao.hourly.is_day[posicao];

    return `
      <li class="forecast-hour">
        <div class="forecast-time">${formatarHorarioForecast(hora)}</div>
        <div class="forecast-icon" aria-hidden="true">${getForecastIcon(codigo, isDay)}</div>
        <div class="forecast-temp">${temp}${tempUnidade}</div>
        <div class="forecast-rain">${chuva}% chuva</div>
      </li>
    `;
  }).join('');

  $('hourly-forecast-section').classList.add('visible');
}

function renderizarPrevisaoSemanal(previsao, unidade) {
  const lista = $('weekly-forecast-list');
  const tempUnidade = unidade === 'imperial' ? '\u00B0F' : '\u00B0C';

  lista.innerHTML = previsao.daily.time.map((dia, index) => {
    const minima = Math.round(previsao.daily.temperature_2m_min[index]);
    const maxima = Math.round(previsao.daily.temperature_2m_max[index]);
    const codigo = previsao.daily.weather_code[index];

    return `
      <li class="forecast-day">
        <section class="forecast-date">${formatarDiaForecast(dia)}</section>
        <div class="forecast-icon" aria-hidden="true">${getForecastIcon(codigo, 1)}</div>
        <div class="forecast-temp">${maxima}${tempUnidade}/${minima}${tempUnidade}</div>
      </li>
    `;
  }).join('');

  $('weekly-forecast-card').classList.add('visible');
}

async function buscarClima() {
  const cidade = $('input').value.trim();
  const unidade = $('units').value;

  esconderResultados();

  if (!cidade) {
    mostrarErro('Digite o nome de uma cidade.');
    return;
  }

  $('loading').classList.add('visible');
  $('input').blur();

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cidade)}&appid=${API_KEY}&units=${unidade}&lang=pt_br`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok || data.cod !== 200) {
      mostrarErro('Cidade nao encontrada. Tente novamente.');
      return;
    }

    renderizarClimaAtual(data, unidade);

    try {
      const previsao = await buscarPrevisao({
        latitude: data.coord.lat,
        longitude: data.coord.lon,
        timezoneOffset: data.timezone,
        unidade
      });

      renderizarPrevisaoHoraria(previsao, data.timezone, unidade);
      renderizarPrevisaoSemanal(previsao, unidade);
    } catch (err) {
      $('hourly-forecast-list').innerHTML = '<li class="forecast-empty">Nao foi possivel carregar a previsao agora.</li>';
      $('hourly-forecast-section').classList.add('visible');
    }
  } catch (err) {
    mostrarErro('Erro de conexao. Verifique sua internet.');
  } finally {
    $('loading').classList.remove('visible');
  }
}

$('buscar').addEventListener('click', buscarClima);

$('input').addEventListener('keydown', e => {
  if (e.key === 'Enter') buscarClima();
});

$('units').addEventListener('change', () => {
  if ($('input').value.trim()) buscarClima();
});
