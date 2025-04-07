from shapely.geometry import shape

def evaluar_propuesta(ut_clave, geojson):
    geom = shape(geojson["geometry"])

    # Aquí iría el análisis real, por ahora solo ejemplo:
    return {
        "orientacion": "Desarrollo comunitario",
        "impacto": "Al bienestar",
        "viabilidad": "Técnicamente viable",
        "zonas_especiales": "No se intersectan zonas especiales"
    }