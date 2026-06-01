var newWindow = null;
const config = window.customConfig;

async function actionbuttonpress(args) {
  console.log("actionbuttonpress");

  if (args.name === "ReserveMerkband") {
    const formPathName = '/PortalCustomizations/Merkband.html';
    const formTitle = 'Reserve Merkband Names';
    const width = 330;
    const height = 400;

    openForm(formPathName, formTitle, width, height);
  }
  if (args.name === "HighlightContainer") {
	  console.log(args);	
	  if($NWP.toolbar.getPressed('HighlightContainer')) {
		
		//alert('register');		
	    parent.$NWP.on('gtechfeatureload', featureSelectedInFE, null);
	  }
	  else { 
	   
	  // alert('unregister');
	   parent.$NWP.un('gtechfeatureload', featureSelectedInFE, null);
	  }
	  
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

//the following stores the last selected feature in the feature explorer as a cookie	
async function featureSelectedInFE(args) {
    console.log(args);
    const fid = args.G3E_FID;
    const fno = args.G3E_FNO;
    const legendState = $NWP.map.getLegendState().legendType;
    const rno = '3,6';
	const featureDataService = 'https://swdclr0586.kpnnl.local/KPNNwFeatureDataService';

    try {
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
                await GetGraphicParent(fno, fid, legendState, featureDataService, rno, highlightfeatures);
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
    }
}

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
async function findServiceUrl(urlSolutiondata, serviceType) {
	for (const service of urlSolutiondata) {
		console.log(service.Type);
		console.log(service);
		if (service.Type === serviceType) {
			return service.Url;
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
function GetParent(fno,fid,legendState)
{
	
}

async function SetVisibilityForUtilityLegend(flag) {
  let vectorServiceURL = null;
  const mapsource = parent.$NWP.workspace.getSection("mapsource");

  for (let item of mapsource.items) {
    if (item.type === 'NetworksVector') {
      vectorServiceURL = item.url;
      break;
    }
  }

  if (!vectorServiceURL) {
    throw new Error("NetworksVector type not found in mapsource items.");
  }

  // const targetNames = config.displayoffNodes;
   const targetNames =['Multinet','Infrastructure','Enclosures','Cable','Cocon Features']
   const lsno=1;
   
   const dataUrl = `${vectorServiceURL}/displaycontrol/${lsno}/dc`;
      /* console.log(dataUrl); */
   try { 
	
       const resultData = await parent.$NWP.fetchJson({ url: dataUrl });	  
   
	    await findDcrowno(resultData, targetNames);

      
      } catch (error) {
        console.error("Error fetching data:", error);
    }

 } 
 
async function findDcrowno(data, targetNames) {
  const lowerCaseTargetNames = targetNames.map(name => name.toLowerCase());

  async function searchChildren(children) {
   // const results = [];
	
    for (const child of children) {
		 console.log(child.name + '-' +child.displayMode);
      if (child.name && lowerCaseTargetNames.includes(child.name.toLowerCase())) {
        //results.push(child.dcrowno);
		 await parent.$NWP.map.setLegendState({
              id: child.dcrowno,
              filter: null,
              visible: false
            }); 
      }
	  else {
		    if(child.leafIndicator === 1 && child.displayMode) {
				console.log('set dispy '+ child.name + '-' +child.displayMode);
			   await parent.$NWP.map.setLegendState({
				  id: child.dcrowno,
				  filter: null,
				  visible: child.displayMode === 1
				}); 
			}
			else {
				if (child.children) {
				//results.push(...searchChildren(child.children));
				   await searchChildren(child.children);
				}
			}
	  }
      
    }
    //return results;
  }

  return searchChildren(data.children);
}

async function getFooterData(fno,fid,geometry,zoomScale) { 
	
	let featureDataServiceURL= await getServiceUrl('FeatureDataService');
	if (!featureDataServiceURL) {
		throw new Error("featureDataServiceURL not configured.");
	  }
	  
    let apiUrl = `${featureDataServiceURL}/feature/${fno}/${fid}`;    
	console.log(apiUrl);
    
    try {
		
        const responsefeatureData = await fetch(apiUrl);
        const featureData = await responsefeatureData.json();
       // console.log(RelationsTabdata);
	   
	    //const projectedCoord = [135691.101, 455946.511 ];
		const sourceProj = $NWP.map.getViewState().projection;	

		const lonLat = ol.proj.toLonLat(geometry, sourceProj);
		console.log('Longitude:', lonLat[0]);
		console.log('Latitude:', lonLat[1]);
				

        if (featureData && featureData.components ) {
             const netElem = featureData.components.GC_NETELEM?.[0];
			 const branch=featureData.components.GC_FBRANCH?.[0]; 
			 console.log(netElem);
			 console.log(branch);
			 
			 const footerData = {
			  AssetID: netElem?.ASSET_ID ??' ',
			  Remark: netElem?.DESCRIPTION??' ',
			  CLLICode: netElem?.SWITCH_CENTRE_CLLI??' ',
			  Town: "New York",
			  PostCode: "10001",
			  Housenumber: "45",
			  StreetName: "Broadway",
			  CaseType: branch?.PHYSICAL_TYPE??' ',
			  Lasmof: branch?.MODEL??' ',
			  DisplayScale: zoomScale,
			  Lattitude: lonLat[1],
			  Longitude: lonLat[0],
			  TotalPages:2
			};
			 
			 

            return footerData;
        } 
		
		return null;
		
    } catch (error) {
        console.error(`Error fetching feature data for FNO: ${fno}, FID: ${fid}, RNO: ${rno}`, error);
		return null;
    }

} 

async function ExecuteFBEReport(assetID, fid) {
    let analyticalServiceURL = await getServiceUrl('AnalyticalService');
    if (!analyticalServiceURL) {
        throw new Error("analyticalServiceURL not configured.");
    }

    // Fetch available searches
    const response = await fetch(analyticalServiceURL + '/Search/searches');
    const data = await response.json();

    // Find the specific report by name
    let g3e_amno = null;
    for (let item of data) {
        if (item.UserName === "Report FBE Connection, by Name") {
            g3e_amno = item.G3E_AMNO;
            break;
        }
    }

    if (g3e_amno != null) {
        const paramValue = assetID;
        const sData = {
            parameters: [{ parameterId: 1, textValue: paramValue }]
        };

        const aURL = `${analyticalServiceURL}/search/execute/${g3e_amno}`;

        try {
            const response = await fetch(aURL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json; charset=UTF-8"
                },
                body: JSON.stringify(sData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const responseText = await response.text();
            const oJSON = JSON.parse(responseText);

            if (oJSON.ResultItems && oJSON.ResultItems.length > 0) {
                const filteredItems = oJSON.ResultItems.filter(item => item.G3E_FID === fid);
                return filteredItems;
            } else {
                console.warn("No ResultItems found.");
                return [];
            }

        } catch (error) {
            console.error("Error executing FBE report:", error);
            return [];
        }
    } else {
        console.warn("G3E_AMNO not found for specified report name.");
        return [];
    }
}
async function featureactionbuttonpress(args) {
  console.log("featureactionbuttonpress");
  
  if(args.name==="FBEReport") {
	  
	   $NWP.setLoading(true);
	   const feature=args.feature;
	   	   console.log(feature);
	   //let ids = feature.ID.split(',').map(id => id.trim());
	   const fno= feature.properties.G3E_FNO;
	   const fid=feature.properties.G3E_FID;
	   
	   const resolution=parent.$NWP.map.getViewState().resolution;
	   const legendState=parent.$NWP.map.getLegendState();
	   const zoomScale=$NWP.map.getOlMapObject().getViewport().innerText.split('\n')[0].split(':')[1].trim();
	   var viewProj = parent.$NWP.map.getViewState().projection;
		console.log(legendState);
	  
	  // await new Promise(resolve => {parent.$NWP.map.getOlMapObject().once('rendercomplete', resolve);});
	  
	    parent.$NWP.features.clearHighlight()
	   
	    const rect = parent.$NWP.map.getOlMapObject().getTargetElement().getBoundingClientRect();
		const width = rect.width;
		const height = rect.height;
		
		const pdf = new jsPDF({ orientation: 'portrait', format: 'a4' });

		const pdfWidth = 210; // mm
		const pdfHeight = 297; // mm
		
		const margin = 5; // mm
		
		//const pdfImgWidth=555;
		//const pdfImgHeight=300;
		
		
		

		// Match aspect ratio
		const imgAspect = height / width;
		const imgWidth = pdfWidth - 2 * margin;
		//const imgHeight = imgWidth * imgAspect; 
		const imgHeight = 105; 
		
		console.log(height + '-'+width);
		
		const xPos = margin;
		const yPos = margin;
		const fbeyPos = imgHeight+10;
		
		console.log(imgWidth + '-'+imgHeight);

	    const mapCanvas = document.createElement('canvas');
		
        mapCanvas.width = width;
        mapCanvas.height = height;
        const mapContext = mapCanvas.getContext('2d');
		//mapContext.fillStyle = "white";
		//mapContext.fillRect(0, 0, canvas.width, canvas.height);
		
		//var timeout=1000*(dimsTimeout[format]+resolution/100+1+(5000-scale)/5000*3+1)
		var timeout=1000*(2+96/100+1+(5000-0.5)/5000*3+1);       
         console.log(timeout);
		await new Promise((resolve) => {
			setTimeout(() => {
			Array.prototype.forEach.call(
			  document.querySelectorAll('canvas'),
			  function(canvas) {
				if (canvas.width > 0 && canvas.height > 0 && canvas.closest('.ol-layer')) {
				  const opacity = canvas.parentNode.style.opacity;
				  mapContext.globalAlpha = opacity === '' ? 1 : Number(opacity);

				  mapContext.fillStyle = "white";
				  mapContext.fillRect(0, 0, canvas.width, canvas.height);

				  const transform = canvas.style.transform;
				  if (transform) {
					const matrix = transform
					  .match(/^matrix\(([^\(]*)\)$/)[1]
					  .split(',')
					  .map(Number);
					CanvasRenderingContext2D.prototype.setTransform.apply(mapContext, matrix);
				  }

				  mapContext.drawImage(canvas, 0, 0);
				}
			  }
			);

			const imgData = mapCanvas.toDataURL('image/jpeg');
			pdf.setDrawColor(255, 0, 0);
			pdf.setLineWidth(2);
			pdf.rect(xPos, fbeyPos, imgWidth, imgHeight);
			pdf.addImage(imgData, 'JPEG', xPos, fbeyPos, imgWidth, imgHeight);
			
			resolve(); // <- let the code continue after drawing
		  }, timeout);
		});
								
		console.log(config);
		await parent.$NWP.map.setViewState({resolution : 0.983,center:feature.geometry.coordinates});	
		//alert('after setViewState');
								
		const olMap = parent.$NWP.map.getOlMapObject();
	 //  await olMap.getView().setCenter(feature.geometry.coordinates);		
      //  alert('after setCenter');    
		//await parent.$NWP.map.setViewState({center:feature.geometry.coordinates});	
		
		var fbeLayer = $NWP.map.addLegendEntry({
			type: "source",
			name: "fbeLayer",
			userName: "FBE",
			drawingPriority: 20,
			visible: true,
			queryable: true,
			source: {
				type: "localvector",
				name: "fbeSource",
				projection: viewProj
			}
		});

		// Create the FBE point feature
		var fbeFeature = new ol.Feature({
			geometry: new ol.geom.Point(feature.geometry.coordinates) // from your original logic
		});

		// Style for the FBE point
		var pointStyle = new ol.style.Style({
			image: new ol.style.Circle({
				radius: 15,
				fill: new ol.style.Fill({ color: 'red' }),
				stroke: new ol.style.Stroke({ color: 'red', width: 2 })
			})
		});
		fbeFeature.setStyle(pointStyle);

		// Add the feature to the source
		var source = fbeLayer.getSource();
		source.addFeature(fbeFeature);
		
        await SetVisibilityForUtilityLegend(false); 
		
		//alert('before setViewState');
		
		
		
		const footerData=await getFooterData(fno,fid,feature.geometry.coordinates,zoomScale);
		console.log(footerData);
		const queryResult= 	await ExecuteFBEReport(footerData.AssetID,fid);

        applyLayerChangesAndWait(olMap);
		//olMap.renderSync(); 
       // await new Promise(resolve => {parent.$NWP.map.getOlMapObject().once('rendercomplete', resolve);});		 
       // await new Promise(resolve => setTimeout(resolve, 1000));

		const fbeMapCanvas = document.createElement('canvas');

				
        fbeMapCanvas.width = width;
        fbeMapCanvas.height = height;
        const fbeMapContext = fbeMapCanvas.getContext('2d'); 
		
		fbeMapContext.fillStyle = "white";
        fbeMapContext.fillRect(0, 0, fbeMapCanvas.width, fbeMapCanvas.height);
		
		//var fbetimeout=1000*(2+96/100+1+(5000-3.5)/5000*3+1);
		var fbetimeout=10000;
		console.log(fbetimeout);
		const canvases = document.querySelectorAll('canvas');
        console.log('Total canvases found:', canvases);
		await new Promise((resolve) => {
			setTimeout(() => {

			Array.prototype.forEach.call(
				document.querySelectorAll('canvas'),
				function(canvas) { 
				    const parentLayer = canvas.closest('.ol-layer');
					 if (canvas.width > 0 && canvas.height > 0 && parentLayer && window.getComputedStyle(parentLayer).display !== 'none' && parseFloat(window.getComputedStyle(parentLayer).opacity) !== 0) 
					{
					   //To avoid printing other canvas than the map
							var opacity = canvas.parentNode.style.opacity;
							fbeMapContext.globalAlpha = opacity === '' ? 1 : Number(opacity);
							
							//fbeMapContext.fillStyle = "white";
							//fbeMapContext.fillRect(0, 0, canvas.width, canvas.height);
							
							var transform = canvas.style.transform;
							if(transform){
				// Get the transform parameters from the style's transform matrix
								var matrix = transform
									.match(/^matrix\(([^\(]*)\)$/)[1]
									.split(',')
									.map(Number);
				// Apply the transform to the export map context
								CanvasRenderingContext2D.prototype.setTransform.apply(
									fbeMapContext,
									matrix
								);
							}
							fbeMapContext.drawImage(canvas, 0, 0);																	
					}
				}
			);
			
			console.log("fbeMapCanvas data:", fbeMapCanvas.toDataURL().substring(0, 100));
			const fbeImgData = fbeMapCanvas.toDataURL('image/jpeg');					   			
			pdf.setDrawColor(255, 0, 0);
			pdf.setLineWidth(2);
			pdf.rect(xPos, yPos, imgWidth, imgHeight);

			pdf.addImage(fbeImgData, 'JPEG', xPos, yPos, imgWidth, imgHeight); 
			
			resolve(); // <- let the code continue after drawing
		  }, fbetimeout);
		});
		

		
		
		/* const footerData = {
			AssetID: "FBE123",
		  Remark: "Underground cable",
		  CLLICode: "NYC001",
		  Town: "New York",
		  PostCode: "10001",
		  Housenumber: "45",
		  StreetName: "Broadway",
		  CaseType: "Repair",
		  Lasmof: "Yes",
		  DisplayScale: "500",
		  Lattitude: "40.7128",
		  Longitude: "-74.0060",
		  TotalPages:2
		}; */

		createPDFFooterContent(pdf, 1, footerData);
		generateSecondPageFBEQueryTable(pdf,queryResult,footerData,2);

		
/* 		const columns = [
			{ header: "SR_NO", key: "SR_NO" },
			{ header: "DUCT_FID", key: "DUCT_FID" },
			{ header: "DUCT_MODEL", key: "DUCT_MODEL" },
			{ header: "INNER_DUCT_FID", key: "INNER_DUCT_FID" },
			// Add remaining fields in the same order as in your recordset
		];

		// Example data row
		const data = [
			{
				SR_NO: "1",
				DUCT_FID: "10001",
				DUCT_MODEL: "Model A",
				INNER_DUCT_FID: "20001",
				// Add all other fields as per the `columns`
			},
			// Add more rows
		];
		generateSecondPageFBEQueryTable(pdf,data,columns,footerData,2); */
		//pdf.addPage();
		//createPDFFooterContent(pdf, 2, footerData);
		pdf.save('map.pdf');
	
      $NWP.setLoading(false);
    }
  
} 

async function applyLayerChangesAndWait(map) {
  const view = map.getView();
  const center = view.getCenter();
  view.setCenter([center[0] + 0.00001, center[1]]);
  view.setCenter(center);

  map.render();
  map.renderSync();

  await new Promise(resolve => {
    map.once('rendercomplete', () => setTimeout(resolve, 300));
  });
}
function createPDFFooterContent(pdf, pageNo, data) {
    const {
        AssetID,
        Remark,
        CLLICode,
        Town,
        PostCode,
        Housenumber,
        StreetName,
        CaseType,
        Lasmof,
        DisplayScale,
        Lattitude,
        Longitude,
        TotalPages
    } = data;

    const pageNumber = `${pageNo} of ${TotalPages}`;
    const pageHeight = pdf.internal.pageSize.getHeight();
    const marginLeft = 5;
    const marginRight = 5;
    const startY = pageHeight - 60;

    const tableBody = [
        [
            { content: 'FBE ASSET_ID:', styles: { fontStyle: 'bold' } },
            { content: AssetID, styles: { fontSize: 14 }, colSpan: 1 },
            { content: `Remark: ${Remark}`, colSpan: 5 }
        ],
        [
            { content: 'CLLI', styles: { fontStyle: 'bold' } },
            { content: 'Town', styles: { fontStyle: 'bold' } },
            { content: 'Postcode', styles: { fontStyle: 'bold' } },
            { content: 'Housenumber', styles: { fontStyle: 'bold' } },
            { content: 'Streetname', styles: { fontStyle: 'bold' }, colSpan: 3 }
        ],
        [
            CLLICode,
            Town,
            PostCode,
            { content: Housenumber, styles: { halign: 'center' } },
            { content: StreetName, colSpan: 3, styles: { fontSize: 10 } }
        ],
        [
            { content: '', colSpan: 7, styles: { fillColor: [112, 128, 144], cellPadding: 0.5 } }
        ],
        [
            { content: 'CaseType', styles: { fontStyle: 'bold' } },
            { content: 'Lasmof', styles: { fontStyle: 'bold' }, colSpan: 2 },
            { content: 'Scale', styles: { fontStyle: 'bold' } },
            { content: 'Lat', styles: { fontStyle: 'bold' } },
            { content: 'Lon', styles: { fontStyle: 'bold' } },
            { content: 'Page', styles: { fontStyle: 'bold' } }
        ],
        [
            CaseType,
            { content: Lasmof, colSpan: 2 },
            `1:${DisplayScale}`,
            Lattitude,
            Longitude,
            pageNumber
        ]
    ];

    pdf.autoTable({
        startY: startY,
        margin: { left: marginLeft, right: marginRight },
        body: tableBody,
        theme: 'grid',
        styles: {
            fontSize: 8,
            cellPadding: 1.5,
            overflow: 'linebreak',
            halign: 'left',
            valign: 'middle',
            lineColor: [0, 0, 0],
            lineWidth: 0.4,
			textColor: [0, 0, 0],
        },
        tableWidth: 'auto', // stretches across the page minus margins
        pageBreak: 'avoid'
    });
} 
function generateSecondPageFBEQueryTable(pdf, resultItems, footerData, startPage = 2) {
    if (!Array.isArray(resultItems) || resultItems.length === 0) {
        console.warn("No data to render.");
        return;
    }

    const rowsPerPage = 19;
    const totalRows = resultItems.length;
    let currentPage = startPage;

    // Dynamically extract column headers from the first item, skipping G3E_FID and G3E_FNO
    const excludedFields = ['G3E_FID', 'G3E_FNO','G3E_VIEW','GAO_NET_FEATURENAME'];
    const fieldNames = Object.keys(resultItems[0]).filter(key => !excludedFields.includes(key));
    const columnHeaders = fieldNames.map(name => name.replaceAll('_', ' ')); 
	
	const columnWidthAdjustmentsJS = {
			'SR_NO': -10,
			'DUCT_FID': -3,
			'DUCT_MODEL': 19,
			'INNER_DUCT_FID': -3,
			'INNER_DUCT_POSITION': -6,
			'CONNECTED_INNER_DUCT_POSITION': -4,
			'CONNECTED_INNER_DUCT_FID': -3,
			'CONNECTED_DUCT_MODEL': 19,
			'CONNECTED_DUCT_FID': -3,
			'CONNECTED_INNER_DUCT_MODEL': 10,
			'INNER_DUCT_MODEL':10,
			'ASSET_ID': -2.33,
			'DUCT_TAG_ID': -2.67,
			'CONNECTED_DUCT_TAG_ID': -2.67,
			'INNER_DUCT_STATUS': -8.33,
			'COUPLER_STATUS': 2.67
		}; 
		
	const totalWidthJS = 270;
	const baseColumnWidth = totalWidthJS / fieldNames.length;

	const columnStyles = {};
	fieldNames.forEach((key, index) => {
		const adj = columnWidthAdjustmentsJS[key.toUpperCase()] || 0;
		columnStyles[index] = {
			cellWidth: baseColumnWidth + adj,
			overflow: 'linebreak'
		};
	});
 // Group and assign alternating colors by unique DUCT_FID
    const ductFIDColorMap = {};
    let colorToggle = true;

    [...new Set(resultItems.map(row => row.DUCT_FID))].forEach(fid => {
        ductFIDColorMap[fid] = colorToggle ? 'antiquewhite' : 'whitesmoke';
        colorToggle = !colorToggle;
    });
    for (let i = 0; i < totalRows; i += rowsPerPage) {
        const chunk = resultItems.slice(i, i + rowsPerPage);
		const bodyWithHeaderLast = [
			...chunk.map(row => fieldNames.map(key => row[key] ?? '')),
			columnHeaders // header row at the bottom
		];


        if (i !== 0 || currentPage > 1) {
            pdf.addPage('a4', 'landscape');
            createPDFFooterContent(pdf, currentPage, footerData);
            currentPage++;
        }

        pdf.autoTable({
			head: [columnHeaders],
			body: bodyWithHeaderLast,
			startY: 5,
			margin: { left: 5, right: 5 },
			styles: {
				fontSize: 5,
				cellPadding: { top: 1, right: 1, bottom: 1, left: 1 }, // reduced padding
				lineColor: [0, 0, 0],
				lineWidth: 0.5,
				tableLineWidth: 0.5,
				valign: 'middle',
				halign: 'left',
				textColor: [0, 0, 0],
				overflow: 'linebreak'
			},
			headStyles: {
				fillColor: [255, 255, 255],
				textColor: [0, 0, 0],
				fontStyle: 'bold',
				halign: 'middle',
				valign: 'top',
				lineWidth: 0.2,
				
			},
			bodyStyles: {
				halign: 'left',
				lineWidth: 0.2,
				textColor: [0, 0, 0]
			},
			columnStyles:columnStyles,
			theme: 'grid',
			didParseCell: function (data) {
				const rowData = data.row.raw;
				const isLastRow = data.row.index === bodyWithHeaderLast.length - 1;

				if (data.section === 'body') {
					if (isLastRow) {
						// Style last row as header
						data.cell.styles.fillColor = [255, 255, 255];
						data.cell.styles.textColor = [0, 0, 0];
						data.cell.styles.fontStyle = 'bold';
						data.cell.styles.halign = 'middle';
						data.cell.styles.valign = 'top';
					} else {
						// Color logic for regular rows
						const ductFID = rowData[2];
						const color = ductFIDColorMap[ductFID];
						if (color === 'antiquewhite') {
							data.cell.styles.fillColor = [250, 235, 215];
						} else if (color === 'whitesmoke') {
							data.cell.styles.fillColor = [245, 245, 245];
						}
					}
				}
            }
			
		});
    }
}
/* function createPDFFooterContent(pdf, pageNum, totalPages, data) {
  const startX = 5;
  const startY = 250;
  const cellHeight = 15;
  const labelFontSize = 10;
  const valueFontSize = 12;
  const borderColor = [0, 0, 0]; // Black

  pdf.setDrawColor(...borderColor);
  pdf.setLineWidth(0.75);

  // === First Row: Asset ID and Remark ===
  pdf.setFontSize(labelFontSize);
  pdf.rect(startX, startY, 30, cellHeight); // Label
  pdf.text('FBE ASSET_ID:', startX + 2, startY + 6);
  pdf.rect(startX + 30, startY, 50, cellHeight); // Value
  pdf.setFontSize(valueFontSize);
  pdf.text(data.AssetID || '', startX + 30, startY + 6);
  pdf.setFontSize(labelFontSize);
  pdf.rect(startX + 80, startY, 80, cellHeight); // Remark
  pdf.text(`Remark: ${data.Remark || ''}`, startX + 80, startY + 6);

  // === Second Row: Headers ===
  const y2 = startY + cellHeight;
  const columns1 = ['CLLI', 'Town', 'Postcode', 'Housenumber', 'Streetname'];
  const widths1 = [30, 35, 35, 40, 80];

  let x = startX;
  pdf.setFontSize(labelFontSize);
  columns1.forEach((text, i) => {
    pdf.rect(x, y2, widths1[i], cellHeight);
    pdf.text(text, x + 2, y2 + 6);
    x += widths1[i];
  });

  // === Third Row: Data for headers ===
  const y3 = y2 + cellHeight;
  const values1 = [
    data.CLLICode || '',
    data.Town || '',
    data.PostCode || '',
    data.Housenumber || '',
    data.StreetName || ''
  ];
  x = startX;
  pdf.setFontSize(valueFontSize);
  values1.forEach((val, i) => {
    pdf.rect(x, y3, widths1[i], cellHeight);
    pdf.text(val, x + 2, y3 + 6);
    x += widths1[i];
  });

  // === Fourth Row: Headers for second table ===
  const y4 = y3 + cellHeight + 1;
  const columns2 = ['CaseType', 'Lasmof', 'Scale', 'Lat', 'Lon', 'Page'];
  const widths2 = [30, 60, 40, 30, 30, 40];

  x = startX;
  pdf.setFontSize(labelFontSize);
  columns2.forEach((text, i) => {
    pdf.rect(x, y4, widths2[i], cellHeight);
    pdf.text(text, x + 2, y4 + 6);
    x += widths2[i];
  });

  // === Fifth Row: Values for second table ===
  const y5 = y4 + cellHeight;
  const values2 = [
    data.CaseType || '',
    data.Lasmof || '',
    `1:${data.DisplayScale || ''}`,
    data.Lattitude || '',
    data.Longitude || '',
    `${pageNum} of ${totalPages}`
  ];

  x = startX;
  pdf.setFontSize(valueFontSize);
  values2.forEach((val, i) => {
    pdf.rect(x, y5, widths2[i], cellHeight);
    pdf.text(val, x + 2, y5 + 6);
    x += widths2[i];
  });
} */


parent.$NWP.on('actionbuttonpress', actionbuttonpress, null);
parent.$NWP.on('featureactionbuttonpress' ,featureactionbuttonpress,null);