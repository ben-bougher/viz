

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

from google.appengine.ext import db


class Feedback(db.Model):
    comment = db.TextProperty

env = Environment(loader=FileSystemLoader(join(dirname(__file__),
                                               'templates')))


class Viz(webapp2.RequestHandler):

    attributes = ['I', 'G',
                  'PCA1', 'PCA2',
                  'PCA3', 'PCA4',
                  'PCA5']

    file_dict = {"I": "I.np.npy",
                 "G": "G.np.npy",
                 "PCA1": "PCA0.np.npy",
                 "PCA2": "PCA1.np.npy",
                 "PCA3": "PCA2.np.npy",
                 "PCA4": "PCA3.np.npy",
                 "PCA5": "PCA4.np.npy"}


class MainHandler(Viz):

    def get(self):

        template = env.get_template('index.html')

        html = template.render()

        self.response.out.write(html)


class DataHandler(Viz):

    def get(self):

        self.response.headers['Content-Type'] = 'application/json'

        output = {}
        output["min"] = {}
        output["max"] = {}
        output["cmap"] = {}
        output["data"] = []
        
        image_data = {}
        for attr, filename in self.file_dict.iteritems():
            data = np.load(filename).T[::5,::5]
            image_data[attr] = data.tolist()
            output["max"][attr] = float(np.amax(data))
            output["min"][attr] = float(np.amin(data))
            output["cmap"][attr] = "div"
            
   
        output["attributes"] = self.attributes
        output["image_data"] = image_data


        output["image_data"] = image_data
        
        output["cbar1"] = np.linspace(-1, 1, 10).tolist()
        output["cbar2"] = (1 - np.linspace(0.0, 1, 10)).tolist()[::-1]


        with open('features.json', 'r') as f:
            output['data'] = json.load(f)[::20]
            
           
                             
        self.response.out.write(json.dumps(output))


class vDHandler(Viz):

    def get(self):

        attr1_id = self.request.get("attr1")
        attr2_id = self.request.get("attr2")
        
        attr1 = np.nan_to_num(np.load(self.file_dict[attr1_id])).T
        attr2 = np.nan_to_num(np.load(self.file_dict[attr2_id])).T
        
        output = {}
        output["attr1"] = attr1.tolist()
        output["attr2"] = attr2.tolist()

        cbar1 = np.linspace(np.amin(attr1), np.amax(attr1), 10).tolist()

        if(attr1_id == attr2_id):
            cbar2 = np.ones(10).tolist()
        else:
            cbar2 = (np.amax(attr2) - np.linspace(np.amin(attr2), np.amax(attr2), 10)).tolist()[::-1]
            
        output["cbar1"] = cbar1
        output["cbar2"] = cbar2
   
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json.dumps(output))


class MaskHandler(Viz):

    def get(self):
            
        attr1_id = self.request.get("attr1")
        attr2_id = self.request.get("attr2")

        at1_clip1 = float(self.request.get("attr1_clip1"))
        at1_clip2 = float(self.request.get("attr1_clip2"))
        at2_clip1 = float(self.request.get("attr2_clip1"))
        at2_clip2 = float(self.request.get("attr2_clip2"))

        attr1 = np.nan_to_num(np.load(self.file_dict[attr1_id])).T
        attr2 = np.nan_to_num(np.load(self.file_dict[attr2_id])).T
   
        x = np.zeros(attr1.shape)
        y = np.ones(attr1.shape)

        clip_index = ((attr1 > at1_clip1) & (attr1 < at1_clip2) &
                      (attr2 > at2_clip1) & (attr2 < at2_clip2))

        mask = np.where(clip_index, y, x)
        print np.sum(clip_index)
        
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json.dumps({"mask": mask.tolist()}))


class FeedbackHandler(Viz):

    def get(self):
        
        template = env.get_template('feedback.html')
        html = template.render()

        self.response.out.write(html)

    def post(self):

        comment = str(self.request.get("feedback"))

        Feedback(comment=comment)

        self.response.out.write("Thanks!")
        
app = webapp2.WSGIApplication([('/', MainHandler),
                               ('/data', DataHandler),
                               ('/vd_data', vDHandler),
                               ('/mask', MaskHandler),
                               ('/feedback', FeedbackHandler)],
                              debug=False)


def main():

    run_wsgi_app(app)

if __name__ == "__main__":
    main()
