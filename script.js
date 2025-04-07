let skipCities = {};
const stateMap = {
    AL: "alabama",
    AK: "alaska",
    AZ: "arizona",
    AR: "arkansas",
    CA: "california",
    CO: "colorado",
    CT: "connecticut",
    DE: "delaware",
    FL: "florida",
    GA: "georgia",
    HI: "hawaii",
    ID: "idaho",
    IL: "illinois",
    IN: "indiana",
    IA: "iowa",
    KS: "kansas",
    KY: "kentucky",
    LA: "louisiana",
    ME: "maine",
    MD: "maryland",
    MA: "massachusetts",
    MI: "michigan",
    MN: "minnesota",
    MS: "mississippi",
    MO: "missouri",
    MT: "montana",
    NE: "nebraska",
    NV: "nevada",
    NH: "new-hampshire",
    NJ: "new-jersey",
    NM: "new-mexico",
    NY: "new-york",
    NC: "north-carolina",
    ND: "north-dakota",
    OH: "ohio",
    OK: "oklahoma",
    OR: "oregon",
    PA: "pennsylvania",
    RI: "rhode-island",
    SC: "south-carolina",
    SD: "south-dakota",
    TN: "tennessee",
    TX: "texas",
    UT: "utah",
    VT: "vermont",
    VA: "virginia",
    WA: "washington",
    WV: "west-virginia",
    WI: "wisconsin",
    WY: "wyoming"
};

async function loadCities() {
  const res = await fetch('./public/skipCities.json');
  skipCities = await res.json();
}

async function parseAddress(address) {
  return new Promise((resolve, reject) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: address, componentRestrictions: { country: 'US' } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const components = results[0].address_components;
        let street = '', city = '', state = '', zipCode = '';

        for (const component of components) {
          const types = component.types;
          if (types.includes('street_number') || types.includes('route')) {
            street = street ? `${street} ${component.long_name}` : component.long_name;
          } else if (types.includes('locality') || types.includes('sublocality')) {
            city = component.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            state = component.short_name;
          } else if (types.includes('postal_code')) {
            zipCode = component.long_name;
          }
        }

        if (!state) {
          reject(new Error('无法识别州信息'));
          return;
        }

        resolve({
          street: street,
          city: city,
          stateAbbr: state,
          zipCode: zipCode,
          fullAddress: results[0].formatted_address,
          location: results[0].geometry.location
        });
      } else {
        reject(new Error('无法解析地址'));
      }
    });
  });
}

async function getCoordinates(address) {
  return new Promise((resolve, reject) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: address }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        resolve([location.lng(), location.lat()]);
      } else {
        reject(new Error('无法获取坐标信息'));
      }
    });
  });
}

async function getDrivingTime(origin, destination) {
  return new Promise((resolve, reject) => {
    const service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix({
      origins: [{ lat: origin[1], lng: origin[0] }],
      destinations: [{ lat: destination[1], lng: destination[0] }],
      travelMode: google.maps.TravelMode.DRIVING,
      unitSystem: google.maps.UnitSystem.IMPERIAL
    }, (response, status) => {
      if (status === 'OK' && response.rows[0].elements[0].status === 'OK') {
        const element = response.rows[0].elements[0];
        resolve({
          duration: element.duration.value,
          distance: element.distance.value
        });
      } else {
        reject(new Error('无法获取驾车时间'));
      }
    });
  });
}

function formatDistance(meters) {
  const miles = (meters * 0.000621371).toFixed(1);
  return `${miles} miles`;
}

function formatDuration(seconds) {
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minutes`;
}

document.getElementById('calculate-btn').onclick = async () => {
  try {
    const addressInput = document.getElementById('store-address').value.trim();
    const parsed = await parseAddress(addressInput);
    
    if (!parsed) {
      alert('地址解析失败，请检查地址格式。');
      return;
    }

    const stateFull = stateMap[parsed.stateAbbr];
    if (!stateFull || !skipCities[stateFull]) {
      alert(`未找到 ${parsed.stateAbbr} 州的城市数据，请联系管理员。`);
      return;
    }

    // 显示加载状态
    const resultList = document.getElementById('result-list');
    resultList.innerHTML = '<li class="loading">正在加载店铺坐标...</li>';

    const storeCoords = [parsed.location.lng(), parsed.location.lat()];
    resultList.innerHTML = '<li class="loading">店铺坐标已加载，开始并行计算城市距离...</li>';

    const cities = skipCities[stateFull];
    const totalCities = cities.length;
    let processedCities = 0;

    // 创建所有城市的处理任务
    const cityTasks = cities.map(async (city) => {
      try {
        processedCities++;
        resultList.innerHTML = `<li class="loading">正在并行处理第 ${processedCities}/${totalCities} 个城市...</li>`;

        const cityCoords = await getCoordinates(`${city}, ${parsed.stateAbbr}`);
        const routeInfo = await getDrivingTime(cityCoords, storeCoords);

        const mapsLink = `https://www.google.com/maps/dir/?api=1&origin=${cityCoords[1]},${cityCoords[0]}&destination=${storeCoords[1]},${storeCoords[0]}&travelmode=driving`;

        return {
          city,
          duration: routeInfo.duration,
          distance: routeInfo.distance,
          mapsLink,
          status: 'success'
        };
      } catch (error) {
        console.error(`处理城市 ${city} 时出错:`, error);
        return {
          city,
          error: true,
          status: 'error'
        };
      }
    });

    // 并行执行所有任务
    const results = await Promise.all(cityTasks);

    // 显示计算完成状态
    resultList.innerHTML = '<li class="loading">计算完成，正在排序结果...</li>';

    // 按开车时间排序
    results.sort((a, b) => {
      if (a.status === 'error') return 1;
      if (b.status === 'error') return -1;
      return a.duration - b.duration;
    });

    // 显示最终结果
    resultList.innerHTML = '';
    results.forEach((result, index) => {
      const li = document.createElement('li');
      if (result.status === 'error') {
        li.innerHTML = `<span style="color: #666">${index + 1}. 从 <strong>${result.city}</strong> 到店铺: 获取数据失败</span>`;
      } else {
        li.innerHTML = `
          <a href="${result.mapsLink}" target="_blank">
            ${index + 1}. 从 <strong>${result.city}</strong> 到店铺: ${formatDuration(result.duration)} (${formatDistance(result.distance)})
          </a>`;
      }
      resultList.appendChild(li);
    });

    // 添加统计信息
    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const statsLi = document.createElement('li');
    statsLi.className = 'stats';
    statsLi.innerHTML = `计算完成: ${successCount} 个成功, ${errorCount} 个失败`;
    resultList.appendChild(statsLi);

  } catch (error) {
    console.error('计算过程中出错:', error);
    resultList.innerHTML = `<li class="error">计算过程中出现错误: ${error.message}</li>`;
  }
};

window.onload = loadCities;
