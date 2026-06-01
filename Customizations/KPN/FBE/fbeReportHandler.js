 const rowsPerPage = 20;
 const displayOffLegendNames =['Multinet','Infrastructure','Enclosures','Cable','Cocon Features'];
 const lsno=1; 
 const FBEQueryName="Report FBE Connection, by Name";
 const NEAREST_ACN_SEARCH_DISTANCE=100;
 
function drawFBEMapToCanvasAndAddToPDF(context, timeout, pdf, xPos, yPos, imgWidth, imgHeight) {
  return new Promise((resolve) => {
    setTimeout(() => {
      Array.prototype.forEach.call(
        document.querySelectorAll('canvas'),
        function (canvas) {
          const parentLayer = canvas.closest('.ol-layer');
          if (
            canvas.width > 0 &&
            canvas.height > 0 &&
            parentLayer &&
            window.getComputedStyle(parentLayer).display !== 'none' &&
            parseFloat(window.getComputedStyle(parentLayer).opacity) !== 0
          ) {
            const opacity = canvas.parentNode.style.opacity;
            context.globalAlpha = opacity === '' ? 1 : Number(opacity);

            const transform = canvas.style.transform;
            if (transform) {
              const matrix = transform
                .match(/^matrix\(([^\(]*)\)$/)[1]
                .split(',')
                .map(Number);
              CanvasRenderingContext2D.prototype.setTransform.apply(context, matrix);
            }

            context.drawImage(canvas, 0, 0);
          }
        }
      );

      const imgData = context.canvas.toDataURL('image/jpeg');
      pdf.setDrawColor(255, 0, 0);
      pdf.setLineWidth(2);
      pdf.rect(xPos, yPos, imgWidth, imgHeight);
      pdf.addImage(imgData, 'JPEG', xPos, yPos, imgWidth, imgHeight);

      resolve();
    }, timeout);
  });
} 

async function SetVisibilityForFBEUtilityLegend(flag) {
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
   //const targetNames =['Multinet','Infrastructure','Enclosures','Cable','Cocon Features']
   //const lsno=1;   
   const dataUrl = `${vectorServiceURL}/displaycontrol/${lsno}/dc`;
   try { 
	
       const resultData = await parent.$NWP.fetchJson({ url: dataUrl });	    
	    await findFBEDcrowno(resultData, displayOffLegendNames);
      
      } catch (error) {
        console.error("Error fetching data:", error);
    } 

 } 
 async function displayOffWMSLegend() {
  const wmsLegendState = parent.$NWP.map.getLegendState().layers.find(parent =>
    parent.name.startsWith('wms')
  );

  if (wmsLegendState && Array.isArray(wmsLegendState.layers)) {
    for (const layer of wmsLegendState.layers) {
      await parent.$NWP.map.setLegendState({
        id: layer.id,
        filter: null,
        visible: false
      });
    }
  }
}
async function findFBEDcrowno(data, targetNames) {
  const lowerCaseTargetNames = targetNames.map(name => name.toLowerCase());

  async function searchChildren(children) {
   // const results = [];
	
    for (const child of children) {
		 //console.log(child.name + '-' +child.displayMode);
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
				//console.log('set dispy '+ child.name + '-' +child.displayMode);
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

async function getFBEFooterData(fno,fid,geometry,zoomScale) { 
	
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
			 
			 let addressInfo;

			 if(netElem && netElem.SWITCH_CENTRE_CLLI) {
				addressInfo  = await getFBEAddressInfo(fid,netElem.SWITCH_CENTRE_CLLI,NEAREST_ACN_SEARCH_DISTANCE);
			 }
			 
			 const footerData = {
			  AssetID: netElem?.ASSET_ID ??' ',
			  Remark: netElem?.DESCRIPTION??' ',
			  CLLICode: netElem?.SWITCH_CENTRE_CLLI??' ',
			  Town: addressInfo?.town??' ',
			  PostCode:  addressInfo?.postCode??' ',
			  Housenumber: addressInfo?.houseNumber??' ',
			  StreetName:  addressInfo?.streetName??' ',
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
        console.error(`Error fetching footerData data for FNO: ${fno}, FID: ${fid}`, error);
		return null;
    }

} 
async function getFBEAddressInfo(fid,clliCode,distance) {
	  try {
	  
		const FBEAddressAPIUrl = `${baseURL}/FBEReportPortalCustomService/FBECustomization/GetAddressInfo?fid=${fid}&clliCode=${clliCode}&distance=${distance}`; 
		const response = await fetch(FBEAddressAPIUrl, {
		  method: 'GET',
		  headers: {
			'Content-Type': 'application/json'
		  }
		});
		console.log(response);
		if (!response.ok) {
		  throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		console.log("AddressInfo:", data);
		return data;
		
	  } catch (error) {
		parent.$NWP.msg.showError("Error while getting the addressInfo:" + error.message);
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
        if (item.UserName === FBEQueryName) {
            g3e_amno = item.G3E_AMNO;
            break;
        }
    }

    if (g3e_amno != null) {
        const paramValue = assetID;
        const sData = {
            parameters: [{ parameterId: 1, textValue: paramValue },{ parameterId: 2, LongValue: fid }]
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
function addFBELayerWithFeature(viewProj, coordinates, userName, sourceName) {	
	
	$NWP.map.addSourceEntry({
		type: "source",
		name: userName ,
		userName: userName,
		drawingPriority: 20,
		visible: true,
		queryable: false,
		source: { 
            type: "localvector",
			name: "FBESOURCE",
			projection: viewProj }
		}).then(legendEntry => {
			//console.log("Layer added successfully:", legendEntry);
			//console.log("Layer added successfully:", legendEntry.layer.getSource());
			const fbeFeature = new ol.Feature({
				geometry: new ol.geom.Point(coordinates)
			});

			const pointStyle = new ol.style.Style({
				image: new ol.style.Circle({
					radius: 15,
					fill: new ol.style.Fill({ color: 'red' }),
					stroke: new ol.style.Stroke({ color: 'red', width: 2 })
				})
			});

			fbeFeature.setStyle(pointStyle);
			legendEntry.layer.getSource().addFeature(fbeFeature);
			
       }).catch(error => {
			console.error("Error adding layer:", error);
		});
} 
async function applyLayerChangesAndWait(map) {
  //const view = map.getView();
  //const center = view.getCenter();
  //view.setCenter([center[0] + 0.00001, center[1]]);
  //view.setCenter(center);

  map.render();
  map.renderSync();

  await new Promise(resolve => {
    map.once('rendercomplete', () => setTimeout(resolve, 300));
  });
}
function createFBEPDFFooterContent(pdf, pageNo, data,totalPages) {
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
       // TotalPages
    } = data;

    const pageNumber = `${pageNo} of ${totalPages}`;
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
function generateSecondPageFBEQueryTable(pdf, resultItems, footerData, startPage = 2,totalPages) {
    if (!Array.isArray(resultItems) || resultItems.length === 0) {
        console.warn("No data to render.");
        return;
    }
   console.log("resultItems");
   // const rowsPerPage = 20;
    const totalRows = resultItems.length;
    let currentPage = startPage;

    // Dynamically extract column headers from the first item, skipping G3E_FID and G3E_FNO
    const excludedFields = ['G3E_FID', 'G3E_FNO','G3E_VIEW','GAO_NET_FEATURENAME','GAO_NET_FEATURELABEL'];
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
            createFBEPDFFooterContent(pdf, currentPage, footerData,totalPages);
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
async function getfbeAllChildLayerVisibilityMap(legendState) { 
  const vetcorLegendState = legendState.layers.filter(parent =>
    parent.name === 'vector1' // 
  )[0]; 
 
  const wmsLegendState = legendState.layers.find(parent =>
    parent.name.startsWith('wms'));
 console.log(wmsLegendState);

  const visibilityMap = {};

  function traverseLayers(layers) {
    if (!Array.isArray(layers)) return; // Guard clause to avoid errors

    layers.forEach(layer => {
      const key = `${layer.id}`;
      visibilityMap[key] = layer.visible;

      // Recurse into child layers
      if (Array.isArray(layer.layers)) {
        traverseLayers(layer.layers);
      }
    });
  }

  if (vetcorLegendState && Array.isArray(vetcorLegendState.layers)) {
    traverseLayers(vetcorLegendState.layers);
  } else {
    console.warn("Legend state or layers are not defined:", legendState);
  } 
  if (wmsLegendState && Array.isArray(wmsLegendState.layers)) { 
   console.log(wmsLegendState.layers);
    traverseLayers(wmsLegendState.layers);
  } 
  return visibilityMap;
     
}
async function syncFBELegendStates(orgLegendState, currLegendState) { 
  for (const key in currLegendState) {
    const currVisible = currLegendState[key];
    const orgVisible = orgLegendState[key];

    if (currVisible !== orgVisible) {
      await parent.$NWP.map.setLegendState({
        id: key, // assuming key format is "layerName_visibleName"
        filter: null,
        visible: orgVisible
      });
    }
  }
}
function pad(n) {
    return n.toString().padStart(2, '0');
}

function formatDate(date) {
    return (
        pad(date.getDate()) +
        pad(date.getMonth() + 1) +
        date.getFullYear().toString().slice(-2) +
        pad(date.getHours()) +
        pad(date.getMinutes()) +
        pad(date.getSeconds())
    );
}

function getFBEFilename(assetID) {
    const cleanedAssetID = assetID.replace(/[^_.()a-zA-Z0-9 -]/g, "_");
    const timestamp = formatDate(new Date());
    return `FBE-${cleanedAssetID}-${timestamp}.pdf`;
}

async function handleFBEReport(args) {
   
   console.log("Generating FBE Report...");

   const feature=args.feature;
	console.log(feature);
  
   const fno= feature.properties.G3E_FNO;
   const fid=feature.properties.G3E_FID;
   
   const resolution=parent.$NWP.map.getViewState().resolution;
   const center=parent.$NWP.map.getViewState().center;
   const legendState=parent.$NWP.map.getLegendState();
  
   const orgLegendstateDictionary=await getfbeAllChildLayerVisibilityMap(legendState);

   
   const zoomScale=$NWP.map.getOlMapObject().getViewport().innerText.split('\n')[0].split(':')[1].trim();
   var viewProj = parent.$NWP.map.getViewState().projection;
   console.log(legendState);
   	await displayOffWMSLegend();
  
  // await new Promise(resolve => {parent.$NWP.map.getOlMapObject().once('rendercomplete', resolve);});
  
	//parent.$NWP.features.clearHighlight()
   
	const rect = parent.$NWP.map.getOlMapObject().getTargetElement().getBoundingClientRect();
	const width = rect.width;
	const height = rect.height;
	
	const pdf = new jsPDF({ orientation: 'portrait', format: 'a4' });

	const pdfWidth = 210; // mm
	const pdfHeight = 297; // mm
	
	const margin = 5; // mm
	
	//const pdfImgWidth=555;
	//const pdfImgHeight=300;
	
	const imgWidth = pdfWidth - 2 * margin;
	const imgHeight = 105; 
		
	const xPos = margin;
	const yPos = margin;
	const fbeyPos = imgHeight+10;
	
	console.log(imgWidth + '-'+imgHeight);

	const mapCanvas = document.createElement('canvas');
	
	mapCanvas.width = width;
	mapCanvas.height = height;
	const mapContext = mapCanvas.getContext('2d');
	mapContext.fillStyle = "white";
	mapContext.fillRect(0, 0, mapCanvas.width, mapCanvas.height);
	
	//var timeout=1000*(dimsTimeout[format]+resolution/100+1+(5000-scale)/5000*3+1)
	var timeout=1000*(2+96/100+1+(5000-0.5)/5000*3+1);       
	 console.log(timeout);
	 
    await drawFBEMapToCanvasAndAddToPDF(mapContext, timeout, pdf, xPos, fbeyPos, imgWidth, imgHeight);

	await parent.$NWP.map.setViewState({resolution : 0.983,center:feature.geometry.coordinates});	
							
	const olMap = parent.$NWP.map.getOlMapObject();
	const fbeLayer = addFBELayerWithFeature(viewProj, feature.geometry.coordinates, "FBE", "fbeSource");
			
	await SetVisibilityForFBEUtilityLegend(false); 

	
	const footerData=await getFBEFooterData(fno,fid,feature.geometry.coordinates,zoomScale);
	console.log(footerData);
	const queryResult= 	await ExecuteFBEReport(footerData.AssetID,fid);
	
	const totalPages = Math.ceil(queryResult.length / rowsPerPage)+1;

	applyLayerChangesAndWait(olMap);
	
	const fbeMapCanvas = document.createElement('canvas');
			
	fbeMapCanvas.width = width;
	fbeMapCanvas.height = height;
	const fbeMapContext = fbeMapCanvas.getContext('2d'); 
	
	fbeMapContext.fillStyle = "white";
	fbeMapContext.fillRect(0, 0, fbeMapCanvas.width, fbeMapCanvas.height);

	var fbetimeout=10000;	
	await drawFBEMapToCanvasAndAddToPDF(fbeMapContext, fbetimeout, pdf, xPos, yPos, imgWidth, imgHeight);
	
	createFBEPDFFooterContent(pdf, 1, footerData,totalPages);
	generateSecondPageFBEQueryTable(pdf,queryResult,footerData,2,totalPages);
	const fileName = getFBEFilename(footerData.AssetID);
	
    pdf.save(fileName); 
	
   const currLegendState=parent.$NWP.map.getLegendState();
   const currLegendstateDictionary=await getfbeAllChildLayerVisibilityMap(currLegendState); 
   
   await syncFBELegendStates(orgLegendstateDictionary,currLegendstateDictionary);

   parent.$NWP.map.removeLegendEntry("FBE");
   await parent.$NWP.map.setViewState({resolution : resolution,center:center});	
		
}