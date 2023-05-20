let map; //основная переменная с картой

let data_0; // массив настроек

let engines; // массив подложек


let isCustomSequence = false


let markerList = [];

var selectedMarkers = [];

var myLayers = {};
var myMarkers = {};

var layerControl;

var osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap",
});

var google = L.tileLayer(
  "http://{s}.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}",
  {
    subdomains: ["mt0"],
    attribution: "© Google maps",
  }
);

var baseMaps = {
  OpenStreetMap: osm,
  "Google maps": google,
};

//------------------------------------------------------------------------------------------------------------------------
//-- Функции

const clearActiveMarkers = () => {
  markerList.forEach((marker, index) => {
    setMarkerUnActive(marker);
  });
  selectedMarkers = [];
};

function CreatePolyline(options) {
  const polyline = {
    color: options.color != undefined ? options.color : "red",
    weight: options.weight != undefined ? options.weight : 3,
    opacity: options.opacity != undefined ? options.opacity : 0.9,
  };

  return polyline;
}

const setMarkerActive = (marker) => {
  try {
    L.DomUtil.addClass(marker._icon, "my-div-icon_active");
  } catch (error) {}


  selectedMarkers.push(marker.options.id);

  // console.log({ marker: marker.options })
  const color = marker.options.icon.options.color
  const number = isCustomSequence ? selectedMarkers.length :  marker.options.icon.options.number
  const numberRoute = isCustomSequence ? selectedMarkers.length : marker.options.icon.options.numberRoute


  const myIcon = L.divIcon({
    className: `my-div-icon my-div-icon_active`,
    iconSize: 50,
    color: color,
    number: number,
    numberRoute: numberRoute,
    html: `<div class="my-div-icon_inner">${Boolean(numberRoute) ? `<span class="my-div-icon_inner_number-route">${numberRoute}</span>` : ''}<span class="my-div-icon_inner_number">${Boolean(number) ? number : ''}</span><svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="-4 0 36 36"><g fill="none" fill-rule="evenodd"><path fill="${color}" d="M14 0c7.732 0 14 5.641 14 12.6C28 23.963 14 36 14 36S0 24.064 0 12.6C0 5.641 6.268 0 14 0Z"/><circle cx="14" cy="14" r="7" fill="#fff" fill-rule="nonzero"/></g></svg></div>`,
  });


  
  
  setTimeout(() => {
    marker.setIcon(myIcon);
  }, 300);
};

const setMarkerUnActive = (marker) => {
  try {
    L.DomUtil.removeClass(marker._icon, "my-div-icon_active");
  } catch (error) {}


  const color = marker.options.icon.options.color
  const number = isCustomSequence ? 0 :  marker.options.icon.options.number
  const numberRoute = isCustomSequence ? 0 : marker.options.icon.options.numberRoute

  const myIcon = L.divIcon({
    className: `my-div-icon`,
    iconSize: 50,
    color: color,
    number: number,
    numberRoute: numberRoute,
    html: `<div class="my-div-icon_inner">${Boolean(numberRoute) ? `<span class="my-div-icon_inner_number-route">${numberRoute}</span>` : ''}<span class="my-div-icon_inner_number">${Boolean(number) ? number : ''}</span><svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="-4 0 36 36"><g fill="none" fill-rule="evenodd"><path fill="${color}" d="M14 0c7.732 0 14 5.641 14 12.6C28 23.963 14 36 14 36S0 24.064 0 12.6C0 5.641 6.268 0 14 0Z"/><circle cx="14" cy="14" r="7" fill="#fff" fill-rule="nonzero"/></g></svg></div>`,
  });

  selectedMarkers = selectedMarkers.filter(
    (item) => item !== marker.options.id
  );
  setTimeout(() => {
    marker.setIcon(myIcon);
  }, 300);
};

function addMarker(data_in, icon, comment) {
  if (icon === undefined) {
    icon = myIcon;
  }

  L.marker(data_in, { icon: icon }).addTo(map).bindPopup(comment);
}

