let map;
let data;
let engines;
let isCustomSequence = false;
let customSequenceMarkers = [];
let markerList = [];
let newGeozone = false;
let data_newGeozone = [];
let data_newGeozone1 = [];
let isGeoZonesFlag = false;
let canPutGeoZone = false;
let manualMarker = null;

var selectedMarkers = [];
var selectedMarkersCounter = [];
var myLayers = {};
var myMarkers = {};
var layerControl;
var osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap",
});
var google = L.tileLayer(
  "http://{s}.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}",
  { subdomains: ["mt0"], attribution: "© Google maps" }
);

var baseMaps = { OpenStreetMap: osm, "Google maps": google };
var data_geozones = [];
var isShowCounter = true;
var areaSelectionZone;

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
  iconSize: 35,
  html: '<div class="my-div-icon_inner"><svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="-4 0 36 36"><g fill="none" fill-rule="evenodd"><path fill="#000000" d="M14 0c7.732 0 14 5.641 14 12.6C28 23.963 14 36 14 36S0 24.064 0 12.6C0 5.641 6.268 0 14 0Z"/></g><g fill="#fff" transform="scale(0.6) translate(8, 6)"><path d="m15.16 24.73h4.27v6.27h-4.27z"/><path d="m1.98999 13.14001c.15002.39996.52002.66998.94.66998h1.37v16.19001c0 .54999.45001 1 1 1h7.85999v-7.27002c0-.54999.45001-1 1-1h5.27002v-5.27002c0-.54999.45001-1 1-1h7.27002v-2.64996h1.37c.41998 0 .78998-.27002.94-.66998.14001-.39001.02002-.84003-.31-1.10004l-13.06-10.81c-.37-.31-.91003-.31-1.28003 0l-13.06 10.81c-.33002.26001-.45001.71002-.31 1.10003z"/><path d="m21.43 18.46h6.27v4.27h-6.27z"/><path d="m21.42999 24.72998v6.27002h5.27002c.54999 0 1-.45001 1-1v-5.27002z"/></g></svg></div>',
});

var myIconDefault = myIcon;

//------------------------------------------------------------------------------------------
//-- Инициализация карты
//------------------------------------------------------------------------------------------

(function () {
  start();
})();

async function start() {
  createMap();
}

function createMap() {
  window.L_PREFER_CANVAS = true;

  map = L.map("map", {
    boxZoom: false,
    selectArea: true,
    //minZoom: 10,
    renderer: L.canvas(),
  });

  map.on("areaselected", (e) => {
    L.Util.requestAnimFrame(function () {
      markerList.forEach(function (marker, index, array) {
        if (e.bounds.contains(marker.getLatLng())) {
          setMarkerActive(marker);
          addMarkerCounter(marker);
        }
      });

      calculateCounter();
    });
  });

  map.on("click", (e) => {
    if (!isCustomSequence) {
      allMarkerUnactive();
      allMarkersCounterUnactive();

      if (selectedMarkers.length != 0) {
        if (selectedMarkers[0] != 0) {
          if (selectedMarkers[0] === 1) {
            selectedMarkers = [];
            selectedMarkers.push(0);
          }
        }
      }
    }
  });

  const areaSelection = new window.leafletAreaSelection.DrawAreaSelection({
    onPolygonReady: (polygon) => {
      if (isGeoZonesFlag) {
        data_newGeozone = JSON.stringify(polygon.toGeoJSON(3), undefined, 2);
      } else {
        L.Util.requestAnimFrame(function () {
          markerList.forEach(function (marker, index, array) {
            if (polygon.getBounds().contains(marker.getLatLng())) {
              setMarkerActive(marker);
              addMarkerCounter(marker);
            }
          });
          calculateCounter();
        });
      }
    },
  });

  map.selectArea.setControlKey(true);
  map._layersMaxZoom = 10;
  map.addControl(areaSelection);
  map.createPane("markers");
  map.getPane("markers").style.zIndex = 400;

  areaSelectionZone = areaSelection;
}

function init(data1c) {
  data = JSON.parse(data1c);

  ConsoleLogHTML.connect(document.getElementById("log"));

  setFirstView();
}

function setFirstView(zoom = 4) {
  if (data.debug) {
    showlog();
  }

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

    L.easyButton(
      '<span class="btn-toogle-number">#</span>',
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

  addMarker(mapCenter, myIconStock, data.comment);
}

//------------------------------------------------------------------------------------------
//-- Сброс
//------------------------------------------------------------------------------------------

function cleanLayersGroup(layer) {
  allMarkerUnactive();
  allMarkersCounterUnactive();

  layer = JSON.parse(layer);

  myLayers[layer.layer].clearLayers();
  map.removeLayer(myLayers[layer.layer]);
  layerControl.removeLayer(myLayers[layer.layer]);

  markerList = markerList.filter(function (marker) {
    return marker.options.route_id !== layer.layer;
  });
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

  if (data.iconHouse) {
    L.marker(mapCenter, { icon: icon }).addTo(map).bindPopup(comment);
  }
}

function setMarkerActive(marker, pushInArray = true) {
  try {
    L.DomUtil.addClass(marker._icon, "my-div-icon_active");
  } catch (error) {}

  if (pushInArray) {
    selectedMarkers.push(marker.options.id);
    selectedMarkersCounter.push(marker.options.id);
  }

  const color = marker.options.icon.options.color;

  const uniqueSelectedMarker = new Set(selectedMarkers).size;

  //console.log("uniqueSelectedMarker" + " " + uniqueSelectedMarker);

  var number = isCustomSequence
    ? uniqueSelectedMarker
    : marker.options.icon.options.number;

  var numberRoute = isCustomSequence
    ? uniqueSelectedMarker
    : marker.options.icon.options.numberRoute;

  //console.log("selectedMarkers" + " " + selectedMarkers.length);

  // console.log(JSON.stringify(selectedMarkers));

  /*const myIcon = L.divIcon({
    className: `my-div-icon my-div-icon_active`,
    iconSize: 35,
    color: color,
    number: number,
    numberRoute: numberRoute,
    html: `<div class="my-div-icon_inner">${Boolean(numberRoute)
      ? `<span class="my-div-icon_inner_number-route">${numberRoute}</span>`
      : ""
      }<span class="my-div-icon_inner_number">${Boolean(number) ? number : ""
      }</span><svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="-4 0 36 36"><g fill="none" fill-rule="evenodd"><path fill="${color}" d="M14 0c7.732 0 14 5.641 14 12.6C28 23.963 14 36 14 36S0 24.064 0 12.6C0 5.641 6.268 0 14 0Z"/><circle cx="14" cy="14" r="10" fill="#fff" fill-rule="nonzero"/></g></svg></div>`,
  });*/

  const mapMarker = generateSVGMarker(color, numberRoute, number);

  var myIcon = L.divIcon({
    className: `my-div-icon my-div-icon_active`,
    iconSize: 35,
    color: color,
    number: number,
    numberRoute: numberRoute,
    html: mapMarker,
    iconSize: [20, 20],
  });

  if (isCustomSequence) {
    //if (!customSequenceMarkers.includes(marker)) {
    customSequenceMarkers.push(marker);
    //}

    //const customSequenceMarkers = customSequenceMarkers.filter((value, index, self) => {
    // return self.indexOf(value) === index;
    //});
  }

  marker.setIcon(myIcon);
}

const setMarkerUnActive = (marker) => {
  try {
    L.DomUtil.removeClass(marker._icon, "my-div-icon_active");
  } catch (error) {}

  const color = marker.options.icon.options.color;
  const number = isCustomSequence ? 0 : marker.options.icon.options.number;
  const numberRoute = isCustomSequence
    ? 0
    : marker.options.icon.options.numberRoute;

  /*const myIcon = L.divIcon({
    className: `my-div-icon`,
    iconSize: 35,
    color: color,
    number: number,
    numberRoute: numberRoute,
    html: `<div class="my-div-icon_inner">${Boolean(numberRoute)
      ? `<span class="my-div-icon_inner_number-route">${numberRoute}</span>`
      : ""
      }<span class="my-div-icon_inner_number">${Boolean(number) ? number : ""
      }</span><svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="-4 0 36 36"><g fill="none" fill-rule="evenodd"><path fill="${color}" d="M14 0c7.732 0 14 5.641 14 12.6C28 23.963 14 36 14 36S0 24.064 0 12.6C0 5.641 6.268 0 14 0Z"/><circle cx="14" cy="14" r="10" fill="#fff" fill-rule="nonzero"/></g></svg></div>`,
  });*/

  const mapMarker = generateSVGMarker(color, numberRoute, number);

  var myIcon = L.divIcon({
    className: `my-div-icon`,
    iconSize: 35,
    color: color,
    number: number,
    numberRoute: numberRoute,
    html: mapMarker,
    iconSize: [20, 20],
  });

  selectedMarkers = selectedMarkers.filter(
    (item) => item !== marker.options.id
  );

  if (isCustomSequence) {
    customSequenceMarkers = customSequenceMarkers.filter(
      (item) => item.options.id !== marker.options.id
    );
  }

  marker.setIcon(myIcon);
};

function allMarkerUnactive() {
  markerList.forEach(function (marker, index, array) {
    setMarkerUnActive(marker);
  });
}

function clearMarkers(data2) {
  selectedMarkers = [];
  //allMarkersCounterUnactive();

  if (data2 !== undefined) {
    data2 = JSON.parse(data2);

    selectedMarkers.push(data2);
  }
}

function clearActiveMarkers() {
  markerList.forEach((marker, index) => {
    setMarkerUnActive(marker);
  });
}

function setMarkerCenter(data2, parseNeed = true) {
  allMarkerUnactive();
  allMarkersCounterUnactive();

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
      addMarkerCounter(marker);

      map.setView([data2.lat, data2.lng], 20);
    }
  });

  calculateCounter();
}

