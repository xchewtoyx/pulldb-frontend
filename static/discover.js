var volume_panel_loading;
var volume_panel;

var Discover = {
    init: function() {
        this.registerTabs();
        this.templateLoad();
    },

    registerTabs: function() {
        $( "#searchtabs a" ).click(function (e) {
            e.preventDefault();
            console.log(e, this);
            $( this ).tab( "show ");
        });
    },

    templateLoad: function() {
        $.get('/static/volume_doc.jst', function(data) {
            volume_panel_loading = jsontemplate.Template(
                data, {undefined_str: ""});
        });
        $.get('/static/volume_panel.jst', function(data) {
            volume_panel = jsontemplate.Template(
                data, {undefined_str: ""});
        });
    },

    updateVolume: function(data) {
        var panel_id = '#volume_' + String(data.results[0].volume.id);
        console.log(panel_id, $(panel_id));
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
};

$( document ).ready( function() {
  Discover.init();
});

$( document ).on( "pulldbAuthorised", function (event, token) {
  var query = $.url().param("q");
  var volume_ids = $.url().param("volume_ids");
  var source = $.url().param("source");
  var search_url;
  var context = this;
  if ( query ) {
      $( "input[name=q]" ).attr("value", query);
  }
  if ( volume_ids ) {
      $( "input[name=volume_ids]" ).attr("value", volume_ids);
  }
  if ( source == "local" ) {
    console.log("Search local for " + query);
    search_url = "/api/volumes/search?q=" + query;
  }
  if ( source == "comicvine" ) {
    console.log("Search cv for " + query);
    $('li>a[href=#comicvine]').tab('show');
    search_url = "/api/volumes/search/comicvine?";
    if ( volume_ids ) {
        console.log(volume_ids);
        search_url = search_url + "volume_ids=" + volume_ids;
    } else if ( query ) {
        search_url = search_url + "q=" + query;
    }
  }
  if ( search_url ) {
      Site.apiFetch({
          url: search_url,
          dataType: "json",
          success: renderResults,
      });
  }
});

function renderResults(data) {
  var source = $.url().param("source");
  var items = data.results.length;
  console.log("Found " + items + " results.", data);
  for (var i=0; i<items; i++){
      var result = data.results[i];
      var panel;
      if( source == "local") {
          panel = $( volume_panel_loading.expand({
              "volume_id": String(result.id),
              "volume_name": result.name,
              "volume_start_year": result.start_year
          }) );
      } else {
          panel = $( volume_panel_loading.expand({
              "volume_id": String(result.id),
              "volume_name": result.name,
              "volume_start_year": result.start_year
          }) );
      }
      $("#search-results").append(panel);
      Site.apiFetch({
          url: "/api/volumes/" + String(result.id) + "/get?context=1",
          dataType: "json",
          success: Discover.updateVolume,
      });
  }
  Site.subscriptionEvents();
}
