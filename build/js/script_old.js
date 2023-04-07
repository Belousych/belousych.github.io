

let map; //основная переменная с картой

let data_0; // массив настроек

let engines; // массив подложек

let markers; // Массив с координатами выделенной области

let mapLayers = new Map(); // массив наших слоев на карте

let controlScale;

//------------------------------------------------------------------------------------------------------------------------
//-- Иконочки
//-- https://github.com/pointhi/leaflet-color-markers

let storageIcon = new L.Icon({
  iconUrl: "ссылка на картинку в базе или в сети",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  //--shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  //--shadowSize: [41, 41],
});

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

//-- определяет центр координат в массиве - функция со стаковерфлоу
let getCenterMap = function (coordinates) {
  return coordinates.reduce(
    function (x, y) {
      return [
        x[0] + y[0] / coordinates.length,
        x[1] + y[1] / coordinates.length,
      ];
    },
    [0, 0]
  );
};

//-- рисуем кривую
function addPolylines(data_in, polyline) {
  data_in = JSON.parse(data_in);

  //-- координаты хранятся в data_in.routes[0].geometry.coordinates
  let arCoordinates = data_in.routes[0].geometry.coordinates;

  //-- треба поменять местами Долготу и Ширину
  let polylinePoints = [];
  for (let i = 0; i < arCoordinates.length; i++) {
    polylinePoints.push(new L.LatLng(arCoordinates[i][1], arCoordinates[i][0]));
  }

  //-- объявляем координаты
  polyline = new L.Polyline(polylinePoints, CreatePolyline());

  //-- рисуем на карте линию
  layerName = map.addLayer(polyline);

  //-- показываем всю линию
  map.fitBounds(polyline.getBounds());

  return; //--### на кой это
}

//отрисовка полигонов
//data_in - ?
function changePolygon(data_in) {
  //-- очищаем всю карту
  ResetMap();

  data_in = JSON.parse(data_in);

  let mapCenter = [];

  //-- переберем данные и отрисуем каждый полигон отдельно и добавим название
  for (k in data_in) {
    for (i in data_in[k]) {
      addPolygon(data_in[k][i], k);

      //-- соединяем при помощи .concat массив, чтоб в дальнейшем определить его центр
      mapCenter = mapCenter.concat(data_in[k][i]);
    }
  }

  //-- центрируем карту
  map.setView(getCenterMap(mapCenter), 3);

  //-- чтобы вывести некие области без названия скопом, засунуть все геоданные в массив и его вывести в L.polygon(
  /*multipolygon = [];
  
      for (k in data_regions) {
      	
          for (i in data_in[k]) {
              multipolygon.push(data_in[k][i]);
          }
      }
  
      addPolygon(multipolygon)*/
}

function addPolygon(data, name_polygone) {
  style = stylePolygon(name_polygone.length);

  let polygon = L.polygon(data, style).addTo(map).bindPopup(name_polygone);
}

//-- чтоб стили были разные для каждой области
function getColorPolygon(d) {
  return d > 32
    ? "#800026"
    : d > 29
    ? "#BD0026"
    : d > 26
    ? "#E31A1C"
    : d > 23
    ? "#FC4E2A"
    : d > 20
    ? "#FD8D3C"
    : d > 17
    ? "#FEB24C"
    : d > 14
    ? "#FED976"
    : "#FFEDA0";
}

function stylePolygon(feature) {
  return {
    fillColor: getColorPolygon(feature),
    weight: 2,
    opacity: 1,
    color: "white",
    dashArray: "3",
    fillOpacity: 0.7,
  };
}

function getMap(position, tooltip, zoom = 15) {
  if (map === null) {
    map = L.map("map").setView(position, zoom);
  } else {
    map.flyTo(position); // перемещение к следующей позиции
  }

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  // удаление предыдущего маркера
  if (marker) {
    map.removeLayer(marker);
  }

  marker = new L.Marker(position).addTo(map).bindPopup(tooltip).openPopup();
}

