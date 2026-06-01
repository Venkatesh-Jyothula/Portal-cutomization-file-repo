function overrideFeatureSelection() {
	$NWP.features.setEditorDisabled(true);
	$NWP.features.getSelected().then(function(feature) {
	console.log(feature);
	var win = $NWP.createWindow({title: 'Foo', height: 500, width: 500, url: 'examples/empty.html'});
	win.show();
	var f = win.getFrame();
	f.contentDocument.write(feature.userName);
	// Remember to enable feature selection behaviour when done.
	$NWP.features.setEditorDisabled(false);
 });
}


