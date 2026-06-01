
var newWindow = null;
const config = window.customConfig;
let ptrClickCount = 0;
let ptrCoordinates = null;
let ptrvectorSource = null;
let ptrvectorLayer = null;
let ptrFiberInnerDuctRequired = null;
let fsevectorSource = null;
let fsevectorLayer = null;
let ptrDraw = null;
let ptrfinalvectorSource = null;
let ptrfinalvectorLayer = null;
//let featureHighlight = null;
let mtrClickCount = 0;
let mtrCoordinates = null;
let trfeatureHighlightLayer = null;


async function actionbuttonpress(args) {
  console.log("actionbuttonpress");

  if (args.name === "ReserveMerkband") {
    const formPathName = '/PortalCustomizations/Merkband/Merkband.html';
    const formTitle = 'Reserve Merkband Names';
    const width = 330;
    const height = 400;

    openForm(formPathName, formTitle, width, height);
  }
  if (args.name === "HighlightContainer") {
	  console.log(args);
      //console.log($NWP.toolbar.getPressed('HighlightContainer'));	  
	  if($NWP.toolbar.getPressed('HighlightContainer')) {
		
		//alert('register');		
	    parent.$NWP.on('gtechfeatureload', featureSelectedInFE, null);
	  }
	  else { 
	   
	  // alert('unregister');
	   parent.$NWP.un('gtechfeatureload', featureSelectedInFE, null);
	  }
	  
  }
  if(args.name === "ZoomToScale") { 
   console.log(args);
  
  const formPathName = '/PortalCustomizations/ZoomToScale/ZoomToScale.html';
    const formTitle = 'Zoom to scale';
    const width = 360;
    const height = 190;

    openForm(formPathName, formTitle, width, height);
  
  
  }
  
  if (args.name === "PlaceTrenchRedline"){
		if($NWP.toolbar.getPressed('PlaceTrenchRedline')) {
			console.log('PlaceTrenchLine Activted');
			
			$NWP.toolbar.setPressed('DeleteTrenchRedline');
			$NWP.toolbar.setPressed('MoveTrenchRedline');
			
			//Disable editor on click event
			$NWP.features.setEditorDisabled(true);
			$NWP.map.setModeToDefault();
			
			//Initialize click count and coordinates array 
			ptrClickCount = 0;
			ptrCoordinates = [];

			//Remove eventlistner, interaction and highlightlayer for delete trenchline
			$NWP.map.getOlMapObject().removeEventListener('pointermove', DTRHandleMouseHover);
			$NWP.map.getOlMapObject().removeEventListener('click', DTRHandleMouseClick);
			$NWP.map.getOlMapObject().removeInteraction(ptrDraw);
			$NWP.map.getOlMapObject().removeLayer(trfeatureHighlightLayer);			

			//Remove eventlistner, interaction and highlightlayer for move trenchline
			$NWP.map.getOlMapObject().removeEventListener('pointermove', MTRHandleMouseHover);
			$NWP.map.getOlMapObject().removeEventListener('click', MTRHandleMouseClick);
			$NWP.map.getOlMapObject().removeEventListener('dblclick',MTRHandleMouseDblClick);

			//Register mouse click and mouse over events
			$NWP.map.getOlMapObject().addEventListener('click',PTRHandleMouseClick);
			$NWP.map.getOlMapObject().addEventListener('pointermove', PTRHandleMouseHover);
			$NWP.map.getOlMapObject().addEventListener('moveend', TRZoomEnd);
			$NWP.map.getOlMapObject().getView().on('change:resolution', PTRChangeMarginLine);
			
			//Vector source and vector layer for line and text geometry
			ptrvectorSource = new ol.source.Vector();
			ptrvectorLayer = new ol.layer.Vector({source:ptrvectorSource});
			ptrvectorLayer.setZIndex(999);
			$NWP.map.getOlMapObject().addLayer(ptrvectorLayer);
			
			if (ptrfinalvectorSource === null){
				ptrfinalvectorSource = new ol.source.Vector();
			}
			if (ptrfinalvectorLayer === null){
				ptrfinalvectorLayer = new ol.layer.Vector({source:ptrfinalvectorSource,style:PTRStyleFunction});
				ptrfinalvectorLayer.setZIndex(999);
				$NWP.map.getOlMapObject().addLayer(ptrfinalvectorLayer);
			}
			
			
			//Display message to user for fiber inner ducts
			$NWP.msg.showYesNo("Do you want to display fiber inner duct in stack label","Trench Redline").then(function (result){ ptrFiberInnerDuctRequired= result});
			
			PTRAddInteraction();
		}
		else{
			console.log('PlaceTrenchLine DeActivted');
			//Remove vector layers
			$NWP.map.getOlMapObject().removeInteraction(ptrDraw);
			$NWP.map.getOlMapObject().removeEventListener('click', PTRHandleMouseClick);
			$NWP.map.getOlMapObject().removeEventListener('pointermove', PTRHandleMouseHover);
			$NWP.map.getOlMapObject().removeLayer(ptrvectorLayer);
			$NWP.map.getOlMapObject().removeLayer(PTRVectorLayerScaleIndependent);
			$NWP.map.resetMode();
			$NWP.features.setEditorDisabled(false);
		}
		/*
		//Disable editor on click event
		$NWP.features.setEditorDisabled(true);
		$NWP.map.setModeToDefault();
		
		//Initialize click count and coordinates array 
		ptrClickCount = 0;
		ptrCoordinates = [];
		
		//Register mouse clicl and mouse over events
		$NWP.map.getOlMapObject().addEventListener('click',PTRHandleMouseClick);
		$NWP.map.getOlMapObject().addEventListener('pointermove', PTRHandleMouseHover);
		
		//Vector source and vector layer for line and text geometry
		ptrvectorSource = new ol.source.Vector();
		ptrvectorLayer = new ol.layer.Vector({source:ptrvectorSource});
		ptrvectorLayer.setZIndex(999);
		$NWP.map.getOlMapObject().addLayer(ptrvectorLayer);
		
		//Display message to user for fiber inner ducts
		$NWP.msg.showYesNo("Do you want to display fiber inner duct in stack label","Trench Redline").then(function (result){ ptrFiberInnerDuctRequired= result});
		
		PTRAddInteraction();
		*/
	}
	
	if (args.name === "DeleteTrenchRedline"){
		if($NWP.toolbar.getPressed('DeleteTrenchRedline')) {
			let deleteAllTrenchLines;
			console.log('DeleteTrenchRedline Activted');
			
			//Deactivate Trenchline custom command and remove associated events, interacted and layers
			$NWP.toolbar.setPressed('PlaceTrenchRedline');
			$NWP.toolbar.setPressed('MoveTrenchRedline');
			$NWP.map.getOlMapObject().removeInteraction(ptrDraw);
			$NWP.map.getOlMapObject().removeEventListener('click', PTRHandleMouseClick);
			$NWP.map.getOlMapObject().removeEventListener('pointermove', PTRHandleMouseHover);
			$NWP.map.getOlMapObject().removeLayer(ptrvectorLayer);
			$NWP.map.getOlMapObject().removeLayer(PTRVectorLayerScaleIndependent);

			//Remove eventlistner for move trenchline
			$NWP.map.getOlMapObject().removeEventListener('pointermove', MTRHandleMouseHover);
			$NWP.map.getOlMapObject().removeEventListener('click', MTRHandleMouseClick);
			$NWP.map.getOlMapObject().removeEventListener('dblclick',MTRHandleMouseDblClick);

			//Display message to user for fiber inner ducts
			$NWP.msg.showYesNo("Do you want to delete all stack labels","Delete Trench Redline").then(function (result){
				if (result === true){
					if (ptrfinalvectorLayer != null){
						const stackLabelFeatures = ptrfinalvectorLayer.getSource().getFeatures();
						stackLabelFeatures.forEach(feature => {
							if (feature.get('name') === 'StackLabel'){
								ptrfinalvectorLayer.getSource().removeFeature(feature);
							}
						});
					}
										
					let slRdfeaturesWithinMapExtent;					
					const indexRedLineLayer = $NWP.map.getMapLayers().findIndex(mapLayer => mapLayer.userName === "Redline" && mapLayer.type === "localvector");
					
					if (indexRedLineLayer !== -1) {
						slRdfeaturesWithinMapExtent =  $NWP.map.getMapLayers()[indexRedLineLayer].layer.getSource().getFeatures();
					}	
					
					for (let featureRD of slRdfeaturesWithinMapExtent){
						debugger;
						if (featureRD.getProperties().__style.name === 'StackLabel Redline Linestring' || featureRD.getProperties().__style.name === 'StackLabel Redline Text'){
							$NWP.map.getMapLayers()[indexRedLineLayer].layer.getSource().removeFeature(featureRD);  
						}
					}
					
					$NWP.toolbar.setPressed('DeleteTrenchRedline',false);
				}
				else{
					//Disable editor on click event
					$NWP.features.setEditorDisabled(true);
					$NWP.map.setModeToDefault();

					//Register mouse click and mouse over events
					$NWP.map.getOlMapObject().addEventListener('click',DTRHandleMouseClick);
					$NWP.map.getOlMapObject().addEventListener('pointermove', DTRHandleMouseHover);
					
					trfeatureHighlightLayer = new ol.layer.Vector({
					  source: new ol.source.Vector(),
					  map: $NWP.map.getOlMapObject(),
					  style: TRHighlightedStyleFunction
					});
				}
			});
			


			
			
			
		}
		else{
			console.log('DeleteTrenchRedline DeActivted');
			//Remove vector layers
			$NWP.map.getOlMapObject().removeInteraction(ptrDraw);
			$NWP.map.getOlMapObject().removeEventListener('click', DTRHandleMouseClick);
			$NWP.map.getOlMapObject().removeEventListener('pointermove', DTRHandleMouseHover);
			$NWP.map.getOlMapObject().removeLayer(trfeatureHighlightLayer);
			$NWP.map.resetMode();
			$NWP.features.setEditorDisabled(false);
		}
	}
	
	if (args.name === "MoveTrenchRedline"){
		if($NWP.toolbar.getPressed('MoveTrenchRedline')) {
			console.log('MoveTrenchRedline Activted');
			
			//Deactivate Trenchline custom command and remove associated events, interacted and layers
			$NWP.toolbar.setPressed('PlaceTrenchRedline');
			$NWP.toolbar.setPressed('DeleteTrenchRedline');
			$NWP.map.getOlMapObject().removeInteraction(ptrDraw);
			$NWP.map.getOlMapObject().removeEventListener('click', PTRHandleMouseClick);
			$NWP.map.getOlMapObject().removeEventListener('pointermove', PTRHandleMouseHover);
			$NWP.map.getOlMapObject().removeLayer(ptrvectorLayer);
			$NWP.map.getOlMapObject().removeLayer(PTRVectorLayerScaleIndependent);

			//Remove eventlistner, interaction and highlightlayer for delete trenchline
			$NWP.map.getOlMapObject().removeEventListener('pointermove', DTRHandleMouseHover);
			$NWP.map.getOlMapObject().removeEventListener('click', DTRHandleMouseClick);
			$NWP.map.getOlMapObject().removeInteraction(ptrDraw);
		
			//Disable editor on click event
			$NWP.features.setEditorDisabled(true);
			$NWP.map.setModeToDefault();
			
			//Initialize click count and coordinates array 
			mtrClickCount = 0;
			mtrCoordinates = [];	
			
			//Register mouse click and mouse over events
			$NWP.map.getOlMapObject().addEventListener('click',MTRHandleMouseClick);
			$NWP.map.getOlMapObject().addEventListener('pointermove', MTRHandleMouseHover);
			$NWP.map.getOlMapObject().addEventListener('dblclick',MTRHandleMouseDblClick);
			
			/*
			ptrvectorSource = new ol.source.Vector();
			ptrvectorLayer = new ol.layer.Vector({source:ptrvectorSource});
			ptrvectorLayer.setZIndex(999);
			$NWP.map.getOlMapObject().addLayer(ptrvectorLayer);
			*/
			
			trfeatureHighlightLayer = new ol.layer.Vector({
			  source: new ol.source.Vector(),
			  map: $NWP.map.getOlMapObject(),
			  style: TRHighlightedStyleFunction
			});
		}
		else{
			console.log('MoveTrenchRedline DeActivted');
			//Remove vector layers
			$NWP.map.getOlMapObject().removeInteraction(ptrDraw);
			$NWP.map.getOlMapObject().removeEventListener('click', MTRHandleMouseClick);
			$NWP.map.getOlMapObject().removeEventListener('pointermove', MTRHandleMouseHover);
			$NWP.map.getOlMapObject().removeEventListener('dblclick',MTRHandleMouseDblClick);
			$NWP.map.getOlMapObject().removeLayer(trfeatureHighlightLayer);
			$NWP.map.getOlMapObject().removeLayer(ptrvectorLayer);
			$NWP.map.resetMode();
			$NWP.features.setEditorDisabled(false);
		}
	}
        
	if(args.name === "MergePlotPDF") { 
    const formPathName = '/PortalCustomizations/MergePDF/MergePlotPDF.html';
     const formTitle = 'Merge Plot PDF';
    const width = 330;
    const height = 300; 

    openForm(formPathName, formTitle, width, height);
  
  
  }

	if (args.name === "BrowseFTTHPOPs"){
    	console.log(args);
  
		const formPathName = '/PortalCustomizations/BrowseFTTHPOPs/BrowseFTTHPOPs.html';
		const formTitle = 'Browse FTTH POPs';
		const width = 432;
		const height = 442;

		openForm(formPathName, formTitle, width, height);
		
	}
	
	if (args.name === "AttachFloorPlan"){
                console.log(args);
		AttachFloorPlan();
	}
}

