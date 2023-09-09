let map; //основная переменная с картой

let data_0; // массив настроек

let engines; // массив подложек

let isCustomSequence = false;


let isGeoZonesFlag = false


let setGeozoneFlag = (value) => {
  isGeoZonesFlag = Boolean(value)
}

let customSequenceMarkers = [];

let markerList = [];

var selectedMarkers = [];

var data_geozones = []

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
    isPolyline: true,
  };

  return polyline;
}

const setMarkerActive = (marker) => {
  try {
    L.DomUtil.addClass(marker._icon, "my-div-icon_active");
  } catch (error) {}

  selectedMarkers.push(marker.options.id);

  var number = isCustomSequence
    ? selectedMarkers.length
    : marker.options.icon.options.number;
  var numberRoute = isCustomSequence
    ? selectedMarkers.length
    : marker.options.icon.options.numberRoute;

  if (isCustomSequence) {
    if (selectedMarkers.indexOf(marker.options.id) + 1) {
      number = selectedMarkers.indexOf(marker.options.id) + 1;
      numberRoute = selectedMarkers.indexOf(marker.options.id) + 1;
    }
  }

  // console.log({ marker: marker.options })
  const color = marker.options.icon.options.color;

  const myIcon = L.divIcon({
    className: `my-div-icon my-div-icon_active`,
    iconSize: 50,
    color: color,
    number: number,
    numberRoute: numberRoute,
    html: `<div class="my-div-icon_inner">${
      Boolean(numberRoute)
        ? `<span class="my-div-icon_inner_number-route">${numberRoute}</span>`
        : ""
    }<span class="my-div-icon_inner_number">${
      Boolean(number) ? number : ""
    }</span><svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="-4 0 36 36"><g fill="none" fill-rule="evenodd"><path fill="${color}" d="M14 0c7.732 0 14 5.641 14 12.6C28 23.963 14 36 14 36S0 24.064 0 12.6C0 5.641 6.268 0 14 0Z"/><circle cx="14" cy="14" r="7" fill="#fff" fill-rule="nonzero"/></g></svg></div>`,
  });

  if (isCustomSequence) {
    customSequenceMarkers.push(marker);
  }

  setTimeout(() => {
    marker.setIcon(myIcon);
  }, 300);
};