function returnMarkers() {
  if (selectedMarkers.length != 0) {
    selectedMarkers = Array.from(new Set(selectedMarkers));

    return JSON.stringify(selectedMarkers);
  }
}

function setCenterMap(data2) {
  data2 = JSON.parse(data2);

  console.log(data2);

  map.setView([data2.lat, data2.lng], 20);
}

function generateSVGMarker(color, numberRoute, number) {
  const svg = `<div class="my-div-icon_inner" style="z-index: 999">
    <svg width="22" height="26" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg" data-name="Layer 1">
      <defs>
        <style>.cls-1{fill:none;stroke:${color};stroke-miterlimit:10;stroke-width:1.91px;}</style>
      </defs>
      <g class="layer">
        <path d="m5.4,1.6c0.1,0 6.3,0 6.3,0c0,0 5.6,0.11 5.6,0.11c0,0 2.2,0.22 2.2,0.11c0,-0.11 1.1,1.83 1.1,1.83c0,0 0.5,3.98 0.5,3.98c0,0 -0.4,2.8 -0.4,2.69c0,-0.11 -0.5,2.69 -0.5,2.69c0,0 -0.8,0.97 -0.9,0.97c-0.1,0 -2.4,0 -2.4,0c0,0 -2.7,0 -2.7,0c0,0 -1.1,1.72 -1.1,1.72c0,0 -1.3,2.58 -1.3,2.58c0,0 -0.5,1.72 -0.6,1.61c-0.1,-0.11 -2.8,-5.6 -2.8,-5.6c0,0 -4.6,-0.22 -4.7,-0.22c-0.1,0 -1.2,-1.08 -1.3,-1.08c-0.1,0 -1.1,-2.8 -1.1,-2.91c0,-0.11 -0.1,-4.41 -0.1,-4.52c0,-0.11 0.4,-2.26 0.4,-2.26c0,0 1.4,-1.72 1.5,-1.72c0.1,0 2.3,0 2.3,0z" fill="#ffffff" id="svg_7"/>
        <path class="cls-1" d="m17.25,1.48l-12.25,0a3.5,2.92 0 0 0 -3.5,2.92l0,7.28a3.5,2.92 0 0 0 3.5,2.92l3.5,0l2.52,7.97l2.72,-7.97l3.5,0a3.5,2.92 0 0 0 3.5,-2.92l0,-7.28a3.5,2.92 0 0 0 -3.5,-2.92l0.01,0z" id="svg_2" transform="matrix(1 0 0 1 0 0)">&quot;1</path>
        <text fill="#000000" font-size="10" font-weight="bold" id="svg_8" stroke-width="0" text-anchor="middle" x="11" xml:space="preserve" y="11.6" style="display:inline-block">
          <span class="my-div-icon_inner_number-route">${numberRoute}</span>
          <span class="my-div-icon_inner_number">${number}</span>
        </text>
      </g>
    </svg>
  </div>`;

  /*const svg = `<div class="my-div-icon_inner">${Boolean(numberRoute)
    ? `<span class="my-div-icon_inner_number-route">${numberRoute}</span>` : ""
    }<span class="my-div-icon_inner_number">${Boolean(number) ? number : ""
    }</span><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="61" height="33" x="0px" y="0px" viewBox="0 0 61 85" enable-background="new 0 0 61 85" xml:space="preserve">
    <path fill="${color}" d="M31.75,0C48.318,0,61,12.488,61,29.057V30c0,21.834-19.322,49-29.75,55H31C20.572,79,0,51.834,0,30v-0.943  C0,12.488,13.932,0,30.5,0C30.667,0,31.583,0,31.75,0z"></path>
    <path fill="${color}" d="M31.688,2C47.428,2,59,13.989,59,29.729v0.896C59,51.367,41.119,77,31.212,83h-0.237  C21.069,77,2,51.367,2,30.625v-0.896C2,13.989,14.76,2,30.5,2C30.659,2,31.529,2,31.688,2z"></path>
    <text x="50%" y="50%" dy=".13em" font-size="40" font-weight="bold" text-anchor="middle" fill="${color}">${number}</text></svg></div>`;*/

  return svg;
}

function generateSVGMarkerFlag(color) {
  /*const svg = `<div class="my-div-icon_inner" style="z-index: 999">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.42 4.44994C19.3203 4.38116 19.2053 4.3379 19.085 4.32395C18.9647 4.31 18.8428 4.32579 18.73 4.36994C17.5425 4.8846 16.2857 5.22155 15 5.36994C14.1879 5.15273 13.4127 4.81569 12.7 4.36994C11.7802 3.80143 10.763 3.40813 9.7 3.20994C8.41 3.08994 5.34 4.09994 4.7 4.30994C4.55144 4.36012 4.42234 4.4556 4.33086 4.58295C4.23938 4.71031 4.19012 4.86314 4.19 5.01994V19.9999C4.19 20.1989 4.26902 20.3896 4.40967 20.5303C4.55032 20.6709 4.74109 20.7499 4.94 20.7499C5.13891 20.7499 5.32968 20.6709 5.47033 20.5303C5.61098 20.3896 5.69 20.1989 5.69 19.9999V14.1399C6.93659 13.6982 8.23315 13.4127 9.55 13.2899C10.3967 13.4978 11.2062 13.8351 11.95 14.2899C12.8201 14.8218 13.7734 15.2038 14.77 15.4199H15C16.4474 15.2326 17.8633 14.8526 19.21 14.2899C19.3506 14.2342 19.4713 14.1379 19.5568 14.0132C19.6423 13.8885 19.6887 13.7411 19.69 13.5899V5.06994C19.6975 4.95258 19.6769 4.83512 19.63 4.7273C19.583 4.61947 19.511 4.5244 19.42 4.44994Z" fill="${color}"/>
  </div>`;*/

  const svg = `<div class="my-div-icon_inner" style="z-index: 999">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.75 1C6.16421 1 6.5 1.33579 6.5 1.75V3.6L8.22067 3.25587C9.8712 2.92576 11.5821 3.08284 13.1449 3.70797L13.3486 3.78943C14.9097 4.41389 16.628 4.53051 18.2592 4.1227C19.0165 3.93339 19.75 4.50613 19.75 5.28669V12.6537C19.75 13.298 19.3115 13.8596 18.6864 14.0159L18.472 14.0695C16.7024 14.5119 14.8385 14.3854 13.1449 13.708C11.5821 13.0828 9.8712 12.9258 8.22067 13.2559L6.5 13.6V21.75C6.5 22.1642 6.16421 22.5 5.75 22.5C5.33579 22.5 5 22.1642 5 21.75V1.75C5 1.33579 5.33579 1 5.75 1Z" fill="${color}"/>
    </svg>
  </div>`;

  return svg;
}

