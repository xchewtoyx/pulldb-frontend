# Copyright 2013 Russell Heilling

import logging
import urlparse

from google.appengine.ext import ndb

# pylint: disable=F0401

from pulldb import base
from pulldb.models.subscriptions import (
    Subscription, subscription_context, subscription_key
)
from pulldb.models import users

# pylint: disable=W0232,E1101,R0903,R0201,C0103,W0201

class MainPage(base.BaseHandler):
    def subscription_detail(self, result):
        volume = result['volume']
        return {
            'volume_key': volume.key.urlsafe(),
            'volume': volume,
            'publisher':  result['publisher'],
            'subscribed': bool(result),
        }

    def get(self):
        query = Subscription.query(ancestor=users.user_key())
        results = query.map(subscription_context)
        template_values = self.base_template_values()
        template_values.update({
            'results': (
                self.subscription_detail(
                    subscription
                ) for subscription in results
            ),
            'results_count': query.count(),
        })
        template = self.templates.get_template('subscriptions_list.html')
        self.response.write(template.render(template_values))

class AddSub(base.BaseHandler):
    def get(self, volume_key):
        volume = ndb.Key(urlsafe=volume_key)
        user = users.user_key().get()
        logging.info(
            'User %s subscribing to volume %s', user.nickname, volume.get().name
        )
        # Add subscription
        subscription_key(volume, create=True)
        if self.request.get('type') == 'ajax':
            self.abort(204)
        else:
            # redirect to source
            referer = self.request.referer
            self.redirect(
                urlparse.urljoin(referer, '#%s' % volume_key))

class RemoveSub(base.BaseHandler):
    def get(self, volume_key):
        logging.warn('Removal not yet supported.')
        if self.request.get('type') == 'ajax':
            self.abort(501)
        else:
            referer = self.request.referer
            self.redirect(
                urlparse.urljoin(referer, '#%s' % volume_key))

class UpdateSub(base.BaseHandler):
    def post(self):
        pass

app = base.create_app([
    (r'/subscriptions$', MainPage),
    (r'/subscriptions/add/([^/]+)', AddSub),
    (r'/subscriptions/remove/([^/])+', RemoveSub),
    (r'/subscriptions/update/([^/])+', UpdateSub),
])