function cleanLayersGroup(id) {
  // удалить все слои пути id = route_0
  myLayers[id].clearLayers();

  layerControl.removeLayer(myLayers[id]);
}

// рисуем кривую по геометрии в формате geoJSON
// на основе функции "addPolylines"
//координаты хранятся в data_in.routes[0].geometry.coordinates
//let arCoordinates = data_in.routes[0].geometry.coordinates;
//
function RouteBuild(data_in, parseNeed = true) {
  if (parseNeed) {
    data_in = JSON.parse(data_in);
  }

  const markers = L.markerClusterGroup(); //https://github.com/Leaflet/Leaflet.markercluster
  
  const circleList = [];
  const route = data_in.route;
  const deliveryPoints = data_in.deliveryPoints;
  const myRoute = [];

  myMarkers[route.id] = []

  const color = route.color || "red";

  let options = { color: color };

  //alert(1);

  var divIconGhost = L.divIcon({
    className: "my-div-icon",
    iconSize: 25,
    html: `<div class="my-div-icon_inner"><svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="-4 0 36 36"><g fill="none" fill-rule="evenodd"><path fill="${color}" d="M14 0c7.732 0 14 5.641 14 12.6C28 23.963 14 36 14 36S0 24.064 0 12.6C0 5.641 6.268 0 14 0Z"/><circle cx="14" cy="14" r="7" fill="#fff" fill-rule="nonzero"/></g></svg></div>`,
  });

  let polylinePoints = [];
  let arCoordinates = route.geometry;

  //треба поменять местами Долготу и Ширину
  for (let i = 0; i < arCoordinates.length; i++) {
    polylinePoints.push(new L.LatLng(arCoordinates[i][1], arCoordinates[i][0]));
  }

  //alert(2);

  //создаём линию маршрута
  const polyline = new L.Polyline(polylinePoints, CreatePolyline(options));

  //alert(route.lineColor);

  if (polylinePoints.length != 0) {
    //layerName = map.addLayer(polyline);	// не добавляем линию на карту саму по себе
    myRoute.push(polyline); // но добавляем линию к нашему слою

    //-- показываем всю линию
    map.fitBounds(polyline.getBounds());
  }

  deliveryPoints.forEach((item, index) => {
    const coord = [];
    coord.push(item.ltd, item.lng);

    var myIcon = L.divIcon({
      className: `my-div-icon my-div-icon_${route.id}`,
      iconSize: 50,
      color: color,
      number: item.number,
      numberRoute: item.numberRoute,
      html: `<div class="my-div-icon_inner">${Boolean(item.numberRoute) ? `<span class="my-div-icon_inner_number-route">${item.numberRoute}</span>` : ''}<span class="my-div-icon_inner_number">${Boolean(item.number) ? item.number : ''}</span><svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="-4 0 36 36"><g fill="none" fill-rule="evenodd"><path fill="${color}" d="M14 0c7.732 0 14 5.641 14 12.6C28 23.963 14 36 14 36S0 24.064 0 12.6C0 5.641 6.268 0 14 0Z"/><circle cx="14" cy="14" r="7" fill="#fff" fill-rule="nonzero"/></g></svg></div>`,
    });

    let markerOptions = {
      icon: myIcon,
      title: item.textHover,
      id: item.id,
      route_id: route.id
      // pane: "markers"
    };

    let marker = L.marker(coord, markerOptions).bindPopup(
      `
      ${
        Boolean(item.textPopup.partner)
          ? `<div><b>Контрагент:</b>${item.textPopup.partner}</div>`
          : ""
      }
      ${
        Boolean(item.textPopup.weight)
          ? `<div><b>Вес:</b>${item.textPopup.weight}</div>`
          : ""
      }
      ${
        Boolean(item.textPopup.volume)
          ? `<div><b>Объем:</b>${item.textPopup.volume}</div>`
          : ""
      }
      ${
        Boolean(item.textPopup.address)
          ? `<div><b>Адрес:</b>${item.textPopup.address}</div>`
          : ""
      }
      ${
        Boolean(item.textPopup.date)
          ? `<div><b>Интервал доставки:</b>${item.textPopup.date}</div>`
          : ""
      }
      ${
        Boolean(item.textPopup.comment)
          ? `<div><b>Комментарий:</b>${item.textPopup.comment}</div>`
          : ""
      }
      `,
      {
        offset: [0, -20],
      }
    );

    var circle = L.circleMarker(coord, {
      ...markerOptions,
      color: color,
      icon: divIconGhost,
      opacity: 0.25,
      pane: "markers",
    });

    circleList.push(circle);

    markerList.push(marker);
    myMarkers[route.id].push(marker)
    markers.addLayer(marker);
    
  });
  // markers.addLayer(polyline);

  markers.on("click", function (e) {
    const marker = e.sourceTarget;
    // console.log(setMarkerActive)
    if (selectedMarkers.includes(marker.options.id)) {
      setMarkerUnActive(marker);
      marker.closePopup();
    } else {
      setMarkerActive(marker);
    }

    if (isCustomSequence) {
      drawPoliline()
    }
  });

  myLayers[route.id] = L.layerGroup([polyline, markers, ...circleList], {
    color: color
  });

  

  // console.log({ layerControl })
  layerControl.addOverlay(myLayers[route.id], route.id);

  myLayers[route.id].addTo(map);
}

