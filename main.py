

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
        #A /= np.amax(np.abs(A))

        gradient = np.flipud(np.nan_to_num(np.load('gradient.npy'))).T
        intercept = np.flipud(np.nan_to_num(np.load('intercept.npy'))).T
        FI = np.flipud(np.nan_to_num(np.load('FI.npy'))).T
        output = {}
        output["attributes"] = self.attributes

        output["data"] = []
        image_data = {}

        image_data["amplitude"] = A[::5,::5].tolist()
        image_data["similarity"] = C[::5, ::5].tolist()
        image_data["gradient"] = gradient[::5, ::5].tolist()
        image_data["intercept"] = intercept[::5, ::5].tolist()
        image_data["FI"] = FI[::5, ::5].tolist()

        output["image_data"] = image_data
        
        output["cbar1"] = np.linspace(-1, 1, 10).tolist()
        output["cbar2"] = (1 - np.linspace(0.0, 1, 10)).tolist()[::-1]

        output["min"] = {"amplitude": -10*np.std(A),
                         "similarity":0,
                         "gradient": -10*np.std(gradient),
                         "intercept": -1*np.std(intercept),
                         "FI": -30*np.std(FI)}

        output["max"] =  {"amplitude": 10*np.std(A),
                         "similarity": 1,
                         "gradient": 1*np.std(gradient),
                         "intercept": 10*np.std(intercept),
                         "FI": 0*np.std(FI)}

        output["cmap"] =  {"amplitude": "div",
                            "similarity": "seq",
                            "gradient":"seq",
                            "intercept": "seq",
                            "FI": "seq"}

        for amp, cont, grad, inter, fi in zip(A.flatten()[::50],
                                              C.flatten()[::50],
                                              gradient.flatten()[::50],
                                              intercept.flatten()[::50],
                                              FI.flatten()[::50]):
            dic = {"amplitude": np.clip(amp, output["min"]["amplitude"],
                                        output["max"]["amplitude"]),
                   "similarity": np.clip(cont,output["min"]["similarity"],
                                        output["max"]["similarity"]),
                   "gradient": np.clip(grad,output["min"]["gradient"],
                                       output["max"]["gradient"]),
                   "intercept": np.clip(inter,output["min"]["intercept"],
                                        output["max"]["intercept"]),
                   "FI": np.clip(fi, output["min"]["FI"],
                                     output["max"]["FI"])}
                
            output["data"].append(dic)

           
                             
        self.response.out.write(json.dumps(output))


class vDHandler(Viz):

    def get(self):

        attr1_id = self.request.get("attr1")
        attr2_id = self.request.get("attr2")
        
        attr1 = np.flipud(np.nan_to_num(np.load(self.file_dict[attr1_id]))).T
        attr2 = np.flipud(np.nan_to_num(np.load(self.file_dict[attr2_id]))).T
        
        output = {}
        output["attr1"] = attr1.tolist()
        output["attr2"] = attr2.tolist()
        output["cbar1"] = np.linspace(-1, 1, 10).tolist()
        output["cbar2"] = (1 - np.linspace(0, .5, 10)).tolist()[::-1]
   
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json.dumps(output))

class MaskHandler(Viz):

    def get(self):
            
        attr1_id = self.request.get("attr1")
        attr2_id = self.request.get("attr2")

        at1_clip1 = self.request.get("attr1_clip1")
        at1_clip2 = self.request.get("attr1_clip2")
        at2_clip1 = self.request.get("attr2_clip1")
        at2_clip2 = self.request.get("attr2_clip2")

        attr1 = np.flipud(np.nan_to_num(np.load(self.file_dict[attr1_id]))).T
        attr2 = np.flipud(np.nan_to_num(np.load(self.file_dict[attr2_id]))).T
    
        x = np.zeros(attr1.shape)
        y = np.ones(attr1.shape)

        clip_index = (attr1 > at1_clip1) & (attr1 < at1_clip2) & (attr2 > at2_clip1) & (attr2 < at2_clip2)

        mask = np.where(clip_index, y, x)
        print np.sum(clip_index)
        
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json.dumps({"mask": mask.tolist()}))

        
app = webapp2.WSGIApplication([('/', MainHandler),
                               ('/data', DataHandler),
                               ('/vd_data', vDHandler),
                               ('/mask', MaskHandler) ],
                              debug=False)


def main():

    run_wsgi_app(app)

if __name__ == "__main__":
    main()
