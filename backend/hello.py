from flask import Flask, request, jsonify
import requests
import json
import xgen
import time

app = Flask(__name__)

def cors_response(msg):
    response = jsonify(msg)
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response

@app.route("/create_table")
def create_table():
    word = ""
    if "text" in request.args:
        word = request.args.get("text")
    print("Received request with some text:", word)
    return cors_response(xgen.create_table(word))

@app.route("/make_grammar_ex")
def make_grammar_ex():
    text = ""
    if "text" in request.args:
        text = request.args.get("text")
    print("Received request with some text:", text)
    return cors_response(xgen.make_grammar_ex(text))

@app.route("/process_grammar_data")
def process_grammar_data():
    text = ""
    if "text" in request.args:
        text = request.args.get("text")
    print("Received request with some text:", text)
    return cors_response(xgen.process_grammar_data(text))

@app.route("/process")
def process():
    text = ""
    if "text" in request.args:
        text = request.args.get("text")
    print("Received request with some text:", text)
    return cors_response(xgen.process(text))

@app.route("/process3")
def process3():
    json_obj = request.args.get("json", default="", type=str)
    chosen_pos = request.args.get("chosenVpos", default="", type=str)
    selectedEveryX = request.args.get("everyx", type=int)
    excludeFirstSentence = request.args.get("excludeFirstSentence", default="False", type=str)
    excludeLastSentence = request.args.get("excludeLastSentence", default="False", type=str)
    print("Recevied data")
    if excludeFirstSentence.lower() == "true":
        excludeFirstSentence = True
    else:
        excludeFirstSentence = False
    if excludeLastSentence.lower() == "true":
        excludeLastSentence = True
    else:
        excludeLastSentence = False
    return cors_response(xgen.process3(json_obj, chosen_pos, selectedEveryX, excludeFirstSentence, excludeLastSentence))

@app.route("/identify")
def identify():
    me = request.args.get("me")
    hashvalue = hash(me)
    if hashvalue == 4889620346995004926:
        return cors_response({"msg": 1, "statuscode": 200})
    return cors_response({"statuscode": 403})

@app.route("/process2")
def process2():
    json_string = request.args.get("json", default="", type=str)
    exclude_first = request.args.get("ex1", type=bool)
    exclude_last = request.args.get("ex2", type=bool)
    everyx = request.args.get("everyx", type=int)
    json_obj = json.loads(json_string)
    return cors_response(xgen.process2(json_obj, exclude_first, exclude_last, everyx))


dataStore = {} # Data saved in a temporary dictionary

@app.route('/storeData', methods=['POST'])
def store_data():
    print("Store data called")
    data = request.json
    id = str(time.time())
    dataStore[id] = data
    return jsonify({"id": id, "data": data})


@app.route('/showData')
def show_data():
    print("Show data called")
    id = request.args.get('id')
    data = dataStore.get(id)
    if data is None:
        return 'Data not found', 404
    else:
        return jsonify(data)


@app.after_request
def after_request(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    return response