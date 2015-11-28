#!/usr/bin/env python
# -*- coding: utf-8 -*-
# modelr web app
# Agile Geoscience
# 2012-2014
#

from google.appengine.ext import webapp as webapp2
from google.appengine.ext.webapp.util import run_wsgi_app
from jinja2 import Environment, FileSystemLoader
from os.path import dirname, join
import json
import numpy as np


env = Environment(loader=FileSystemLoader(join(dirname(__file__),
                                            'templates')))


class Viz(webapp2.RequestHandler):

    attributes = ['amplitude', 'phase', 'similarity',
                  'energy', 'intercept', 'gradient']


class MainHandler(Viz):

    def get(self):

        template = env.get_template('index.html')

        html = template.render()

        self.response.out.write(html)


class DataHandler(Viz):

    def get(self):

        self.response.headers['Content-Type'] = 'application/json'

        output = {}
        output["attributes"] = self.attributes

        output["data"] = []

        for point in range(500):
            output["data"].append({attr: np.random.randn() for attr in self.attributes})
            
        self.response.out.write(json.dumps(output))


class vDHandler(Viz):

    def get(self):

        data = np.random.randn(3, 50, 50).tolist()

        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json.dumps(data))


app = webapp2.WSGIApplication([('/', MainHandler),
                               ('/data', DataHandler),
                               ('/vd_data', vDHandler)],
                              debug=False)


def main():

    run_wsgi_app(app)

if __name__ == "__main__":
    main()
