# Copyright 2013 Russell Heilling
# pylint: disable=F0401
from pulldb import base

# pylint: disable=W0232,E1101,R0903,R0201,C0103

class MainPage(base.BaseHandler):
    def get(self):
        template_values = self.base_template_values()
        template = self.templates.get_template('index.html')
        self.response.write(template.render(template_values))

app = base.create_app([
    ('/', MainPage),
])
