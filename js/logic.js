// Inicializa el mapa
const map = L.map('map', {
  maxBoundsViscosity: 1.0
});

// Fondos de mapa (incluye Google como WMS simulada)
const basemaps = {
  osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
  googleMaps: L.tileLayer('http://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    attribution: 'Google Maps'
  }),
  googleSatellite: L.tileLayer('http://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    attribution: 'Google Satellite'
  })
};
basemaps.googleSatellite.addTo(map);

let alcaldiaLayer;
let labelLayer = L.layerGroup().addTo(map);
let unidadesGeojson;

// Ajustar límites según alcaldía.geojson
fetch('data/alcaldia.geojson')
  .then(res => res.json())
  .then(geojson => {
    alcaldiaLayer = L.geoJSON(geojson, {
      style: {
        color: 'blue',
        weight: 1,
        fillOpacity: 0
      }
    }).addTo(map);
    const bounds = alcaldiaLayer.getBounds();
    map.fitBounds(bounds);
    map.setMaxBounds(bounds);
  });

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
    });
}

// Control de visibilidad de capas
const checkboxes = document.querySelectorAll('.layerToggle');
checkboxes.forEach(cb => {
  cb.checked = false;
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

let lastCentroid = null;
map.on('draw:created', function (e) {
  const layer = e.layer;
  drawnItems.clearLayers();
  drawnItems.addLayer(layer);

  const geojson = layer.toGeoJSON();
  const buffered = turf.buffer(geojson, 0.1, { units: 'kilometers' });
  console.log('Buffer de 100m generado:', buffered);

  const centroid = turf.centroid(geojson).geometry.coordinates;
  lastCentroid = centroid;

  const claveUT = document.getElementById('utClave').textContent;

  fetch('https://coyo.onrender.com/dictamen', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ut_clave: claveUT,
      geojson: geojson
    })
  })
  .then(res => res.json())
  .then(data => {
    document.getElementById('ia-orientacion').textContent = data.orientacion;
    document.getElementById('ia-impacto').textContent = data.impacto;
    document.getElementById('ia-viabilidad').textContent = data.viabilidad;
    document.getElementById('ia-zonas').textContent = data.zonas_especiales;
  })
  .catch(error => {
    console.error('Error al obtener dictamen IA:', error);
  });

  document.getElementById('streetviewBtn').disabled = false;
});

document.getElementById('streetviewBtn').addEventListener('click', () => {
  if (lastCentroid) {
    const lat = lastCentroid[1];
    const lon = lastCentroid[0];
    window.open(`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lon}`, '_blank');
  }
});

let utHighlightLayer;

// Zoom y datos al seleccionar UT
fetch('data/unidades.geojson')
  .then(res => res.json())
  .then(geojson => {
    unidadesGeojson = geojson;
    const utSelect = document.getElementById('utSelect');
    geojson.features.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f.properties.CVE_UT;
      opt.textContent = `${f.properties.CVE_UT} - ${f.properties.NOMBRE}`;
      utSelect.appendChild(opt);
    });

    utSelect.addEventListener('change', e => {
      const clave = e.target.value;
      const feature = geojson.features.find(f => f.properties.CVE_UT === clave);

      if (feature) {
        const bounds = L.geoJSON(feature).getBounds();
        map.fitBounds(bounds);

        if (utHighlightLayer) map.removeLayer(utHighlightLayer);
        labelLayer.clearLayers();

        utHighlightLayer = L.geoJSON(feature, {
          style: {
            color: 'purple',
            weight: 1.2,
            fillOpacity: 0
          }
        }).addTo(map);

        const center = turf.centroid(feature).geometry.coordinates;
        const label = L.marker([center[1], center[0]], {
          icon: L.divIcon({ className: 'ut-label', html: feature.properties.NOMBRE })
        }).addTo(labelLayer);

        

        document.getElementById('utNombre').textContent = feature.properties.NOMBRE;
        document.getElementById('utClave').textContent = feature.properties.CVE_UT;
        document.getElementById('utPresupuesto').textContent = feature.properties.monto_mone || '--';

        document.getElementById('ia-orientacion').textContent = '--';
        document.getElementById('ia-impacto').textContent = '--';
        document.getElementById('ia-viabilidad').textContent = '--';
        document.getElementById('ia-zonas').textContent = '--';
      }
    });
  });


