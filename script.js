    // Chave de API do OpenWeatherMap
    const API_KEY = '1064fb42234e2f83329960b8888b9998';

    // Mapeia código de clima para emoji
    function getIcon(id) {
      if (id >= 200 && id < 300) return '⛈️'; 
      if (id >= 300 && id < 400) return '🌦️';
      if (id >= 500 && id < 600) return '🌧️';
      if (id >= 600 && id < 700) return '❄️';
      if (id >= 700 && id < 800) return '🌫️';
      if (id === 800)             return '☀️';
      if (id === 801)             return '🌤️';
      if (id >= 802 && id < 900) return '☁️';
      return '🌡️';
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

    async function buscarClima() {
      const cidade = document.getElementById('input').value.trim();

      // Esconde tudo
      document.getElementById('card').classList.remove('visible');
      document.getElementById('error').classList.remove('visible');
      document.getElementById('local-date').textContent = '';

      if (!cidade) {
        mostrarErro('Digite o nome de uma cidade.');
        return;
      }

      // Mostra loading
      document.getElementById('loading').classList.add('visible');

      try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cidade)}&appid=${API_KEY}&units=metric&lang=pt_br`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.cod !== 200) {
          mostrarErro('Cidade não encontrada. Tente novamente.');
          return;
        }

        // Preenche os dados
        document.getElementById('city').textContent = `${data.name}, ${data.sys.country}`;
        document.getElementById('temp').textContent = `${Math.round(data.main.temp)}°`;
        document.getElementById('icon').textContent = getIcon(data.weather[0].id);
        document.getElementById('desc').textContent = data.weather[0].description;
        document.getElementById('feels').textContent = `${Math.round(data.main.feels_like)}°C`;
        document.getElementById('humidity').textContent = `${data.main.humidity}%`;
        document.getElementById('wind').textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
        document.getElementById('visibility').textContent = `${(data.visibility / 1000).toFixed(1)} km`;
        document.getElementById('temp-min').textContent = `${Math.round(data.main.temp_min)}\u00B0C`;
        document.getElementById('temp-max').textContent = `${Math.round(data.main.temp_max)}\u00B0C`;
        document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;
        document.getElementById('clouds').textContent = `${data.clouds?.all ?? 0}%`;
        document.getElementById('sunrise').textContent = formatarHora(data.sys.sunrise, data.timezone);
        document.getElementById('sunset').textContent = formatarHora(data.sys.sunset, data.timezone);
        document.getElementById('local-date').textContent = formatarDataLocal(data.timezone);

        document.getElementById('card').classList.add('visible');

      } catch (err) {
        mostrarErro('Erro de conexão. Verifique sua internet.');
      } finally {
        document.getElementById('loading').classList.remove('visible');
      }
    }

    function mostrarErro(msg) {
      document.getElementById('loading').classList.remove('visible');
      const el = document.getElementById('error');
      el.textContent = msg;
      el.classList.add('visible');
    }

    // Busca ao pressionar Enter
    document.getElementById('input').addEventListener('keydown', e => {
      if (e.key === 'Enter') buscarClima();
    });
