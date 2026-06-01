/*
async function PlaceTrenchLineMain(args){
	debugger;
	console.log("In Function PlaceTrenchLineMain");
	console.log(args);
	let actioName = args.name;
	let redlineFeature = args.feature;
	
	if (redlineFeature.geometry.coordinates.length > 2 || redlineFeature.geometry.coordinates.length < 2){
		$NWP.msg.showError('Place line with 2 coordinates');
		return;
	}
	
	
	
	//const visibleLayers = PTRGetVisibleLayers();
	//let layerObj = {};
	//layerObj.visiblelayer = visibleLayers;
	//layerObj.coordinates = redlineFeature.geometry.coordinates;
	
	//const url = 'http://localhost/PlaceTrenchLine_PublishedService/api/GetLabel';
	//const responseData = await fetch(url,{
	//	method : 'POST',
	//	headers :{
	//		'Content-Type': 'application/json'
	//	},
	//	body: JSON.stringify(layerObj)
	//});
	
	
	//Get intersected fetaures
	const intersectionFeaturesArr = PTRGetIntersectedFeatures(redlineFeature);	
	console.log(intersectionFeaturesArr);
	console.log(JSON.stringify(intersectionFeaturesArr));
	
	//Get label
	const label = await PTRGetLabel(intersectionFeaturesArr);
	
	
	const redlineTextObj = PTRCreateRedlineTextObj(label);
	redlineTextObj.geometry.coordinates = [redlineFeature.geometry.coordinates[0][0],redlineFeature.geometry.coordinates[0][1]];
	//redlineTextObj.properties.__style.text = label;
	
	$NWP.redlines.load(redlineTextObj);
	
}
*/

let TRTextFeature;
let TRLineFeature;
//let ptrDraw;
let PTRStrLabel= null;
let PTRVectorSourceScaleIndependent = null;
let PTRVectorLayerScaleIndependent = null;
let PTRfont_size = 10;

/** PTRAddInteraction - This function starts interaction with map */
function PTRAddInteraction(){
	const ptrvectorSource  = new ol.source.Vector();
	ptrDraw = new ol.interaction.Draw({
		source: ptrvectorSource ,
		type: 'LineString'
	});
	$NWP.map.getOlMapObject().addInteraction(ptrDraw);
}

/**
 * PTRHandleMouseClick - This function get invoked when user clicks on map for place trench redline custom command
 * @param event - event object
 */
