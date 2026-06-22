// Chave de API do OpenWeatherMap.
// Observacao: em apps 100% front-end, qualquer chave colocada no JS fica visivel no navegador.
const API_KEY = '1064fb42234e2f83329960b8888b9998';

// Funcao de atalho: em vez de escrever "document.getElementById('algo')" toda hora,
// usamos "$('algo')". Faz exatamente a mesma coisa, só economiza digitação.
const $ = id => document.getElementById(id);

// Caminhos das IMAGENS usadas pelo app (antes eram emojis, agora sao arquivos .png).
// Cada chave (thunder, rain, sun, etc.) representa uma condicao de tempo.
// Para adicionar mais icones:
// 1. Coloque o arquivo de imagem dentro da pasta assets/images/.
// 2. Crie uma nova chave aqui, como hail: 'assets/images/granizo.png'.
// 3. Use essa chave dentro de getIcon() ou getForecastIcon().
// 4. Se precisar, crie uma nova regra usando o codigo da API.
const ICONES_CLIMA = {
  thunder: 'assets/images/tempestade.png',
  drizzle: 'assets/images/chuva.png',
  rain: 'assets/images/chuva-forte.png',
  snow: 'assets/images/neve.png',
  fog: 'assets/images/nevoa.png',
  sun: 'assets/images/ceu-limpo1.png',
  moon: 'assets/images/ceu-limpo2.png',
  partlyCloudyDay: 'assets/images/parcialmente-nublado-sol.png',
  partlyCloudyNight: 'assets/images/parcialmente-nublado-lua.png',
  cloud: 'assets/images/nublado.png',
  thermometer: 'assets/images/nublado.png', // usado como imagem padrao/de seguranca
};

// Diz se, na hora atual, ja esta de noite na cidade pesquisada.
// agora/nascerDoSol/porDoSol chegam da API como timestamps (numeros), entao
// basta comparar os numeros: se "agora" for menor que o nascer do sol, ou
// maior/igual ao por do sol, entao e noite.
function estaDeNoite(agora, nascerDoSol, porDoSol) {
  return agora < nascerDoSol || agora >= porDoSol;
}

// Recebe o codigo de clima da OpenWeather e devolve o CAMINHO da imagem certa.
// id: codigo do clima. Ex: 800 = ceu limpo, 500-599 = chuva.
// agora/nascerDoSol/porDoSol: timestamps em segundos, usados so para saber se e dia ou noite.
// IMPORTANTE: esta funcao nao mostra a imagem na tela, ela so retorna o caminho
// (uma string de texto, tipo "assets/images/chuva.png"). Quem mostra na tela
// e o codigo em renderizarClimaAtual(), que coloca esse caminho num <img src="...">.
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

// Open-Meteo (usado na previsao) tem codigos de clima diferentes da OpenWeather.
// Esta funcao traduz esses outros codigos para os MESMOS caminhos de imagem do app,
// respeitando se e dia ou noite (isDay vem da API: 1 = dia, 0 = noite).
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

// Transforma um timestamp (numero) em horario legivel, tipo "14:30",
// respeitando o fuso horario (timezoneOffset) da cidade pesquisada.
function formatarHora(timestamp, timezoneOffset) {
  const horarioNaCidade = new Date((timestamp + timezoneOffset) * 1000);

  return horarioNaCidade.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  });
}

