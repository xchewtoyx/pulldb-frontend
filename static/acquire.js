var Acquire = {
    init: function() {
        $(document).on( "pulldbAuthorised", function (event, token) {
            console.log("Handling authorised", token);
            Site.apiFetch({
                url: "/api/pulls/list/new?context=1",
                dataType: "json",
                success: Acquire.renderNewPulls,
            });
        });
    },

    renderNewPulls: function(data) {
        for(var i=0; i<data.results.length; i++) {
            var pull = data.results[i];
            console.log(pull, issue_panel);
            var panel_content = issue_panel.expand({
                "issue_id": pull.issue.id,
                "issue_date": pull.issue.pubdate,
                "issue_image": pull.issue.image,
                "issue_name": pull.issue.name,
                "issue_url": pull.issue.site_detail_url,
                "pull_key": pull.pull.key,
                "volume_name": pull.volume.name,
            });
            $("div#content").append($(panel_content));
        }
        $("div#content [data-toggle=tooltip]").tooltip();
        Issues.toggleEvents();
    }
};

$(document).ready( function() {
    Acquire.init();
});