async function PTRHandleMouseClick(event){
	try{
		ptrCoordinates.push(event.coordinate);
		ptrClickCount++;
		if (ptrClickCount === 2){//when user place second point of line
			//Start wait curosr
			$NWP.map.getOlMapObject().getViewport().style.cursor = 'wait'
			
			//When user click second point, remove interaction 
			$NWP.map.getOlMapObject().removeInteraction(ptrDraw);
			//TRReDrawLine();
			
			//Get layers which are switched on
			const visibleLayers = PTRGetVisibleLayers();
			
			//Check the map scale  
			//scale = GetMapScale();
			scale = $NWP.map.getOlMapObject().getViewport().innerText.split(':')[1].split('\n')[0].replace(',','').trim();
			
			//Vector layer source for scale dependent features like path, conduit and fiber cables
			PTRVectorSourceScaleIndependent = new ol.source.Vector();
			
			/*Load scale dependent features. Features like path, conduit and fiber cables are not visible on map beyond certain scales
			  So load this features at back end so that these features can appear in stack label when user place stack label at higher scale.*/
			
			//Load conduit features
			if (scale >= 1500 && scale < 20000){
				if (visibleLayers.includes('221001')) {await PTRLoadScaleDependentVectorData(221001)};//Conduit
				if (visibleLayers.includes('221401')) {await PTRLoadScaleDependentVectorData(221401)};//Cocon Conduit
			}
			
			//Load path features
			if (scale >= 3500 && scale < 20000){
				if (visibleLayers.includes('351001')) {await PTRLoadScaleDependentVectorData(351001)};//Path
				//if (visibleLayers.includes('351401')) {await PTRLoadScaleDependentVectorData(351401)};//Cocon Path do not load
			}
					
			//Load cable features
			if (scale >= 10000 && scale < 20000){
				if (visibleLayers.includes('721001')) {await PTRLoadScaleDependentVectorData(721001)};//Cable
				if (visibleLayers.includes('721201')) {await PTRLoadScaleDependentVectorData(721201)};//Cocon Cable
			}
			
			//Add vector layer for above features.
			PTRVectorLayerScaleIndependent = new ol.layer.Vector({
				source: PTRVectorSourceScaleIndependent
			});
			PTRVectorLayerScaleIndependent.setZIndex(0);			
			$NWP.map.getOlMapObject().addLayer(PTRVectorLayerScaleIndependent);
						
			//Get intersected fetaures corssed by user placed line
			const intersectionFeaturesArr = PTRGetIntersectedFeatures(ptrCoordinates);
			//console.log(intersectionFeaturesArr);
			//console.log(JSON.stringify(intersectionFeaturesArr));
			
			//If no intersected feature found then display message to user.
			if (intersectionFeaturesArr.length === 0){
				$NWP.msg.showInfo("No Path,Conduit,Fiber Duct,Cable(Fiber) feature found");
				PTRStrLabel = null;
				ptrClickCount = 0;
				ptrCoordinates = [];
				PTRAddInteraction();
				//Remove vector layers
				//$NWP.map.getOlMapObject().removeLayer(ptrvectorLayer);
				//$NWP.map.getOlMapObject().removeLayer(PTRVectorLayerScaleIndependent)
				/*
				setTimeout(
					function(){
					$NWP.map.resetMode();
					$NWP.features.setEditorDisabled(false);
				},1000);
				*/
				//throw new Error ("No Path,Conduit,Fiber Duct,Cable(Fiber) feature found");
			}
			else {
				//Create feature collection object. This will be passed to .Net API to create label
				const featureCollection = {"FeatureCollection":intersectionFeaturesArr,"FiberInnerDuctRequired" : ptrFiberInnerDuctRequired,"IsLabelForFSE" : false};
				console.log(featureCollection);
				console.log(JSON.stringify(featureCollection));
				
				//Create label
				PTRStrLabel = await PTRGetLabel(featureCollection);
				
				TRLineFeature = PTRCreateLineFeature(ptrCoordinates);
				TRTextFeature = PTRCreateTextFeature(event.coordinate,PTRStrLabel);
				
			}
					
		}else if (ptrClickCount === 3){//when user click for label placement on map
			let resolution = $NWP.map.getOlMapObject().getView().getResolution();
			
			//Remove additional last coordinate from margine line
			ptrCoordinates.splice(-1);
			
			DrawLineAndText(ptrCoordinates,event.coordinate, PTRStrLabel);
			//CreateGeoJSONFeature(ptrCoordinates,event.coordinate, PTRStrLabel);
			//addLineGeometryLayer('StackLabel', 'StackLabelSource',ptrCoordinates,event.coordinate,PTRStrLabel)
						
			
			//Create redline text object using label fetched using API
			const redlineTextObj = PTRCreateRedlineTextObj(PTRStrLabel,resolution);
			redlineTextObj.geometry.coordinates = event.coordinate;
			
			//Create redline line object using coordinates of vector line
			const redlineLineStringObj = PTRCreateRedlineLineStringObj(resolution);
			redlineLineStringObj.geometry.coordinates = TRLineFeature.getGeometry().getCoordinates();
			
			ptrvectorSource.removeFeature(TRTextFeature);
			ptrvectorSource.removeFeature(TRLineFeature);
			
			//Load redlineTextObj and redlineLineStringObj
			$NWP.redlines.load(redlineLineStringObj);
			$NWP.redlines.load(redlineTextObj);
			
			//Commencted code
			/*
			//Create vector line feature using provided coordinates and remove itercation and mouse move handler
			TRReDrawLine();
			//$NWP.map.getOlMapObject().removeEventListener('pointermove', PTRHandleMouseHover);
			$NWP.map.getOlMapObject().removeInteraction(ptrDraw);
			
			//Create redline text object using label fetched using API
			const redlineTextObj = PTRCreateRedlineTextObj(PTRStrLabel,resolution);
			redlineTextObj.geometry.coordinates = event.coordinate;
			
			//Create redline line object using coordinates of vector line
			const redlineLineStringObj = PTRCreateRedlineLineStringObj(resolution);
			redlineLineStringObj.geometry.coordinates = TRLineFeature.getGeometry().getCoordinates();
			
			//Remove vector text and line feature
			ptrvectorSource .removeFeature(TRTextFeature);
			ptrvectorSource .removeFeature(TRLineFeature);
			
			//Load redlineTextObj and redlineLineStringObj
			$NWP.redlines.load(redlineLineStringObj);
			$NWP.redlines.load(redlineTextObj);
			*/
			
			//Remove vectorlayer used for line and text and vector layer used for scale dependent feature 
			//$NWP.map.getOlMapObject().removeLayer(ptrvectorLayer);
			//$NWP.map.getOlMapObject().removeLayer(PTRVectorLayerScaleIndependent);
			//PTRStrLabel = null;
			
			ptrClickCount = 0;
			ptrCoordinates = [];
			PTRAddInteraction();
			/*
			setTimeout(
				function(){
				$NWP.map.resetMode();
				$NWP.features.setEditorDisabled(false);
			},1000);
			*/
		}
	}
	catch(err){
		console.log(err);
		$NWP.map.getOlMapObject().removeLayer(ptrvectorLayer);
		$NWP.map.getOlMapObject().removeLayer(PTRVectorLayerScaleIndependent);
	}
	finally{
		$NWP.map.getOlMapObject().getViewport().style.cursor = '';
	}
	
}

/**
 * PTRLoadScaleDependentVectorData - This function loads vector data for path,conduit and fiber cables when map scale is  
 * more than scale defined for feature. This is alternative for switching off scale dependent of layer 
 * @param leno - Legened number of feature
 */
