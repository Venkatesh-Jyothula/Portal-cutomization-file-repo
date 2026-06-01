var selectedF;

class HashTable {
		constructor() {
			this.table = new Array(1000);
			this.size = 0;
		}

		_hash(key) {
			let hash = 0;
			for (let i = 0; i < key.length; i++) {
				hash += key.charCodeAt(i);
			}
			return hash % this.table.length;
		}

		set(key, value) {
			const index = this._hash(key);
			this.table[index] = [key, value];
			this.size++;
		}

		get(key) {
			const target = this._hash(key);
			return this.table[target];
		}

		remove(key) {
			const index = this._hash(key);

			if (this.table[index] && this.table[index].length) {
				this.table[index] = [];
				this.size--;
				return true;
			} else {
				return false;
			}
		}
	}
	
	    
	async function findPendingEdits(urlJob, urlVector, activeJob){
		var xMin, yMin, xMax, yMax,x,y;
		var firstGeometry=1;

//Retrieve the pending edits from the job service
		var arrayPendingEdits = await $NWP.fetchJson({ url: urlJob });

//the result gives all the components.  We just need the features FNO & FID's 
//We use a hashtable to just keep one time each feature
		var myFeatures=new HashTable();
		var allFeatures=[], allFeaturesBody=[];
		for (var i=0, iLen=arrayPendingEdits.length; i<iLen; i++) {
			var key=arrayPendingEdits[i].FeatureKey.Fno+'_'+arrayPendingEdits[i].FeatureKey.Fid;
			var myEntry=myFeatures.get(key);
			if(myEntry==null){
				myFeatures.set(key,arrayPendingEdits[i]);
				allFeaturesBody.push({"G3E_FNO": arrayPendingEdits[i].FeatureKey.Fno,"G3E_FID": arrayPendingEdits[i].FeatureKey.Fid});
			}
		}
		myFeatures=null;
		if(allFeaturesBody.length==0){
			alert("No feature found in the job");
			return;
		}
//allFeaturesBody contains the list of features to manage
		var requestBody = {"features": allFeaturesBody};
		var featureCollection=null;
		try{
//Retrieve all primary geographic components
			featureCollection=await $NWP.fetchJson({ url: urlVector+'/geometry/?g=1&a=0&s=0&jobs='+activeJob.identifier,
				jsonData:requestBody});
		}
		catch (error){
//returns an eror if no graphic component found.  Just for information
			console.error(error);
			featureCollection=null;
		}
		if(featureCollection!=null){

//console.log(featureCollection);
			for (var j=0, jLen=featureCollection.features.length; j<jLen; j++) {
				if(featureCollection.features[j].geometry){
	//Using the openlayer library to compute the extents of the geometries (no need to test on the type of the geometry)
					olGeometry=new parent.ol.format.GeoJSON().readGeometry(featureCollection.features[j].geometry);
					for (var k=0, kLen=olGeometry.flatCoordinates.length; k<kLen; k+=2) {
						x=olGeometry.flatCoordinates[k];
						y=olGeometry.flatCoordinates[k+1];
						if(firstGeometry==1){
							firstGeometry=0;
							xMin=x;
							xMax=xMin;
							yMin=y;
							yMax=yMin
						}
						else{
							if(x<xMin)
								xMin=x;
							if(x>xMax)
								xMax=x;
							if(y<yMin)
								yMin=y;
							if(y>yMax)
								yMax=y;
						}
					}
				}
			}
		}

		if(firstGeometry==1){
			alert("No geometry found.  Only non-graphic features in the job.");
			return;
		}
//Fit on the job
		var geojsonObject = {
			'type': 'Feature',
			'geometry': {
				'type': 'Polygon',
				'coordinates': [
					[
						[xMin, yMin],
						[xMin, yMax],
						[xMax, yMax],
						[xMax, yMin]
					]
				]
			}
		};
				
		parent.$NWP.map.fit(geojsonObject);
	}
	
	async function FitJob(){
//Check if a job is active.  If not, return
		var activeJob=parent.$NWP.jobs.getActiveJob();
				if(activeJob==null){
			alert("No active job");
			return;
		}
		
		var urlSolution=null,jobServiceURL=null, vectorServiceURL=null;
		
		//urlSolution="http://hxgn_infra_emea/NetWorksSolutionService";
//Retrieve the vector service from the map and build the networksolution url
		var mapsource=parent.$NWP.workspace.getSection("mapsource");
		for (var i=0, iLen=mapsource.items.length; i<iLen; i++) {

			if(mapsource.items[i].type=='NetworksVector'){
				vectorServiceURL=mapsource.items[i].url;
				urlSolution=vectorServiceURL.substring(0,vectorServiceURL.lastIndexOf('/'))+'/NetWorksSolutionService';
				break;
			}
		}
		

//Retrieve the DB Alias for the Solution Service
		var dbAlias=await $NWP.fetchJson({ url: urlSolution });
//Retrieve all available services
		var arrayServices = await $NWP.fetchJson({ url: urlSolution+'/'+dbAlias });
		
//Loop on all the available services and retrieve the job
		for (var i=0, iLen=arrayServices.length; i<iLen; i++) {
			/*if(arrayServices[i].Type=='VectorService'){
				vectorServiceURL=arrayServices[i].Url;
			}
			else*/ if(arrayServices[i].Type=='JobService'){
				jobServiceURL=arrayServices[i].Url;
				break;
			}
		}
//Retrieve the pending edits from the Job Service
		findPendingEdits(jobServiceURL+'/pendingedits/'+activeJob.identifier+'?1',vectorServiceURL,activeJob);
	}

