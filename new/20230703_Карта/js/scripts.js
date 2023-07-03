let map; 
let data;
let engines;
let isCustomSequence = false;
let customSequenceMarkers = [];
let markerList = [];
var selectedMarkers = [];
var myLayers = {};
var myMarkers = {};
var layerControl;
var osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {attribution: "© OpenStreetMap",});
var google = L.tileLayer("http://{s}.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}",{subdomains: ["mt0"],attribution: "© Google maps",});
var baseMaps = {"OpenStreetMap": osm, "Google maps": google};

//------------------------------------------------------------------------------------------
//-- Иконки
//------------------------------------------------------------------------------------------

var myIcon = L.divIcon({
  className: "my-div-icon",
  iconSize: 50,
  html: '<div class="my-div-icon_inner"><svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="-4 0 36 36"><g fill="none" fill-rule="evenodd"><path fill="#3276c3" d="M14 0c7.732 0 14 5.641 14 12.6C28 23.963 14 36 14 36S0 24.064 0 12.6C0 5.641 6.268 0 14 0Z"/><circle cx="14" cy="14" r="7" fill="#fff" fill-rule="nonzero"/></g></svg></div>',
});

var myIconActive = L.divIcon({
  className: "my-div-icon my-div-icon_active",
  iconSize: 50,
  html: '<div class="my-div-icon_inner"><svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="-4 0 36 36"><g fill="none" fill-rule="evenodd"><path fill="#3276c3" d="M14 0c7.732 0 14 5.641 14 12.6C28 23.963 14 36 14 36S0 24.064 0 12.6C0 5.641 6.268 0 14 0Z"/><circle cx="14" cy="14" r="7" fill="#fff" fill-rule="nonzero"/></g></svg></div>',
});

var myIconStock = L.divIcon({
  className: "my-div-icon",
  iconSize: 50,
  html: '<div class="my-div-icon_inner"><svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="-4 0 36 36"><g fill="none" fill-rule="evenodd"><path fill="#000000" d="M14 0c7.732 0 14 5.641 14 12.6C28 23.963 14 36 14 36S0 24.064 0 12.6C0 5.641 6.268 0 14 0Z"/><circle cx="14" cy="14" r="7" fill="#fff" fill-rule="nonzero"/></g></svg></div>',
});

var myIconDefault = myIcon;

//------------------------------------------------------------------------------------------
//-- Инициализация карты
//------------------------------------------------------------------------------------------

(function() {
  start();   
}());

async function start() {
  createMap();
}

function createMap() {
  map = L.map("map", {
    boxZoom: false, 
    selectArea: true
  }); 

  map.on("areaselected", (e) => {
    L.Util.requestAnimFrame(function () {
      markerList.forEach(function (marker, index, array) {
        if (e.bounds.contains(marker.getLatLng())) {
          setMarkerActive(marker);
        }
      });
    });
  });

  map.on("click", (e) => {
      if (!isCustomSequence) {
        allMarkerUnactive();

        if (selectedMarkers.length != 0) {
          if(selectedMarkers[0] != 0) {
            if(selectedMarkers[0] === 1){
              selectedMarkers = []; 
              selectedMarkers.push(0);  
            }
          }
        }
      } 
  });

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

  map.selectArea.setControlKey(true);
  map._layersMaxZoom = 10;
  map.addControl(areaSelection);
  map.createPane('markers');
  map.getPane('markers').style.zIndex = 400;
}

function init(data1c) {
  data = JSON.parse(data1c);

  ConsoleLogHTML.connect(document.getElementById("log"));
  
  setFirstView();
}

function setFirstView(zoom = 4) {
  mapCenter = [data.lat, data.lng];
  
  map.setView(mapCenter, zoom);

  engines = data.engines;
  if (engines && engines.length > 0) {
    baseMaps = {};
  
    for (let index = 0; index < engines.length; index++) {
      const element = engines[index];
      
      baseMaps[element.name] = L.tileLayer(element.link);
    }

    layerControl = L.control.layers(baseMaps).addTo(map);

    L.easyButton('<span class="btn-toogle-number">#</span>', function(btn, map){
      document.body.classList.toggle('show-numberRoute');
    }).addTo(map);

    if (baseMaps.google) {
      baseMaps.google.addTo(map);
    } else if (baseMaps["GoogleMap"]) {
      baseMaps["GoogleMap"].addTo(map);
    }
  } 

  addMarker(mapCenter, myIconStock, data.comment);
}