async function PTRLoadScaleDependentVectorData(leno){
	let mapsource = $NWP.workspace.getSection("mapsource");
	let vectorServiceURL;
	let mapextent = $NWP.map.getViewState().extent;
	let resolution = $NWP.map.getOlMapObject().getView().getResolution();

	// Loop through mapsource items to find the NetworksVector type
	for (let item of mapsource.items) {
		if (item.type === 'NetworksVector') {
		  vectorServiceURL = item.url;
		  break;
		}
	}
	
	//Fetch data for provided legend entry for current extent of map	
	await fetch(`${vectorServiceURL}/data`,{
		method: "POST",
		body: JSON.stringify({
			"lsno": 1,
			"bbox": mapextent,
			"resolution": resolution,//1.424,
			"entries": [{"l":leno,"s":1}]//'s=1' means scale independent
		}),
		headers: {
			"Content-type": "application/json; charset=UTF-8"
		}
	}).then((response) => response.json())
	  .then(function(json){
		//console.log(json.features);
		//loop through each record and create new ol feature using geometry and properties of record.
		json.features.forEach(item =>{
			if (item.geometry && item.geometry.coordinates) {
				let coordinates = item.geometry.coordinates;
				
				const feature = new ol.Feature({
					geometry: new ol.geom.LineString(coordinates)
				});
				
				feature.setProperties({
				  ID: item.properties.ID,
				  SNO: item.properties.SNO
				});
				
				//Set color as white so it will not be displayed to user
				feature.setStyle(new ol.style.Style({
					stroke: new ol.style.Stroke({
						color: 'white',
						width: 1
					})
				}));
				
				//Add ol feature to vector source.
				PTRVectorSourceScaleIndependent.addFeature(feature);
			}
		});
		
	  });
}

/**
 * PTRCreateLineFeature - This function creates line feature using provided coordinates
 * @param coordinates - coordinates to create line
 */
function PTRCreateLineFeature(coordinates){
	debugger;
	const lineFeature = new ol.Feature({
		geometry: new ol.geom.LineString(coordinates),
	});
 
	lineFeature.setStyle(new ol.style.Style({
		stroke: new ol.style.Stroke({ color: 'rgba(0, 0, 0, 1)', width: 0.6}),
	}));
	
	ptrvectorSource .addFeature(lineFeature);
	return lineFeature;
}

/**
 * PTRCreateTextFeature - This function creates text feature using provided coordinate and text
 * @param coord - Coordinate to create text
 * @param text -  Label to place
 */
function PTRCreateTextFeature(coord,text){
	debugger;
	//let font_size = 8;
	const textFeature = new ol.Feature({
		geometry: new ol.geom.Point(coord),
	});
	 
	textFeature.setStyle(new ol.style.Style({
		text: new ol.style.Text({
			text: text,
		  font: 'bold ' + PTRfont_size + 'px Lucida Console',
		  textAlign:'left',
		  textBaseline: 'bottom',
		  fill: new ol.style.Fill({ color: 'rgba(0, 0, 0, 1)' }),
		  stroke: new ol.style.Stroke({ color: 'white', width: 2 }),
		  offsetX: 0,
		  offsetY: 0,
		  scaleDependent: true,		  
		}),
	}));
	
	ptrvectorSource.addFeature(textFeature);
	
	return textFeature;
}

/**
 * TRReDrawLine - This function set the geometry of existing line feature using provided  coordinates
 * @param coordinates - coordinates to for setting geometry
 */
function TRReDrawLine(coordinates) {
  if (TRLineFeature !== undefined){
	  TRLineFeature.getGeometry().setCoordinates(coordinates);
  }
}

/**
 * TRReDrawText - This function creates text feature at given coord and given text
 * @param coord - Coordinate to place text
 * @param text -  Label to place
 */
function TRReDrawText(coord, text) {
  
	let resolution = $NWP.map.getOlMapObject().getView().getResolution();	 
	//let font_size = (1/resolution) * 10; 
	//console.log(resolution + ',' + font_size);
	//let zoom =$NWP.map.getOlMapObject().getView().getZoom();
	//let font_size = 8;
  
    //let scale = $NWP.map.getOlMapObject().getViewport().innerText.split(':')[1].split('\n')[0].replace(',','').trim();
  
	/*
  	if (scale > 0 && scale < 500){
		font_size = 10;
	}
	else if (scale > 500 && scale < 1000){
		font_size = 9;
	}
	else if (scale > 1000 && scale < 1500){
		font_size = 8;
	}
	else if (scale > 1500 && scale < 5000){
		font_size = 8;
	}
        else if (scale > 5000 && scale < 10000){
		font_size = 8;
	}
	else{
		font_size = 5;
	}
    */
  
  	if (TRTextFeature !== undefined){
		let originalResolution = TRTextFeature.get('originalResolution') || resolution;
		scale = originalResolution / resolution;
		
	    TRTextFeature.setStyle(new ol.style.Style({
		text: new ol.style.Text({
		  text: text,
		  font: 'bold ' + PTRfont_size + 'px Lucida Console',
		  textAlign:'left',
		  textBaseline: 'bottom',
		  fill: new ol.style.Fill({ color: 'rgba(0, 0, 0, 1)' }),
		  stroke: new ol.style.Stroke({ color: 'white', width: 2 }),
		  offsetX: 0,
		  offsetY: 0,
          scaleDependent: true,	
          scale: scale,		  
		}),
  	}));
  
  	TRTextFeature.getGeometry().setCoordinates(coord);
  }

}

