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
import numpy as np
import random

MONGOLAB_URI = os.environ['MONGOLAB_URI']

def eat_cookies():
	cookie_id = bottle.request.get_cookie('username', str(uuid4()))
	bottle.response.set_cookie('username', cookie_id, max_age=950400)
	return cookie_id

#specifying the path for the files
@route('/<filepath:path>')
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

	# Check if market is opened

	client = MongoClient(MONGOLAB_URI)
	db = client.get_default_database()

	settings = db['settings']
	settings_cursor = settings.find()

	market_opened = False

	for doc in settings_cursor:
		market_opened = doc['open']

	if not market_opened:
		return -1

	# Resume operation if market is opened

	companies = db['companies']
	cursor = companies.find({'name':stock['name']})
	result = {}
	price = None
	price_before_charge = None

	if not stock['quantity']:
		return -1

	qty = float(stock['quantity'])

	if qty <= 0:
		return -1

	for doc in cursor:
		price = doc['price'] * qty
		price_before_charge = price

		sigma = 0.5 # standard deviation

		if stock['trade_type'] == "Buy":
			mu = qty / 1250.0 # mean
			s = np.random.normal(mu, sigma, 1) * random.uniform(0,1)

			doc['price'] = round(doc['price'] + s[0], 2)
			doc['quantity_bought'] += qty
			if doc['quantity_bought'] > doc['quantity_max']:
				doc['quantity_max'] = doc['quantity_bought']
		else:
			mu = -1* qty / 1150 # mean
			s = np.random.normal(mu, sigma, 1) * random.uniform(0,1)

			doc['price'] = round(doc['price'] + s[0], 2)
			doc['quantity_bought'] -= qty

		result['name'] = doc['name']
		result['price'] = doc['price']

		# can be updated to read a new list rather than directly update and cause sync problem
		companies.update({'_id':doc['_id']}, {"$set":doc})

	investors = db['investors']
	cursor = investors.find({'username':stock['username']})

	for doc in cursor:
		if stock['trade_type'] == "Buy":
			price = price * 1.01 + 10
			doc['cash'] = round(doc['cash'] - price, 2)
			if doc['cash'] <= 0:
				return -1
			for data in doc['investment']:
				if stock['name'] == data['name']:
					data['quantity'] += qty 
					result['quantity'] = data['quantity']
					data['paid'] += price_before_charge
		else:
			price = price * 0.99 - 10
			doc['cash'] = round(doc['cash'] + price, 2)
			for data in doc['investment']:
				if stock['name'] == data['name']:
					data['quantity'] -= qty 
					result['quantity'] = data['quantity']
					data['paid'] -= price_before_charge

		result['cash'] = doc['cash']

		investors.update({'_id':doc['_id']}, {"$set":doc})

	client.close()
	return result

@route("/")
def invest():
	MONGOLAB_URI="mongodb://heroku_app36386927:91dt3q2v6buluv8mg271s2mrlo@ds031852.mongolab.com:31852/heroku_app36386927"
	client = MongoClient(MONGOLAB_URI)
	db = client.get_default_database()

	settings = db['settings']
	settings_cursor = settings.find()

	market_opened = False

	for doc in settings_cursor:
		market_opened = doc['open']

	client.close()
	return template('views/index.html', market_opened=market_opened, page="home")

@route("/company")
def companies_api():
	client = MongoClient(MONGOLAB_URI)
	db = client.get_default_database()
	companies = db['companies']
	cursor = companies.find()
	companies_ls = []
	
	for doc in cursor:
		incomes = {}
		incomes['name'] = doc['real_name']
		incomes['income'] = round(doc['quantity_max'], 2)
		companies_ls.append(incomes)
	client.close()
	return template('views/company.html', companies_ls=companies_ls, page="company")

@route("/rank")
def rank():
	client = MongoClient(MONGOLAB_URI)
	db = client.get_default_database()
	companies = db['companies']
	companies_cursor = companies.find()
	companies_ls = list(companies_cursor)

	investors = db['investors']
	investors_cursor = investors.find()
	persons = []
	
	for doc in investors_cursor:
		net_worth = doc['cash']
		for c_doc in companies_ls:
			for stock in doc['investment']:
				if stock['name'] == c_doc['name']:
					worth = c_doc['price'] * stock['quantity']
					net_worth += worth
		if doc['name'] != "Investor":
			persons.append([doc['name'], net_worth])

	persons.sort(key=lambda tup: tup[1], reverse=True)

	return template('views/rank.html', persons=persons, page="rank")

@route("/analysis")
def invest():
	MONGOLAB_URI="mongodb://heroku_app36386927:91dt3q2v6buluv8mg271s2mrlo@ds031852.mongolab.com:31852/heroku_app36386927"
	client = MongoClient(MONGOLAB_URI)
	db = client.get_default_database()

	companies = db['companies']
	cursor = companies.find()

	data = []
	for doc in cursor:
		data.append([doc['real_name'], doc['price_opening'], doc['price_pitch'], doc['price_b_product'], doc['price_product'], doc['price']])

	client.close()
	return template('views/analysis.html', page="analysis", data=data)

run(reloader=True, host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), server='gevent')

