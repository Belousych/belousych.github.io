let map; //основная переменная с картой

let data_0; // массив настроек

let engines; // массив подложек

let isCustomSequence = false;


let isGeoZonesFlag = false

var isShowCounter = true


function showCounter () {
  const counter = document.getElementById("counter")
  counter.classList.remove("hidden")
  isShowCounter = true
}

function hideCounter () {
  const counter = document.getElementById("counter")
  counter.classList.add("hidden")
  isShowCounter = false
}

function calculateCounter () {
  const counterDiv = document.getElementById("counter")
  console.log({ selectedMarkers, markerList })
  var clientCount = selectedMarkers.length;
  var pointCount = selectedMarkers.length;
  var partners = [];
  var weightSum = 0
  var volumeSum = 0
  
  for (let index = 0; index < selectedMarkers.length; index++) {
    const markerId = selectedMarkers[index];
    const marker = markerList.find((item) => item.options.id === markerId);
    const partner = marker.options.item.textPopup.partner;

    if (!partners.includes(partner)) {
      partners.push(partner);
    }
    console.log({ marker })
    weightSum += marker.options.item.textPopup.weight
    volumeSum += marker.options.item.textPopup.volume
    
  }


  
  counterDiv.innerHTML = `Клиентов: ${clientCount}; Точек: ${pointCount}; Партнеров: ${partners.length}; Вес: ${weightSum}; Объем: ${volumeSum}`


}


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
  calculateCounter()
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

  calculateCounter();

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