//---------------------------------------------------------------------------

//---------------------------------------------------------------------------

var myIcon = L.divIcon({
  className: "my-div-icon",
  iconSize: 50,
  html: '<div class="my-div-icon_inner"><svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="-4 0 36 36"><g fill="none" fill-rule="evenodd"><path fill="#3276c3" d="M14 0c7.732 0 14 5.641 14 12.6C28 23.963 14 36 14 36S0 24.064 0 12.6C0 5.641 6.268 0 14 0Z"/><circle cx="14" cy="14" r="7" fill="#fff" fill-rule="nonzero"/></g></svg></div>',
});

var myIconDefault = myIcon


var myIconActive = L.divIcon({
  className: "my-div-icon my-div-icon_active",
  iconSize: 50,
  html: '<div class="my-div-icon_inner"><svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="-4 0 36 36"><g fill="none" fill-rule="evenodd"><path fill="#3276c3" d="M14 0c7.732 0 14 5.641 14 12.6C28 23.963 14 36 14 36S0 24.064 0 12.6C0 5.641 6.268 0 14 0Z"/><circle cx="14" cy="14" r="7" fill="#fff" fill-rule="nonzero"/></g></svg></div>',
});

var myIconStock = L.icon({
  iconUrl: "/img/icon.png",
  iconSize: [64, 64],
});

//------------------------------------------------------------------------------------------

function initMap(zoom = 4, showMarker = true) {
  mapCenter = [data_0.lat, data_0.lng];

  map.setView(mapCenter, zoom);

  engines = data_0.engines;

  if (engines && engines.length > 0) {
    baseMaps = {};
    for (let index = 0; index < engines.length; index++) {
      const element = engines[index];
      baseMaps[element.name] = L.tileLayer(element.link);
    }

    layerControl = L.control.layers(baseMaps).addTo(map);

    L.easyButton('<span class="btn-toogle-number">№</span>', function(btn, map){
      document.body.classList.toggle('show-numberRoute');
  }).addTo(map);

    if (baseMaps.google) {
      baseMaps.google.addTo(map);
    } else if (baseMaps["GoogleMap"]) {
      baseMaps["GoogleMap"].addTo(map);
    }
  }

  if (showMarker) {
    addMarker(mapCenter, myIconStock, data_0.comment);
  }
}

// Очистить карту от всего
function ResetMap() {
  map.eachLayer((layer) => map.removeLayer(layer));
}

