(function () {
  var SDK = window.__HERMES_PLUGIN_SDK__;
  if (!SDK) {
    return;
  }
  var React = SDK.React;
  var useState = SDK.hooks.useState;
  var useEffect = SDK.hooks.useEffect;
  var Card = SDK.components.Card;
  var CardContent = SDK.components.CardContent;
  var CardHeader = SDK.components.CardHeader;
  var CardTitle = SDK.components.CardTitle;
  var Button = SDK.components.Button;

  function ManagekarPage() {
    var state = useState(null);
    var ticket = state[0];
    var setTicket = state[1];
    var errorState = useState("");
    var error = errorState[0];
    var setError = errorState[1];

    useEffect(function () {
      var cancelled = false;
      SDK.fetchJSON("/api/plugins/managekar/pair", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ host_label: "Hermes" }),
      })
        .then(function (body) {
          if (!cancelled) {
            setTicket(body);
          }
        })
        .catch(function (err) {
          if (!cancelled) {
            setError(err && err.message ? err.message : "Could not mint a pair ticket");
          }
        });
      return function () {
        cancelled = true;
      };
    }, []);

    return React.createElement(
      Card,
      { className: "mk-host-pair" },
      React.createElement(CardHeader, null, React.createElement(CardTitle, null, "Manage.kar host QR")),
      React.createElement(
        CardContent,
        null,
        error
          ? React.createElement("p", null, error)
          : ticket
            ? React.createElement(
                "div",
                null,
                React.createElement("p", null, "Scan this from the Manage.kar phone app, or open the QR page."),
                ticket.qr_svg
                  ? React.createElement("div", {
                      "aria-label": "pair QR",
                      dangerouslySetInnerHTML: { __html: ticket.qr_svg },
                    })
                  : null,
                React.createElement(
                  "p",
                  null,
                  React.createElement("a", { href: ticket.qr_url }, ticket.qr_url),
                ),
                React.createElement("pre", null, ticket.payload || JSON.stringify(ticket.ticket, null, 2)),
                React.createElement(
                  Button,
                  {
                    onClick: function () {
                      if (ticket.qr_url) {
                        window.open(ticket.qr_url, "_blank");
                      }
                    },
                  },
                  "Open QR page",
                ),
              )
            : React.createElement("p", null, "Minting a single-use ticket…"),
      ),
    );
  }

  window.__HERMES_PLUGINS__.register("managekar", ManagekarPage);
})();
