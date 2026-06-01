function getAppUrl(path) {
    return `${window.location.origin}${path}`;
}

async function fetchNetworkSolutionData() {
		try {
			// Get the mapsource section
			var mapsource = parent.$NWP.workspace.getSection("mapsource");

			// Initialize variables
			var vectorServiceURL;

			// Loop through mapsource items to find the NetworksVector type
			for (var i = 0, iLen = mapsource.items.length; i < iLen; i++) {
				if (mapsource.items[i].type === 'NetworksVector') {
					vectorServiceURL = mapsource.items[i].url;
					urlSolution = vectorServiceURL.substring(0, vectorServiceURL.lastIndexOf('/')) + '/NetWorksSolutionService';
					break;
				}
			}

			// Check if urlSolution was found
			if (!urlSolution) {
				throw new Error("NetworksVector type not found in mapsource items.");
			}
			console.log(urlSolution);
			//Retrieve the DB Alias for the Solution Service
			var dbAlias=await parent.$NWP.fetchJson({ url: urlSolution });

			// Fetch data from the selected option endpoint
			const response = await fetch(`${urlSolution}/${dbAlias}/`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			// Check if the response is ok
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			// Parse the response data as JSON
			const urlSolutiondata = await response.json();

			// Check if urlSolutiondata is null
			if (urlSolutiondata === null) {
				throw new Error("Received null data from the network solution service.");
			}

			// Return the parsed data
			return urlSolutiondata;

		} catch (error) {
			// Handle errors
			console.error('Error fetching network solution data:', error);
			throw error;  // Re-throw the error after logging it
		}
	}
async function getProxyServiceUrl(originalServiceUrl) {
  try {
        
    const url = new URL(originalServiceUrl);
    const serviceName = url.pathname.split('/').pop(); 

    const match = window.location.pathname.match(/^\/([^\/]+)/);
    const portalName = match ? match[1] : '';

    if (!portalName) {
      throw new Error('Unable to extract portal name from current pathname.');
    }

    // Step 4: Construct the final URL
   // const finalUrl = `${url.protocol}//${url.host}/${portalName}/proxy/networks/${serviceName}`;
    const finalUrl = `${window.location.origin}/${portalName}/proxy/networks/${serviceName}`;

    //console.log('Modified Service URL:', finalUrl);
    return finalUrl;

  } catch (error) {
    console.error('Error modifying service URL:', error);
    throw error;
  }
}

async function findServiceUrl(urlSolutiondata, serviceType) {
	for (const service of urlSolutiondata) {
		//console.log(service.Type);
		//console.log(service);
		if (service.Type === serviceType) {
			return getProxyServiceUrl(service.Url);
		}
	}
	throw new Error(`${serviceType} not found in network solution data.`);
}

 async function getServiceUrl(serviceType) {
	try {
		// Fetch network solution data
		const urlSolutiondata =  await fetchNetworkSolutionData();

		// Find and return the service URL for the specified service type
		const serviceUrl = await findServiceUrl(urlSolutiondata, serviceType);
		return serviceUrl;
	} catch (error) {
		console.error('Error:', error);
		throw error;
	}
}