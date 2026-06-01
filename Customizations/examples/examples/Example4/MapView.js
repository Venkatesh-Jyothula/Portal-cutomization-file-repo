function setCenter() {
	var geographicCenter = [11.348319575656586, 55.39913084254158];
	var center = ol.proj.fromLonLat(geographicCenter, $NWP.map.getViewState().projection);
	$NWP.map.center(center);
}

function setExtent() {
	var geographicExtent = [11.3464090819607, 55.39858358068569, 11.350086605340945, 55.39938358332305];
	var extent = ol.proj.transformExtent(geographicExtent, 'EPSG:4326', $NWP.map.getViewState().projection);
	$NWP.map.fit(extent);
}

function setLastLegendEntryVisible(visible) {
	var layers = $NWP.map.getLegendState().layers;
	var item = layers[layers.length - 1];
	$NWP.map.setLegendState(
		{
			id: item.id,
			visible: visible
		});
}