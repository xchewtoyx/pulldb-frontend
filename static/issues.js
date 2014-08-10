var issue_panel;

var Issues = {
    init: function() {
        this.templateLoad();
    },

    togglePulled: function() {
        var pull = $(this);
        function togglePulled() {
            pull.find("i.fa").toggleClass(
                "fa-square fa-square-o");
            if(pull.data("pulled") == "True") {
                pull.data("pulled", "False");
            } else {
                pull.data("pulled", "True");
            }
        }
        if(pull.data("pulled") == "True") {
            console.log('Removing pull...');
            Site.apiFetch({
                method: "POST",
                url: "/api/pulls/update",
                data: JSON.stringify({
                    "unpull": [String(pull.data("pull"))],
                }),
                success: togglePulled,
            });
        } else {
            console.log('Pulling...', JSON.stringify({
                pull: [pull.data("pull")],
            }));
            Site.apiFetch({
                method: "POST",
                url: "/api/pulls/update",
                data: JSON.stringify({
                    "pull": [String(pull.data("pull"))],
                }),
                success: togglePulled,
            });
        }
    },

    toggleEvents : function () {
        $("a.pull").on("click", Issues.togglePulled);
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
    Issues.toggleEvents();
}
