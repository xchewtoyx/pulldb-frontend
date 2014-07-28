var auth_token;

var Site = {
    clientId: '462995942151-naeu6b7vnecc6hr112a718darg0o6gqp.' +
        'apps.googleusercontent.com',
    apiKey: 'AIzaSyB7y3n64f5O5EQISlVQpFNvEnnr79dSVLo',
    scopes: 'https://www.googleapis.com/auth/plus.me ' +
        'https://www.googleapis.com/auth/userinfo.email',

    init : function() {
        if(api_ready) {
            this.clientAuth();
        } else {
            $(document).on("pulldbAuthReady", $.proxy(this.clientAuth, this));
        }
        this.authEvents();
        this.subscriptionEvents();
    },

    clientAuth: function() {
        console.log("doing clientauth...", this);
        gapi.client.setApiKey(this.apiKey);
        gapi.auth.authorize({
            client_id: this.clientId, scope: this.scopes, immediate: true
        }, this.handleAuthResult);
    },

    handleAuthResult: function (authResult) {
        var auth_panel = $('#auth-required');
        if (authResult && !authResult.error) {
            auth_panel.hide();
            auth_token = authResult.access_token;
            $.event.trigger(
                {"type": "pulldbAuthorised"}, [authResult.access_token]);
        } else {
            auth_panel.show();
        }
    },

    authEvents : function() {
        $("#auth-required .btn").on("click", $.proxy(function() {
            gapi.auth.authorize({
                client_id: this.clientId, scope: this.scopes, immediate: false,
            }, this.handleAuthResult);
        }, this));
    },

    subscriptionEvents : function () {
        $("a.subscription").on("click", function () {
            var volume = $(this);
            function toggleSubscription() {
                volume.find("i.fa").toggleClass(
                    "fa-heart fa-heart-o");
                if(volume.data("subscribed") == "True") {
                    volume.data("subscribed", "False");
                } else {
                    volume.data("subscribed", "True");
                }
            };
            if(volume.data("subscribed") == "True") {
                console.log('unsubscribing...');
                $.ajax({
                    type: "POST",
                    url: "/api/subscriptions/remove",
                    data: JSON.stringify({
                        volumes: [volume.data("volume")],
                    }),
                    success: toggleSubscription,
                    error: function (jqXHR,  textStatus,  errorThrown) {
                        console.log("Subscription Error", textStatus,
                                    errorThrown )
                    },
                    beforeSend: function(jqxhr, settings) {
                        jqxhr.setRequestHeader('Authorization',
                                               'Bearer ' + auth_token);
                    },
                });
            } else {
                console.log('subscribing...', JSON.stringify({
                    volumes: [volume.data("volume")],
                }));
                $.ajax({
                    type: "POST",
                    url: "/api/subscriptions/add",
                    data: JSON.stringify({
                        volumes: [volume.data("volume")],
                    }),
                    success: toggleSubscription,
                    error: function (jqXHR,  textStatus,  errorThrown) {
                        console.log("Subscription Error", textStatus,
                                    errorThrown )
                    },
                    beforeSend: function(jqxhr, settings) {
                        jqxhr.setRequestHeader('Authorization',
                                               'Bearer ' + auth_token);
                    },
                });
            }
        });
    },
};

// Triggers for oauth token availability
var api_ready;
function handleApiLoad() {
  console.log("trigger authready...");
  $.event.trigger({"type": "pulldbAuthReady"});
  api_ready = true;
}

$(document).ready( function() {
    Site.init();
});
