# server.py
import json
import os
from flask import Flask
from flask_cors import CORS
from flask import request
from flask import send_from_directory
import util

app = Flask(__name__, static_folder="../src", template_folder="../src")
CORS(app)

@app.route("/")
def index():
    return "Server Running"

@app.route("/initialize/<dataname>")
def initialize(dataname):
    print("========================================================")
    print("===== generate surrogate rules ======")
    print("========================================================")
    filter_threshold = {
        "support": 5,
        "fidelity": .25,
        "num_feat": 4,
        "num_bin": 3,
    }
    res = util.initialize(dataname, filter_threshold)
    return res

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=1127)