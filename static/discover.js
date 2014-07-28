var Discover = {
    init: function() {
        this.registerTabs();
    },

    registerTabs: function() {
        $( "#searchtabs a" ).click(function (e) {
            e.preventDefault();
            console.log(e, this);
            $( this ).tab( "show ");
        });
    },
};

$( document ).ready( function() {
  Discover.init();
});

$( document ).on( "pulldbAuthorised", function (event, token) {
  var query = $.url().param("q");
  var source = $.url().param("source");
  var search_url;
  var context = this;
  if ( source == "local" ) {
    console.log("Search local for " + query);
    search_url = "/api/volumes/search?q=" + query;
  }
  if ( source == "comicvine" ) {
    console.log("Search cv for " + query);
  }
  if ( search_url ) {
    $.ajax({
      url: search_url,
      dataType: "json",
      success: renderResults,
      error: function (jqXHR,  textStatus,  errorThrown) {
        console.log( "NewPulls Error", textStatus, errorThrown )},
      beforeSend: function(jqxhr, settings) {
          jqxhr.setRequestHeader('Authorization', 'Bearer ' + auth_token);
      },
    });
  }
});

function renderResults(data) {
  var items = data.results.length;
  console.log("Found " + items + " results.", data);
  for (var i=0; i<items; i++){
      console.log(data.results[i]);
      volume_doc = data.results[i];
      var panel = volume_panel(volume_doc);
      $("#search-results").append(panel);
      $.ajax({
          url: "/api/volumes/" + volume_doc.id + "/get?context=1",
          dataType: "json",
          success: function(data) {
              var panel_id = '#volume_' + data.results[0].volume.id;
              $( panel_id ).find('i.logo').replaceWith(
                  '<img width="90%" height="auto" src="' +
                      data.results[0].volume.image + '">');
              $( panel_id ).find("a.cvlink")
                  .attr('href', data.results[0].volume.site_detail_url).end()
                  .removeClass("disabled");
              if(data.results[0].subscription.id) {
                  $( panel_id ).find("a.subscription")
                      .attr("data-subscribed", "True").end()
                      .find("i.fa-heart-o").toggleClass("fa-heart fa-heart-o");
              }
              $( panel_id ).find("a.subscription").removeClass("disabled");
              $( panel_id ).find("i.publisher")
                  .wrap('<span data-toggle="tooltip" data-placement="top" ' +
                        'title="' + data.results[0].publisher.name + '"/>')
                  .replaceWith(
                      $('<img src="' + data.results[0].publisher.image + '">')
                      );
              $( panel_id ).find("i.issues")
                  .replaceWith("<span>" +
                               data.results[0].volume.issue_count +
                              "</span>");
              $( panel_id ).find("[data-toggle=tooltip]").tooltip();
          },
          error: function (jqXHR,  textStatus,  errorThrown) {
              console.log( "renderResult Error", textStatus, errorThrown )},
          beforeSend: function(jqxhr, settings) {
              jqxhr.setRequestHeader('Authorization', 'Bearer ' + auth_token);
          },
      });
  }
  Site.subscriptionEvents();
}

function volume_panel(volume_doc) {
    var panel = $('<div id="volume_' + volume_doc.id + '" class="col-md-3">' +
                  '<div class="panel panel-default">' +
                  '<div class="panel-heading"><h3 class="panel-title">' +
                  volume_doc.name + '</h3></div>' +
                  '<div class="panel-body">' +
                  '<div class="col-md-6">' +
                  '<i class="fa fa-spinner fa-5x fa-spin logo"></i>' +
                  '</div>' +
                  '<div class="col-md-4">' +
                  '<table class="table">' +
                  '<tr>' + // volume
                  '<th>' +
                  '<a class="disabled cvlink">' +
                  '<i class="fa fa-info-circle" ' +
                  'data-toggle="tooltip" data-placement="top" ' +
                  'title="View volume on Comicvine"></i></a>' +
                  '</th>' +
                  '<td>' +
                  '<a class="disabled subscription" data-volume="'
                  + volume_doc.id + '" data-subscribed="False">' +
                  '<i class="fa fa-heart-o"></i></a>' +
                  '</td>' +
                  '</tr>' +
                  '<tr><th>' +
                  '<i class="fa fa-institution" ' +
                  'data-toggle="tooltip" data-placement="top" ' +
                  'title="Published by"></i>' +
                  '</th><td>' +
                  '<i class="fa fa-spin fa-spinner publisher"></i>' +
                  '</td></tr>' + // publisher
                  '<tr><th><i class="fa fa-calendar"></i></th>' +  // date
                  '<td>' + Number(volume_doc.start_year) + '</td></tr>' +
                  '<tr><th>' +
                  '<i class="fa fa-bookmark" ' +
                  'data-toggle="tooltip" data-placement="top" ' +
                  'title="Number of issues"></i></th>' +
                  '<td>' +
                  '<i class="fa fa-spinner fa-spin issues"></i>' +
                  '</td></tr>' + // issues
                  '</table>' +
                  '</div>' +
                  '</div>' +
                  '</div>'
    );
    return panel;
}
