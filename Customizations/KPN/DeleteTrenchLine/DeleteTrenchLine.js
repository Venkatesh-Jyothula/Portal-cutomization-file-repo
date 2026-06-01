let highlight;

/**
 * DTRHandleMouseHover - This function invokes when user moves mouse on map for delete trenchline custom command
 * @param event - event object
 */
function DTRHandleMouseHover (event){
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
}

/**
 * TRHighlightedStyleFunction - This function set style to highlighted composite geometry feature
 * @param feature - compoiste line and text feature
 * @param resolution - resolution of map
 */
function TRHighlightedStyleFunction(feature,resolution){
	//let font_size = 8;

	let originalResolution = feature.get('originalResolution') || resolution;
	let scale = originalResolution / resolution;

	let geometries = feature.getGeometry().getGeometries();
	let point = geometries[0];
        let line = geometries[1];
	
	let lineStyle = new ol.style.Style({
		geometry: line,
		stroke: new ol.style.Stroke({ color: 'red', width: 0.8}),
	});
	
	
	let textStyle = new ol.style.Style({
		geometry: point,	
		text: new ol.style.Text({
			text: (feature.get('label')).toString(),
			font: PTRfont_size + 'px Lucida Console',
			textAlign:'left',
			textBaseline: 'bottom',
			fill: new ol.style.Fill({ color: 'red' }),
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
 * DTRHandleMouseClick - This function get invoked when user clicks on map for delete trench line custom command
 * @param event - event object
 */
function DTRHandleMouseClick (event){
	debugger;

	const mapLayersDTR = $NWP.map.getMapLayers();
	const indexDTR = mapLayersDTR.findIndex(mapLayer => mapLayer.userName === "Redline" && mapLayer.type === "localvector");
        let featuresWithinMapExtentDTR;

	if (indexDTR !== -1) {
		featuresWithinMapExtentDTR =  mapLayersDTR[indexDTR].layer.getSource()
                .getFeatures();
	}	

	$NWP.map.getOlMapObject().forEachFeatureAtPixel(event.pixel, function (feature) {
		if (typeof feature.get('features') === 'undefined') {
			console.log('Feature:', feature.get('name'));
			if (feature.get('name') === 'StackLabel'){
				let geometries = feature.getGeometry().getGeometries();
				let pointArray = geometries[0].getCoordinates();
				let lineArray = geometries[1].getCoordinates(); 

				for (let featureRD of featuresWithinMapExtentDTR){
				      let rdGeomArray = featureRD.getGeometry().getCoordinates();
				      if (deepEqual(pointArray,rdGeomArray)){
				          mapLayersDTR[indexDTR].layer.getSource().removeFeature(featureRD);
				      }
				      if (deepEqual(lineArray,rdGeomArray)){
				       	  mapLayersDTR[indexDTR].layer.getSource().removeFeature(featureRD);  
				      }
				}
                                
				ptrfinalvectorLayer.getSource().removeFeature(feature);
				
			}
		}
	});
	/*
	$NWP.map.getOlMapObject().removeInteraction(ptrDraw);
	$NWP.map.getOlMapObject().removeEventListener('pointermove', DTRHandleMouseHover);
	$NWP.map.getOlMapObject().removeEventListener('click', DTRHandleMouseClick);
	$NWP.map.resetMode();
	$NWP.features.setEditorDisabled(false);
	$NWP.map.getOlMapObject().removeLayer(trfeatureHighlightLayer);
	*/
}