/**
 * PTRHandleMouseHover - This function invokes when user moves mouse on map for place trenchline custom command
 * @param event - event object
 */
const PTRHandleMouseHover = (event) => {
  if (ptrClickCount === 2) {
    // Clear previous hover text
    //ptrvectorSource .clear();
 
	let merginLineHeight;
	//Get length of margin line
	if (PTRStrLabel != null){
		merginLineHeight = PTRGetMarginLineLength(PTRStrLabel);
	}
	
	//On each mouse over, remove last 2 coordinates i.e coordinates of mergine line
	if (ptrCoordinates.length > 2){
		ptrCoordinates.splice(-2);
	}
	//Push mouse over coordinate into coordinate array
	ptrCoordinates.push(event.coordinate);
	//Push last coordinate of margin line into coordinate array
	ptrCoordinates.push([event.coordinate[0],event.coordinate[1] + merginLineHeight]);
	
	//DrawLineAndText(ptrCoordinates,event.coordinate, PTRStrLabel);
	
    // Redraw the line (since we cleared everything)
    TRReDrawLine(ptrCoordinates);
 
    // Show floating text at hover position
    TRReDrawText(event.coordinate, PTRStrLabel);
  }
};

/**
 * DrawLineAndText - This function create feature as composite geometry of line and text
 * @param linecoords - coordinates to create line
 * @param textcoord - coordinates to create text
 * @param text - text to place label
 */
function DrawLineAndText(linecoords,textcoord, text) {
	debugger;  
	let resolution = $NWP.map.getViewState().resolution; 
	slLineTextFeature = new ol.Feature({
		geometry: new ol.geom.GeometryCollection([
			new ol.geom.Point(textcoord),
			new ol.geom.LineString(linecoords)
		]),
		label: text,
		name:'StackLabel',
		originalResolution: resolution,
	});
	slLineTextFeature.set('selected', false);
	ptrfinalvectorSource.addFeature(slLineTextFeature);
}

/*
function CreateGeoJSONFeature(linecoords,textcoord, text) {
	debugger;  
	const viewProj = $NWP.map.getViewState().projection;
	const geojson = {
		"type": "FeatureCollection",
		"features": [
			{
				"type": "Feature",
				"geometry": {
					"type": "GeometryCollection",
					"geometries":[
						{
						{
							"type": "Point",
							"name": "test",
							"coordinates": textcoord
						},
						{
							"type": "LineString",
							"coordinates": linecoords
						}
					]
				},
				"properties": {
					"name": "StackLabel",
					"label": text,
					"selected" : false
				}
         }
       ]
    };
	
	ptrfinalvectorSource = new ol.source.Vector({
       format: new ol.format.GeoJSON({dataProjection:viewProj}),
       features: new ol.format.GeoJSON().readFeatures(geojson), // Read GeoJSON data from object
    });
	
	slfinalvectorLayer.setSource(ptrfinalvectorSource);
	slfinalvectorLayer.setStyle(PTRStyleFunction);
	}
*/


/**
 * PTRStyleFunction - This function set style for line and text for composite geometry feature
 * @param feature - compoiste line and text feature
 * @param resolution - resolution of map
 */
function PTRStyleFunction(feature,resolution){
	console.log(resolution);
	console.log(feature);
	console.log("originalResolution",feature.get('originalResolution'));
	let originalResolution = feature.get('originalResolution') || resolution;
	let scale = originalResolution / resolution;
	console.log('scale:' , scale);
	let geometries = feature.getGeometry().getGeometries();
	let point = geometries[0];
    let line = geometries[1];
	let selected = feature.get('selected');
	
	let lineStyle = new ol.style.Style({
		geometry: line,
		stroke: new ol.style.Stroke({ color: selected ? 'rgba(255, 0, 0, 1)' : 'rgba(0, 0, 0, 1)', width: 0.6}),
	});
	
	
	let textStyle = new ol.style.Style({
		geometry: point,	
		text: new ol.style.Text({
			text: (feature.get('label')).toString(),
			font: 'bold ' + PTRfont_size + 'px Lucida Console',
			textAlign:'left',
			textBaseline: 'bottom',
			fill: new ol.style.Fill({ color: selected ? 'rgba(255, 0, 0, 1)' : 'rgba(0, 0, 0, 1)' }),
			stroke: new ol.style.Stroke({ color: 'white', width: 2 }),
			offsetX: 0,
			offsetY: 0, 
			scaleDependent: true,
			scale: scale
		}),
	});
	
	return [lineStyle, textStyle]; 
}

/**
 * PTRGetIntersectedFeatures - This function gets array of features intersected by cross line placed by user
 * @param redlineCoordinates - Coordinate of line placed by user
 */