//-- фокус на точку
function setMap(data_in, zoom = 20) {
  if (data_in === undefined) {
    mapCenter = [data_0.lat, data_0.lng];
  } else {
    data_in = JSON.parse(data_in);

    mapCenter = [data_in.lat, data_in.lng];
  }

  map.setView(mapCenter, zoom);
}

function getLayers() {
  let myLayers = [];

  map.eachLayer((layer) => myLayers.push(layer));

  return myLayers;
}

function addMarker(data_in, icon, comment) {
  if (icon === undefined) {
    icon =
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png";
  }

  if (comment === undefined) {
    comment = "no comment";
  }

  if (comment === undefined || comment === "") {
    L.marker(data_in, { icon: icon }).addTo(map);
  } else {
    L.marker(data_in, { icon: icon }).addTo(map).bindPopup(comment);
  }
}

function CreateIcon(
  iconUrl,
  shadowUrl,
  iconSize,
  iconAnchorSize,
  popupAnchorSize,
  shadowSize
) {
  return new L.Icon({
    iconUrl: iconUrl,
    shadowUrl: shadowUrl,
    iconSize: iconSize,
    iconAnchor: iconAnchorSize,
    popupAnchor: popupAnchorSize,
    shadowSize: shadowSize,
  });
}

function set_tileLayer(data_in) {
  data_in = JSON.parse(data_in);

  L.tileLayer(data_in.Layer).addTo(map);
}

// рисуем кривую по геометрии в формате geoJSON
// на основе функции "addPolylines"
//координаты хранятся в data_in.routes[0].geometry.coordinates
//let arCoordinates = data_in.routes[0].geometry.coordinates;
//
function addPolylinesByGeometry(data_in, options, parseNeed = false) {
  if (parseNeed) {
    data_in = JSON.parse(data_in);
  }

  let arCoordinates = data_in;

  //alert(1);

  //треба поменять местами Долготу и Ширину
  let polylinePoints = [];
  for (let i = 0; i < arCoordinates.length; i++) {
    polylinePoints.push(new L.LatLng(arCoordinates[i][1], arCoordinates[i][0]));
  }

  //alert(2);
  //-- объявляем координаты

  const polyline = new L.Polyline(polylinePoints, CreatePolyline(options));

  //-- рисуем на карте линию
  //layerName = map.addLayer(polyline);

  //-- показываем всю линию
  map.fitBounds(polyline.getBounds());

  return polyline; //### на кой это
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
      icon: new L.NumberedDivIcon({
        number: item.number,
        iconUrl: route.iconUrl,
      }),
      title: item.textHover,
      alt: item.id,
    };

    let marker = L.marker(coord, markerOptions).bindPopup(item.textPopup);

    myRoute.push(marker);
  });

  eval("var " + route.id + " = L.layerGroup(myRoute);");

  eval("" + route.id + ".addTo(map);");

  mapLayers.set(route.id, eval(route.id));
}

//---------------------------------------------------------------------------
//--let newLayer = L.Layer.extend();
//--map.addLayer(newLayer);

//--L.marker(coord, markerOptions).addTo(map).bindPopup(item.textPopup).openPopup();
//--let marker = new L.Marker(coord, { icon: new L.NumberedDivIcon({ number: index + 1 }) });
//--marker.addTo(map).bindPopup(item.textPopup).openPopup();

//--myRoute.forEach( (item,index)=> alert(item[0]) );
//--let newLayer = L.layer.extend();
//--L.LayerGroup(myRoute).addLayer(newLayer).addTo(map);

