// Chave de API do OpenWeatherMap
const API_KEY = '1064fb42234e2f83329960b8888b9998';

// Emojis usados pelo app.
// Eles estao escritos com Unicode para evitar bug de codificacao no arquivo.
// Para adicionar mais emotes:
// 1. Crie uma nova chave aqui, como hail: '\uXXXX'.
// 2. Use essa chave dentro da funcao getIcon().
// 3. Se precisar, crie uma nova regra usando o codigo de clima da OpenWeather.
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

  // Ceu limpo muda entre sol e lua dependendo do horario local da cidade.
  if (id === 800) return noite ? ICONES_CLIMA.moon : ICONES_CLIMA.sun;

  // Poucas nuvens tambem tem versao de dia e de noite.
  if (id === 801) {
    return noite ? ICONES_CLIMA.partlyCloudyNight : ICONES_CLIMA.partlyCloudyDay;
  }

  if (id >= 802 && id < 900) {
    return noite ? ICONES_CLIMA.partlyCloudyNight : ICONES_CLIMA.cloud;
  }

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

function mostrarErro(msg) {
  document.getElementById('loading').classList.remove('visible');
  const el = document.getElementById('error');
  el.textContent = msg;
  el.classList.add('visible');
}

async function buscarClima() {
  const cidade = document.getElementById('input').value.trim();
  const unidade = document.getElementById('units')?.value || 'metric';
  const tempUnidade = unidade === 'imperial' ? '\u00B0F' : '\u00B0C';
  const ventoUnidade = unidade === 'imperial' ? 'mph' : 'km/h';

  // Esconde resultados anteriores antes de buscar novos dados.
  document.getElementById('card').classList.remove('visible');
  document.getElementById('weekly-forecast-card')?.classList.remove('visible');
  document.getElementById('error').classList.remove('visible');
  document.getElementById('local-date').textContent = '';

  if (!cidade) {
    mostrarErro('Digite o nome de uma cidade.');
    return;
  }

  document.getElementById('loading').classList.add('visible');

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cidade)}&appid=${API_KEY}&units=${unidade}&lang=pt_br`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.cod !== 200) {
      mostrarErro('Cidade n\u00E3o encontrada. Tente novamente.');
      return;
    }

    const vento = unidade === 'imperial'
      ? Math.round(data.wind.speed)
      : Math.round(data.wind.speed * 3.6);

    document.getElementById('city').textContent = `${data.name}, ${data.sys.country}`;
    document.getElementById('temp').textContent = `${Math.round(data.main.temp)}${tempUnidade}`;
    document.getElementById('icon').textContent = getIcon(
      data.weather[0].id,
      data.dt,
      data.sys.sunrise,
      data.sys.sunset
    );
    document.getElementById('desc').textContent = data.weather[0].description;
    document.getElementById('feels').textContent = `${Math.round(data.main.feels_like)}${tempUnidade}`;
    document.getElementById('humidity').textContent = `${data.main.humidity}%`;
    document.getElementById('wind').textContent = `${vento} ${ventoUnidade}`;
    document.getElementById('visibility').textContent = `${(data.visibility / 1000).toFixed(1)} km`;
    document.getElementById('temp-min').textContent = `${Math.round(data.main.temp_min)}${tempUnidade}`;
    document.getElementById('temp-max').textContent = `${Math.round(data.main.temp_max)}${tempUnidade}`;
    document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;
    document.getElementById('clouds').textContent = `${data.clouds?.all ?? 0}%`;
    document.getElementById('sunrise').textContent = formatarHora(data.sys.sunrise, data.timezone);
    document.getElementById('sunset').textContent = formatarHora(data.sys.sunset, data.timezone);
    document.getElementById('local-date').textContent = formatarDataLocal(data.timezone);

    document.getElementById('card').classList.add('visible');
    document.getElementById('weekly-forecast-card')?.classList.add('visible');
  } catch (err) {
    mostrarErro('Erro de conex\u00E3o. Verifique sua internet.');
  } finally {
    document.getElementById('loading').classList.remove('visible');
  }
}

// Busca ao pressionar Enter.
document.getElementById('input').addEventListener('keydown', e => {
  if (e.key === 'Enter') buscarClima();
});