function PTRGetIntersectedFeatures(redlineCoordinates){
	let lineCoords = redlineCoordinates;
	//Create points using line geometry placed by users
	const point1 = new Point(lineCoords[0][0],lineCoords[0][1]);
	const point2 = new Point(lineCoords[1][0],lineCoords[1][1]);
	
	//Create line using coordinates of cross line place by user
	const lineGeometry = new ol.geom.LineString(lineCoords);

	//Get Geobase Engineering layer
	let ptrvectorLayer = null;
	const mapLayers = $NWP.map.getMapLayers();
	const index = mapLayers.findIndex(mapLayer => mapLayer.userName === "Geobase Engineering" && mapLayer.type === "NetworksVector");
	
	const intersectionFeaturesArr = [];
	if (index !== -1) {
		//Get path,conduit,fiber duct and fiber cable features within map extent
		let featuresWithinMapExtent =  mapLayers[index].layer.getSource()
                .getFeatures()
                .filter(feature => feature.values_?.ID?.includes(',3500,') || feature.values_?.ID?.includes(',4000,')|| feature.values_?.ID?.includes(',2200,')|| feature.values_?.ID?.includes(',7200,'))
                .map(feature => feature.values_);
		
		//Get path,conduit fiber cable features which are at higher scale and not visible on map due to scale
		let scaledependentFeatures = PTRVectorLayerScaleIndependent.getSource()
				.getFeatures()
				.map(feature => feature.values_);
		
		//loop through each scale dependent feature and add into featuresWithinMapExtent array if does not exist
		scaledependentFeatures.forEach(function (arrayItem){
			let feat = featuresWithinMapExtent.find((elem) => elem.ID === arrayItem.ID && JSON.stringify(elem.geometry.flatCoordinates)  === JSON.stringify(arrayItem.geometry.flatCoordinates));
			if (feat === undefined){
				featuresWithinMapExtent.push(arrayItem);
			}
		});
					
		//Array.prototype.push.apply(featuresWithinMapExtent,scaledependentFeatures);
		if (featuresWithinMapExtent.length > 0){
			//Loop through each feature within mapextent
			for (let feature of featuresWithinMapExtent){
				if (!ol.extent.intersects(lineGeometry.getExtent(),feature.geometry.getExtent())){
					continue;
				}
					
				feature.geometry.forEachSegment(function(geomStart,geomEnd){
					lineGeometry.forEachSegment(function(lineStart,lineEnd){
						//Check if line geometry segment intersects with each segment of feature within map extent		
						if (PTRDoLinesIntersect(geomStart, geomEnd, lineStart, lineEnd)) {
							let point3 = new Point(geomStart[0],geomStart[1]);
							let point4 = new Point(geomEnd[0],geomEnd[1]);
							//If intersected the get point of intersection
							intersectionPoint = PTRFindIntersection(point1,point2,point3,point4);
							//Get distance between first point of cross line placed by user and intersected point.
							let distance = Math.round(PTRDistanceOfTwoPoints(new Point(lineStart[0],lineStart[1]),intersectionPoint));	
							//Create array of intersected features based on distance
							let featArrAtDist = intersectionFeaturesArr.find(item => item.distance == distance);
							if (featArrAtDist != undefined){
								featArrAtDist.features.push(feature.ID); //if distnace already exists
							} else {
								const intersectedFeatureObj = {};
								const intersectedFeatures =[];
								intersectedFeatureObj.distance = distance;
								intersectedFeatures.push(feature.ID);
								intersectedFeatureObj.features = intersectedFeatures;
								intersectionFeaturesArr.push(intersectedFeatureObj);
							}
						}
					});	
				});
			}
		}		
	}
	else {
		$NWP.map.getOlMapObject().removeLayer(ptrvectorLayer);
		$NWP.map.getOlMapObject().removeLayer(PTRVectorLayerScaleIndependent);
		throw new Error("No Vector layer found");
	}
	return intersectionFeaturesArr;
}

/**
 * PTRCreateRedlineTextObj - This function creates geojson text object for label
 * @param label - Label to place on map
 * @param resolution - Resolution of map
 */
function PTRCreateRedlineTextObj(label,resolution){
	//Geometry object	
	redLineTextGeomObj = new Object();
	redLineTextGeomObj.type = 'Point';
	
	//Style object
	redlineTextStyleObj = new Object();
	redlineTextStyleObj.fontColor = "#000000";
	redlineTextStyleObj.fontFamily = "Lucida Console";
	redlineTextStyleObj.fontOpacity = 1;
	redlineTextStyleObj.fontSize = 10;
	redlineTextStyleObj.fontStyle = "normal";
	redlineTextStyleObj.rotateWithView = false;
	redlineTextStyleObj.scaleDependent = true;
	redlineTextStyleObj.text = label;
	redlineTextStyleObj.textAlign = "left";
	redlineTextStyleObj.textBaseline = "bottom";
	redlineTextStyleObj.offsetX = 0;
	redlineTextStyleObj.offsetY = 0;
	redlineTextStyleObj.name = "StackLabel Redline Text";
	
	//Property object
	redlineTextPropertyObj = new Object();
	redlineTextPropertyObj.__featureType ="label";
	redlineTextPropertyObj.__resolution =resolution;
	redlineTextPropertyObj.__rotation = 0;
	redlineTextPropertyObj.type = "Feature";
	redlineTextPropertyObj.__style = redlineTextStyleObj;
	
	//Root object
	redLineTextRootObj = new Object();
	redLineTextRootObj.type = "Feature";
	redLineTextRootObj.geometry = redLineTextGeomObj;
	redLineTextRootObj.properties = redlineTextPropertyObj;
 
	return redLineTextRootObj;
	
}