//------------------------------------------------------------------------------------------
//-- Маршрут
//------------------------------------------------------------------------------------------

function RouteBuild(data_in, parseNeed = true) {
  if (parseNeed) {
    data_in = JSON.parse(data_in);
  }

  const circleList = [];
  const route = data_in.route;
  const road = data_in.road;
  const deliveryPoints = data_in.deliveryPoints;
  const myRoute = [];
  const color = route.color || "black";
  const textColor = tinycolor.mostReadable(color, ["#fff", "#000"]);
  const spiderfyOnMaxZoom = data_in.parameters.spiderfyOnMaxZoom;
  const maxClusterRadius = data_in.parameters.maxClusterRadius;
  const coveragesChildCount = data_in.parameters.coveragesChildCount;
  const zoomToBoundsOnClick = data_in.parameters.zoomToBoundsOnClick;
  const showClusterWeight = data_in.parameters.showClusterWeight;
  const smoothFactorValue = data_in.parameters.smoothFactor;
  const coverages = new L.LayerGroup(); //-- https://jsfiddle.net/mad__97/3v7hd2vx/211/
  const markers = L.markerClusterGroup({
    removeOutsideVisibleBounds: true,
    spiderfyOnMaxZoom: spiderfyOnMaxZoom,
    maxClusterRadius: maxClusterRadius,
    zoomToBoundsOnClick: zoomToBoundsOnClick,
    iconCreateFunction: function (cluster) {
      let textMarker = cluster.getChildCount();

      if (showClusterWeight) {
        const clusterMarkers = cluster.getAllChildMarkers();

        let weightSum = 0;

        for (var i = 0; i < clusterMarkers.length; i++) {
          const clusterMarker = clusterMarkers[i];
          const weight = Number(clusterMarker.options.item.textPopup.weight);

          weightSum += weight;
        }

        if (weightSum >= 100) {
          textMarker = parseFloat((weightSum / 1000).toFixed(2)) + "т";
        } else {
          textMarker = weightSum.toFixed(0) + "кг";
        }
      }

      return new L.divIcon({
        html: `<svg width="56" height="56" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg">
          <g class="layer">
            <circle cx="18px" cy="18px" fill="${color}" fill-opacity="0.8" id="svg_1" r="9px"/>
            <circle cx="18px" cy="18px" fill="${color}" fill-opacity="0.6" id="svg_2" r="12px"/>
            <circle cx="18px" cy="18px" fill="${color}" fill-opacity="0.3" id="svg_3" r="15px"/>
            <text fill="${textColor}" fill-opacity="1" font-weight="bold" font-size="10" id="svg_6" stroke-width="0" text-anchor="middle" x="18" xml:space="preserve" y="21">${textMarker}</text>
          </g>
        </svg>`,
        className: "marker-cluster",
        iconSize: new L.Point(15, 15),
      });
    },
  });

  let options = { color: color, smoothFactor: smoothFactorValue };
  let polylinePoints = [];
  let polylinePointsRoad = [];
  let arCoordinates = route.geometry;
  let arCoordinatesRoad = road.geometry;
  let orderList = [];

  myMarkers[route.id] = [];

  var divIconGhost = L.divIcon({
    className: "my-div-icon",
    iconSize: 35,
    html: `<div class="my-div-icon_inner"><svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="-4 0 36 36"><g fill="none" fill-rule="evenodd"><path fill="${color}" d="M14 0c7.732 0 14 5.641 14 12.6C28 23.963 14 36 14 36S0 24.064 0 12.6C0 5.641 6.268 0 14 0Z"/><circle cx="14" cy="14" r="10" fill="#fff" fill-rule="nonzero"/></g></svg></div>`,
  });

  for (let i = 0; i < arCoordinates.length; i++) {
    polylinePoints.push(new L.LatLng(arCoordinates[i][1], arCoordinates[i][0]));
  }

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
              className: "my-icon-arrow",
              html: `
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 256 256" enable-background="new 0 0 256 256" xml:space="preserve">
                <metadata> Svg Vector Icons : http://www.onlinewebfonts.com/icon </metadata>
                <g><g><g><path fill="${color}" d="M124.8,11.5c-1.7,1.7-99.5,228.1-100,231.5c-0.3,2.3,0.7,3.3,2.8,2.8c0.8-0.2,23.7-13.2,50.9-29l49.5-28.6l49.4,28.5c27.1,15.7,49.9,28.7,50.6,29c2.4,0.7,3.5-0.2,3.1-2.6c-0.5-3.3-99-229.5-100.9-231.5C128.4,9.5,126.8,9.5,124.8,11.5z"/></g></g></g>
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

  deliveryPoints.forEach((item, index) => {
    const coord = [];
    coord.push(item.ltd, item.lng);

    const colorMarker = item.color;

    let numberRoute = item.numberRoute;
    let number = item.number;

    if (number === 0) {
      number = "";

      if (showClusterWeight) {
        const weightPoint = item.textPopup.weight;

        number = item.textPopup.weight.toFixed(0) + "кг";
      }
    }

    const mapMarker = generateSVGMarker(colorMarker, numberRoute, number);

    var myIcon = L.divIcon({
      className: `my-div-icon my-div-icon_${route.id}`,
      iconSize: 35,
      color: color,
      number: number,
      numberRoute: item.numberRoute,
      html: mapMarker,
      iconSize: [20, 20],
    });

    let markerOptions = {
      icon: myIcon,
      //title: item.textHover,
      id: item.id,
      item: item,
      route_id: route.id,
      // pane: "markers"
    };

    let marker = L.marker(coord, markerOptions)
      .bindTooltip(
        //'<span style="font-size: 10px;">' + item.textHover + '</span>',
        '<span style="font-size: 10px;">' +
          item.textPopup.partner +
          "/" +
          item.textPopup.address +
          "</span>",
        { offset: [15, 0] }
      )
      .bindPopup(
        `
      ${
        Boolean(item.textPopup.partner)
          ? `<div><b>Контрагент: </b>${item.textPopup.partner}</div>`
          : ""
      }
      ${
        Boolean(item.textPopup.weight)
          ? `<div><b>Вес, кг: </b>${item.textPopup.weight}</div>`
          : ""
      }
      ${
        Boolean(item.textPopup.volume)
          ? `<div><b>Объем, м³: </b>${item.textPopup.volume}</div>`
          : ""
      }
      ${
        Boolean(item.textPopup.address)
          ? `<div><b>Адрес: </b>${item.textPopup.address}</div>`
          : ""
      }
      ${
        Boolean(item.textPopup.date)
          ? `<div><b>Интервал доставки: </b>${item.textPopup.date}</div>`
          : ""
      }
      ${
        Boolean(item.textPopup.comment)
          ? `<div><b>Комментарий: </b>${item.textPopup.comment}</div>`
          : ""
      }
      `,
        {
          offset: [0, -20],
        }
      );

    markerList.push(marker);
    //myMarkers[route.id].push(marker) //-- 20240610 Пока не понимаю для чего он тут
    markers.addLayer(marker);
  });

  markers.on("click", function (e) {
    const marker = e.sourceTarget;

    if (!isCustomSequence) {
      allMarkerUnactive();
      allMarkersCounterUnactive();
    }

    if (selectedMarkers.includes(marker.options.id)) {
      setMarkerUnActive(marker);

      marker.closePopup();
    } else {
      setMarkerActive(marker);
      addMarkerCounter(marker);

      calculateCounter();
    }

    if (isCustomSequence) {
      drawPolyline(route.id, polyline, decorator);
    }
  });

  markers.on("animationend", function () {
    // Here getting clusters randomly, but you can decide which one you want to show coverage of.

    coverages.clearLayers();

    markers._featureGroup.eachLayer(function (layer) {
      if (
        layer instanceof L.MarkerCluster &&
        layer.getChildCount() > coveragesChildCount
      ) {
        const childCount = layer.getChildCount();
        var opacity = childCount / 80 || 0.2;

        if (opacity > 0.8) {
          opacity = 0.8;
        }

        if (opacity < 0.2) {
          opacity = 0.2;
        }

        coverages.addLayer(
          L.polygon(layer.getConvexHull(), {
            color: color,
            fillOpacity: opacity,
            chunkedLoading: true,
            stroke: false,
          })
        );
      }

      coverages.addTo(map);
    });
  });

  if (!spiderfyOnMaxZoom) {
    markers.on("clusterclick", function (event) {
      const currentZoom = map.getZoom();
      const maxZoom = map.getMaxZoom();

      if (currentZoom === maxZoom) {
        const clusterMarkers = event.layer.getAllChildMarkers();

        allMarkerUnactive();
        allMarkersCounterUnactive();

        clusterMarkers.forEach(function (marker) {
          addMarkerCounter(marker);
          setMarkerActive(marker);
        });

        calculateCounter();
      }
    });

    if (!zoomToBoundsOnClick) {
      markers.on("clusterclick", function (event) {
        const clusterMarkers = event.layer.getAllChildMarkers();

        allMarkerUnactive();
        allMarkersCounterUnactive();

        clusterMarkers.forEach(function (marker) {
          addMarkerCounter(marker);
          setMarkerActive(marker);
        });

        calculateCounter();
      });
    }
  }

  markers
    .on("clustermouseover", function (event) {
      //const currentZoom = map.getZoom();

      //if (currentZoom > 9) {
      const clusterMarkers = event.layer.getAllChildMarkers();

      orderList = [];

      clusterMarkers.forEach(function (marker) {
        orderList.push(
          marker.options.item.textPopup.partner +
            "/" +
            marker.options.item.textPopup.address
        );
      });

      const uniqueOrderList = Array.from(new Set(orderList));

      let text = uniqueOrderList.join("<br/>");

      event.layer
        .bindTooltip('<span style="font-size: 10px;">' + text + "</span>", {
          offset: [20, 10],
          direction: "right",
        })
        .openTooltip();
      //}
    })
    .on("clustermouseout", function (ev) {
      event.layer.unbindTooltip();
    });

  //-- Всплывашка при наведении на полилинию маршрута
  /*polyline.bindTooltip(
      `${Boolean(driverInfo.point)
          ? `<div><b>Номер Маршрута: </b>${driverInfo.route}</div>`
          : ""
      }`,
      { 
          permanent: false, 
          sticky: true,
          direction: 'top' 
      }
  );

  polyline.on('mouseover', function () {
      this.openTooltip();
      clearTimeout(tooltipTimeout); 
  });

  polyline.on('mouseout', function () {
    tooltipTimeout = setTimeout(() => {
      this.closeTooltip(); 
    }, 1000);
  });*/

  myLayers[route.id] = L.layerGroup(
    [polyline, markers, ...circleList, decorator, coverages],
    {
      color: color,
    }
  );

  layerControl.addOverlay(
    myLayers[route.id],
    `<div class="layerControlRoute" style="display: inline-block"><span style="color: ${color}">●</span> Маршрут ${route.id_route}</div>`
  );
  myLayers[route.id].addTo(map);
}

function CreatePolyline(options) {
  const polyline = {
    color: options.color != undefined ? options.color : "black",
    weight: options.weight != undefined ? options.weight : 3,
    opacity: options.opacity != undefined ? options.opacity : 0.7,
    isPolyline: true,
    smoothFactor: options.smoothFactor,
  };

  return polyline;
}

function showNumberRoute(show) {
  document.body.classList.remove("show-numberRoute");

  if (show) {
    document.body.classList.add("show-numberRoute");
  }
}

function setCustomSequence(CustomSequence) {
  isCustomSequence = CustomSequence;
  const counterMarkers = document.getElementById("counterMarkers");
  const counter = document.getElementById("counter");

  /*if (isCustomSequence) {
    counterMarkers.classList.remove("hidden");
    counter.classList.add("hidden");

    updateCounterMarkers();

    counterMarkers.innerHTML = `11111111111111111111111111111111111`;
  } else {
    
    counter.classList.remove("hidden");
    counterMarkers.classList.add("hidden");
  }*/
}

//------------------------------------------------------------------------------------------
//-- Геозоны
//------------------------------------------------------------------------------------------

function showAllGeoZones(data_geozones, needParse = true) {
  if (needParse) {
    data_geozones = JSON.parse(data_geozones);
  }

  let polygons = [];
  var bounds;

  if (myLayers.geozones) {
    myLayers.geozones.clearLayers();
  }

  for (let index = 0; index < data_geozones.length; index++) {
    var polylinePoints = [];

    const element = data_geozones[index];
    const coordinates = element.geometry.coordinates;

    for (let i = 0; i < coordinates.length; i++) {
      var el = coordinates[i];

      polylinePoints.push(new L.LatLng(el[1], el[0]));
    }

    var polygon = L.polygon(polylinePoints, {
      color: element.color,
      uid: element.uid,
      dashArray: "5, 5",
      weight: 1,
    }).bindPopup(element.name);

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
}

function hideAllGeoZones() {
  if (myLayers.geozones) {
    myLayers.geozones.clearLayers();
  }
}

function ReturnRawGeoZone() {
  if (newGeozone) {
    newGeozone = false;
    isGeoZonesFlag = false;

    return data_newGeozone;
  }
}

function ReturnGeoZone() {
  return data_newGeozone1;
}

function ActivateAreaSelection() {
  isGeoZonesFlag = true;
  areaSelectionZone.activate();
}

function DeactivateAreaSelection() {
  areaSelectionZone.deactivate();
  newGeozone = true;
}

// функция объединения геозон
function combineGeoZones(geozonesArray = [], newGeozone) {
  geozonesArray = JSON.parse(geozonesArray);
  newGeozone = JSON.parse(newGeozone);

  var polygons = [];
  for (let index = 0; index < geozonesArray.length; index++) {
    const element = geozonesArray[index];

    polygons.push(turf.polygon([element.geometry.coordinates]));
  }

  var union = polygons[0];
  for (let i = 1; i < polygons.length; i++) {
    union = turf.union(union, polygons[i]);
  }

  const turfPolygon = turf.polygon(newGeozone.geometry.coordinates);
  const diff = turf.difference(turfPolygon, union);

  return JSON.stringify(diff);
}

// редактирование геозоны для этого они должны быть сначала показаны!!!
function editGeoZone(uid) {
  //uid = JSON.parse(uid);

  geoZone = uid;

  if (window.data_geozones) {
    isGeoZonesFlag = true;

    const brect = map.getContainer().getBoundingClientRect();
    const layers = myLayers.geozones.getLayers();
    const currentZone = layers.find((item) => item.options.uid === uid);
    const currentZonePoints = currentZone.getLatLngs()[0];
    const point = currentZonePoints[0];
    const point_1 = map.latLngToContainerPoint([point.lat, point.lng]);

    map.fire(
      "as:point-add",
      new MouseEvent("click", {
        clientX: point_1.x + brect.left,
        clientY: point_1.y + brect.top,
      })
    );

    for (let index = 1; index < currentZonePoints.length; index++) {
      const point = currentZonePoints[index];
      const point_2 = map.latLngToContainerPoint([point.lat, point.lng]);

      map.fire(
        "as:point-add",
        new MouseEvent("click", {
          clientX: point_2.x + brect.left,
          clientY: point_2.y + brect.top,
        })
      );
    }

    map.fire(
      "as:point-add",
      new MouseEvent("click", {
        clientX: point_1.x + brect.left,
        clientY: point_1.y + brect.top,
      })
    );
  }
}

function cleanPoints(points) {
  points = JSON.parse(points);

  for (let index = 0; index < points.length; index++) {
    const point = points[index];

    myLayers.point[point.id].clearLayers();
    layerControl.removeLayer(myLayers.point[point.id]);
  }
}

function renderPoints(points) {
  points = JSON.parse(points);

  for (let index = 0; index < points.length; index++) {
    const point = points[index];
    const markers = L.markerClusterGroup({
      removeOutsideVisibleBounds: true,
    });
    const circleList = [];
    const id = point.id;

    let polygons = [];
    if (point.coordinates.name != "Без геозоны") {
      var polylinePoints = [];

      const element = point.coordinates;
      const coordinates = element.geometry.coordinates;

      for (let i = 0; i < coordinates.length; i++) {
        var el = coordinates[i];

        polylinePoints.push(new L.LatLng(el[1], el[0]));
      }

      var polygon = L.polygon(polylinePoints, {
        color: element.color,
        uid: element.uid,
        dashArray: "5, 5",
        weight: 0,
      }).bindPopup(element.name);

      polygons.push(polygon);
    }

    var coverages = new L.LayerGroup(); //-- https://jsfiddle.net/mad__97/3v7hd2vx/211/

    myMarkers[id] = [];

    const color = point.color || "grey";

    var divIconGhost = L.divIcon({
      className: "my-div-icon",
      iconSize: 35,
      html: `<div class="my-div-icon_inner"><svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="-4 0 36 36"><g fill="none" fill-rule="evenodd"><path fill="${color}" d="M14 0c7.732 0 14 5.641 14 12.6C28 23.963 14 36 14 36S0 24.064 0 12.6C0 5.641 6.268 0 14 0Z"/><circle cx="14" cy="14" r="10" fill="#fff" fill-rule="nonzero"/></g></svg></div>`,
    });

    point.points.forEach((item, index) => {
      const coord = [];
      coord.push(item.ltd, item.lng);

      const mapMarker = generateSVGMarker(color, "", item.numberRoute);

      var myIcon = L.divIcon({
        className: `my-div-icon my-div-icon_${id}`,
        iconSize: 35,
        color: color,
        number: item.number,
        numberRoute: item.numberRoute,
        html: mapMarker,
        iconSize: [20, 20],
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
            ? `<div><b>Контрагент: </b>${item.textPopup.partner}</div>`
            : ""
        }
        ${
          Boolean(item.textPopup.weight)
            ? `<div><b>Вес, кг: </b>${item.textPopup.weight}</div>`
            : ""
        }
        ${
          Boolean(item.textPopup.volume)
            ? `<div><b>Объем, м³: </b>${item.textPopup.volume}</div>`
            : ""
        }
        ${
          Boolean(item.textPopup.address)
            ? `<div><b>Адрес: </b>${item.textPopup.address}</div>`
            : ""
        }
        ${
          Boolean(item.textPopup.date)
            ? `<div><b>Интервал доставки: </b>${item.textPopup.date}</div>`
            : ""
        }
        ${
          Boolean(item.textPopup.comment)
            ? `<div><b>Комментарий: </b>${item.textPopup.comment}</div>`
            : ""
        }
        `,
        {
          offset: [0, -20],
        }
      );

      //var circle = L.circleMarker(coord, {
      //  ...markerOptions,
      //  color: color,
      //  icon: divIconGhost,
      //  opacity: 0.25,
      //  // pane: "markers",
      //});

      //circleList.push(circle);

      markerList.push(marker);
      myMarkers[id].push(marker);
      markers.addLayer(marker);
    });

    markers.on("animationend", function () {
      coverages.clearLayers();

      markers._featureGroup.eachLayer(function (layer) {
        if (layer instanceof L.MarkerCluster && layer.getChildCount() > 2) {
          const childCount = layer.getChildCount();
          var opacity = childCount / 80 || 0.2;

          if (opacity > 0.8) {
            opacity = 0.8;
          }

          if (opacity < 0.2) {
            opacity = 0.2;
          }

          coverages.addLayer(
            L.polygon(layer.getConvexHull(), {
              color: color,
              fillOpacity: opacity,
              chunkedLoading: true,
              weight: 2,
            })
          );
        }

        coverages.addTo(map);
      });
    });

    if (!myLayers.point) {
      myLayers.point = {};
    }

    myLayers.point[id] = L.layerGroup(
      [markers, ...circleList, ...polygons, coverages],
      {
        color: color,
      }
    );

    layerControl.addOverlay(myLayers.point[id], point.name);

    myLayers.point[id].addTo(map);
  }
}

