// Call to a 'portal' service
$NWP.serviceRequest({serviceName: 'clientid', callback: function(result) {console.log(result)}})

// Generic server request
$NWP.serverRequest({url: 'coordsys.json', success: function(response) {console.log(response)}})

// Fetch like request
$NWP.fetchJson({url: 'coordsys.json'}).then(function(result) {console.log(result)})