/**
 * PTRCreateRedlineLineStringObj - This function creates geojson line object for line placed by user
 * @param resolution - Resolution of map
 */
function PTRCreateRedlineLineStringObj(resolution){
	//Geometry object
	redLineLineStringGeomObj = new Object();
	redLineLineStringGeomObj.type = 'LineString';
	
	//Style object
	redlineLineStringStyleObj = new Object();
	redlineLineStringStyleObj.enableAngle = false;
	redlineLineStringStyleObj.enableArrows = false;
	redlineLineStringStyleObj.enableSegmentLength = false;
	redlineLineStringStyleObj.enableTotalLength = false;
	redlineLineStringStyleObj.fontFamily = "Lucida Console";
	redlineLineStringStyleObj.fontOutlineColor = "#000000";
	redlineLineStringStyleObj.fontOutlineWidth = 3;
	redlineLineStringStyleObj.fontSize = 10;
	redlineLineStringStyleObj.rotateWithView = false;
	redlineLineStringStyleObj.scaleDependent = true;
	redlineLineStringStyleObj.strokeColor = "#000000";
	redlineLineStringStyleObj.strokeDashstyle = "solid";
	redlineLineStringStyleObj.strokeOpacity = 0.9;
	redlineLineStringStyleObj.strokeWidth = 0.2;
	redlineLineStringStyleObj.name = "StackLabel Redline Linestring";

	//Property object
	redlineLineStringPropertyObj = new Object();
	redlineLineStringPropertyObj.__featureType ="line";
	redlineLineStringPropertyObj.__resolution =resolution;
	redlineLineStringPropertyObj.__rotation = 0;
	redlineLineStringPropertyObj.type = "Feature";
	redlineLineStringPropertyObj.__style = redlineLineStringStyleObj;
	
	//Root object
	redLineLineStringRootObj = new Object();
	redLineLineStringRootObj.type = "Feature";
	redLineLineStringRootObj.geometry = redLineLineStringGeomObj;
	redLineLineStringRootObj.properties = redlineLineStringPropertyObj;
 
	return redLineLineStringRootObj;
}

/**
 * PTRGetLabel - This function get the label created in API
 * @param intersectionFeaturesArr - Array of intersected features
 */
