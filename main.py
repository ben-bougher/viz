

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

    attributes = ['FI', 'similarity',
                  'amplitude', 'intercept', 'gradient']

    file_dict = {"similarity": "cont.npy",
                 "amplitude": "amp_slice.npy",
                 "gradient": "gradient.npy",
                 "intercept": "intercept.npy",
                 "FI": "FI.npy"}


class MainHandler(Viz):

    def get(self):

        template = env.get_template('index.html')

        html = template.render()

        self.response.out.write(html)


class DataHandler(Viz):

    def get(self):

        self.response.headers['Content-Type'] = 'application/json'

        A = np.flipud(np.nan_to_num(np.load('amp_slice.npy'))).T
        C = np.flipud(np.nan_to_num(np.load('cont.npy'))).T
        A /= np.amax(np.abs(A))

        gradient = np.flipud(np.nan_to_num(np.load('gradient.npy'))).T
        intercept = np.flipud(np.nan_to_num(np.load('intercept.npy'))).T
        FI = np.flipud(np.nan_to_num(np.load('FI.npy'))).T
        output = {}
        output["attributes"] = self.attributes

        output["data"] = []

        output["attr1"] = A.tolist()
        output["attr2"] = C.tolist()
        output["cbar1"] = np.linspace(-1, 1, 10).tolist()
        output["cbar2"] = (1 - np.linspace(0.0, 1, 10)).tolist()[::-1]

        for amp, cont, grad, inter, fi in zip(A.flatten()[::25],
                                              C.flatten()[::25],
                                              gradient.flatten()[::25],
                                              intercept.flatten()[::25],
                                              FI.flatten()[::25]):
            dic = {"amplitude": amp,
                   "similarity": cont,
                   "gradient": grad,
                   "intercept": inter,
                   "FI": fi}
                
            output["data"].append(dic)

            output["min"] = {"amplitude": np.amin(A.flatten()[::25]),
                             "similarity": np.amin(C.flatten()[::25]),
                             "gradient": np.amin(gradient.flatten()[::25]),
                             "intercept": np.amin(intercept.flatten()[::25]),
                             "FI": np.amin(FI.flatten()[::25])}

            output["max"] = {"amplitude": np.amax(A.flatten()[::25]),
                             "similarity": np.amax(C.flatten()[::25]),
                             "gradient": np.amax(gradient.flatten()[::25]),
                             "intercept": np.amax(intercept.flatten()[::25]),
                             "FI": np.amax(FI.flatten()[::25])}
                             
        self.response.out.write(json.dumps(output))


class vDHandler(Viz):

    def get(self):

        attr1_id = self.request.get("attr1")
        attr2_id = self.request.get("attr2")
        
        attr1 = np.flipud(np.nan_to_num(np.load(self.file_dict[attr1_id]))).T
        attr2 = np.flipud(np.nan_to_num(np.load(self.file_dict[attr2_id]))).T
        
        output = {}
        output["attr1"] = (attr1 / np.amax(np.abs(attr1))).tolist()
        output["attr2"] = np.abs(attr2).tolist()
        output["cbar1"] = np.linspace(-1, 1, 10).tolist()
        output["cbar2"] = (1 - np.linspace(0, .5, 10)).tolist()[::-1]
   
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json.dumps(output))


app = webapp2.WSGIApplication([('/', MainHandler),
                               ('/data', DataHandler),
                               ('/vd_data', vDHandler)],
                              debug=False)


def main():

    run_wsgi_app(app)

if __name__ == "__main__":
    main()
