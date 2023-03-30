

let map; //основная переменная с картой

let data_0; // массив настроек

let engines; // массив подложек



let mapLayers = new Map(); // массив наших слоев на карте

let controlScale;




var myLayers = {}

//------------------------------------------------------------------------------------------------------------------------
//-- Функции

function CreatePolyline(options) {
  const polyline = {
    color: options.color != undefined ? options.color : "red",
    weight: options.weight != undefined ? options.weight : 3,
    opacity: options.opacity != undefined ? options.opacity : 0.9,
  };

  return polyline;
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
  const markers = L.markerClusterGroup();  //https://github.com/Leaflet/Leaflet.markercluster


  let options = { color: 'red' };

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
      alt: item.id,
    };

    

    let marker = L.marker(coord, markerOptions).bindPopup(item.textPopup);

    
   
    markers.addLayer(marker);
  });
  markers.addLayer(polyline)

  markers.on('click', function (a) {
    console.log(a);

    // $(marker._icon).addClass('selectedMarker');
  });

 

  

  myLayers[route.id] = markers

  myLayers[route.id].addTo(map)

  
}

//---------------------------------------------------------------------------


//---------------------------------------------------------------------------


function removeLayer(layer, parseNeed = true) {
  if (parseNeed) {
    layer = JSON.parse(layer).layer;
  }

  if (mapLayers.has(layer)) {
    map.removeLayer(mapLayers.get(layer));

    mapLayers.delete(layer);
  }
  //} else { alert("key: " + layer + " not found") };

  //alert("removed: " + layer);
}
var myIcon = L.divIcon({className: 'my-div-icon', iconSize: 36, html: '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="-4 0 36 36"><g fill="none" fill-rule="evenodd"><path fill="#3276c3" d="M14 0c7.732 0 14 5.641 14 12.6C28 23.963 14 36 14 36S0 24.064 0 12.6C0 5.641 6.268 0 14 0Z"/><circle cx="14" cy="14" r="7" fill="#fff" fill-rule="nonzero"/></g></svg>'})




//------------------------------------------------------------------------------------------

function init(data) {
  if (data == undefined) {
    alert("No data in");

    return -1;
  }


  
  data_0 = JSON.parse(data);

  storageIcon = new L.Icon({
    iconUrl: data_0.iconUrl,
    iconSize: [51, 51],
    iconAnchor: [12, 51],
    popupAnchor: [1, -34],
  });

  return 1;
}

function initMap(zoom = 4, showMarker = false) {
  mapCenter = [data_0.lat, data_0.lng];

  map.setView(mapCenter, zoom);

  L.tileLayer(data_0.map).addTo(map);

  controlScale = L.control.scale({
    position: "topright",
    metric: true,
    imperial: false,
  });

  //controlScale.addTo(map);

  if (showMarker) {
    addMarker(mapCenter, storageIcon, data_0.comment);
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

  //-- В выделенной области перебираем маркеры и кладем их в массив markers
  map.on("areaselected", (e) => {
    markers = [];

    L.Util.requestAnimFrame(function () {
      let props = [];

      map.eachLayer(function (pointLayer) {
        if (pointLayer instanceof L.Marker) {
          if (e.bounds.contains(pointLayer.getLatLng())) {
            for (let key in pointLayer) {
              props.push("key: " + key + " -> " + pointLayer[key]);
            }

            markers.push(pointLayer._popup._content);

            //alert(pointLayer._popup._alt);
            //markers.push(props);
          }
        }
      });
    });
  });

  map.selectArea.setControlKey(true);
}

//-- функция служит для возврата с Карты в 1с массив выделенных координат
function returnMarkers() {
  if (markers.length != 0) {
    return JSON.stringify(markers);
  }
}

function clearMarkers() {
  markers = [];
}





// --------------------

async function loadJson(url){
    const res = await fetch(url);
    const json = await res.json();
    return json
}





async function start() {
    const dataInit = await loadJson('./data/1/data.json');    
    const data_in = await loadJson('./data/2/data.json');    

    console.log(data_in)
    createMap();
    init(JSON.stringify(dataInit));
    initMap();
    console.time('FirstWay');
    RouteBuild(JSON.stringify(data_in))
    console.timeEnd('FirstWay');
}



(function () {
  start()
}());