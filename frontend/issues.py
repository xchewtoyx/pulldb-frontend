# Copyright 2013 Russell Heilling
import logging
from math import ceil

from google.appengine.ext import ndb

# pylint: disable=F0401

from pulldb import base
from pulldb import util
from pulldb.models import comicvine
from pulldb.models import issues
from pulldb.models import volumes

# pylint: disable=W0232,E1101,R0903,R0201,C0103,W0201

class MainPage(base.BaseHandler):
    def get(self):
        template_values = self.base_template_values()
        template = self.templates.get_template('issues.html')
        self.response.write(template.render(template_values))

class IssueList(base.BaseHandler):
    def issue_detail(self, comicvine_issue):
        logging.debug('Creating detail for %r', comicvine_issue)
        volume = volumes.volume_key(comicvine_issue['volume']).get()
        issue = issues.issue_key(
            comicvine_issue, volume_key=volume.key
        ).get()
        # subscription = False
        # subscription_key = subscriptions.subscription_key(volume.key)
        # if subscription_key:
        #   subscription = subscription_key.urlsafe()
        detail = {
            'issue_key': issue.key.urlsafe(),
            'issue': issue,
            'volume': volume,
        }
        logging.info('issue_detail: %r', detail)
        return detail

    def fetch_issues(self, volume_detail):
        issue_count = len(volume_detail.get('issues', []))
        page_end = min([issue_count, self.offset + self.limit])
        issue_ids = []
        for issue in volume_detail['issues'][self.offset:page_end]:
            issue_ids.append(issue['id'])
        results = self.cv.fetch_issue_batch(issue_ids)
        return issue_count, results

    def get(self, volume_key):
        logging.debug('Listing issues for volume %s', volume_key)
        self.cv = comicvine.load()
        page = int(self.request.get('page', 0))
        self.limit = int(self.request.get('limit', 20))
        self.offset = page * self.limit
        if volume_key:
            volume = ndb.Key(urlsafe=volume_key).get()
            volume_detail = self.cv.fetch_volume(volume.identifier)
        issue_count, results = self.fetch_issues(volume_detail)
        page_end = min([issue_count, self.offset + self.limit])
        logging.info('Retrieving results %d-%d / %d', self.offset, page_end,
                     issue_count)
        template_values = self.base_template_values()

        template_values.update({
            'page': page,
            'limit': self.limit,
            'results': (self.issue_detail(issue) for issue in results),
            'results_count': issue_count,
            'page_url': util.StripParam(self.request.url, 'page',
                                        replacement='___'),
            'page_count': int(ceil(1.0*issue_count/self.limit)),
        })
        logging.debug('Rendering template %s using values %r',
                      'issues_list.html', template_values)
        template = self.templates.get_template('issues_list.html')
        self.response.write(template.render(template_values))

app = base.create_app([
    base.Route('/issues', MainPage),
    base.Route('/issues/list/<volume_key:[^/?&]+>', IssueList),
])
