from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict
from dictamen import evaluar_propuesta

app = FastAPI()

class ProyectoInput(BaseModel):
    ut_clave: str
    geojson: Dict

@app.post("/dictamen")
def dictaminar_propuesta(proyecto: ProyectoInput):
    resultado = evaluar_propuesta(proyecto.ut_clave, proyecto.geojson)
    return resultado