//---------------------------------------------------------------------------
function RouteBuildOldWorked(data_in, parseNeed = true) {
  if (parseNeed) {
    data_in = JSON.parse(data_in);
  }

  const route = data_in.route;

  const deliveryPoints = data_in.deliveryPoints;

  const myRoute = [];

  deliveryPoints.forEach((item, index) => {
    const coord = [];
    coord.push(item.ltd, item.lng);

    let markerOptions = {
      icon: new L.NumberedDivIcon({
        number: item.number,
        iconUrl: route.iconUrl,
      }),
      title: item.textHover,
      alt: item.id,
    };

    let marker = L.marker(coord, markerOptions).bindPopup(item.textPopup);

    myRoute.push(marker);
  });

  try {
    if (route.id != "route_0") {
      let options = {
        color: route.lineColor,
      };

      let polyline = addPolylinesByGeometry(route.geometry, options);

      //map.fitBounds(polyline.getBounds());	//эта краска для волос всё ломает

      myRoute.push(polyline);
    }
  } catch (err) {
    //alert("Геометрия маршрута №" + route.id + " не в формате geoJSON.\n Выведены только точки маршрута.");
  }

  eval("var " + route.id + " = L.layerGroup(myRoute);");

  eval("" + route.id + ".addTo(map);");

  mapLayers.set(route.id, eval(route.id));

  //alert("builded: " + route.id);
}

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

L.NumberedDivIcon = L.Icon.extend({
  options: {
    //-- EDIT THIS TO POINT TO THE FILE AT http://www.charliecroom.com/marker_hole.png (or your own marker)
    //--iconUrl: "some marker.png",
    number: "123",
    shadowUrl: null,
    iconSize: new L.Point(20, 20),
    iconAnchor: new L.Point(13, 41),
    popupAnchor: new L.Point(0, -33),
    //--iconAnchor: (Point),
    //--popupAnchor: (Point),
    className: "leaflet-div-icon",
  },

  createIcon: function () {
    var div = document.createElement("div");
    var img = this._createImg(this.options["iconUrl"]);
    var numdiv = document.createElement("div");
    numdiv.setAttribute("class", "number");
    numdiv.innerHTML = this.options["number"] || "";
    div.appendChild(img);
    div.appendChild(numdiv);
    this._setIconStyles(div, "icon");
    return div;
  },

  //you could change this to add a shadow like in the normal marker if you really wanted
  createShadow: function () {
    return null;
  },
});

function fillEngines(engineArray, parseNeed = true) {
  if (parseNeed) {
    engineArray = JSON.parse(engineArray);
  }

  if (engineArray === undefined) {
    engines = [];
    engines.push("http://tile2.maps.2gis.com/tiles?x={x}&y={y}&z={z}");
    engines.push("http://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}");
    engines.push("http://{s}.tile.osm.org/{z}/{x}/{y}.png");
  } else {
    engineArray.forEach((item) => engines.push(item));
  }
}

function createLine(data_in, parseNeed = true) {
  if (parseNeed) {
    data_in = JSON.parse(data_in);
  }

  let Line = {
    color: data_in.color,
    weight: data_in.weight,
    opacity: data_in.opacity,
  };

  return Line;
}

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

function TestHTML(data_in) {
  let mdata = JSON.parse(data_in).data;

  L.tileLayer(data_0.map);

  alert(mdata[0].number);

  let number = mdata[0].number;

  let iconUrl = mdata[0].iconUrl;

  for (let key in mdata) {
    let lng = mdata.points[key].lng;
    let ltd = mdata.points[key].ltd;
    let description = mdata[key].description;

    let coord = [];

    coord.push(lng, ltd);

    let markerOptions = {
      icon: L.icon({ iconUrl: iconUrl }), //--new L.NumberedDivIcon({ number: number }),
      interactive: true,
      draggable: true,
      keyboard: true,
      title: "it title",
      alt: "alt title",
    };

    L.marker(coord, markerOptions)
      .addTo(map)
      .bindPopup(description)
      .openPopup();
  }
}

function TestCSS(data_in, parseNeed) {
  alert("TestCSS ok");
}

function TestJS(data_in) {
  let _layers = getLayers();

  alert("На карте слоёв: " + _layers.length);

  //map.removeLayer( controlScale );
  removeLayer(controlScale);

  return _layers;
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

start()