//the following stores the last selected feature in a cookie
	function featureSelected(args)
	{
		selectedF=args;
		setCookie("NetWorksFeature",selectedF.properties.G3E_FNO + "|" + selectedF.properties.G3E_FID,1);
	}

//the following stores the last selected feature in the feature explorer as a cookie	
	function featureSelectedInFE(args)
	{
		selectedF=args;
		setCookie("NetWorksFeature",selectedF.G3E_FNO + "|" + selectedF.G3E_FID,1);
	}
	
//Save the cookie
	function setCookie(cname, cvalue, exdays) {
		const d = new Date();
		d.setTime(d.getTime() + (exdays*24*60*60*1000));
		let expires = "expires="+ d.toUTCString();
		document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
//console.log("cookie ok");
	}
	
//Read the cookie
	function getCookie(cname) {
		let name = cname + "=";
		let decodedCookie = decodeURIComponent(document.cookie);
		let ca = decodedCookie.split(';');
		for(let i = 0; i <ca.length; i++) {
			let c = ca[i];
			while (c.charAt(0) == ' ') {
				c = c.substring(1);
			}
			if (c.indexOf(name) == 0) {
				return c.substring(name.length, c.length);
			}
		}
		return "";
	}

//The entry points for the extra buttons in the toolbar
	async function manageButtonPress(args)
	{
		if(args.name=="hiliteSelected"){
			var myKeys=getCookie("NetWorksFeature");
			var parsedKeys = myKeys.split('|');
		
			parent.$NWP.features.fetchGTechFeatures({G3E_FNO: parsedKeys[0], G3E_FID: parsedKeys[1]}).then(function(result) {
				if (result.success) {
					parent.$NWP.features.highlight(result.data, true);
				}
			});
		}
		if(args.name=="refreshJob"){
			var activeJob;
			activeJob=parent.$NWP.jobs.getActiveJob();
			refreshJob(activeJob);
		}
		
		if(args.name=="fitJob"){
			FitJob();
		}
		
		if(args.name=="discardJob"){
			var activeJob;
			var urlSolution=null,jobServiceURL=null, vectorServiceURL=null;
						
			activeJob=parent.$NWP.jobs.getActiveJob();
			if(activeJob!=null){
//Retrieve the vector service from the map and build the networksolution url
				var mapsource=parent.$NWP.workspace.getSection("mapsource");
				for (var i=0, iLen=mapsource.items.length; i<iLen; i++) {
					if(mapsource.items[i].type=='NetworksVector'){
						vectorServiceURL=mapsource.items[i].url;
						urlSolution=vectorServiceURL.substring(0,vectorServiceURL.lastIndexOf('/'))+'/NetWorksSolutionService';
						break;
					}
				}
//Retrieve the DB Alias for the Solution Service
				var dbAlias=await $NWP.fetchJson({ url: urlSolution });
//Retrieve all available services
				var arrayServices = await $NWP.fetchJson({ url: urlSolution+'/'+dbAlias });
		
//Loop on all the available services and retrieve the job service
				for (var i=0, iLen=arrayServices.length; i<iLen; i++) {
					if(arrayServices[i].Type=='JobService'){
						jobServiceURL=arrayServices[i].Url;
						break;
					}
				}
				var response = await $NWP.serverRequest({ url:jobServiceURL+"/discard/"+activeJob.identifier });
			}
		}
	}

//Refresh the active job
function refreshJob(activeJob)
{
	if(activeJob!=null){
		parent.$NWP.jobs.clear();
		parent.$NWP.jobs.setActiveJob(activeJob);
	}
}
//console.log("dans captureevent.js");

//When starting up - handling the events when features are selected and when action buttons are pressed.
parent.$NWP.on('featureselected', featureSelected, null);
parent.$NWP.on('gtechfeatureload', featureSelectedInFE, null);
parent.$NWP.on('actionbuttonpress', manageButtonPress, null);
