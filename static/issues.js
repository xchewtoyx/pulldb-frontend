var issue_panel;

var Issues = {
    init: function() {
        this.templateLoad();
    },

    templateLoad: function() {
        $.get('/static/issue_panel.jst', function(data) {
            issue_panel = jsontemplate.Template(data);
        });
    },
};

$( document ).ready(function() {
    Issues.init();
});


function renderNewPulls(data) {
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
}