const setMarkerUnActive = (marker) => {
  try {
    L.DomUtil.removeClass(marker._icon, "my-div-icon_active");
  } catch (error) {}

  const color = marker.options.icon.options.color;
  const number = isCustomSequence ? 0 : marker.options.icon.options.number;
  const numberRoute = isCustomSequence
    ? 0
    : marker.options.icon.options.numberRoute;

  const myIcon = L.divIcon({
    className: `my-div-icon`,
    iconSize: 50,
    color: color,
    number: number,
    numberRoute: numberRoute,
    html: `<div class="my-div-icon_inner">${
      Boolean(numberRoute)
        ? `<span class="my-div-icon_inner_number-route">${numberRoute}</span>`
        : ""
    }<span class="my-div-icon_inner_number">${
      Boolean(number) ? number : ""
    }</span><svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="-4 0 36 36"><g fill="none" fill-rule="evenodd"><path fill="${color}" d="M14 0c7.732 0 14 5.641 14 12.6C28 23.963 14 36 14 36S0 24.064 0 12.6C0 5.641 6.268 0 14 0Z"/><circle cx="14" cy="14" r="7" fill="#fff" fill-rule="nonzero"/></g></svg></div>`,
  });

  selectedMarkers = selectedMarkers.filter(
    (item) => item !== marker.options.id
  );

  if (isCustomSequence) {
    customSequenceMarkers = customSequenceMarkers.filter(
      (item) => item.options.id !== marker.options.id
    );
  }

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
  const road = data_in.road;
  let polylinePointsRoad = [];
  let arCoordinatesRoad = data_in?.road && road.geometry;

  const deliveryPoints = data_in.deliveryPoints;
  const myRoute = [];

  myMarkers[route.id] = [];

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

  var decorator = L.polylineDecorator(polyline, {
    patterns: [
      // defines a pattern of 10px-wide dashes, repeated every 20px on the line
      {
        offset: "0",
        repeat: "200px",
        symbol: L.Symbol.marker({
          rotate: true,
          markerOptions: {
            icon: L.icon({
              iconUrl: "./img/map.svg",
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            }),
          },
        }),
      },
    ],
  });

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
      html: `<div class="my-div-icon_inner">${
        Boolean(item.numberRoute)
          ? `<span class="my-div-icon_inner_number-route">${item.numberRoute}</span>`
          : ""
      }<span class="my-div-icon_inner_number">${
        Boolean(item.number) ? item.number : ""
      }</span><svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="-4 0 36 36"><g fill="none" fill-rule="evenodd"><path fill="${color}" d="M14 0c7.732 0 14 5.641 14 12.6C28 23.963 14 36 14 36S0 24.064 0 12.6C0 5.641 6.268 0 14 0Z"/><circle cx="14" cy="14" r="7" fill="#fff" fill-rule="nonzero"/></g></svg></div>`,
    });

    let markerOptions = {
      icon: myIcon,
      title: item.textHover,
      id: item.id,
      route_id: route.id,
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
    myMarkers[route.id].push(marker);
    markers.addLayer(marker);
  });
  // markers.addLayer(polyline);

  markers.on("click", function (e) {
    const marker = e.sourceTarget;
    // console.log(setMarkerActive)

    if (!isCustomSequence) {
      // TODO нужно уточнение всегда ли сбрасываем все активные маркеры?
      allMarkerUnactive();
    }
    // allMarkerUnactive() // сбросим все активные маркеры

    if (selectedMarkers.includes(marker.options.id)) {
      setMarkerUnActive(marker);
      marker.closePopup();
    } else {
      setMarkerActive(marker);
    }

    if (isCustomSequence) {
      drawPolyline(route.id, polyline, decorator);
    }
  });

  myLayers[route.id] = L.layerGroup(
    [polyline, decorator, markers, ...circleList],
    {
      color: color,
    }
  );

  //-- Реальный маршрут проезда
  if (!!arCoordinatesRoad && arCoordinatesRoad.length != 0) {
    options.color = "black";

    for (let i = 0; i < arCoordinatesRoad.length; i++) {
      polylinePointsRoad.push(
        new L.LatLng(arCoordinatesRoad[i][1], arCoordinatesRoad[i][0])
      );
    }

    const polylineRoad = new L.Polyline(
      polylinePointsRoad,
      CreatePolyline(options)
    );

    // myLayers[route.id].addLayer(polylineRoad);

    var trackPolyline = L.motion
      .polyline(
        polylinePointsRoad,
        {
          color: "red",
        },
        null,
        {
          removeOnEnd: false,
          icon: L.divIcon({
            className: "my-truck",
            html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><!--! Font Awesome Pro 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M48 0C21.5 0 0 21.5 0 48V368c0 26.5 21.5 48 48 48H64c0 53 43 96 96 96s96-43 96-96H384c0 53 43 96 96 96s96-43 96-96h32c17.7 0 32-14.3 32-32s-14.3-32-32-32V288 256 237.3c0-17-6.7-33.3-18.7-45.3L512 114.7c-12-12-28.3-18.7-45.3-18.7H416V48c0-26.5-21.5-48-48-48H48zM416 160h50.7L544 237.3V256H416V160zM112 416a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm368-48a48 48 0 1 1 0 96 48 48 0 1 1 0-96z"/></svg>`,
            iconSize: L.point(19, 24),
          }),
        }
      )
      .motionDuration(20000);

    var seqGroup = L.motion.seq([trackPolyline]).addTo(map);

    // Start the motion (you could put this in a timer, or some other event)
    seqGroup.motionStart();
  }

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

var myIconDefault = myIcon;

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

    L.easyButton(
      '<span class="btn-toogle-number">№</span>',
      function (btn, map) {
        document.body.classList.toggle("show-numberRoute");
      }
    ).addTo(map);



    

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

function allMarkerUnactive() {
  markerList.forEach(function (marker, index, array) {
    setMarkerUnActive(marker);
  });
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

  map.on("click", function (e) {
    console.log(e);
    if (!isCustomSequence) {
      allMarkerUnactive();
    }
  });

  map.selectArea.setControlKey(true);

  // const areaSelection = new window.leafletAreaSelection.DrawAreaSelection({
  //   onPolygonReady: (polygon) => {
  //     L.Util.requestAnimFrame(function () {
  //       markerList.forEach(function (marker, index, array) {
  //         if (polygon.getBounds().contains(marker.getLatLng())) {
  //           setMarkerActive(marker);
  //         }
  //       });
  //     });
  //   },
  // });

  // map.addControl(areaSelection);


 

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
  isCustomSequence = true;
  if (parseNeed) {
    data_in = JSON.parse(data_in);
  }

  ResetMap(); // ОЧИСТИМ карту
  clearMarkers(); // и выделенные маркеры на всякий случай

  const id = data_in.route && data_in.route.id;

  map.addLayer(baseMaps["GoogleMap"]); // вернем подложку

  addMarker([data_0.lat, data_0.lng], myIconStock, data_0.comment); //поставим маркер склада

  if (myLayers[id]) {
    // если роут с таким id уже есть то вернем его тоже на карту
    map.addLayer(myLayers[id]);
  } else {
    // если нет то нарисуем как обычно
    RouteBuild(data_in, false);
  }

  const color = myLayers[id].options.color;

  const myIcon = L.divIcon({
    className: `my-div-icon my-div-icon_${id}`,
    iconSize: 50,
    color: color,
    html: `<div class="my-div-icon_inner"><svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="-4 0 36 36"><g fill="none" fill-rule="evenodd"><path fill="${color}" d="M14 0c7.732 0 14 5.641 14 12.6C28 23.963 14 36 14 36S0 24.064 0 12.6C0 5.641 6.268 0 14 0Z"/><circle cx="14" cy="14" r="7" fill="#fff" fill-rule="nonzero"/></g></svg></div>`,
  });

  L.Util.requestAnimFrame(function () {
    myMarkers[id].forEach(function (marker, index, array) {
      marker.setIcon(myIcon);
    });
  });
}

