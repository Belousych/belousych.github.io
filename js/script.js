let map; //основная переменная с картой

let data_0; // массив настроек

let engines; // массив подложек

const markers = L.markerClusterGroup(); //https://github.com/Leaflet/Leaflet.markercluster
const circleList = []
let markerList = [];
let mapLayers = new Map(); // массив наших слоев на карте

let controlScale;

var selectedMarkers = [];

var myLayers = {};

var mapTilesUrl = {
  "google": "http://{s}.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}",
  "yandex": "",
  "openstreet": "https://tile.openstreetmap.org/{z}/{x}/{y}.png?{foo}"
}


var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    
    attribution: '© OpenStreetMap'
});

var google = L.tileLayer('http://{s}.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}', {
    subdomains:['mt0'],
    
    attribution: '© Google maps'
});




var baseMaps = {
  "OpenStreetMap": osm,
  "Google maps": google,
  
};


//------------------------------------------------------------------------------------------------------------------------
//-- Функции

const clearActiveMarkers = () => {
  markerList.forEach((marker, index) => {
    setMarkerUnActive(marker)
  })
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
  } catch (error) {
    
  }
  
  selectedMarkers.push(marker.options.id);
  setTimeout(() => {
    marker.setIcon(myIconActive);
  }, 400);
};

const setMarkerUnActive = (marker) => {
  try {
    L.DomUtil.removeClass(marker._icon, "my-div-icon_active");  
  } catch (error) {
    
  }
  
  selectedMarkers = selectedMarkers.filter(item => item !== marker.options.id);
  setTimeout(() => {
    marker.setIcon(myIcon);
  }, 400);
};


function addMarker(data_in, icon, comment ) {
  if (icon === undefined) {
    icon = myIcon
  }

 

  L.marker(data_in, { icon: icon }).addTo(map).bindPopup(comment);
}



function cleanLayersGroup(id) { // удалить все слои пути id = route_0
  myLayers[id].clearLayers()
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

  const route = data_in.route;
  const deliveryPoints = data_in.deliveryPoints;
  const myRoute = [];


  document.documentElement.style.setProperty('--path-color', route.color || "red");

  let options = { color: route.color || "red" };

  //alert(1);

  

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

  //alert(3);

  deliveryPoints.forEach((item, index) => {
    const coord = [];
    coord.push(item.ltd, item.lng);

    let markerOptions = {
      icon: myIcon,
      title: item.textHover,
      id: item.id,
      // pane: "markers"
    };

    let marker = L.marker(coord, markerOptions).bindPopup(`
      <div><b>Контрагент:</b>${item.textPopup.partner}</div>
      <div><b>Вес:</b>${item.textPopup.weight}</div>
      <div><b>Объем:</b>${item.textPopup.volume}</div>
      <div><b>Адрес:</b>${item.textPopup.address}</div>
      <div><b>Интервал доставки:</b>${item.textPopup.date}</div>
      <div><b>Комментарий:</b>${item.textPopup.comment}</div>
      
      `, {
      offset: [0, -20],
    });

    var circle = L.circleMarker(coord, {
      ...markerOptions,
      icon: divIconGhost,
      opacity: 0.25,
      pane: "markers"
  })

  circleList.push(circle)

    markerList.push(marker);
    markers.addLayer(marker);
  });
  // markers.addLayer(polyline);

  markers.on("click", function (e) {
    const marker = e.sourceTarget
    // console.log(setMarkerActive)
    if (selectedMarkers.includes(marker.options.id)) {
      setMarkerUnActive(marker);
      marker.closePopup()
    } else {
      setMarkerActive(marker);
    }
    
  
  });

  


  
  


  myLayers[route.id] =  L.layerGroup([ polyline, markers, ...circleList ])
  




  var layerControl = L.control.layers(baseMaps, {
    [route.id]: myLayers[route.id],
  }).addTo(map);

  myLayers[route.id].addTo(map);
}

//---------------------------------------------------------------------------

//---------------------------------------------------------------------------


var myIcon = L.divIcon({
  className: "my-div-icon",
  iconSize: 50,
  html: '<div class="my-div-icon_inner"><svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="-4 0 36 36"><g fill="none" fill-rule="evenodd"><path fill="#3276c3" d="M14 0c7.732 0 14 5.641 14 12.6C28 23.963 14 36 14 36S0 24.064 0 12.6C0 5.641 6.268 0 14 0Z"/><circle cx="14" cy="14" r="7" fill="#fff" fill-rule="nonzero"/></g></svg></div>',
});


var divIconGhost = L.divIcon({
  className: "my-div-icon",
  iconSize: 25,
  html: '<div class="my-div-icon_inner"><svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="-4 0 36 36"><g fill="none" fill-rule="evenodd"><path fill="#3276c3" d="M14 0c7.732 0 14 5.641 14 12.6C28 23.963 14 36 14 36S0 24.064 0 12.6C0 5.641 6.268 0 14 0Z"/><circle cx="14" cy="14" r="7" fill="#fff" fill-rule="nonzero"/></g></svg></div>',
});

var myIconActive = L.divIcon({
  className: "my-div-icon my-div-icon_active",
  iconSize: 50,
  html: '<div class="my-div-icon_inner"><svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="-4 0 36 36"><g fill="none" fill-rule="evenodd"><path fill="#3276c3" d="M14 0c7.732 0 14 5.641 14 12.6C28 23.963 14 36 14 36S0 24.064 0 12.6C0 5.641 6.268 0 14 0Z"/><circle cx="14" cy="14" r="7" fill="#fff" fill-rule="nonzero"/></g></svg></div>',
});



var myIconStock = L.icon({
  iconUrl: '/img/icon.png',
  iconSize: [64, 64],
});

//------------------------------------------------------------------------------------------

function initMap(zoom = 4, showMarker = true) {
  mapCenter = [data_0.lat, data_0.lng];

  map.setView(mapCenter, zoom);

  engines = data_0.engines

  console.log('engines', engines)

 if (engines && engines.length > 0) {
  baseMaps = {}
  for (let index = 0; index < engines.length; index++) {
    const element = engines[index];
    baseMaps[element?.name] = L.tileLayer(element.url)
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

  map.on("click", (e) => {
    // clearActiveMarkers();
    // console.log(markers);
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
  



  map.createPane('markers');
  map.getPane('markers').style.zIndex = 401;
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

// --------------------

async function loadJson(url) {
  const res = await fetch(url);
  const json = await res.json();
  return json;
}

async function start() {
  const dataInit = await loadJson("./data/1/data.json");
  const data_in = await loadJson("./data/next/1.json");
  const data2 = await loadJson("./data/next/2.json");

  
  window.data2 = data2

  data_0 = dataInit
  
  createMap();
  initMap();

  
  google.addTo(map)
    

  console.time("FirstWay");
  RouteBuild(JSON.stringify(data_in));
  console.timeEnd("FirstWay");
}

(function () {
  start();
})();


function setMarkerCenter(data2) {
  if (!myLayers[data2.route_id]) {
    alert(`маршрут ${data2.route_id} не отображен на карте `)
  }
  markers.eachLayer((marker) => {
    
    if (marker.options.id === data2.id) {

      console.log(marker)
      setTimeout(() => {
        marker.openPopup();
      }, 500);
      setMarkerActive(marker)
      
    }
  });
  
  map.setView([data2.ltd, data2.lng], zoom = 19);
}