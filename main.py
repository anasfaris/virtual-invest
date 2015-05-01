#Gevent Server
import sys
if 'threading' in sys.modules:
    del sys.modules['threading']
from gevent import monkey; monkey.patch_all()

#Bottle Framework
from bottle import route, run, template, request, static_file, get, post, request, Bottle, error, redirect, abort, response
import bottle
import os
import pymongo						# MongoDB
from pymongo import MongoClient		# MongoDB client
from bson.json_util import dumps
from bson import json_util
# from bson.objectid import ObjectId

MONGOLAB_URI = os.environ['MONGOLAB_URI']

def eat_cookies():
	cookie_id = bottle.request.get_cookie('username', str(uuid4()))
	bottle.response.set_cookie('username', cookie_id, max_age=950400)
	return cookie_id

#specifying the path for the files
@route('/static/<filepath:path>')
def server_static(filepath):
	return static_file(filepath, root='.')

@error(404)
def error404(error):
    return 'URL does not exist'

@route("/login", method="POST")
def login():
	login_info = request.json['login_info']
	
	if login_info['login_type'] == "Logout":
		response.set_cookie('username', '')
		return {'username': ''}

	else:
		client = MongoClient(MONGOLAB_URI)
		db = client.get_default_database()
		investors = db['investors']
		cursor = investors.find({'username':login_info['username']})
		user = []
		for doc in cursor:
			user.append(doc)

		if user:
			response.set_cookie('username', user[0]['username'])
			username_cookie = request.get_cookie('username')
			print username_cookie

		client.close()
		return dumps(user, sort_keys=True, indent=4, default=json_util.default)

@route("/investors_api")
def investors_api():
	client = MongoClient(MONGOLAB_URI)
	db = client.get_default_database()
	investors = db['investors']
	cursor = investors.find()
	client.close()
	return dumps(cursor, sort_keys=True, indent=4, default=json_util.default)

@route("/investor_api")
def investor_api():
	username_cookie = request.get_cookie('username')

	if username_cookie:
		client = MongoClient(MONGOLAB_URI)
		db = client.get_default_database()
		investors = db['investors']
		cursor = investors.find({"username":username_cookie})
		client.close()
		return dumps(cursor, sort_keys=True, indent=4, default=json_util.default)
	else:
		return {}

@route("/companies_api")
def companies_api():
	client = MongoClient(MONGOLAB_URI)
	db = client.get_default_database()
	companies = db['companies']
	cursor = companies.find()
	client.close()
	return dumps(cursor, sort_keys=True, indent=4, default=json_util.default)

@route("/trade_api", method="POST")
def trade_api():
	stock = request.json['stock']
	
	client = MongoClient(MONGOLAB_URI)
	db = client.get_default_database()
	companies = db['companies']
	cursor = companies.find({'name':stock['name']})
	result = {}
	price = None

	for doc in cursor:
		price = doc['price'] * float(stock['quantity'])
		if stock['trade_type'] == "Buy":
			doc['price'] *= 1.01
		else:
			doc['price'] *= 0.99

		result['name'] = doc['name']
		result['price'] = doc['price']

		# can be updated to read a new list rather than directly update and cause sync problem
		companies.update({'_id':doc['_id']}, {"$set":doc})

	investors = db['investors']
	cursor = investors.find({'username':stock['username']})

	for doc in cursor:
		if stock['trade_type'] == "Buy":
			doc['cash'] -= price
		else:
			doc['cash'] += price

		result['cash'] = doc['cash']

		investors.update({'_id':doc['_id']}, {"$set":doc})

	client.close()
	return result

@route("/")
def invest():
	return template('views/index.html')

run(reloader=True, host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), server='gevent')