function cleanPoints(id) {
  if (id && myLayers.points && myLayers.points[id]) {
    myLayers.points[id].clearLayers();
    layerControl.removeLayer(myLayers.points[id]);
    return
  }

  if (myLayers.points) {
    const pointsIds = Object.values(myLayers.points)

    pointsIds.forEach(item => {
      item.clearLayers();
      layerControl.removeLayer(item);
    })
  }


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
            icon: L.divIcon({
              // iconUrl: "./img/map.svg",
              className: 'my-icon-arrow',
              html: `
              <svg version="1.1" id="icons" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 128 128" style="enable-background:new 0 0 128 128;" xml:space="preserve">
<style type="text/css">
	.st0{display:none;fill:${color};}
	.st1{display:none;fill-rule:evenodd;clip-rule:evenodd;fill:${color};}
	.st2{display:none;}
	.st3{display:inline;fill-rule:evenodd;clip-rule:evenodd;fill:${color};}
	.st4{display:inline;fill:${color};}
	.st5{fill:${color};}
</style>
<g id="row3">
	<path id="nav:5_3_" class="st0" d="M17.7,59.6c0,7.2,5.9,13,13.3,13c5.5,0,10.2-3.3,12.2-7.9l40.5,8.1c0,3.6,1.5,6.8,3.9,9.1
		l-13.9,21.6c-1.9-1-4.1-1.6-6.4-1.6c-7.3,0-13.3,5.8-13.3,13c0,7.2,5.9,13,13.3,13s13.3-5.9,13.3-13c0-2.9-0.9-5.5-2.5-7.7
		l14.4-22.3c1.4,0.5,2.9,0.8,4.5,0.8c7.3,0,13.3-5.8,13.3-13s-5.9-13-13.3-13c-5.4,0-10,3.2-12.1,7.7l-40.7-8.1
		c-0.1-4.1-2.1-7.7-5.2-10l10.1-23.5c1,0.2,2,0.4,3.1,0.4c7.3,0,13.3-5.8,13.3-13S59.5,0,52.2,0c-7.3,0-13.3,5.8-13.3,13
		c0,4.2,2,7.9,5.1,10.3L33.8,46.9c-0.9-0.2-1.9-0.3-2.8-0.3C23.7,46.6,17.7,52.4,17.7,59.6z M45.5,13c0-3.6,3-6.5,6.6-6.5
		c3.7,0,6.6,2.9,6.6,6.5s-3,6.5-6.6,6.5C48.5,19.6,45.5,16.6,45.5,13z M90.4,72.7c0-3.6,3-6.5,6.6-6.5c3.7,0,6.6,2.9,6.6,6.5
		s-3,6.5-6.6,6.5C93.3,79.2,90.4,76.3,90.4,72.7z M67.3,108.4c3.7,0,6.6,2.9,6.6,6.5c0,3.6-3,6.5-6.6,6.5c-3.7,0-6.6-2.9-6.6-6.5
		C60.7,111.3,63.7,108.4,67.3,108.4z M24.4,59.6c0-3.6,3-6.5,6.6-6.5c3.7,0,6.6,2.9,6.6,6.5c0,3.6-3,6.5-6.6,6.5
		C27.3,66.2,24.4,63.2,24.4,59.6z"/>
	<path id="nav:4_2_" class="st0" d="M68.6,46.6H58.3l-2.6,15.5h15.5L68.6,46.6z M110,66.5c-9.9,0-18,7.9-18,17.7
		c0,9.8,8,17.7,18,17.7c9.9,0,18-7.9,18-17.7C128,74.4,120,66.5,110,66.5z M110,89.2l-7.6,4.5l7.6-20.9l7.6,20.9L110,89.2z
		 M108.2,61.6c-1.7,0.1-3.3,0.4-4.8,0.9L92.1,30.8H67.4l1.7,10H57.8l1.7-10H38.6L8.3,90.4h44l3.4-20.3h15.6l3.4,20.3H88
		c0.5,1.6,1.1,3.2,1.9,4.6H0l36-68.8h58.9L108.2,61.6z"/>
	<path id="nav:3_4_" class="st1" d="M128,64L90.3,50.3l10.5-22.5L77.9,38.1L64,1L50,38.1L27.2,27.8l10.5,22.5L0,64l37.7,13.7
		l-10.5,22.5L50,89.9L64,127l14-37.1l22.8,10.3L90.3,77.7L128,64z M11,64.2l29.1-8.7l5.7-1.7l15.1,10.4H11z M64,115.5l-8.7-28
		l-1.9-6.2L64,66.5V115.5z M64,12.5l8.7,28l1.9,6.2L64,61.6V12.5z M82.2,74.3L67.2,63.9H117l-29.1,8.7L82.2,74.3z"/>
	<path id="nav:2_1_" class="st1" d="M110.5,12.7c-9.7,0-17.5,7.7-17.5,17.1c0,4.2,5.2,13.1,5.2,13.1l8.8,14.5
		c-13.2,0.8-33.4,7.5-34,28.9c-0.1,4.9-2,8.9-5.7,12.3c-10.5,9.7-32.5,10.9-40.6,11l12.5-21.8c0,0,8-12.1,8-17.7
		c0-12.8-10.6-23.2-23.7-23.2C10.6,46.9,0,57.3,0,70.1c0,5.7,7.1,17.7,7.1,17.7L23.6,115l0,0.3c0.2,0,1,0,2.4,0
		c7.9,0,32.8-1,45.3-12.5c4.8-4.4,7.3-9.9,7.5-16.3c0.6-23.2,29.1-23.6,31.7-23.5h0.1l0.1-0.1l11.5-20c0,0,5.9-8.9,5.9-13.1
		C128,20.4,120.2,12.7,110.5,12.7z M23.7,82c-7.7,0-14-6.1-14-13.6c0-7.5,6.3-13.7,14-13.7c7.7,0,14,6.1,14,13.7
		C37.7,75.9,31.4,82,23.7,82z M110.5,38.6c-5.7,0-10.3-4.5-10.3-10.1c0-5.6,4.6-10.1,10.3-10.1c5.7,0,10.3,4.5,10.3,10.1
		C120.8,34.1,116.2,38.6,110.5,38.6z"/>
	<path id="nav:1_3_" class="st0" d="M0,86.7c0.6,10.1,4.7,20,12.6,27.8c7.9,7.8,17.9,11.8,28.2,12.4l-0.5-5
		c-8.9-0.4-17.8-3.8-24.6-10.5C9,104.7,5.5,96,5.1,87.3L0,86.7z M11.8,86.2c0.1,7.5,2.9,14.8,8.8,20.5c5.7,5.6,13.2,8.5,20.7,8.7
		l-0.9-4.9c-6,0-12.1-2.2-16.7-6.8c-4.7-4.6-7-10.8-6.9-16.8L11.8,86.2z M23.6,86.5c-0.2,4.5,1.4,9,4.8,12.4c3.5,3.5,8.2,5,12.8,4.7
		l-1.7-4.8c-2.9,0.2-5.8-0.8-8-2.9c-2.4-2.4-4.1-5.1-3.6-8.2L23.6,86.5z M126.1,87.6l-26.5-26l6.7-6.6l-6.3-6.2l3.9-3.8L83.8,25.1
		l-3.9,3.8l-6.7-6.6l-6.7,6.6L40,2.9c-2.4-2.4-6.6-2.4-9,0L7.9,25.6c-2.5,2.4-2.5,6.4,0,8.9l26.5,26l-5.1,5c-1.7,1.7-1.7,4.3,0,5.9
		l8.8,8.7l-6.6,6.4l9.5,9.4l6.5-6.5l8.8,8.7c1.7,1.6,4.3,1.6,6,0l5.1-5l26.5,26c1.2,1.2,2.8,1.8,4.5,1.8c1.7,0,3.3-0.6,4.5-1.8
		l23.1-22.7c1.2-1.2,1.9-2.8,1.9-4.4C128,90.4,127.3,88.8,126.1,87.6z M37.4,57.6l-26.5-26c-0.8-0.8-0.8-2.1,0-2.9l2.7-2.6
		l27.9,27.5L37.4,57.6z M43.1,52L15.1,24.5l3.9-3.8L47,48.1L43.1,52z M48.5,46.6L20.5,19.2l3.9-3.8l27.9,27.5L48.5,46.6z M53.9,41.3
		L26,13.8l3.9-3.8l27.9,27.5L53.9,41.3z M59.3,36L31.4,8.5L34,5.9c0.4-0.4,0.9-0.6,1.5-0.6c0.6,0,1.1,0.2,1.5,0.6l26.5,26L59.3,36z
		 M100,116.2c-0.8,0.8-2.2,0.8-3,0l-26.5-26l4.2-4.1l28,27.5L100,116.2z M104.2,112.1l-28-27.5l3.9-3.8l28,27.5L104.2,112.1z
		 M109.6,106.8l-28-27.5l3.9-3.8l28,27.5L109.6,106.8z M115.1,101.5L87.1,74l3.9-3.8l28,27.5L115.1,101.5z M123.1,93.5l-2.7,2.6
		l-28-27.5l4.2-4.1l26.5,26c0.4,0.4,0.6,0.9,0.6,1.5C123.8,92.6,123.5,93.1,123.1,93.5z"/>
</g>
<g id="row2">
	<polygon id="nav:5_2_" class="st0" points="103.1,78 103.1,65.4 69.6,65.4 69.6,127.1 58,127.1 58,65.4 24.9,65.4 24.9,78 0,60.7 
		24.9,43.4 24.9,56 58,56 58,25.4 46.6,25.4 64.2,0.9 81.8,25.4 69.6,25.4 69.6,56 103.1,56 103.1,43.4 128,60.7 	"/>
	<path id="nav:4_1_" class="st1" d="M36.1,55.8L75.9,76c4.9,2.5,6.8,8.4,4.3,13.2c-2.5,4.8-8.5,6.7-13.4,4.2L26.9,73.2
		c-4.9-2.5-6.8-8.4-4.3-13.2S31.2,53.3,36.1,55.8z M37.9,84.3l13.3,6.8L23.9,127L37.9,84.3z M68.2,2l33.7,17.1
		c4.1,2.1,5.8,7.1,3.6,11.2c-2.1,4.1-7.2,5.7-11.4,3.6L60.5,16.7c-4.1-2.1-5.8-7.1-3.6-11.2C59,1.5,64.1-0.1,68.2,2z M76.1,71.1
		c2.3-6.8,5.4-14,9.2-21.1c2.1-4,4.3-7.8,6.6-11.4L57.9,21.3c-1.7,3.9-3.5,7.9-5.6,11.9c-3.8,7.2-7.9,13.8-12.2,19.6L76.1,71.1z"/>
	<path id="nav:3_2_" class="st1" d="M64,0C28.2,0,0,27.8,0,63c0,35.2,28.2,62.9,64,62.9c9.3,0,18-1.9,25.9-5.3l-3-4.9
		c-2.2,0.8-4.4,1.5-6.7,2.1c1.5-2,2.9-4.1,4.2-6.2l-3.2-5.2c0,0,0,0,0,0c-2.5,4.8-5.4,9.3-8.5,13.4c-2.1,0.4-3.9,0.5-5.8,0.5V92.4
		c2.6,0.2,5.3,0.5,8,1c-0.8-2.1-1.5-4.1-1.9-6c-2.1-0.4-4.1-0.6-6.1-0.7V65.7h13.5c2.1-2.2,4.6-4.1,7.4-5.6H66.8V39.3
		c6.4-0.4,13.7-2.2,20.9-5.2c3.1,8,5.1,15.9,5.7,23.8c1.8-0.5,3.6-0.8,5.5-1c-0.7-7.3-2.9-16-6.2-24.7c5.6-2.4,10.7-5,14.7-7.8
		c8.6,9.4,13.9,21.9,14.5,35.7h-7c5.4,2.8,9.7,7.3,12.3,12.7c0.5-3.2,0.8-6.5,0.8-9.9C128,27.8,99.8,0,64,0z M47.8,8
		c-4.1,5.6-7.9,12.4-10.7,19.4c-4.9-2-9.2-4.4-12.6-6.8C31.1,14.6,39,10.2,47.8,8z M20.5,24.5c4,2.8,9.1,5.4,14.7,7.8
		c-3.8,10-6,20-6.4,27.9H6C6.6,46.3,11.9,33.9,20.5,24.5z M6,65.7h22.8c0.2,7.8,2.4,18,6.4,28c-5.6,2.4-10.7,5-14.7,7.8
		C11.9,92,6.6,79.6,6,65.7z M24.5,105.4c3.6-2.6,7.9-5,12.8-7c2.6,7,6.2,13.7,10.5,19.4C39,115.7,31.1,111.3,24.5,105.4z
		 M61.2,120.2c-1.9,0-3.8-0.2-5.8-0.5c-5.3-6.9-9.8-15-13.2-23.3c6.4-2.2,13-3.5,19-3.9V120.2z M61.2,86.7
		c-6.4,0.4-13.7,2.2-20.9,5.2c-3.4-8.9-5.5-17.8-5.8-26.1h26.7V86.7z M61.2,60.2H34.4c0.4-8.7,2.4-17.4,5.8-26.1
		c7.2,2.9,14.5,4.8,20.9,5.2V60.2z M61.2,33.5c-6.2-0.4-13-1.9-19.2-4.1c3.6-8.5,8.3-16.3,13.4-23.1c2.1-0.4,3.9-0.5,5.8-0.5V33.5z
		 M66.8,33.5V5.8c1.9,0,3.8,0.2,5.8,0.5c5.1,6.8,9.8,14.6,13.4,23.1C79.8,31.7,73,33.2,66.8,33.5z M90.9,27.4
		c-2.8-7-6.6-13.9-10.7-19.4c8.8,2.2,16.8,6.7,23.3,12.6C100.1,23,95.8,25.4,90.9,27.4z M121.2,77c-2-4.1-5.3-7.5-9.4-9.7
		c-3.1-1.6-6.7-2.6-10.4-2.6c-0.6,0-1.2,0-1.8,0.1c-1.5,0.1-2.9,0.4-4.2,0.8c-1.5,0.4-3,1-4.4,1.7c-2.1,1.1-4,2.6-5.6,4.3
		c-3.7,3.8-5.9,9-5.9,14.7c0,0.6,0.1,1.2,0.2,1.9c0.3,1.4,0.8,3,1.4,4.6c1.9,4.7,4.6,9.5,4.9,9.9c0,0,0,0,0,0l2.4,4l1.9,3.2l2.3,3.8
		l8.7,14.3l14.6-25.3c0,0,7.4-11.2,7.4-16.4C123.3,83,122.5,79.8,121.2,77z M114.2,85.9c-0.3,3.4-1.9,6.3-4.4,8.4
		c-1.8,1.5-4.1,2.6-6.6,2.9c-0.6,0.1-1.3,0.2-1.9,0.2c-4.6,0-8.7-2.4-11-5.9c-1.3-1.9-2-4.2-2-6.7c0-4.8,2.8-9,6.9-11.2
		c1.4-0.7,2.8-1.2,4.4-1.4c0.5-0.1,1.1-0.1,1.6-0.1c7.2,0,12.9,5.7,12.9,12.6C114.3,85.1,114.2,85.5,114.2,85.9z"/>
	<path id="nav:2" class="st0" d="M76.8,32H17.6c-1.8,0-3.3,1.5-3.3,3.2v89.6c0,1.8,1.5,3.2,3.3,3.2h59.2c1.8,0,3.3-1.5,3.3-3.2V35.2
		C80.1,33.4,78.6,32,76.8,32z M47.2,125.9c-3.1,0-5.6-2.5-5.6-5.5c0-3.1,2.5-5.5,5.6-5.5c3.1,0,5.6,2.5,5.6,5.5
		C52.8,123.4,50.3,125.9,47.2,125.9z M73.3,110.3c0,0.9-0.7,1.6-1.6,1.6H22.7c-0.9,0-1.6-0.7-1.6-1.6V40.2c0-0.9,0.7-1.6,1.6-1.6
		h48.9c0.9,0,1.6,0.7,1.6,1.6V110.3z M113.7,38.8c-0.6-9.8-4.6-19.3-12.2-26.8C93.9,4.5,84.2,0.6,74.3,0l0.5,4.8
		c8.6,0.4,17.2,3.7,23.7,10.1c6.5,6.4,9.9,14.9,10.3,23.3L113.7,38.8z M102.3,39.3c-0.1-7.2-2.8-14.3-8.4-19.8
		c-5.5-5.4-12.7-8.2-20-8.4l0.9,4.7c5.8,0,11.7,2.2,16.2,6.5c4.5,4.5,6.7,10.4,6.6,16.2L102.3,39.3z M90.9,39
		c0.2-4.3-1.3-8.7-4.7-12c-3.4-3.3-7.9-4.9-12.4-4.6l1.6,4.7c2.8-0.2,5.6,0.7,7.8,2.8c2.3,2.3,3.9,4.9,3.4,7.9L90.9,39z M47.2,61.7
		c-9.2,0-16.7,7.4-16.7,16.5c0,9.1,7.5,16.5,16.7,16.5c9.3,0,16.8-7.4,16.8-16.5C64,69.1,56.5,61.7,47.2,61.7z M47.2,82.9l-7.1,4.2
		l7.1-19.5l7.1,19.5L47.2,82.9z"/>
	<path id="nav:1" class="st1" d="M33.1,31.3C33.1,14.6,47.2,1,64.2,1c17,0,30.7,13.5,30.7,30.2c0,14.4-10.2,26.4-23.8,29.4L63.8,127
		l-7.3-66.4C43.2,57.1,33.1,45.4,33.1,31.3z M63.8,23.2c0-4.6-3.8-8.2-8.4-8.2S47,18.6,47,23.2s3.8,8.2,8.4,8.2S63.8,27.7,63.8,23.2
		z"/>
</g>
<g id="row1">
	<path id="nav:5_1_" class="st0" d="M49.7,1h23.7v14H49.7V1z M49.7,47.7h23.7V57H49.7V47.7z M49.7,89.6h23.7V127H49.7V89.6z
		 M30.8,19.7h75.9V43H30.8L18.4,31.4L30.8,19.7z M21.3,61.7h75.9l12.4,11.7L97.1,85H21.3V61.7z"/>
	<path id="nav:4" class="st1" d="M64,1C38.8,1,18.3,21.2,18.3,46S64,127,64,127s45.7-56.2,45.7-81S89.2,1,64,1z M64,74.9
		c-16.6,0-30-13.2-30-29.5C34,29,47.4,15.8,64,15.8c16.6,0,30,13.2,30,29.5C94,61.6,80.6,74.9,64,74.9z"/>
	<g id="nav:3_3_" class="st2">
		<ellipse class="st3" cx="16.7" cy="81.5" rx="4.6" ry="4.6"/>
		<ellipse class="st3" cx="113.7" cy="49.4" rx="4.6" ry="4.6"/>
		<path class="st4" d="M82.9,76.4c-1.6,0-3.1-0.2-4.5-0.6l1-3.5c1.4,0.4,3.2,0.5,4.8,0.4l0.3,3.6C84,76.4,83.5,76.4,82.9,76.4z
			 M90.5,74.6l-1.8-3.2c1.3-0.7,2.4-1.7,3.4-3.1l3,2.1C93.8,72.3,92.3,73.6,90.5,74.6z M20.3,74l-3.6-1c0.5-1.8,1.1-3.6,1.7-5.3
			l3.5,1.3C21.3,70.5,20.8,72.2,20.3,74z M72.9,72.8c-1.3-1.2-2.6-2.7-3.8-4.6l3.1-2c1.1,1.6,2.1,2.9,3.2,3.8L72.9,72.8z M98,65.4
			l-3.4-1.5c0.3-0.7,0.7-1.5,1-2.2c0.4-0.9,0.8-1.9,1.3-2.8l3.3,1.6c-0.4,0.9-0.8,1.8-1.2,2.7C98.7,63.9,98.4,64.6,98,65.4z
			 M24,64.1l-3.3-1.6c0.9-1.8,1.8-3.4,2.8-5l3.1,1.9C25.6,60.9,24.8,62.4,24,64.1z M66.3,63.4l-0.4-0.7c-0.7-1.3-1.5-2.7-2.3-4
			l3.2-1.8c0.8,1.4,1.6,2.8,2.3,4.2l0.4,0.7L66.3,63.4z M102.9,56.1l-3-2.2c1.4-1.8,2.9-3.1,4.6-4.1l1.8,3.2
			C105.1,53.7,103.9,54.7,102.9,56.1z M29.7,55.4l-2.8-2.4c1.3-1.5,2.8-2.8,4.3-4l2.2,2.9C32.1,52.9,30.8,54,29.7,55.4z M60.7,54.4
			c-1.1-1.4-2.3-2.5-3.6-3.4l2.2-3c1.6,1.1,3,2.4,4.3,4.1L60.7,54.4z M37.8,49.4L36.3,46c1.8-0.8,3.8-1.3,5.8-1.6l0.5,3.6
			C40.9,48.3,39.3,48.7,37.8,49.4z M52.7,48.8c-1.5-0.5-3.2-0.8-5-0.9l0.3-3.6c2.1,0.2,4.1,0.5,5.8,1.1L52.7,48.8z"/>
		<path id="nav:3_1_" class="st4" d="M94.8,14.3L64.1,26.8L33.2,14.3L0,27.8v85.1l33.2-13.4l30.4,12.3l31.2-11.5l33.2,13.6V27.9
			L94.8,14.3z M122.4,105.5L97.6,95.3V70.1c-1.4,2.2-3.1,4.3-5.6,5.8v19.3l-25.6,9.4V67.4c-0.8-1.3-1.4-2.5-2.1-3.8
			c-1.1-2.1-2.2-4.1-3.4-5.9v47L36,94.6V52.4c-2.1,1.3-4,3-5.6,4.9v37.3L5.6,104.7V31.4l24.9-10.1v25.9C32.2,46,34,45,36,44.2V21.4
			l24.9,10.1V47c2.2,1.7,4,3.7,5.6,5.8v-21L92,21.4V65c0.6-1.2,1.3-2.5,1.9-4c1-2.2,2.1-4.6,3.6-6.9V21.4l24.9,10.2V105.5z"/>
	</g>
	<path id="nav:2_3_" class="st5" d="M64,1L17.9,127L64,99.8l46.1,27.2L64,1z M64,21.4l32.6,89.2L64,91.3V21.4z"/>
	<path id="nav:1_2_" class="st0" d="M64,127C28.7,127,0,98.7,0,64S28.7,1,64,1s64,28.2,64,63S99.3,127,64,127z M64,10.2
		C33.8,10.2,9.3,34.3,9.3,64s24.5,53.8,54.7,53.8s54.7-24.1,54.7-53.8S94.2,10.2,64,10.2z M52.8,53L29.9,97.5L75.2,75l22.9-44.5
		L52.8,53z M64,69.5c-3.1,0-5.6-2.4-5.6-5.5c0-3,2.5-5.5,5.6-5.5s5.6,2.4,5.6,5.5C69.6,67,67.1,69.5,64,69.5z"/>
</g>
</svg>

              `,
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
      item: item,
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


    calculateCounter();
    
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


// рисуем points
function renderPoints(points) {
  const markers = L.markerClusterGroup();

  const circleList = [];
  const id = points.id;
  myMarkers[id] = [];

  const color = points.color || "red";


  var divIconGhost = L.divIcon({
    className: "my-div-icon",
    iconSize: 25,
    html: `<div class="my-div-icon_inner"><svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="-4 0 36 36"><g fill="none" fill-rule="evenodd"><path fill="${color}" d="M14 0c7.732 0 14 5.641 14 12.6C28 23.963 14 36 14 36S0 24.064 0 12.6C0 5.641 6.268 0 14 0Z"/><circle cx="14" cy="14" r="7" fill="#fff" fill-rule="nonzero"/></g></svg></div>`,
  });


  points.points.forEach((item, index) => {
    const coord = [];
    coord.push(item.ltd, item.lng);

    var myIcon = L.divIcon({
      className: `my-div-icon my-div-icon_${id}`,
      iconSize: 50,
      color: color,
      
      html: `<div class="my-div-icon_inner"><svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="-4 0 36 36"><g fill="none" fill-rule="evenodd"><path fill="${color}" d="M14 0c7.732 0 14 5.641 14 12.6C28 23.963 14 36 14 36S0 24.064 0 12.6C0 5.641 6.268 0 14 0Z"/><circle cx="14" cy="14" r="7" fill="#fff" fill-rule="nonzero"/></g></svg></div>`,
    });

    let markerOptions = {
      icon: myIcon,
      title: item.textHover,
      id: item.id,
      route_id: id,
      
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
      // pane: "markers",
    });

    circleList.push(circle);

    markerList.push(marker);
    myMarkers[id].push(marker);
    markers.addLayer(marker);
  });
  // markers.addLayer(polyline);

  if (!myLayers.points) {
    myLayers.points = {}
  }
  myLayers.points
  myLayers.points[id] = L.layerGroup(
    [markers, ...circleList],
    {
      color: color,
    }
  );


  layerControl.addOverlay(myLayers.points[id], points.name);

  myLayers.points[id].addTo(map);
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
  calculateCounter();
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
  
  setGeozoneFlag(true)
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
    for (let i = 0; i < coordinates.length; i++) {
      var el = coordinates[i];
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
            polygons.push([element.geometry.coordinates]);
          }
          
        }
  
        const turfMultiPolygons = turf.multiPolygon(polygons);

        
  
        const diff = turf.difference(turfPolygon, turfMultiPolygons);

  
  
        
        if(!window.geoZone) {
          areaSelection.deactivate();
        }
        

        if (diff) {
          const coordinates = diff.geometry.coordinates;
        
        
        var polylinePoints = [];
  
        //треба поменять местами Долготу и Ширину
        for (let i = 0; i < coordinates[0].length; i++) {
          var el = coordinates[0][i];
          polylinePoints.push(new L.LatLng(el[1], el[0]));
        }
        


       
          var polygon = L.polygon(polylinePoints)
        }
  
        
        polygon.setStyle({
          color: "red",
        });
  
          
        
          
          
        if (!window.geoZone) {
         polygon.addTo(map); 
        }

        window.newGeozone = polygon
        


        


        safeButton.addTo(map)
        cancelButton.addTo(map)
      },
      onPolygonDblClick: (polygon, control, ev) => {},
      onButtonActivate: () => {
        window.geoZone = null
      },
      onButtonDeactivate: (polygon) => {
        
      },
      position: "topleft",
    });
  
    map.addControl(areaSelection);

    window.areaSelection = areaSelection
  }




  
}