function cleanMaps() {
  map.eachLayer(function (layer) {
    if (layer instanceof L.LayerGroup) {
      map.removeLayer(layer);

      layerControl.removeLayer(layer);
    }
  });
}

//------------------------------------------------------------------------------------------
//-- Счетчик
//------------------------------------------------------------------------------------------

function allMarkersCounterUnactive() {
  selectedMarkersCounter = [];

  calculateCounter();
}

function addMarkerCounter(marker) {
  selectedMarkers.push(marker.options.id);
}

function showCounter() {
  const counter = document.getElementById("counter");

  counter.classList.remove("hidden");
  isShowCounter = true;
}

function hideCounter() {
  const counter = document.getElementById("counter");

  counter.classList.add("hidden");
  isShowCounter = false;
}

function calculateCounter() {
  const counterDiv = document.getElementById("counter");

  var clientCount = selectedMarkersCounter.length;
  var pointCount = selectedMarkersCounter.length;
  var partners = [];
  var weightSum = 0;
  var volumeSum = 0;

  //console.log(selectedMarkersCounter.length);

  for (let index = 0; index < selectedMarkersCounter.length; index++) {
    const markerId = selectedMarkersCounter[index];
    const marker = markerList.find((item) => item.options.id === markerId);
    const partner = marker.options.item.textPopup.partner;

    if (!partners.includes(partner)) {
      partners.push(partner);
    }

    weight = Number(marker.options.item.textPopup.weight);

    weightSum += weight;

    volume = Number(marker.options.item.textPopup.volume);

    volumeSum += volume;
  }

  volumeSum = Math.ceil(volumeSum * 1000).toFixed(0) / 1000;
  weightSum = Math.round(weightSum);

  counterDiv.innerHTML = `Заказов:&nbsp;<b>${pointCount}</b>&nbsp;|&nbsp;Контрагентов:&nbsp;<b>${partners.length}</b>&nbsp;|&nbsp;Вес,&nbsp;кг:&nbsp;<b>${weightSum}</b>&nbsp;|&nbsp;Объем,&nbsp;м³:&nbsp;<b>${volumeSum}</b>`;
}

