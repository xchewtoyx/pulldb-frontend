# Copyright 2013 Russell Heilling

import logging
from math import ceil
import re

# pylint: disable=F0401


from pulldb import base
from pulldb import util
from pulldb.models import comicvine
from pulldb.models import subscriptions
from pulldb.models.volumes import volume_key

# pylint: disable=W0232,E1101,R0903,R0201,C0103,W0201,R0914

class MainPage(base.BaseHandler):
    def get(self):
        template_values = self.base_template_values()
        template = self.templates.get_template('volumes.html')
        self.response.write(template.render(template_values))

class Search(base.BaseHandler):
    def volume_detail(self, comicvine_volume):
        try:
            volume = volume_key(comicvine_volume).get()
            subscription = False
            subscription_key = subscriptions.subscription_key(volume.key)
            if subscription_key:
                subscription = subscription_key.urlsafe()
            publisher_key = volume.publisher
            publisher = None
            if publisher_key:
                publisher = publisher_key.get()
            return {
                'volume_key': volume.key.urlsafe(),
                'volume': volume,
                'publisher': publisher,
                'subscribed': bool(subscription),
            }
        except AttributeError as e:
            logging.warn('Could not look up volume %r', comicvine_volume)
            logging.exception(e)

    def get(self):
        cv = comicvine.load()
        query = self.request.get('q')
        volume_ids = self.request.get('volume_ids')
        page = int(self.request.get('page', 0))
        limit = int(self.request.get('limit', 20))
        offset = page * limit
        if volume_ids:
            volumes = [
                int(identifier) for identifier in re.findall(
                    r'(\d+)', volume_ids)
            ]
            logging.debug('Found volume ids: %r', volumes)
            results = []
            for index in range(0, len(volumes), 100):
                volume_page = volumes[index:min([index+100, len(volumes)])]
                results.extend(cv.fetch_volume_batch(volume_page))
            results_count = len(results)
            logging.debug('Found volumes: %r', results)
        elif query:
            results_count, results = cv.search_volume(
                query, page=page, limit=limit)
            logging.debug('Found volumes: %r', results)
        if offset + limit > results_count:
            page_end = results_count
        else:
            page_end = offset + limit
        logging.info('Retrieving results %d-%d / %d', offset, page_end,
                     results_count)
        results_page = results[offset:page_end]
        template_values = self.base_template_values()

        template_values.update({
            'query': query,
            'volume_ids': volume_ids,
            'page': page,
            'limit': limit,
            'results': (self.volume_detail(volume) for volume in results_page),
            'results_count': results_count,
            'page_url': util.StripParam(self.request.url, 'page'),
            'page_count': int(ceil(1.0*results_count/limit)),
        })
        template = self.templates.get_template('volumes_search.html')
        self.response.write(template.render(template_values))

app = base.create_app([
    base.Route('/volumes', MainPage),
    base.Route('/volumes/search', Search),
])