// функция объединения геозон
function combineGeoZones(geozonesArray = []) {
  var polygons = []
  for (let index = 0; index < geozonesArray.length; index++) {
    const element = geozonesArray[index];
    polygons.push(turf.polygon([element.geometry.coordinates]));
    
  }

  console.log({ polygons })

  var union = polygons[0];
  for (let i=1; i<polygons.length; i++) {
    union = turf.union(union, polygons[i]);
  }


  

  // new Feature collection with unioned features
  // var fc2 = {
  //   "type": "FeatureCollection",
  //   "features": [union] // note features has to be an array
  // }

  // // add to map
  // L.geoJson(fc2).addTo(map);


  
    var result = {
      zone: union,
      line: turf.polygonToLine(union)
    }

    console.log(result)

    L.geoJson(union, {
      style: {
        color: "red"
      }
    }).addTo(map);
    L.geoJson(result.line, {
      style: {
        color: "red"
      }
    }).addTo(map);


  
  
}

//функция преобразования геозоны в полигон леафлет
function geozoneToPolygon(geoZone) {
  const element = geoZone;
  const coordinates =
    !!element && !!element.geometry && element.geometry.coordinates;

  var polylinePoints = [];

  //треба поменять местами Долготу и Ширину
  for (let i = 0; i < coordinates[0].length; i++) {
    var el = coordinates[0][i];
    polylinePoints.push(new L.LatLng(el[1], el[0]));
  }

  var polygon = L.polygon(polylinePoints, { color: element.color, uid: element.uid }).bindPopup(element.name);

  

  var polyline = L.polyline(polylinePoints, { color: element.color, uid: element.uid }).bindPopup(element.name);

  return { polygon, polyline}
}


function flyToBoundsGeozone(uid) {
  const layers = myLayers.geozones.getLayers()
  const currentZone = layers.find((item => item.options.uid === uid))

  if (currentZone) {
    map.flyToBounds(currentZone.getBounds())
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
  showCounter();
  const dataInit = await loadJson("./data/json_0.json");

  const data_route0 = await loadJson("./data/route/json_0.json");
  const data_route1 = await loadJson("./data/route/json_1.json");
  const data_geozones = await loadJson("./data/geozones.json");

  const data2 = await loadJson("./data/next/2.json");


  const points = await loadJson("./data/points.json");

  window.data2 = data2;
  window.points = points;

  window.data_route1 = data_route1;
  window.data_geozones = data_geozones;

  data_0 = dataInit;

  createMap();
  initMap(4, true);

  console.time("FirstWay");

  RouteBuild(JSON.stringify(data_route0));
  RouteBuild(JSON.stringify(data_route1));

  await showAllGeoZones(data_geozones);


  // editGeoZone('9712e912-d0b9-11e1-b37b-005056848888')
  console.timeEnd("FirstWay");


  renderPoints(points)


  

 


}

(function () {
  start();
})();
