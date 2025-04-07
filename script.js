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

function parseAddress(address) {
  // 移除多余的空格和特殊字符，并标准化分隔符
  address = address
    .replace(/\s+/g, ' ')  // 将多个空格替换为单个空格
    .replace(/，/g, ',')   // 将中文逗号替换为英文逗号
    .replace(/\./g, '.')   // 确保点号是英文点号
    .trim();

  // 格式1: 街道地址. 城市名.州缩写 邮编
  const format1 = /^(.*)\.\s*([^\.]+)\.([A-Z]{2})\s*(\d{5})$/;
  // 格式2: 街道地址, 城市名, 州缩写 邮编
  const format2 = /^(.*),\s*([^,]+),\s*([A-Z]{2})\s*(\d{5})$/;
  // 格式3: 街道地址, 城市名, 州缩写, 邮编
  const format3 = /^(.*),\s*([^,]+),\s*([A-Z]{2}),\s*(\d{5})$/;
  // 格式4: 街道地址 城市名, 州缩写 邮编
  const format4 = /^(.*)\s+([^,]+),\s*([A-Z]{2})\s*(\d{5})$/;
  // 格式5: 街道地址 城市名 州缩写 邮编
  const format5 = /^(.*)\s+([^,]+)\s+([A-Z]{2})\s*(\d{5})$/;
  // 格式6: 街道地址, 城市名, 州名 邮编
  const format6 = /^(.*),\s*([^,]+),\s*([A-Za-z\s]+)\s*(\d{5})$/;
  // 格式7: 街道地址 城市名 州名 邮编
  const format7 = /^(.*)\s+([^,]+)\s+([A-Za-z\s]+)\s*(\d{5})$/;
  // 格式8: 街道地址, 城市名, 州缩写
  const format8 = /^(.*),\s*([^,]+),\s*([A-Z]{2})$/;
  // 格式9: 街道地址 城市名, 州缩写
  const format9 = /^(.*)\s+([^,]+),\s*([A-Z]{2})$/;
  // 格式10: 街道地址, 城市名, 州缩写 邮编（带连字符）
  const format10 = /^(.*),\s*([^,]+),\s*([A-Z]{2})\s*(\d{5})$/;
  // 格式11: 街道地址 城市名, 州缩写 邮编（带连字符）
  const format11 = /^(.*)\s+([^,]+),\s*([A-Z]{2})\s*(\d{5})$/;
  
  let match = address.match(format1);
  if (!match) match = address.match(format2);
  if (!match) match = address.match(format3);
  if (!match) match = address.match(format4);
  if (!match) match = address.match(format5);
  if (!match) match = address.match(format6);
  if (!match) match = address.match(format7);
  if (!match) match = address.match(format8);
  if (!match) match = address.match(format9);
  if (!match) match = address.match(format10);
  if (!match) match = address.match(format11);
  
  if (!match) {
    // 尝试更宽松的匹配
    const looseMatch = address.match(/^(.*?)(?:,|\s+)([^,]+?)(?:,|\s+)([A-Z]{2})(?:\s+(\d{5}))?$/);
    if (looseMatch) {
      return {
        street: looseMatch[1].trim(),
        city: looseMatch[2].trim(),
        stateAbbr: looseMatch[3].trim(),
        zipCode: looseMatch[4] ? looseMatch[4].trim() : ''
      };
    }
    return null;
  }

  let stateAbbr = match[3].trim();
  
  // 如果匹配到的是州名而不是缩写，转换为缩写
  if (stateAbbr.length > 2) {
    const stateName = stateAbbr.toLowerCase().replace(/\s+/g, '-');
    for (const [abbr, name] of Object.entries(stateMap)) {
      if (name === stateName) {
        stateAbbr = abbr;
        break;
      }
    }
  }

  return {
    street: match[1].trim(),
    city: match[2].trim(),
    stateAbbr: stateAbbr,
    zipCode: match[4] ? match[4].trim() : ''
  };
}