async function drawPolyline(routeId, polyline, decorator) {
  let req = [];
  req.push(`${data_0.lng},${data_0.lat}`);

  for (let index = 0; index < customSequenceMarkers.length; index++) {
    const marker = customSequenceMarkers[index];

    var number = marker.options.icon.options.number;
    var numberRoute = marker.options.icon.options.numberRoute;

    if (isCustomSequence) {
      if (selectedMarkers.indexOf(marker.options.id) + 1) {
        number = selectedMarkers.indexOf(marker.options.id) + 1;
        numberRoute = selectedMarkers.indexOf(marker.options.id) + 1;
      }
    }

    // console.log({ marker: marker.options })
    const color = marker.options.icon.options.color;

    const myIcon = L.divIcon({
      className: `my-div-icon my-div-icon_active`,
      iconSize: 50,
      color: color,
      number: number,
      numberRoute: numberRoute,
      html: `<div class="my-div-icon_inner">${
        Boolean(numberRoute)
          ? `<span class="my-div-icon_inner_number-route">${numberRoute}</span>`
          : ""
      }<span class="my-div-icon_inner_number">${
        Boolean(number) ? number : ""
      }</span><svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="-4 0 36 36"><g fill="none" fill-rule="evenodd"><path fill="${color}" d="M14 0c7.732 0 14 5.641 14 12.6C28 23.963 14 36 14 36S0 24.064 0 12.6C0 5.641 6.268 0 14 0Z"/><circle cx="14" cy="14" r="7" fill="#fff" fill-rule="nonzero"/></g></svg></div>`,
    });

    setTimeout(() => {
      marker.setIcon(myIcon);
    }, 400);
    req.push(`${marker.getLatLng().lng},${marker.getLatLng().lat}`);
  }

  const url = `https://router.project-osrm.org/route/v1/driving/${req.join(
    ";"
  )}?overview=full&alternatives=true&steps=true&geometries=geojson`;

  const res = await loadJson(url);

  const route = res.routes[0];

  let polylinePoints = [];
  let arCoordinates = route.geometry.coordinates;

  //треба поменять местами Долготу и Ширину
  for (let i = 0; i < arCoordinates.length; i++) {
    polylinePoints.push(new L.LatLng(arCoordinates[i][1], arCoordinates[i][0]));
  }
  //создаём линию маршрута
  polyline.setLatLngs(polylinePoints);
  polyline.redraw();
  decorator.setPaths(polylinePoints);
}


// функция возврата геозоны новое
async function returnGeoZone() {
  if (newGeozone) {
    return JSON.stringify(newGeozone.getLatLngs());
  }
}