//------------------------------------------------------------------------------------------
//-- Сброс
//------------------------------------------------------------------------------------------

function cleanLayersGroup(layer) { 
  layer = JSON.parse(layer);

  myLayers[layer.layer].clearLayers();
  layerControl.removeLayer(myLayers[layer.layer]);
}

function resetMap() {
  map.eachLayer((layer) => map.removeLayer(layer));
}

function clearLog() {
  document.getElementById("log").innerHTML = "";
}

function initMap() {
  map.addLayer(baseMaps["GoogleMap"]);

  addMarker([data.lat, data.lng], myIconStock, data.comment); 
}

//------------------------------------------------------------------------------------------
//-- Маркеры
//------------------------------------------------------------------------------------------

function addMarker(mapCenter, icon, comment) {
  if (icon === undefined) {
    icon = myIconDefault;
    comment = "";
  }

  L.marker(mapCenter, { icon: icon }).addTo(map).bindPopup(comment);
}

function setMarkerActive(marker, pushInArray = true) {
  try {
    L.DomUtil.addClass(marker._icon, "my-div-icon_active");
  } catch (error) {}

  if (pushInArray) {
    selectedMarkers.push(marker.options.id);
  }

  const color = marker.options.icon.options.color;
  
  var number = isCustomSequence
    ? selectedMarkers.length
    : marker.options.icon.options.number;
  var numberRoute = isCustomSequence
    ? selectedMarkers.length
    : marker.options.icon.options.numberRoute;

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


  if (isCustomSequence) {
    customSequenceMarkers = customSequenceMarkers.filter(
      (item) => item.options.id !== marker.options.id
    );  
  }

  setTimeout(() => {
    marker.setIcon(myIcon);
  }, 300);
};

function allMarkerUnactive() {
  markerList.forEach(function (marker, index, array) {      
    setMarkerUnActive(marker);      
  });  
}

function clearMarkers(data2) { 
  selectedMarkers = [];

  if (data2 !== undefined) {
    data2 = JSON.parse(data2);

    selectedMarkers.push(data2);
  }
}

function clearActiveMarkers() {
  markerList.forEach((marker, index) => {
    setMarkerUnActive(marker);
  })
}

function setMarkerCenter(data2, parseNeed = true) { 
  allMarkerUnactive();

  if (parseNeed) {
    data2 = JSON.parse(data2);  
  }
  
  if (!myLayers[data2.route_id]) {
    alert(`Маршрут ${data2.route_id} не отображен на карте!`);
  }
  
  markerList.forEach((marker) => {
    if (marker.options.id === data2.id) {
      setTimeout(() => {
        marker.openPopup();
      }, 500);
      
      setMarkerActive(marker, false);

      map.setView([data2.lat, data2.lng], 20);
    }
  }); 
}


function returnMarkers() { 
  if (selectedMarkers.length != 0) {
    return JSON.stringify(selectedMarkers);
  }
}

//------------------------------------------------------------------------------------------
//-- Маршрут
//------------------------------------------------------------------------------------------