// API Keys
const API_KEYS = {
  azure: 'KklG7KuZg9Akt5vhR0iMpjhwX3lyVIotTkXxywpFWyY1XQLnSq8pJQQJ99BDACYeBjFh5AQjAAAgAZMP2wiM',
  google: 'AIzaSyBu6JMRZmgjWhsNRGZAI_octgA9jCF6HOg'
};

// 获取当前选中的API
function getCurrentApi() {
  return document.getElementById('api-select').value;
}

// 获取API密钥
function getApiKey() {
  return API_KEYS[getCurrentApi()];
}

// 使用Google Maps API获取坐标
async function getCoordinatesGoogle(address) {
  const key = getApiKey();
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.error('API Response:', data);
      throw new Error('无法获取坐标信息');
    }
    const location = data.results[0].geometry.location;
    return [location.lng, location.lat];
  } catch (error) {
    console.error('获取坐标时出错:', error);
    console.error('API URL:', url);
    throw error;
  }
}

// 使用Google Maps API获取驾车时间
async function getDrivingTimeGoogle(origin, destination) {
  const key = getApiKey();
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin[1]},${origin[0]}&destinations=${destination[1]},${destination[0]}&mode=driving&key=${key}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.status !== 'OK' || !data.rows || data.rows.length === 0) {
      console.error('API Response:', data);
      throw new Error('无法获取驾车时间');
    }
    const element = data.rows[0].elements[0];
    if (element.status !== 'OK') {
      throw new Error('无法获取驾车时间');
    }
    return {
      duration: element.duration.value,
      distance: element.distance.value
    };
  } catch (error) {
    console.error('获取驾车时间时出错:', error);
    console.error('API URL:', url);
    throw error;
  }
}

// 修改现有的getCoordinates和getDrivingTime函数
async function getCoordinates(address) {
  const api = getCurrentApi();
  if (api === 'google') {
    return getCoordinatesGoogle(address);
  } else {
    return getCoordinatesAzure(address);
  }
}

async function getDrivingTime(origin, destination) {
  const api = getCurrentApi();
  if (api === 'google') {
    return getDrivingTimeGoogle(origin, destination);
  } else {
    return getDrivingTimeAzure(origin, destination);
  }
}

// 重命名原有的Azure函数
async function getCoordinatesAzure(address) {
  const key = getApiKey();
  const url = `https://atlas.microsoft.com/search/address/json?api-version=1.0&subscription-key=${key}&query=${encodeURIComponent(address)}&limit=1`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (!data.results || data.results.length === 0) {
      console.error('API Response:', data);
      throw new Error('无法获取坐标信息');
    }
    const position = data.results[0].position;
    return [position.lon, position.lat];
  } catch (error) {
    console.error('获取坐标时出错:', error);
    console.error('API URL:', url);
    throw error;
  }
}

async function getDrivingTimeAzure(origin, destination) {
  const key = getApiKey();
  const url = `https://atlas.microsoft.com/route/directions/json?api-version=1.0&subscription-key=${key}&query=${origin[1]},${origin[0]}:${destination[1]},${destination[0]}&travelMode=car&computeBestOrder=false`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (!data.routes || data.routes.length === 0) {
      console.error('API Response:', data);
      throw new Error('无法获取驾车时间');
    }
    return {
      duration: data.routes[0].summary.travelTimeInSeconds,
      distance: data.routes[0].summary.lengthInMeters
    };
  } catch (error) {
    console.error('获取驾车时间时出错:', error);
    console.error('API URL:', url);
    throw error;
  }
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
    const parsed = parseAddress(addressInput);
    
    if (!parsed) {
      alert('地址格式不正确，请重新输入。');
      return;
    }

    const stateFull = stateMap[parsed.stateAbbr];
    if (!stateFull || !skipCities[stateFull]) {
      alert('未找到对应州，请检查或联系管理员。');
      return;
    }

    // 显示加载状态
    const resultList = document.getElementById('result-list');
    resultList.innerHTML = '<li class="loading">正在加载店铺坐标...</li>';

    const storeCoords = await getCoordinates(addressInput);
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