// функция показать геозоны
async function showAllGeoZones(data_geozones = []) {
  isGeoZonesFlag = true
  let polygons = [];

  window.data_geozones = data_geozones;

  var bounds;

  if (myLayers.geozones) {
    
    myLayers.geozones.clearLayers()
  }

  for (let index = 0; index < data_geozones.length; index++) {
    const element = data_geozones[index];
    const coordinates =
      !!element && !!element.geometry && element.geometry.coordinates;

    var polylinePoints = [];

    //треба поменять местами Долготу и Ширину
    for (let i = 0; i < coordinates[0].length; i++) {
      var el = coordinates[0][i];
      polylinePoints.push(new L.LatLng(el[1], el[0]));
    }

    var polygon = L.polygon(polylinePoints, { color: element.color, uid: element.uid }).bindPopup(element.name);

    polygons.push(polygon);

    if (bounds) {
      bounds.extend(polygon.getBounds());
    } else {
      bounds = polygon.getBounds();
    }
  }
  
  myLayers.geozones = new L.layerGroup([...polygons]).addTo(map);

  if (bounds) {
    map.fitBounds(bounds);
  }
  

  if (!window.areaSelection) {
    


    var safeButton = L.easyButton('<span class="btn-save-geo">✓</span>', function (btn, map) {
      console.log("сохранить геозону");

      if (safeButton) {
        map.removeControl(safeButton)
      }

      if (cancelButton) {
        map.removeControl(cancelButton)
      }



      if (window.newGeozone) {
        returnGeoZone()
        window.newGeozone = null

        
      }
    })
  
    var cancelButton = L.easyButton('<span class="btn-cancel-geo">x</span>', function (btn, map) {
      console.log("отменить геозону");
      if (safeButton) {
        map.removeControl(safeButton)
      }

      if (cancelButton) {
        map.removeControl(cancelButton)
      }

      if (window.newGeozone) {
        map.removeLayer(newGeozone)
        window.newGeozone = null
      }
    })

    const areaSelection = new window.leafletAreaSelection.DrawAreaSelection({

       
      
      onPolygonReady: (polygon) => {
        
        
  
        
  
        const geojson = polygon.toGeoJSON();
  
        const turfPolygon = turf.polygon(geojson.geometry.coordinates);
  
        
  
        const polygons = [];
        
        

        for (let index = 0; index < window.data_geozones.length; index++) {
          const element = window.data_geozones[index];
          if (geoZone !== element.uid) {
            polygons.push(element.geometry.coordinates);
          }
          
        }
  
        const turfMultiPolygons = turf.multiPolygon(polygons);
  
        const diff = turf.difference(turfPolygon, turfMultiPolygons);
  
        
        if(!window.geoZone) {
          areaSelection.deactivate();
        }
        

        
  
        const coordinates = diff.geometry.coordinates;
  
        var polylinePoints = [];
  
        //треба поменять местами Долготу и Ширину
        for (let i = 0; i < coordinates[0].length; i++) {
          var el = coordinates[0][i];
          polylinePoints.push(new L.LatLng(el[1], el[0]));
        }
        


       
          var polygon = L.polygon(polylinePoints, {
            color: "red",
          })
  
  
          
        


        if (!window.geoZone) {
         polygon.addTo(map);
  
  
          
        }

        window.newGeozone = polygon
        


        


        safeButton.addTo(map)
        cancelButton.addTo(map)
      },
      onPolygonDblClick: (polygon, control, ev) => {},
      onButtonActivate: () => {
        
      },
      onButtonDeactivate: (polygon) => {
        
      },
      position: "topleft",
    });
  
    map.addControl(areaSelection);

    window.areaSelection = areaSelection
  }




  
}

// редактирование геозоны для этого они должны быть сначала показаны!!!
async function editGeoZone(uid) {
  if (!isGeoZonesFlag) {
    return false
  }
  window.geoZone = uid
  if (window.data_geozones) {
    

    const brect = map.getContainer().getBoundingClientRect();
    // const geozone = window.data_geozones.find((item) => item.uid === uid)
    


    const layers = myLayers.geozones.getLayers()
    const currentZone = layers.find((item => item.options.uid === uid))
    const currentZonePoints = currentZone.getLatLngs()[0]

    console.log({ currentZonePoints })

    const point = currentZonePoints[0];
    
    

      const point_1 = map.latLngToContainerPoint([point.lat, point.lng]);

      console.log({ point_1 })

      
map.fire("as:point-add",
  new MouseEvent("click", {
    clientX: point_1.x + brect.left,
    clientY: point_1.y + brect.top
  }))

    for (let index = 1; index < currentZonePoints.length; index++) {
      
      const point = currentZonePoints[index];

      const point_2 = map.latLngToContainerPoint([point.lat, point.lng]);

      console.log({ point_2 }) 
map.fire("as:point-add",
  new MouseEvent("click", {
    clientX: point_2.x + brect.left,
    clientY: point_2.y + brect.top
  })
);
      
    }


    
    map.fire("as:point-add",
      new MouseEvent("click", {
        clientX: point_1.x + brect.left,
        clientY: point_1.y + brect.top
      }))

        console.log({ point_1 })


  }

}

// async function createNewGeoZones(options = {}) {
  

//   L.easyButton('<span class="btn-save-geo">✓</span>', function (btn, map) {
//     console.log("сохранить геозону");
//     window.geoZone = null
//   }).addTo(map);

//   L.easyButton('<span class="btn-cancel-geo">x</span>', function (btn, map) {
//     console.log("отменить геозону");
//     window.geoZone = null
//   }).addTo(map);
// }

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
  const data_geozones = await loadJson("./data/geozones.json");

  const data2 = await loadJson("./data/next/2.json");

  window.data2 = data2;

  window.data_route1 = data_route1;
  window.data_geozones = data_geozones;

  data_0 = dataInit;

  createMap();
  initMap(4, true);

  console.time("FirstWay");

  RouteBuild(JSON.stringify(data_route0));
  RouteBuild(JSON.stringify(data_route1));

  await showAllGeoZones(data_geozones);


  editGeoZone('9712e912-d0b9-11e1-b37b-005056848888')
  console.timeEnd("FirstWay");
}

(function () {
  start();
})();