// Deixa a primeira letra de um texto em maiusculo. Ex: "segunda-feira" -> "Segunda-feira".
function capitalizarPrimeiraLetra(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Monta a data atual da cidade pesquisada por extenso, tipo "22 de junho, Segunda-feira".
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

// Formata um horario da previsao (que vem como texto tipo "2026-06-22T14:00")
// para algo legivel, tipo "Segunda-feira, 14:00".
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

// Formata uma data da previsao semanal (tipo "2026-06-23") para uma versao curta,
// tipo "Ter" (terca-feira abreviado).
function formatarDiaForecast(isoLocal) {
  const dataSemFuso = new Date(`${isoLocal}T12:00:00Z`);
  const diaSemana = dataSemFuso.toLocaleDateString('pt-BR', {
    weekday: 'short',
    timeZone: 'UTC'
  });

  return capitalizarPrimeiraLetra(diaSemana.replace('.', ''));
}

// Descobre qual e a "hora local atual" da cidade pesquisada, no formato que a
// API de previsao usa (ex: "2026-06-22T14:00"). Serve para saber a partir de
// qual hora devemos comecar a mostrar a previsao horaria.
function getHoraLocalAtualISO(timezoneOffset) {
  const dataLocal = new Date(Date.now() + timezoneOffset * 1000);
  return `${dataLocal.toISOString().slice(0, 13)}:00`;
}

// Mostra uma mensagem de erro na tela (ex: "Cidade nao encontrada") e
// esconde o aviso de "carregando".
function mostrarErro(msg) {
  $('loading').classList.remove('visible');
  const el = $('error');
  el.textContent = msg;
  el.classList.add('visible');
}

// Limpa a tela antes de uma nova busca: esconde resultados antigos e
// mensagens de erro, para nao misturar com a busca nova.
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

// Pega os dados do clima atual (que vieram da API) e preenche cada
// elemento da tela (nome da cidade, temperatura, icone, umidade, etc.).
function renderizarClimaAtual(data, unidade) {
  const tempUnidade = unidade === 'imperial' ? '\u00B0F' : '\u00B0C';
  const ventoUnidade = unidade === 'imperial' ? 'mph' : 'km/h';
  const vento = unidade === 'imperial'
    ? Math.round(data.wind.speed)
    : Math.round(data.wind.speed * 3.6);

  $('city').textContent = `${data.name}, ${data.sys.country}`;
  $('temp').textContent = `${Math.round(data.main.temp)}${tempUnidade}`;

  // getIcon() devolve um CAMINHO de imagem (texto), tipo "assets/images/chuva.png".
  // Como #icon agora e uma tag <img> (veja o HTML), usamos ".src" para dizer
  // ao navegador qual arquivo de imagem carregar, e ".alt" como texto alternativo
  // (importante para acessibilidade e para quando a imagem nao carrega).
  const caminhoIcone = getIcon(
    data.weather[0].id,
    data.dt,
    data.sys.sunrise,
    data.sys.sunset
  );
  $('icon').src = caminhoIcone;
  $('icon').alt = data.weather[0].description;

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

// Busca a previsao do tempo (proximos dias/horas) na API Open-Meteo,
// usando a latitude/longitude da cidade que ja veio da busca anterior.
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

// Monta a lista de previsao das proximas ~23 horas e coloca na tela.
// Para cada hora, cria um <li> com horario, icone (agora uma <img>), temperatura e chance de chuva.
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

    // getForecastIcon() devolve um caminho de imagem (texto). Por isso usamos
    // uma tag <img src="..."> aqui dentro do template, em vez de uma <div> vazia.
    return `
      <li class="forecast-hour">
        <div class="forecast-time">${formatarHorarioForecast(hora)}</div>
        <img class="forecast-icon" src="${getForecastIcon(codigo, isDay)}" alt="Condi\u00e7\u00e3o do tempo" />
        <div class="forecast-temp">${temp}${tempUnidade}</div>
        <div class="forecast-rain">${chuva}% chuva</div>
      </li>
    `;
  }).join('');

  $('hourly-forecast-section').classList.add('visible');
}

// Monta a lista de previsao dos proximos dias e coloca na tela.
// Para cada dia, cria um <li> com o nome do dia, icone (agora uma <img>) e temperaturas min/max.
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
        <img class="forecast-icon" src="${getForecastIcon(codigo, 1)}" alt="Condi\u00e7\u00e3o do tempo" />
        <div class="forecast-temp">${maxima}${tempUnidade}/${minima}${tempUnidade}</div>
      </li>
    `;
  }).join('');

  $('weekly-forecast-card').classList.add('visible');
}

// Funcao principal: roda quando o usuario clica em "Buscar" ou aperta Enter.
// Ela: 1) le a cidade digitada, 2) busca o clima atual na OpenWeather,
// 3) mostra esses dados na tela, 4) busca a previsao na Open-Meteo,
// 5) mostra a previsao na tela. Cada etapa tem tratamento de erro.
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

// "Ouvintes de evento": dizem ao navegador o que fazer quando o usuario interage.
// Aqui: clicar no botao "Buscar" -> roda buscarClima().
$('buscar').addEventListener('click', buscarClima);

// Apertar Enter dentro do campo de texto -> tambem roda buscarClima().
$('input').addEventListener('keydown', e => {
  if (e.key === 'Enter') buscarClima();
});

// Trocar a unidade (Celsius/Fahrenheit) -> busca o clima de novo, se ja
// houver uma cidade digitada, para atualizar os valores na nova unidade.
$('units').addEventListener('change', () => {
  if ($('input').value.trim()) buscarClima();
});