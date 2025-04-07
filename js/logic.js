// Inicializa el mapa
const map = L.map('map').setView([19.33, -99.14], 12);

// Fondos de mapa
const basemaps = {
  osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
  esri: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}') ,
  dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png')
};
basemaps.osm.addTo(map);

// Capas temáticas
const layers = {
  unidad_habitacional: L.geoJSON(null).addTo(map),
  zona_monumentos_historicos: L.geoJSON(null).addTo(map)
  // Agrega más capas según tu estructura
};

// Control de visibilidad de capas
const checkboxes = document.querySelectorAll('.layerToggle');
checkboxes.forEach(cb => {
  cb.addEventListener('change', e => {
    const name = e.target.dataset.layer;
    if (e.target.checked) layers[name].addTo(map);
    else map.removeLayer(layers[name]);
  });
});

// Cambiar fondo de mapa
const basemapSelect = document.getElementById('basemapSelect');
basemapSelect.addEventListener('change', e => {
  Object.values(basemaps).forEach(layer => map.removeLayer(layer));
  basemaps[e.target.value].addTo(map);
});

// Capa de geometrías dibujadas
const drawnItems = new L.FeatureGroup().addTo(map);
const drawControl = new L.Control.Draw({
  edit: { featureGroup: drawnItems },
  draw: {
    polygon: true,
    polyline: true,
    rectangle: true,
    marker: true,
    circle: false
  }
});
map.addControl(drawControl);

map.on('draw:created', function (e) {
  const layer = e.layer;
  drawnItems.addLayer(layer);

  const geojson = layer.toGeoJSON();
  const buffered = turf.buffer(geojson, 0.1, { units: 'kilometers' });

  // Aquí se haría la intersección con las capas activas (en el backend o en memoria si ya están cargadas)
  console.log('Buffer de 100m generado:', buffered);
});

// Zoom a UT (placeholder)
document.getElementById('utSelect').addEventListener('change', e => {
  const clave = e.target.value;
  console.log('Seleccionaste UT:', clave);
  // Aquí podrías usar fetch a tu archivo GeoJSON por clave para hacer zoom
});