function createMap() {
  map = L.map("map", {
    boxZoom: false, //-- отключить выделение кнопкой SHIFT
    selectArea: true, //-- запускаем библиотеку выбор маркетор
  });

  map._layersMaxZoom = 19;

  //-- В выделенной области перебираем маркеры и кладем их в массив markers
  map.on("areaselected", (e) => {
    console.log(e);
    console.log(e.bounds.toBBoxString());

    L.Util.requestAnimFrame(function () {
      markerList.forEach(function (marker, index, array) {
        if (e.bounds.contains(marker.getLatLng())) {
          setMarkerActive(marker);
        }
      });
    });
  });



  map.selectArea.setControlKey(true);

  const areaSelection = new window.leafletAreaSelection.DrawAreaSelection({
    onPolygonReady: (polygon) => {
      L.Util.requestAnimFrame(function () {
        markerList.forEach(function (marker, index, array) {
          if (polygon.getBounds().contains(marker.getLatLng())) {
            setMarkerActive(marker);
          }
        });
      });
    },
  });

  map.addControl(areaSelection);

  map.createPane("markers");
  map.getPane("markers").style.zIndex = 401;
}

//-- функция служит для возврата с Карты в 1с массив выделенных координат
function returnMarkers() {
  if (selectedMarkers.length != 0) {
    return JSON.stringify(selectedMarkers);
  }
}

function clearMarkers() {
  selectedMarkers = [];
}

//  ищем маркер на маршруте и ставим в центр карты и открыаем его попап
function setMarkerCenter(data2) {
  if (!myLayers[data2.route_id]) {
    alert(`маршрут ${data2.route_id} не отображен на карте `);
  }
  markerList.forEach((marker) => {
    if (marker.options.id === data2.id) {
      setTimeout(() => {
        marker.openPopup();
      }, 500);
      setMarkerActive(marker);
    }
  });

  map.setView([data2.ltd, data2.lng], (zoom = 19));
}



// кастомная последовательность маршрута
async function customSequence(data_in, parseNeed = true) {
  isCustomSequence = true
  if (parseNeed) {
    data_in = JSON.parse(data_in);
  }

  

  ResetMap() // ОЧИСТИМ карту
  clearMarkers() // и выделенные маркеры на всякий случай

  const id = data_in.route && data_in.route.id
  
  map.addLayer(baseMaps["GoogleMap"]) // вернем подложку

  addMarker([data_0.lat, data_0.lng], myIconStock, data_0.comment); //поставим маркер склада
  
  if (myLayers[id]) {  // если роут с таким id уже есть то вернем его тоже на карту
    map.addLayer(myLayers[id])
  } else { // если нет то нарисуем как обычно
    RouteBuild(data_in, false)
  }

  const color = myLayers[id].options.color

  const myIcon = L.divIcon({
    className: `my-div-icon my-div-icon_${id}`,
    iconSize: 50,
    color: color,
    html: `<div class="my-div-icon_inner"><svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="-4 0 36 36"><g fill="none" fill-rule="evenodd"><path fill="${color}" d="M14 0c7.732 0 14 5.641 14 12.6C28 23.963 14 36 14 36S0 24.064 0 12.6C0 5.641 6.268 0 14 0Z"/><circle cx="14" cy="14" r="7" fill="#fff" fill-rule="nonzero"/></g></svg></div>`,
  });


  L.Util.requestAnimFrame(function () {
    myMarkers[id].forEach(function (marker, index, array) {
      marker.setIcon(myIcon)
    });
  });

 
  
}
// --------------------

async function loadJson(url) {
  const res = await fetch(url);
  const json = await res.json();
  return json;
}

async function start() {
  const dataInit = await loadJson("./data/json_0.json");
  
  
  const data_route0 = await loadJson("./data/route/json_0.json");
  const data_route1 = await loadJson("./data/route/json_1.json");
  
  
  const data2 = await loadJson("./data/next/2.json");

  window.data2 = data2;

  window.data_route1 = data_route1

  data_0 = dataInit;

  createMap();
  initMap(4, true);

  console.time("FirstWay");
  
  RouteBuild(JSON.stringify(data_route0));
  RouteBuild(JSON.stringify(data_route1));
  
  console.timeEnd("FirstWay");
}




(function () {
  start();
})();
