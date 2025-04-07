// Inicializa el mapa
const map = L.map('map').setView([19.33, -99.14], 12);

// Fondos de mapa
const basemaps = {
  osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
  esri: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'),
  dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png')
};
basemaps.osm.addTo(map);

// Capas temáticas disponibles
const layerPaths = {
  unidad_habitacional: 'data/capas_tematicas/unidad_habitacional.geojson',
  anp: 'data/capas_tematicas/anp.geojson',
  areas_conservacion_patrimonial: 'data/capas_tematicas/areas_conservacion_patrimonial.geojson',
  inmuebles_catalogados: 'data/capas_tematicas/inmuebles_catalogados.geojson',
  mercados_publicos: 'data/capas_tematicas/mercados_publicos.geojson',
  reportes_agua_2024: 'data/capas_tematicas/reportes_agua_2024.geojson',
  zona_monumentos_historicos: 'data/capas_tematicas/zona_monumentos_historicos.geojson'
};

const layers = {};
for (let [key, path] of Object.entries(layerPaths)) {
  layers[key] = L.geoJSON(null);
  fetch(path)
    .then(res => res.json())
    .then(data => {
      layers[key].addData(data);
      layers[key].addTo(map);
    });
}

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

  console.log('Buffer de 100m generado:', buffered);
});

// Zoom y datos al seleccionar UT
fetch('data/unidades.geojson')
  .then(res => res.json())
  .then(geojson => {
    const unidadLayer = L.geoJSON(geojson, {
      onEachFeature: function (feature, layer) {
        layer.options.fillOpacity = 0;
        layer.options.opacity = 0;
      }
    }).addTo(map);

    document.getElementById('utSelect').addEventListener('change', e => {
      const clave = e.target.value;
      const feature = geojson.features.find(f => f.properties.CVE_UT === clave);

      if (feature) {
        const bounds = L.geoJSON(feature).getBounds();
        map.fitBounds(bounds);

        document.getElementById('utNombre').textContent = feature.properties.NOMBRE;
        document.getElementById('utClave').textContent = feature.properties.CVE_UT;
        document.getElementById('utPresupuesto').textContent = `$${Number(feature.properties.MONTO).toLocaleString()}`;

        // Aquí podrías también ejecutar la IA y mostrar su salida
        document.getElementById('dictamenIA').textContent = 'Dictamen generado por IA (pendiente de integración con backend)';
      }
    });
  });

