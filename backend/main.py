from fastapi import FastAPI
from database import engine, Base
import models

Base.metadata.create_all(bind=engine)

app = FastAPI(title="PulseWatch")


@app.get("/")
def root():
    return {"message": "PulseWatch is running 🚀"}