async function PTRGetLabel(intersectionFeaturesArr){
	const url = `${baseURL}/GetTrenchLabelPortalCustomService/api/GetLabel`;
	const responseData = await fetch(url,{
		method : 'POST',
		headers :{
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(intersectionFeaturesArr)
	});
	
	
	if (!responseData.ok){
		const apiError = await responseData.json();
		console.log(apiError.Message);
		//$NWP.map.getOlMapObject().removeLayer(ptrvectorLayer);
		//$NWP.map.getOlMapObject().removeLayer(PTRVectorLayerScaleIndependent);
		ptrClickCount = 0;
		ptrCoordinates = [];
		PTRAddInteraction();
		$NWP.msg.showError("Error in PTRGetLabel API");
		PTRStrLabel = null;
		//throw new Error ("Error in PTRGetLabel API");
	}
	else{
		const label = await responseData.json();
		return label;
	}
}

/** PTRGetVisibleLayers - This function gets array of layers which are switched on in legend */
function PTRGetVisibleLayers(){
	const legendState = $NWP.map.getLegendState();
	const legndeLayers = legendState.layers;
	//get vector layer
	let vectorLayer = null;
	for (let layer of legndeLayers){
		if (layer.name = "vector1"){
			vectorLayer = layer;
			break;
		}
	}
	
	if (!vectorLayer){
		throw new Error("No Vector layer found");
	}
	
	//array of lenos which need to check for on or off status
	const targerLayerLENOs = ['351001','401001','721001','221001','351401','401401','721201','221401'];
	const visibleLayers = PTRGetLayerState(vectorLayer.layers,targerLayerLENOs);
	return visibleLayers;
	
}

/**
 * PTRGetLayerState - This function check if state of provided lenos i.e if layer is on or off 
 * @param layers - All layers in legend
 * @param targerLayerLENOs - Array of lenos which need to check for on or off status
 */
function PTRGetLayerState(layers,targerLayerLENOs){
	const visibleLayers =[];
	function GetState(layers){
		for(let layer of layers){
			if (layer.type == 'layer' && layer.expanded == false && layer.name && targerLayerLENOs.includes(layer.name) && layer.visible == true){
				visibleLayers.push(layer.name)
			}
			
			if (layer.type == 'folder'){
				GetState(layer.layers)
			}
		}
	}
	//Recursive function
	GetState(layers);
	return visibleLayers;
}


/**
 * Point - This function create point using given coordinate
 * @param valA - X coordinate value
 * @param valB - Y coordinate value
 */
var Point = function(valA, valB) {
  this.x = valA;
  this.y = valB;
};

/**
 * PTRFindIntersection - This function gets intersection point for given set of points
 * @param p1 - Start point of line 1
 * @param p2 - End point of line 1
 * @param p3 - Start point of line 2
 * @param p4 - End point of line 2
 */
function PTRFindIntersection(p1, p2, p3, p4)
{
    
    // calculate differences  
    let xD1 = p2.x - p1.x;
    let xD2 = p4.x - p3.x;
    let yD1 = p2.y - p1.y;
    let yD2 = p4.y - p3.y;
    let xD3 = p1.x - p3.x;
    let yD3 = p1.y - p3.y;

    // calculate the lengths of the two lines  
    let len1 = Math.sqrt(xD1 * xD1 + yD1 * yD1);
    let len2 = Math.sqrt(xD2 * xD2 + yD2 * yD2);

    // calculate angle between the two lines.  
    let dot = (xD1 * xD2 + yD1 * yD2); // dot product  
    let deg = dot / (len1 * len2);

    // if abs(angle)==1 then the lines are parallell,  
    // so no intersection is possible  
    if (Math.abs(deg) == 1) return null;

    // find intersection Pt between two lines  
    let div = yD2 * xD1 - xD2 * yD1;
    let ua = (xD2 * yD3 - yD2 * xD3) / div;
    let ub = (xD1 * yD3 - yD1 * xD3) / div;
    let xCoor = p1.x + ua * xD1;
	let yCoor = p1.y + ua * yD1;
	let pt = new Point(xCoor,yCoor);

    // calculate the combined length of the two segments  
    // between Pt-p1 and Pt-p2  
    xD1 = pt.x - p1.x;
    xD2 = pt.x - p2.x;
    yD1 = pt.y - p1.y;
    yD2 = pt.y - p2.y;
    let segmentLen1 = Math.sqrt(xD1 * xD1 + yD1 * yD1) + Math.sqrt(xD2 * xD2 + yD2 * yD2);

    // calculate the combined length of the two segments  
    // between Pt-p3 and Pt-p4  
    xD1 = pt.x - p3.x;
    xD2 = pt.x - p4.x;
    yD1 = pt.y - p3.y;
    yD2 = pt.y - p4.y;
    let segmentLen2 = Math.sqrt(xD1 * xD1 + yD1 * yD1) + Math.sqrt(xD2 * xD2 + yD2 * yD2);

    // if the lengths of both sets of segments are the same as  
    // the lenghts of the two lines the point is actually  
    // on the line segment.  

    // if the point isn’t on the line, return null  
    if (Math.abs(len1 - segmentLen1) > 0.01 || Math.abs(len2 - segmentLen2) > 0.01)
        return null;

    // return the valid intersection  
    return pt;

}


/**
 * PTRDoLinesIntersect - This function checks if given lines intersects or not
 * @param a - Start point of line 1
 * @param b - End point of line 1
 * @param c - Start point of line 2
 * @param d - End point of line 2
 */
function PTRDoLinesIntersect(a, b, c, d) {
    function ccw(p1, p2, p3) {
        return (p3[1] - p1[1]) * (p2[0] - p1[0]) > (p2[1] - p1[1]) * (p3[0] - p1[0]);
    }
    return ccw(a, c, d) !== ccw(b, c, d) && ccw(a, b, c) !== ccw(a, b, d);
}

/**
 * PTRDistanceOfTwoPoints - This function gets distance between two points
 * @param p1 - Point1
 * @param p2 - Point2
 */
function PTRDistanceOfTwoPoints(p1, p2)
{
    return Math.sqrt(((p2.x - p1.x) * (p2.x - p1.x)) + ((p2.y - p1.y) * (p2.y - p1.y)) /*+ TODO: Z for 3D*/);
}

/**
 * PTRGetMarginLineLength - This function gets height of label text
 * @param label - Label text
 */
function PTRGetMarginLineLength(label,originalResolution = undefined){
	//debugger;
	let resolution = $NWP.map.getOlMapObject().getView().getResolution();
    let scale = originalResolution != undefined ? originalResolution/resolution : 1;
	let lineCount = label.split('\n').length;
	//let marginLineHeight = lineCount * (1/resolution) * 5; //Since product of lineCount * resolution in decimals hence multiply by 10
	let marginLineHeight = lineCount * scale * resolution * PTRfont_size; //Since product of lineCount * resolution in decimals hence multiply by 10
	return marginLineHeight;
}


/**
 * PTRChangeMarginLine - Function to change length of margin line on zoom out and zoom in
 */
function PTRChangeMarginLine(){
	debugger;
	let slredlinesWithinMapExtent;
	let mapextent = $NWP.map.getViewState().extent;
	
	let mapLayers = $NWP.map.getMapLayers();
	let indexredlineLayer = mapLayers.findIndex(mapLayer => mapLayer.userName === "Redline" && mapLayer.type === "localvector");
	if (indexredlineLayer !== -1) {
		slredlinesWithinMapExtent =  mapLayers[indexredlineLayer].layer.getSource()
            .getFeatures();
	}
	
	if (ptrfinalvectorLayer != undefined){
		let slFeaturesInExtent = ptrfinalvectorLayer.getSource().getFeaturesInExtent(mapextent);
		slFeaturesInExtent.forEach(function(feature){
			if (feature != undefined){
				let sllabel = feature.values_.label;
				let originalResolution = feature.get('originalResolution');
				let slmarginlineheight =  PTRGetMarginLineLength(sllabel,originalResolution);
				let slpointgeom = feature.getGeometry().getGeometries()[0];
				let sllinegeom = feature.getGeometry().getGeometries()[1];
				if (sllinegeom != undefined && slpointgeom != undefined){
					let sllinecoords = sllinegeom.getCoordinates();
					sllinecoords[3][1] =  sllinecoords[2][1] + slmarginlineheight;
					
					for (let featureRD of slredlinesWithinMapExtent){
						let rdGeomArray = featureRD.getGeometry().getCoordinates();
						if (deepEqual(sllinegeom.getCoordinates(),rdGeomArray)){
							console.log("Array Matched");
							featureRD.getGeometry().setCoordinates(sllinecoords);
						}

					}
					
					
					sllinegeom.setCoordinates(sllinecoords);
					
					let slnewgeometries = [slpointgeom,sllinegeom];
					feature.getGeometry().setGeometries(slnewgeometries);
				};
			};
			
		});
	};
	
}

/**
 * TRZoomEnd - Function to refresh vectore layer on zoom end
 */
function TRZoomEnd(){
	ptrfinalvectorLayer.changed();
}

function arraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  return arr1.every((value, index) => value === arr2[index]);
}