function openForm(formPathName, formTitle, vwidth, vheight) {
  if (newWindow) {
    newWindow.destroy();
  }

  newWindow = $NWP.createWindow({
    title: formTitle,
    height: vheight,
    width: vwidth,
    url: formPathName
  });

  newWindow.show();
  window.currentNewWindow = newWindow;
} 
/*
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
    const finalUrl = `${url.protocol}//${url.host}/${portalName}/proxy/networks/${serviceName}`;

    console.log('Modified Service URL:', finalUrl);
    return finalUrl;

  } catch (error) {
    console.error('Error modifying service URL:', error);
    throw error;
  }
}

async function findServiceUrl(urlSolutiondata, serviceType) {
	for (const service of urlSolutiondata) {
		console.log(service.Type);
		console.log(service);
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
} */

//the following stores the last selected feature in the feature explorer as a cookie	
async function featureSelectedInFE(args) { 
 
        try 
		{
			handleHighlightContainer(args); ;
		} catch (error) {
			console.error("Error while highlighting the feature:", error);
			
			
		} finally {
			$NWP.setLoading(false);
		} 
		
	/*
    console.log(args);
    const fid = args.G3E_FID;
    const fno = args.G3E_FNO;
    const legendState = $NWP.map.getLegendState().legendType;
    const rno = '3,6';
	//const featureDataService = 'https://swdclr0586.kpnnl.local/KPNNwFeatureDataService';

    try {
		
		let featureDataServiceURL= await getServiceUrl('FeatureDataService');
	    if (!featureDataServiceURL) {
		    throw new Error("featureDataServiceURL not configured.");
	    }
        let highlightfeatures = [];
        const result = await $NWP.features.fetchGTechFeatures({ G3E_FNO: fno, G3E_FID: fid });

        if (result.success && result.data && result.data.length > 0) {
            const feature = result.data[0];
            //console.log(feature);
            //console.log(feature.properties.IsDetail);
            //console.log(feature.geometry);

            if (legendState === 'geographic' && feature.properties.IsGeographic) {
               // console.log('Geographic');
                return;
            } else if (legendState === 'detail' && feature.properties.IsDetail) {
               // console.log('Detail');
                return;
            } else {
                await GetGraphicParent(fno, fid, legendState, featureDataServiceURL, rno, highlightfeatures);
            }
        }
        console.log(highlightfeatures);
		
	    let featureObjects = highlightfeatures.map(feature => ({
			G3E_FNO: feature.fno,
			G3E_FID: feature.fid
		}));

		parent.$NWP.features.fetchGTechFeatures(featureObjects).then(function(result) {
			if (result.success) {
				parent.$NWP.features.highlight(result.data, true, true);
			}
		});
    } catch (error) {
        console.error('Error fetching feature:', error);
    }*/
}
/*
async function GetGraphicParent(fno, fid, legendState, featureDataService, rno, highlightfeatures) {
    let apiUrl = `${featureDataService}/relationships/${fno}/${fid}`;
    if (rno) {
        apiUrl += `?rno=${encodeURIComponent(rno)}`;
    }
    
    try {
        const responsefeatureData = await fetch(apiUrl);
        const RelationsTabdata = await responsefeatureData.json();
       // console.log(RelationsTabdata);

        if (RelationsTabdata && RelationsTabdata.relationships && RelationsTabdata.relationships.length > 0) {
            for (const relation of RelationsTabdata.relationships) {
                const parentfno = relation.fno;
                const parentfid = relation.fid;

                if (parentfno && parentfid) {
                   // console.log(`Fetching feature data for FNO: ${parentfno}, FID: ${parentfid}, RNO: ${rno}`);
                    const result = await $NWP.features.fetchGTechFeatures({ G3E_FNO: parentfno, G3E_FID: parentfid });

                    if (result.success && result.data && result.data.length > 0) {
                        const feature = result.data[0];
                       // console.log(feature);
                       // console.log(feature.properties.IsDetail);
                       // console.log(feature.geometry);

                        if ((legendState === 'geographic' && feature.properties.IsGeographic) ||
                            (legendState === 'detail' && feature.properties.IsDetail)) {
                            highlightfeatures.push({ fid: parentfid, fno: parentfno });
                            continue;
                        } else {
                            await GetGraphicParent(parentfno, parentfid, legendState, featureDataService, rno, highlightfeatures);
                        }
                    }
                }
            }
        }
		else{ 
			let detailApiUrl = `${featureDataService}/relationships/${fno}/${fid}`;
			const detailrno = 5;
			detailApiUrl += `?rno=${encodeURIComponent(detailrno)}`;
			const responsedetailfeatureData = await fetch(detailApiUrl);
			const DetailRelationsTabdata = await responsedetailfeatureData.json();
			//console.log(DetailRelationsTabdata);

			if (DetailRelationsTabdata && DetailRelationsTabdata.relationships && DetailRelationsTabdata.relationships.length > 0) { 
				for (const relation of DetailRelationsTabdata.relationships) {
					const detailparentfno = relation.fno;
					const detailparentfid = relation.fid;
					 highlightfeatures.push({ fid: detailparentfid, fno: detailparentfno });
				}
			}
			
		}
    } catch (error) {
        console.error(`Error fetching feature data for FNO: ${fno}, FID: ${fid}, RNO: ${rno}`, error);
    }
}
*/
 
