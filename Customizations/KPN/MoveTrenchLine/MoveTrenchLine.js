//Original Code
let mtrLabel = null;
let mtrFeature = null;
let mtrIsMouseMoveCaptured = false;
let redlinesWithinMapExtentMTR;
let mapLayersMTR;
let indexMTR;

/**
 * MTRHandleMouseClick - This function get invoked when user clicks on map for move trench line custom command
 * @param event - event object
 */
function MTRHandleMouseClick(event){
	mtrClickCount++;
	if (mtrClickCount === 1){
		debugger; 
		ptrvectorSource = new ol.source.Vector();
		ptrlvectorLayer = new ol.layer.Vector({source:ptrvectorSource});
		ptrlvectorLayer.setZIndex(999);
		$NWP.map.getOlMapObject().addLayer(ptrlvectorLayer);

		mapLayersMTR = $NWP.map.getMapLayers();
		indexMTR = mapLayersMTR.findIndex(mapLayer => mapLayer.userName === "Redline" && mapLayer.type === "localvector");


		if (indexMTR !== -1) {
			redlinesWithinMapExtentMTR =  mapLayersMTR[indexMTR].layer.getSource()
               		.getFeatures();
		}

		$NWP.map.getOlMapObject().forEachFeatureAtPixel(event.pixel, function (feature) {
			if (typeof feature.get('features') === 'undefined') {
				console.log('Feature:', feature.get('name'));
				if (feature.get('name') === 'StackLabel'){
					mtrFeature = feature;
					return mtrFeature;
				}
			}
		});
		if (mtrFeature){
			mtrCoordinates = [];					

			//Get feature geometries
			let geometries = mtrFeature.getGeometry().getGeometries();
			let point = geometries[0];
			let line = geometries[1]; 
			
			
			mtrCoordinates.push([line.flatCoordinates[0],line.flatCoordinates[1]]);
			mtrCoordinates.push([line.flatCoordinates[2],line.flatCoordinates[3]]);	
			mtrCoordinates.push([line.flatCoordinates[4],line.flatCoordinates[5]]);
			mtrCoordinates.push([line.flatCoordinates[6],line.flatCoordinates[7]]);
						
			mtrLabel = mtrFeature.values_.label;
			
			TRLineFeature = PTRCreateLineFeature(mtrCoordinates);
			TRTextFeature = PTRCreateTextFeature(mtrCoordinates[2],mtrLabel);
		}
		else{
			mtrClickCount = 0;
			mtrCoordinates = [];
			mtrFeature = null;
			mtrIsMouseMoveCaptured = false;
		}
		
	} else if (mtrClickCount === 2 && mtrFeature && mtrIsMouseMoveCaptured === true){
		debugger;

		let resolution = $NWP.map.getOlMapObject().getView().getResolution();
		
		let geometries = mtrFeature.getGeometry().getGeometries();
		let pointArray = geometries[0].getCoordinates();
		let lineArray = geometries[1].getCoordinates(); 

		DrawLineAndText(mtrCoordinates,event.coordinate, mtrLabel);
		
		//Create redline text object using label fetched using API
		const redlineTextObj = PTRCreateRedlineTextObj(mtrLabel,resolution);
		redlineTextObj.geometry.coordinates = event.coordinate;
			
		//Create redline line object using coordinates of vector line
		const redlineLineStringObj = PTRCreateRedlineLineStringObj(resolution);
		redlineLineStringObj.geometry.coordinates = mtrCoordinates;

		ptrvectorSource.removeFeature(TRTextFeature);
		ptrvectorSource.removeFeature(TRLineFeature);

		for (let featureRD of redlinesWithinMapExtentMTR){
			let rdGeomArray = featureRD.getGeometry().getCoordinates();
			if (deepEqual(pointArray,rdGeomArray)){
				mapLayersMTR[indexMTR].layer.getSource().removeFeature(featureRD);
			}
			if (deepEqual(lineArray,rdGeomArray)){
				mapLayersMTR[indexMTR].layer.getSource().removeFeature(featureRD); 
			}
		}
		

		//Load redlineTextObj and redlineLineStringObj
		$NWP.redlines.load(redlineLineStringObj);
		$NWP.redlines.load(redlineTextObj);

		$NWP.map.getOlMapObject().removeLayer(ptrlvectorLayer);

		mtrClickCount = 0;
		mtrCoordinates = [];
		mtrFeature = null;
		mtrIsMouseMoveCaptured = false;
	} else {
		mtrClickCount = 0;
		mtrCoordinates = [];
		mtrFeature = null;
		mtrIsMouseMoveCaptured = false;
	}
}

/**
 * MTRHandleMouseHover - This function invokes when user moves mouse on map for move trenchline custom command
 * @param event - event object
 */
const MTRHandleMouseHover = (event) => {
	if (mtrClickCount === 0) {
		const feature = $NWP.map.getOlMapObject().forEachFeatureAtPixel(event.pixel, function (feature) {
			if (typeof feature.get('features') === 'undefined') {
				console.log('Feature:', feature.get('name'));
				if (feature.get('name') === 'StackLabel'){
					return feature;
				}
			}
		});

		if (feature !== highlight) {
			if (highlight) {
			  trfeatureHighlightLayer.getSource().removeFeature(highlight);
			}
			if (feature) {
			  trfeatureHighlightLayer.getSource().addFeature(feature);
			}
			highlight = feature;
		}
	} else if (mtrClickCount === 1 && mtrFeature) {
		// Clear previous hover text
		//ptrvectorSource.clear();
		mtrIsMouseMoveCaptured = true;
	 
		ptrfinalvectorLayer.getSource().removeFeature(mtrFeature);
			
		let merginLineHeight;
		//Get length of margin line
		if (mtrLabel != null){
			merginLineHeight = PTRGetMarginLineLength(mtrLabel);
		}
		
		//On each mouse over, remove last 2 coordinates i.e coordinates of mergine line
		if (mtrCoordinates.length > 2){
			mtrCoordinates.splice(-2);
		}
		//Push mouse over coordinate into coordinate array
		mtrCoordinates.push(event.coordinate);
		//Push last coordinate of margin line into coordinate array
		mtrCoordinates.push([event.coordinate[0],event.coordinate[1] + merginLineHeight]);


		
		// Redraw the line (since we cleared everything)
		TRReDrawLine(mtrCoordinates);
	 
		// Show floating text at hover position
		TRReDrawText(event.coordinate, mtrLabel);
	}
};


function MTRHandleMouseDblClick(event){
	 // Prevent the default double-click behavior
    event.preventDefault();

    // Optionally, stop event propagation to prevent it from bubbling up to parent elements
    event.stopPropagation(); 
	
	$NWP.map.getOlMapObject().removeLayer(ptrlvectorLayer);
}