function currencyRound(num) {
  const result = Math.ceil(Number(num) * 100) / 100;

  return result.toFixed(3);
}

function showlog() {
  const log = document.getElementById("log");

  log.classList.remove("hidden");
}

function flyToBoundsGeozone(uid) {
  const layers = myLayers.geozones.getLayers();
  const currentZone = layers.find((item) => item.options.uid === uid);

  if (currentZone) {
    map.flyToBounds(currentZone.getBounds());
  }
}

// проверяем входит ли точка в полигон

// Функция для преобразования массива точек в GeoJSON FeatureCollection
function pointsToFeatureCollection(points) {
  const features = points.map((point) => {
    return turf.point(point.coordinates, { uid: point.uid });
  });

  return turf.featureCollection(features);
}

// Функция для преобразования полигона в GeoJSON Feature
function polygonToFeature(polygon) {
  return turf.polygon([polygon.geometry.coordinates]);
}

// Функция для определения точек, находящихся внутри полигона
function pointsInsidePolygon(points, polygon) {
  points = JSON.parse(points);
  polygon = JSON.parse(polygon);

  const pointsFC = pointsToFeatureCollection(points);
  const polygonFeature = polygonToFeature(polygon[0]);
  const pointsInside = turf.pointsWithinPolygon(pointsFC, polygonFeature);
  const returnPoints = pointsInside.features.map(
    (feature) => feature.properties.uid
  );

  return JSON.stringify(returnPoints);
}

//-- Drive

function deleteDriveLayer(uid) {
  map.removeLayer(myLayers[uid]);

  layerControl.removeLayer(myLayers[uid]);
  if (myLayers.polylines[uid]) {
    map.removeLayer(myLayers.polylines[uid]);
    layerControl.removeLayer(myLayers.polylines[uid]);
  }
}

