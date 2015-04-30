#Gevent Server
import sys
if 'threading' in sys.modules:
    del sys.modules['threading']
from gevent import monkey; monkey.patch_all()

#Bottle Framework
from bottle import route, run, template, request, static_file, get, post, request, Bottle, error, redirect, abort
import bottle
import os
import pymongo						# MongoDB
from pymongo import MongoClient		# MongoDB client
from bson.json_util import dumps
from bson import json_util

MONGOLAB_URI = os.environ['MONGOLAB_URI']

## TODO: Upload image using S3

#specifying the path for the files
@route('/static/<filepath:path>')
def server_static(filepath):
	return static_file(filepath, root='.')

@error(404)
def error404(error):
    return 'URL does not exist'

@route("/companies_api")
def companies_api():
	client = MongoClient(MONGOLAB_URI)
	db = client.get_default_database()
	companies = db['companies']
	cursor = companies.find()
	client.close()
	return dumps(cursor, sort_keys=True, indent=4, default=json_util.default)

@route("/buy_api", method="POST")
def companies_api():
	buy_details = request.json['buy_details']
	
	client = MongoClient(MONGOLAB_URI)
	db = client.get_default_database()
	companies = db['companies']
	cursor = companies.find({'name':buy_details['name']})

	for doc in cursor:
		doc['price'] *= 1.01

		# can be updated to read a new list rather than directly update and cause sync problem
		companies.update({'_id':doc['_id']}, {"$set":doc})

	client.close()
	return dumps(doc, sort_keys=True, indent=4, default=json_util.default)

@route("/")
def invest():
	return template('views/index.html')

run(reloader=True, host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), server='gevent')