function RouteBuild(data_in, parseNeed = true) {

  if (parseNeed) {
    data_in = JSON.parse(data_in);
  }

  const markers = L.markerClusterGroup();
  const circleList = [];
  const route = data_in.route;
  const road =  data_in.road;
  const deliveryPoints = data_in.deliveryPoints;
  const myRoute = [];
  const color = route.color || "black";

  let options = { color: color };
  let polylinePoints = [];
  let polylinePointsRoad = [];
  let arCoordinates = route.geometry;
  let arCoordinatesRoad = road.geometry;

  myMarkers[route.id] = [];

  var divIconGhost = L.divIcon({
    className: "my-div-icon",
    iconSize: 25,
    html: `<div class="my-div-icon_inner"><svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="-4 0 36 36"><g fill="none" fill-rule="evenodd"><path fill="${color}" d="M14 0c7.732 0 14 5.641 14 12.6C28 23.963 14 36 14 36S0 24.064 0 12.6C0 5.641 6.268 0 14 0Z"/><circle cx="14" cy="14" r="7" fill="#fff" fill-rule="nonzero"/></g></svg></div>`,
  });

  for (let i = 0; i < arCoordinates.length; i++) {
    polylinePoints.push(new L.LatLng(arCoordinates[i][1], arCoordinates[i][0]));
  }

  const polyline = new L.Polyline(polylinePoints, CreatePolyline(options));

  if (polylinePoints.length != 0) {
    myRoute.push(polyline); 

    map.fitBounds(polyline.getBounds());
  }

  deliveryPoints.forEach((item, index) => {
    const coord = [];
    coord.push(item.ltd, item.lng);

    const colorMarker = item.color;

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
      }</span><svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="-4 0 36 36"><g fill="none" fill-rule="evenodd"><path fill="${colorMarker}" d="M14 0c7.732 0 14 5.641 14 12.6C28 23.963 14 36 14 36S0 24.064 0 12.6C0 5.641 6.268 0 14 0Z"/><circle cx="14" cy="14" r="7" fill="#fff" fill-rule="nonzero"/></g></svg></div>`,
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

    //console.log("12312");
   
    var circle = L.circleMarker(coord, {
      ...markerOptions,
      color: color,
      icon: divIconGhost,
      opacity: 0.25,
      pane: "markers",
    });

    circleList.push(circle)

    markerList.push(marker);
    myMarkers[route.id].push(marker)
    markers.addLayer(marker);
  });

  markers.on("click", function (e) {
    const marker = e.sourceTarget;

    if (!isCustomSequence) { 
      allMarkerUnactive();
    }

    if (selectedMarkers.includes(marker.options.id)) {
      setMarkerUnActive(marker);
     
      marker.closePopup();
    } else {   
      setMarkerActive(marker);
    }

    if (isCustomSequence) {     
      drawPolyline(route.id, polyline)
    }
  });

  myLayers[route.id] = L.layerGroup([polyline, markers, ...circleList], {
    color: color
  });

  //-- Реальный маршрут проезда
  if(arCoordinatesRoad.length != 0){
    options.color = "black";

    for (let i = 0; i < arCoordinatesRoad.length; i++) {
      polylinePointsRoad.push(new L.LatLng(arCoordinatesRoad[i][1], arCoordinatesRoad[i][0]));
    }

    const polylineRoad = new L.Polyline(polylinePointsRoad, CreatePolyline(options));

    myLayers[route.id].addLayer(polylineRoad);


    //-- С машинкой какая-то хуйня, поэтому просто пометим последние n секунд и воткнем на конец маркер
    let polylinePointsRoadCar = [];

    for (let i = 0; i < road.car.length; i++) {
      polylinePointsRoadCar.push(new L.LatLng(road.car[i][1], road.car[i][0]));
    }

    options.color = "red";

    const polylineRoadCar = new L.Polyline(polylinePointsRoadCar, CreatePolyline(options));

    myLayers[route.id].addLayer(polylineRoadCar);    
  }

  //if (polylinePointsRoad.length != 0) {
  //  map.fitBounds(polylineRoad.getBounds());
  //} else {
  //  map.fitBounds(polyline.getBounds());
  //}

  layerControl.addOverlay(myLayers[route.id], `<div class="layerControlRoute" style="display: inline-block"><span style="color: ${color}">●</span> Маршрут ${route.id_route}</div>`);
  myLayers[route.id].addTo(map);
}


function CreatePolyline(options) {
  const polyline = {
    color: options.color != undefined ? options.color : "black",
    weight: options.weight != undefined ? options.weight : 3,
    opacity: options.opacity != undefined ? options.opacity : 0.7,
    isPolyline: true
  };

  return polyline;
}

function showNumberRoute(show) {
  document.body.classList.remove('show-numberRoute');

  if(show){
     document.body.classList.add('show-numberRoute');    
  } 
}

function setCustomSequence(CustomSequence) {
  isCustomSequence = CustomSequence;
}