function RouteBuildDrive(data_in, parseNeed = true, previousView = false) {
  if (parseNeed) {
    data_in = JSON.parse(data_in);
  }

  let newGeomerties = [];
  const circleList = [];
  const driverInfo = data_in.routeDrive.info;
  const route = data_in.route;
  const routeDrive = data_in.routeDrive;
  const road = data_in.road;
  const deliveryPoints = data_in.deliveryPoints;
  const startPoint = data_in.startStopPoint.startPoint;
  const myRoute = [];
  const color = data_in.color || "red";
  const textColor = tinycolor.mostReadable(color, ["#fff", "#000"]);
  //const spiderfyOnMaxZoom = data_in.parameters.spiderfyOnMaxZoom;
  const spiderfyOnMaxZoom = true;
  //const maxClusterRadius = data_in.parameters.maxClusterRadius;
  const maxClusterRadius = 0; //-- Отключаем кластеризацию
  const coveragesChildCount = data_in.parameters.coveragesChildCount;
  const zoomToBoundsOnClick = data_in.parameters.zoomToBoundsOnClick;
  //const showClusterWeight = data_in.parameters.showClusterWeight;
  const showClusterWeight = false;
  const smoothFactorValue = data_in.parameters.smoothFactor;
  const distanceTo = 1000;
  const coverages = new L.LayerGroup();
  const uid = data_in.uid;
  const refreshTime = data_in.parameters.refreshTime * 1000;
  const previousCenter = map.getCenter();
  const previousZoom = map.getZoom();
  const markers = L.markerClusterGroup({
    removeOutsideVisibleBounds: true,
    spiderfyOnMaxZoom: spiderfyOnMaxZoom,
    maxClusterRadius: maxClusterRadius,
    zoomToBoundsOnClick: zoomToBoundsOnClick,
    iconCreateFunction: function (cluster) {
      let textMarker = cluster.getChildCount();

      /*if (showClusterWeight) {
        const clusterMarkers = cluster.getAllChildMarkers();

        let weightSum = 0;

        for (var i = 0; i < clusterMarkers.length; i++) {
          const clusterMarker = clusterMarkers[i];
          const weight = Number(clusterMarker.options.item.textPopup.weight);

          weightSum += weight;
        }

        if (weightSum >= 100) {
          textMarker = parseFloat((weightSum / 1000).toFixed(2)) + "т";  
        } else {
          textMarker = weightSum.toFixed(0) + "кг";
        }
      }*/

      return new L.divIcon({
        html: `<svg width="56" height="56" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg">
          <g class="layer">
            <circle cx="18px" cy="18px" fill="${color}" fill-opacity="0.8" id="svg_1" r="9px"/>
            <circle cx="18px" cy="18px" fill="${color}" fill-opacity="0.6" id="svg_2" r="12px"/>
            <circle cx="18px" cy="18px" fill="${color}" fill-opacity="0.3" id="svg_3" r="15px"/>
            <text fill="${textColor}" fill-opacity="1" font-weight="bold" font-size="10" id="svg_6" stroke-width="0" text-anchor="middle" x="18" xml:space="preserve" y="21">${textMarker}</text>
          </g>
        </svg>`,
        className: "marker-cluster",
        iconSize: new L.Point(15, 15),
      });
    },
  });

  const driverDate = new Date(driverInfo.fix);

  const hours = driverDate.getHours();
  const minutes = driverDate.getMinutes();

  const timeString = `${hours}:${minutes < 10 ? "0" : ""}${minutes}`;

  myMarkers[uid] = [];

  let tooltipTimeout;
  let options = { color: color, smoothFactor: smoothFactorValue };
  let optionsAnt = {
    delay: 800,
    dashArray: [10, 25],
    weight: 4,
    color: color,
    pulseColor: "#FFFFFF",
    paused: false,
    reverse: false,
    hardwareAccelerated: true,
  };
  let polylinePoints = route.geometry.map(
    (coord) => new L.LatLng(coord[1], coord[0])
  );
  let polylinePointsDriverTransparent = routeDrive.geometry.map(
    (coord) => new L.LatLng(coord[0], coord[1])
  );
  let polylinePointsLastDrive = routeDrive.geometryDrive.map(
    (coord) => new L.LatLng(coord[0], coord[1])
  );

  const divIconGhost = L.divIcon({
    className: "my-div-icon",
    iconSize: 35,
    html: `<div class="my-div-icon_inner"><svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="-4 0 36 36"><g fill="none" fill-rule="evenodd"><path fill="${color}" d="M14 0c7.732 0 14 5.641 14 12.6C28 23.963 14 36 14 36S0 24.064 0 12.6C0 5.641 6.268 0 14 0Z"/><circle cx="14" cy="14" r="10" fill="#fff" fill-rule="nonzero"/></g></svg></div>`,
  });

  //-- Полилиния планового Маршрута проезда
  const polyline = new L.Polyline(polylinePoints, options);

  //-- Прозрачная полилиня реального маршрута проезда, нужна для того чтоб работал bindPopup
  const polylineTransparent = new L.Polyline(polylinePointsDriverTransparent, {
    color: "transparent",
    weight: 15,
    opacity: 0,
  });

  const decorator = L.polylineDecorator(polyline, {
    patterns: [
      {
        offset: "0",
        repeat: "200px",
        symbol: L.Symbol.marker({
          rotate: true,
          markerOptions: {
            icon: L.divIcon({
              className: "my-icon-arrow",
              html: `
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 256 256" enable-background="new 0 0 256 256" xml:space="preserve">
                <metadata> Svg Vector Icons : http://www.onlinewebfonts.com/icon </metadata>
                <g><g><g><path fill="${route.color}" d="M124.8,11.5c-1.7,1.7-99.5,228.1-100,231.5c-0.3,2.3,0.7,3.3,2.8,2.8c0.8-0.2,23.7-13.2,50.9-29l49.5-28.6l49.4,28.5c27.1,15.7,49.9,28.7,50.6,29c2.4,0.7,3.5-0.2,3.1-2.6c-0.5-3.3-99-229.5-100.9-231.5C128.4,9.5,126.8,9.5,124.8,11.5z"/></g></g></g>
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

  //-- Полилиния(ии) реального маршрута. При разницы между точка А и Б более distanceTo начинаем новую полилинию
  const pointsDrive = routeDrive.geometry;
  let polylinePointsDrive = [];
  let polylineDrive = [];
  let pointsStart = [];
  let pointFinish = [];

  for (var i = 0; i < pointsDrive.length; i++) {
    var newPoint = L.latLng(pointsDrive[i][0], pointsDrive[i][1]);

    polylinePointsDrive.push(newPoint);

    //-- Пока рисую все сплошняком, далее нужно недостающие участки дорисовывать при помощи OSRM

    //if (polylinePointsDrive.length === 0) {
    //  polylinePointsDrive.push(newPoint);
    //}

    //var lastPoint = polylinePointsDrive[polylinePointsDrive.length - 1];
    //let distanceTolastPoint = lastPoint.distanceTo(newPoint);

    //if (distanceTolastPoint > distanceTo) {
    //polylinePointsDrive.push(newPoint);

    //-- отрисовка с использованием OSRM

    /*getDrivePolyline(lastPoint, newPoint).then((route) => {
        for (let i = 0; i < route.length; i++) {
          const osrmPoint = new L.LatLng(route[i][1], route[i][0]); 
          //console.log(osrmPoint);
          polylinePointsDrive.push(osrmPoint);
        }
      })
      .catch((error) => {
        // Обработайте любые ошибки, возникшие во время вызова функции
        console.error(error);
      });*/

    //-- Отрисовка разных полилиний

    //polylinePointsDrive.push(newPoint);

    /*let polyline = new L.Polyline.AntPath(polylinePointsDrive, optionsAnt);
      polylineDrive.push(polyline);

      polylinePointsDrive = []; 

      pointFinish.push(lastPoint);*/
    //} else {
    //polylinePointsDrive.push(newPoint);
    //}
  }

  if (polylinePointsDrive.length > 1) {
    let polyline = new L.Polyline.AntPath(polylinePointsDrive, optionsAnt);

    polylineDrive.push(polyline);
  }

  //const polylineDrive = new L.Polyline.AntPath(polylinePointsDrive, optionsAnt);

  const polylineLastDrive = L.motion.polyline(
    polylinePointsLastDrive,
    options,
    {},
    {
      icon: L.divIcon({
        html: `<svg width="50" height="50" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g><path fill="#ffffff" opacity="undefined" d="m25.1235,28.72468c-7.09237,0 -12.83719,-5.74482 -12.83719,-12.83719c0,-7.09237 5.74482,-12.83719 12.83719,-12.83719c7.09237,0 12.83719,5.74482 12.83719,12.83719c0,7.09237 -5.74482,12.83719 -12.83719,12.83719z" id="svg_2" stroke="null"/><path id="svg_1" d="m23.91185,30.33434c-7.5775,-0.68286 -13.51556,-7.05124 -13.51556,-14.80652c0,-8.21091 6.65623,-14.86712 14.86712,-14.86712c8.2109,0 14.86711,6.65624 14.86711,14.86712c0,7.75528 -5.93806,14.12366 -13.51556,14.80652l0,17.63083c0,0.74643 -0.6051,1.35156 -1.35155,1.35156c-0.74643,0 -1.35156,-0.60511 -1.35156,-1.35156l0,-17.63083l0,0l0,0zm1.35156,-2.64252c6.71798,0 12.164,-5.44602 12.164,-12.164c0,-6.71798 -5.44602,-12.164 -12.164,-12.164c-6.71799,0 -12.16401,5.44602 -12.16401,12.164c0,6.71798 5.44602,12.164 12.16401,12.164z" stroke="null"/><g id="svg_3" stroke="null"><path fill="${routeDrive.color}" id="svg_4" d="m17.50311,8.62222c-0.57223,0 -1.03628,0.46547 -1.03628,1.03628l0,9.53151c0,0.57081 0.52099,1.09322 1.09322,1.09322l1.49179,0c0.17366,1.03344 1.07044,1.82203 2.15228,1.82203c1.08183,0 1.97861,-0.7886 2.15228,-1.82203l3.37076,0c0.57081,0 1.03628,-0.46547 1.03628,-1.03628l0,-9.56567c0,-0.58362 -0.45978,-1.05906 -1.02489,-1.05906l-9.23543,0l-0.00001,0zm10.98914,2.55085l0,9.11016c0.17509,1.03201 1.10461,1.82203 2.18644,1.82203c1.08183,0 1.97861,-0.79002 2.15228,-1.82203l0.76298,0c0.57223,0 1.09322,-0.52099 1.09322,-1.09322l0,-3.50741c0,-0.73308 -0.52811,-1.48183 -0.59216,-1.5715l-1.51456,-2.02701c-0.34732,-0.4185 -0.89251,-0.91102 -1.53734,-0.91102l-2.55085,0l-0.00001,0zm1.82203,1.82203l2.0384,0l1.16155,1.54873c0.12384,0.17509 0.44412,0.71173 0.44412,1.13877l0,0.22775l-3.64407,0c-0.36441,0 -0.72881,-0.36441 -0.72881,-0.72881l0,-1.45763c0,-0.40284 0.36441,-0.72881 0.72881,-0.72881zm-9.11016,5.4661c0.80426,0 1.45763,0.65337 1.45763,1.45763c0,0.80426 -0.65337,1.45763 -1.45763,1.45763c-0.80426,0 -1.45763,-0.65337 -1.45763,-1.45763c0,-0.80426 0.65337,-1.45763 1.45763,-1.45763zm9.47457,0c0.80426,0 1.45763,0.65337 1.45763,1.45763c0,0.80426 -0.65337,1.45763 -1.45763,1.45763c-0.80426,0 -1.45763,-0.65337 -1.45763,-1.45763c0,-0.80426 0.65337,-1.45763 1.45763,-1.45763z" stroke="null"/></g></g></svg>`,
        iconAnchor: [25, 50],
        popupAnchor: [0, 17],
        className: "custom-icon",
        iconSize: 35,
      }),
    }
  );

  polylineLastDrive.motionDuration(refreshTime);

  //-- Маркер едет, а окно остается на месте =(
  polylineLastDrive.bindTooltip(
    `
      ${
        Boolean(driverInfo.fix)
          ? `<div><b>Последнее время фиксации: </b>${timeString}</div>`
          : ""
      }
      ${
        Boolean(driverInfo.point)
          ? `<div><b>Точка следования: </b>${driverInfo.point}</div>`
          : ""
      }
      ${
        Boolean(driverInfo.speed)
          ? `<div><b>Скорость: </b>${driverInfo.speed}</div>`
          : ""
      }
      `,
    {
      direction: "top",
      offset: [0, -50],
    }
  );

  startPoint.forEach((item, index) => {
    const coord = [item[0], item[1]];
    const colorMarker = color;
    const mapMarker = generateSVGMarkerFlag(colorMarker);

    const myIcon = L.divIcon({
      className: `my-div-icon`,
      iconSize: 35,
      color: colorMarker,
      html: mapMarker,
      iconSize: [20, 20],
      iconAnchor: [5, 17], // право, вверх
    });

    const markerOptions = {
      icon: myIcon,
    };

    const marker = L.marker(coord, markerOptions);

    //markerList.push(marker);
    //myMarkers[uid].push(marker);
    markers.addLayer(marker);
  });

  deliveryPoints.forEach((item, index) => {
    const coord = [item.ltd, item.lng];
    const colorMarker = item.color;

    let numberRoute = item.numberRoute;
    let number = item.number;

    const mapMarker = generateSVGMarker(colorMarker, numberRoute, number);
    const myIcon = L.divIcon({
      className: `my-div-icon my-div-icon_${uid}`,
      iconSize: 35,
      color: colorMarker,
      number: number,
      numberRoute: item.numberRoute,
      html: mapMarker,
      iconSize: [20, 20],
    });

    const markerOptions = {
      icon: myIcon,
      title: item.textHover,
      id: item.id,
      item: item,
      route_id: uid,
    };

    const marker = L.marker(coord, markerOptions).bindPopup(
      `
      ${
        Boolean(item.textPopup.partner)
          ? `<div><b>Контрагент: </b>${item.textPopup.partner}</div>`
          : ""
      }
      ${
        Boolean(item.textPopup.orders)
          ? `<div><b>Количество заказов: </b>${item.textPopup.orders}</div>`
          : ""
      }
      ${
        Boolean(item.textPopup.status)
          ? `<div><b>Статус: </b>${item.textPopup.status}</div>`
          : ""
      }
      ${
        Boolean(item.textPopup.point)
          ? `<div><b>Точка Доставки: </b>${item.textPopup.point}</div>`
          : ""
      }
      ${
        Boolean(item.textPopup.datePlane)
          ? `<div><b>Плановая дата доставки: </b>${item.textPopup.datePlane}</div>`
          : ""
      }
      ${
        Boolean(item.textPopup.volume)
          ? `<div><b>Объем: </b>${item.textPopup.volume}</div>`
          : ""
      }
      ${
        Boolean(item.textPopup.danger)
          ? `<div><b>Отказ: </b>${item.textPopup.danger}</div>`
          : ""
      }
      ${
        Boolean(item.textPopup.weight)
          ? `<div><b>Вес: </b>${item.textPopup.weight}</div>`
          : ""
      }
      ${
        Boolean(item.textPopup.houseTimeFrom)
          ? `<div><b>Время погрузки: </b>${item.textPopup.houseTimeFrom}</div>`
          : ""
      }
      ${
        Boolean(item.textPopup.houseTimeTo)
          ? `<div><b>Время возврата: </b>${item.textPopup.houseTimeTo}</div>`
          : ""
      }
      ${
        Boolean(item.textPopup.comment)
          ? `<div><b>Комментарий: </b>${item.textPopup.comment}</div>`
          : ""
      }
      `,
      {
        offset: [0, -20],
      }
    );

    markerList.push(marker);
    myMarkers[uid].push(marker);
    markers.addLayer(marker);
  });

  markers.on("click", function (e) {
    const marker = e.sourceTarget;

    /*if (!isCustomSequence) {
      allMarkerUnactive();
      allMarkersCounterUnactive();
    }*/

    if (selectedMarkers.includes(marker.options.id)) {
      setMarkerUnActive(marker);

      marker.closePopup();
    } else {
      if (marker.options.id) {
        setMarkerActive(marker);
        addMarkerCounter(marker);
      }

      //calculateCounter();
    }

    /*if (isCustomSequence) {
      drawPolyline(uid, polyline, decorator);
    }*/
  });

  markers.on("animationend", function () {
    coverages.clearLayers();

    markers._featureGroup.eachLayer(function (layer) {
      if (layer instanceof L.MarkerCluster && layer.getChildCount() > 2) {
        const childCount = layer.getChildCount();
        let opacity = childCount / 80 || 0.2;

        if (opacity > 0.8) {
          opacity = 0.8;
        }

        if (opacity < 0.2) {
          opacity = 0.2;
        }

        coverages.addLayer(
          L.polygon(layer.getConvexHull(), {
            color: color,
            fillOpacity: opacity,
            chunkedLoading: true,
            stroke: false,
          })
        );
      }

      coverages.addTo(map);
    });
  });

  if (!spiderfyOnMaxZoom) {
    markers.on("clusterclick", function (event) {
      const currentZoom = map.getZoom();
      const maxZoom = map.getMaxZoom();

      if (currentZoom === maxZoom) {
        const clusterMarkers = event.layer.getAllChildMarkers();

        allMarkerUnactive();
        allMarkersCounterUnactive();

        clusterMarkers.forEach(function (marker) {
          addMarkerCounter(marker);
          setMarkerActive(marker);
        });

        //calculateCounter();
      }
    });

    if (!zoomToBoundsOnClick) {
      markers.on("clusterclick", function (event) {
        const clusterMarkers = event.layer.getAllChildMarkers();

        allMarkerUnactive();
        allMarkersCounterUnactive();

        clusterMarkers.forEach(function (marker) {
          addMarkerCounter(marker);
          setMarkerActive(marker);
        });

        //calculateCounter();
      });
    }
  }

  markers
    .on("clustermouseover", function (event) {
      //const currentZoom = map.getZoom();

      //if (currentZoom > 9) {
      const clusterMarkers = event.layer.getAllChildMarkers();

      orderList = [];

      console.log(JSON.stringify(marker.options.item));

      clusterMarkers.forEach(function (marker) {
        orderList.push(marker.options.item.volume);
      });

      const uniqueOrderList = Array.from(new Set(orderList));

      let text = uniqueOrderList.join("<br/>");

      event.layer
        .bindTooltip('<span style="font-size: 10px;">' + text + "</span>", {
          offset: [20, 10],
          direction: "right",
        })
        .openTooltip();
      //}
    })
    .on("clustermouseout", function (ev) {
      event.layer.unbindTooltip();
    });

  polylineTransparent.bindTooltip(
    `<div><b>Траектория реального маршрута</b></div>
      ${
        Boolean(driverInfo.point)
          ? `<div><b>Номер Маршрута: </b>${driverInfo.route}</div>`
          : ""
      }`,
    {
      permanent: false,
      sticky: true,
      direction: "top",
    }
  );

  polylineTransparent.on("mouseover", function () {
    this.openTooltip();
    clearTimeout(tooltipTimeout);
  });

  polylineTransparent.on("mouseout", function () {
    tooltipTimeout = setTimeout(() => {
      this.closeTooltip();
    }, 1000);
  });

  polyline.bindTooltip(
    `<div><b>Траектория планового маршрута</b></div>
      ${
        Boolean(driverInfo.point)
          ? `<div><b>Номер Маршрута: </b>${driverInfo.route}</div>`
          : ""
      }`,
    {
      permanent: false,
      sticky: true,
      direction: "top",
    }
  );

  polyline.on("mouseover", function () {
    this.openTooltip();
    clearTimeout(tooltipTimeout);
  });

  polyline.on("mouseout", function () {
    tooltipTimeout = setTimeout(() => {
      this.closeTooltip();
    }, 1000);
  });

  myLayers[uid] = L.layerGroup(
    //[polyline, polylineDrive, polylineLastDrive, ...polylineDrive1 markers, ...circleList, decorator, coverages],
    [
      polylineTransparent,
      polyline,
      ...polylineDrive,
      polylineLastDrive,
      markers,
      ...circleList,
      decorator,
      coverages,
    ],
    {
      color: color,
    }
  );

  //-- При периодическом обновлении нам необходимо центровать карту на то место, где она была, для этого у нас есть параметры previousCenter и previousZoom
  if (!previousView) {
    if (polylinePointsDrive.length > 0) {
      let allPoints = [...polylinePointsDrive, ...polylinePointsLastDrive];
      let bounds = new L.LatLngBounds(allPoints);
      map.fitBounds(allPoints);
    } else {
      map.fitBounds(polylinePoints);
    }
  } else {
    map.setView(previousCenter, previousZoom);
  }

  myLayers[uid].addTo(map);

  //-- Помещаем прозрачную полилинию на верх (не всегда срабатывает, скорее всего нужно стиль присвоить с z-index: 999, position: absolute)
  polylineTransparent.bringToFront();

  //-- Запускаем движения маркера по участку дороги
  polylineLastDrive.motionStart();

  //-- Добавляем форму управления
  layerControl.addOverlay(
    myLayers[uid],
    `<div class="layerControlRoute" style="display: inline-block"><span style="color: ${color}">●</span> Маршрут ${route.id_route}</div>`
  );

  myLayers[uid].polylines = L.layerGroup([polyline]);
  myLayers[uid].polylines.addTo(map);

  // Добавляем в контроллер слой для полилинии (отдельный контрол)
  layerControl.addOverlay(
    myLayers[uid].polylines,
    `<div class="layerControlPolyline" style="display: inline-block"><span style="color: ${color}">●</span> Плановый Маршрут ${route.id_route}</div>`
  );




  return newGeomerties;

  /*const overlayMaps = {
    "Видимая полилиния": polyline,
    "Невидимая полилиния": polylineTransparent
  };ч

  // Добавление layerControl на карту
  L.control.layers(null, overlayMaps).addTo(map);*/
}

function checkManualLatLng(lat, lng) {
  if (manualMarker) {
    manualMarker.remove();
    manualMarker = null;

    return false;
  } else {
    const pinIcon = L.icon({
      iconUrl:
        "data:image/svg+xml;charset=utf-8,<svg version='1.1' id='Capa_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' viewBox='0 0 58 58' style='enable-background:new 0 0 58 58;' xml:space='preserve'><line style='fill:none;stroke:#556080;stroke-width:2;stroke-linecap:round;stroke-miterlimit:10;' x1='29' y1='28' x2='29' y2='57'/><circle style='fill:#DD352E;' cx='29' cy='14' r='14'/><circle style='fill:#F76363;' cx='24' cy='10' r='3'/></svg>",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    manualMarker = L.marker([lat, lng], {
      draggable: true,
      autoPan: true,
      icon: pinIcon,
    }).addTo(map);

    return true;
  }
}

function getMarkerCoordinates() {
  if (manualMarker) {
    const position = manualMarker.getLatLng();
    const currentLat = position.lat;
    const currentLng = position.lng;

    return position;
  }
}

//-- Боремся с выбросами на карте
// Функция для вычисления расстояния между двумя точками
function getDistance(latlng1, latlng2) {
  return latlng1.distanceTo(latlng2); // Возвращает расстояние в метрах
}

// -----------

async function loadJson(url) {
  const res = await fetch(url);
  const json = await res.json();
  return json;
}

async function start2() {
  const dataInit = await loadJson("./init.json");
  const dataRoute = await loadJson("./RouteBuildDrive.json");

  init(JSON.stringify(dataInit));
  RouteBuildDrive(JSON.stringify(dataRoute));
}

(function () {
  start2();
})();