async function featureactionbuttonpress(args) {
  console.log("featureactionbuttonpress");
  
  if(args.name==="FBEReport") {
	  
	    $NWP.setLoading(true);
		try {
			await handleFBEReport(args);
		} catch (error) {
			console.error("Error while generating FBE Report:", error);
			
			
		} finally {
			$NWP.setLoading(false);
		}
    } else if (args.name==="FSEReport") { 
	  
	   $NWP.setLoading(true);
		try {
			await handleFSEReport(args);
		} catch (error) {
			console.error("Error while generating FBE Report:", error);
			
			
		} finally {
			$NWP.setLoading(false);
		}
		
	}/* else if(args.name==="TestScale") {
		const feature=args.feature;
		console.log(feature);
	  
	   const fno= feature.properties.G3E_FNO;
	   const fid=feature.properties.G3E_FID; 
	    var viewProj = parent.$NWP.map.getViewState().projection;
		
		await addStackLabelLegendEntry(feature.geometry.coordinates,"TestScale","TestScale",viewProj,"123456789123456789");
   
	}*/
  
} 
/*  
 function createTextStyle(b, d) {
      const a = {
        font: b.font,
        text: b.text,
        fill: new ol.style.Fill({ color: b.fontColor }),
        textAlign: b.textAlign,
        rotateWithView: b.rotateWithView,
        rotation: b.rotation,
        overflow: true
      };

      if (b.textBaseline) a.textBaseline = b.textBaseline;
      if (b.textOffsetX) a.offsetX = Math.round(b.textOffsetX * b.scale);
      if (b.textOffsetY) a.offsetY = Math.round(b.textOffsetY * b.scale);
      if (b.scaleDependent && b.scale) a.scale = b.scale;

      if (b.textBox) {
        a.padding = b.textBoxPadding;
        a.backgroundFill = new ol.style.Fill({ color: b.textBoxFillColor });
        a.backgroundStroke = new ol.style.Stroke({
          color: b.fontOutlineColor,
          width: b.fontOutlineWidth
        });
      } else if (b.fontOutlineColor) {
        a.stroke = new ol.style.Stroke({
          color: b.fontOutlineColor,
          width: b.fontOutlineWidth
        });
      }

      const c = { text: new ol.style.Text(a) };
      if (d) c.geometry = () => d;
      return [new ol.style.Style(c)];
    }

   
	
	
	async function addStackLabelLegendEntry(latlongCoords, userName, sourceName, viewProj,labelText) {
    $NWP.map.addSourceEntry({
        type: "source",
        name: userName,
        userName: userName,
        drawingPriority: 20,
        visible: true,
        queryable: true,
        source: {
            type: "localvector",
            name: sourceName,
            projection: viewProj
        },
		style: function (feature, resolution) {
        const originalResolution = feature.get('originalResolution') || resolution;
        const scale = originalResolution / resolution;

        const styleConfig = {
          text: labelText,
          font: '12px Calibri,sans-serif',
          fontColor: '#000',
          textAlign: 'center',
          textBaseline: 'middle',
          rotateWithView: true,
          rotation: 0,
          scaleDependent: true,
          scale: scale,
          textOffsetY: -15,
          textBox: true,
          textBoxPadding: [4, 4, 4, 4],
          textBoxFillColor: 'rgba(255,255,255,0.8)',
          fontOutlineColor: '#000',
          fontOutlineWidth: 1
        };

        return createTextStyle(styleConfig);
      }
    }).then(legendEntry => {
        const vectorSource = legendEntry.layer.getSource();
		
		
		const resolutionAtPlacement = parent.$NWP.map.getViewState().resolution;
        const feature = new ol.Feature({
			geometry: new ol.geom.Point(latlongCoords),
			label: labelText,
			originalResolution: resolutionAtPlacement
        });        
        vectorSource.addFeature(feature);  
        
        console.log(`${leadeLineInfos.length} leaderline features added to legend entry.`);
    }).catch(error => {
        console.error("Error adding legend entry:", error);
    });
}*/

parent.$NWP.on('actionbuttonpress', actionbuttonpress, null);
parent.$NWP.on('featureactionbuttonpress' ,featureactionbuttonpress,null);