function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function deepEqual(a, b) {
  // Same reference or same primitive
  if (a === b) return true;

  // Handle NaN (NaN !== NaN in JS)
  if (Number.isNaN(a) && Number.isNaN(b)) return true;

  // Types must match for non-strict edge cases
  if (typeof a !== typeof b) return false;

  // Arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  // Plain objects
  if (isPlainObject(a) && isPlainObject(b)) {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (const key of aKeys) {
      if (!Object.hasOwn(b, key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }
    return true;
  }

  // Dates
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // Fallback: not equal for other types (functions, Sets, Maps, etc.)
  return false;
}




/*
function GetMapScale(){
	const dpi = 25.4 / 0.28;
	const unit = $NWP.map.getOlMapObject().getView().getProjection().getUnits();
	const resolution = $NWP.map.getOlMapObject().getView().getResolution();
	const inchesPerMetre = 39.37;
	return Math.round(resolution * ol.proj.Units.METERS_PER_UNIT[unit] * inchesPerMetre * dpi)
}
*/

/*
function LineIntersection(pointA, pointB, pointC, pointD) {
  var z1 = (pointA.x - pointB.x);
  var z2 = (pointC.x - pointD.x);
  var z3 = (pointA.y - pointB.y);
  var z4 = (pointC.y - pointD.y);
  var dist = z1 * z4 - z3 * z2;
  if (dist == 0) {
    return null;
  }
  var tempA = (pointA.x * pointB.y - pointA.y * pointB.x);
  var tempB = (pointC.x * pointD.y - pointC.y * pointD.x);
  var xCoor = (tempA * z2 - z1 * tempB) / dist;
  var yCoor = (tempA * z4 - z3 * tempB) / dist;

  if (xCoor < Math.min(pointA.x, pointB.x) || xCoor > Math.max(pointA.x, pointB.x) ||
    xCoor < Math.min(pointC.x, pointD.x) || xCoor > Math.max(pointC.x, pointD.x)) {
    return null;
  }
  if (yCoor < Math.min(pointA.y, pointB.y) || yCoor > Math.max(pointA.y, pointB.y) ||
    yCoor < Math.min(pointC.y, pointD.y) || yCoor > Math.max(pointC.y, pointD.y)) {
    return null;
  }

  return new Point(xCoor, yCoor);
}
*/

/*
function addLineGeometryLayer(userName, sourceName,linecoords,textcoord,text) { 
	
	let viewProj = parent.$NWP.map.getViewState().projection;
	
	$NWP.map.addSourceEntry({
	type: "source",
	name: userName ,
	userName: userName,
	drawingPriority: 999,
	visible: true,
	queryable: true,
	source: { 
		type: "localvector",
		name: sourceName,
		projection: viewProj }
	}).then(legendEntry => {
		slLineTextFeature = new ol.Feature({
			geometry: new ol.geom.GeometryCollection([
				new ol.geom.Point(textcoord),
				new ol.geom.LineString(linecoords)
			]),
			label: text,
			name:'StackLabel',
		});
		slLineTextFeature.set('selected', false);
		slLineTextFeature.setStyle(PTRStyleFunction);
		legendEntry.layer.getSource().addFeature(slLineTextFeature);
	}).catch(error => {
		console.error("Error adding layer:", error);
	});
}*/