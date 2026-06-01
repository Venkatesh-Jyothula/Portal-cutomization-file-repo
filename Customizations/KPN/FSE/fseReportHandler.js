 const fserowsPerPage = 20;
 const fseDisplayOffLegendNames = ['Infrastructure','Enclosures','Cable','Equipment','General Feature','Design Area','Fiber','Schematic','Raster','NWA Features','Cocon Features'];
 const dimenssionLegendNames=['Dimensioning','Dimensioning (classic)'];
 const geobaselsno=1;
 const detaillsno=7; 
 const FSEQueryName="Report FBE Connection, by Name";
 let displayDimenssions = false;
 const ScanLink=`${baseURL}/SpliceImages/`;
 
 
function drawFSEMapToCanvasAndAddToPDF(context, timeout, pdf, xPos, yPos, imgWidth, imgHeight) {
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

async function SetFSEVisibilityForUtilityLegend(isDetailWindow,displayDimenssions) {
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
  console.log(isDetailWindow);
  // const targetNames = config.displayoffNodes;
   //const targetNames =['Multinet','Infrastructure','Enclosures','Cable','Cocon Features']
   let lsno=1;   
   if(isDetailWindow =="Y") { 
    console.log("Detail window");
    lsno =2;
   }
	   
   const dataUrl = `${vectorServiceURL}/displaycontrol/${lsno}/dc`;
   try { 
	    
       const resultData = await parent.$NWP.fetchJson({ url: dataUrl });
	   /* console.log(resultData); */
	   if(displayDimenssions) {
	      await findDcrowno(resultData, fseDisplayOffLegendNames,displayDimenssions);
	   } else  { 
	     
		    await findDcrowno(resultData, fseDisplayOffLegendNames.concat(dimenssionLegendNames),displayDimenssions);
	   }
      
      } catch (error) {
        console.error("Error fetching data:", error);
    }
    await displayOffWMSLegend();
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
async function findDcrowno(data, targetNames, displayDimenssions) {
  const lowerCaseTargetNames = targetNames.map(name => name.toLowerCase());

  async function searchChildren(children) {
    for (const child of children) {
      /* console.log(child.name + ' - ' + child.displayMode); */

      if (child.name && lowerCaseTargetNames.includes(child.name.toLowerCase())) {
        if (child.name.toLowerCase() === "nwa features" && displayDimenssions) {
          for (const subChild of child.children) {
            /* console.log(subChild.name + ' - ' + subChild.displayMode); */
            await parent.$NWP.map.setLegendState({
              id: subChild.dcrowno,
              filter: null,
              visible: subChild.name.toLowerCase() === "dimensioning (classic)"
            });
          }
        } else {
          await parent.$NWP.map.setLegendState({
            id: child.dcrowno,
            filter: null,
            visible: false
          });
        }
      } else {
        if (child.leafIndicator === 1 && child.displayMode !== undefined) {
          /* console.log('set display ' + child.name + ' - ' + child.displayMode); */
          await parent.$NWP.map.setLegendState({
            id: child.dcrowno,
            filter: null,
            visible: child.displayMode === 1
          });
        } else if (Array.isArray(child.children)) {
          await searchChildren(child.children);
        }
      }
    }
  }

  await searchChildren(data.children);
} 

async function GetParentFBEInfo(fno,fid,rno) { 

    let featureDataServiceURL= await getServiceUrl('FeatureDataService');
	if (!featureDataServiceURL) {
		throw new Error("featureDataServiceURL not configured.");
	  }
	    
	
	let apiUrl = `${featureDataServiceURL}/relationships/${fno}/${fid}`;
    if (rno) {
        apiUrl += `?rno=${encodeURIComponent(rno)}`;
    }
     try {
		console.log(apiUrl);
        const responsefeatureData = await fetch(apiUrl);
        const RelationsTabdata = await responsefeatureData.json();
        console.log(RelationsTabdata);

        if (RelationsTabdata && RelationsTabdata.relationships && RelationsTabdata.relationships.length > 0) {
            for (const relation of RelationsTabdata.relationships) { 
			       console.log(relation);
				   
			   if(relation.fno == 4200) { 
			         console.log("fbe fid "+ relation.fid);
					const parentfno =relation.fno; 
					const parentfid = relation.fid;

					if (parentfno && parentfid) {
				 
						 const fbeData = {
						  fbefno: parentfno,
						  fbefid: parentfid
						 
						};
						 
						return fbeData;
					}
			    }
			}
        } 
		
		return null;
		
    } catch (error) {
        console.error(`Error fetching parent fbe data for FNO: ${fno}, FID: ${fid}`, error);
		return null;
    }
}
async function getFSEFooterData(fno,fid,geometry,zoomScale,IsInDetail) { 
	
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
		
		const xcoordinate = Number(geometry[0]).toFixed(2);
		const ycoordinate = Number(geometry[1]).toFixed(2);
				

        if (featureData && featureData.components ) {
             const netElem = featureData.components.GC_NETELEM?.[0];
			 const splice=featureData.components.GC_FSPLICE?.[0]; 
			 console.log(netElem);
			 console.log(splice);
			 
			 let addressInfo;

			 if(netElem ) {
				addressInfo  = await getFSEAddressInfo(IsInDetail,fid,netElem?.SWITCH_CENTRE_CLLI??' ');
			 }
			
			 const footerData = { 
			  CreatedBy:netElem?.KPN_CREATED_BY ??' ',
			  AssetID: netElem?.ASSET_ID ??' ',
			  Remark: splice?.REMARK??' ',
			  CLLICode: addressInfo?.clliCode??' ',
			  CLLIName: addressInfo?.clliName??' ',
			  Town: addressInfo?.town??' ',
			  PostCode:  addressInfo?.postCode??' ',
			  Housenumber: addressInfo?.houseNumber??' ',
			  StreetName:  addressInfo?.streetName??' ',
			  CaseType: splice?.PHYSICAL_TYPE??' ',
			  Lasmof: splice?.MODEL??' ',
			  Dimenssions:splice?.KPN_NIM_NAME??' ',
			  Dimenssions_house_nbr:splice?.KPN_NIM_TMP??' ',
			  CableID:splice?.KPN_PTTKABELID??' ',
			  Manipulation_Number:splice?.KPN_PTTKABELID??' ',
			  Copper_Splice_Conn:splice?.Copper_Splice_Connec??' ',
			  DisplayScale: zoomScale,
			  Lattitude: lonLat[1],
			  Longitude: lonLat[0],	
              Xcoordinate: xcoordinate,
			  Ycoordinate:ycoordinate,
			  TotalPages:2,
			  Type:splice?.TYPE??' ',
			  ScanLink:splice?.KPN_SCAN_LINK??' '
			};
			 
            return footerData;
        } 
		
		return null;
		
    } catch (error) {
        console.error(`Error fetching footerData data for FNO: ${fno}, FID: ${fid}`, error);
		return null;
    }

} 
async function GetLabelsDictionary(leadeLineInfos,isCooperSplice) { 
  const labelDict = {};
  
  for (const item of leadeLineInfos) {
    const labelText = item.label?.text ?? `Label-${item.ol_uid}`;
    const labelBody = {
      FeatureCollection: [
        {
          distance: 0,
          features: (item.label?.features || []).map(f => `${f.fid},${f.fno},0,0,0`)
        }
      ],
      FiberInnerDuctRequired: true,
	  IsLabelForFSE:true,
	  IsLabelForCopperSplice:isCooperSplice
    };

    const result = await GetLabel(labelBody); // Awaiting here
    labelDict[labelText] = result;
  }

  return labelDict;
}


async function GetLabel(labelBody){
const url = `${baseURL}/GetTrenchLabelPortalCustomService/api/GetLabel`;
	const responseData = await fetch(url,{
		method : 'POST',
		headers :{
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(labelBody)
	});
	
	
	if (!responseData.ok){
		const apiError = await responseData.json();
		console.log(apiError.Message);
		
		$NWP.msg.showError("Error in GetLabel API");
		
	}
	else{
		const label = await responseData.json();
		return label;
	}
}
async function ExecuteAPI(apiUrl) {
	  try {
	  		
		const response = await fetch(apiUrl, {
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
		console.log(apiUrl, data);
		return data;
		
	  } catch (error) {
		parent.$NWP.msg.showError("Error while executing the API:" + apiUrl +"   "+ error.message);
	  }
		  
    }
async function getFSEAddressInfo(IsInDetail,fid,clliCode) {
	  try {
	  
		const FSEAddressAPIUrl = `${baseURL}/FSEReportPortalCustomService/FSECustomization/GetAddressInfo?isInDetail=${IsInDetail}&fid=${fid}&clliCode=${clliCode}`;
		const response = await fetch(FSEAddressAPIUrl, {
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
		console.log(FSEAddressAPIUrl, data);
		return data;
		
	  } catch (error) {
		parent.$NWP.msg.showError("Error while getting the addressInfo:" + error.message);
	  }
		  
    }
function addLineGeometryLayer(viewProj, featureInfo, userName, sourceName,color,width) { 
		
		$NWP.map.addSourceEntry({
		type: "source",
		name: userName ,
		userName: userName,
		drawingPriority: 20,
		visible: true,
		queryable: true,
		source: { 
            type: "localvector",
			name: sourceName,
			projection: viewProj }
		}).then(legendEntry => {
			
			parent.$NWP.features.fetchGTechFeatures(featureInfo).then(function(result) {
				if (result.success && Array.isArray(result.data)) {
					
					const items = result.data;

					items.forEach(function(item) {
						const feature = new ol.Feature({
							geometry: new ol.geom.LineString(item.geometry.coordinates)
						});

						const lineStyle = new ol.style.Style({
							stroke: new ol.style.Stroke({
								color: color,    // Change to desired color
								width: width     // Change line width as needed
							})
						});

						feature.setStyle(lineStyle);
						legendEntry.layer.getSource().addFeature(feature);
					});
				}
		   });

       }).catch(error => {
			console.error("Error adding layer:", error);
		});
}
async function addPointGeometryLayer(viewProj, featureInfo, userName, sourceName) { 
		
		$NWP.map.addSourceEntry({
		type: "source",
		name: userName ,
		userName: userName,
		drawingPriority: 20,
		visible: true,
		queryable: false,
		source: { 
            type: "localvector",
			name: sourceName,
			projection: viewProj }
		}).then(legendEntry => {
			
			parent.$NWP.features.fetchGTechFeatures(featureInfo).then(function(result) {
				if (result.success) {
					const resolution = $NWP.map.getViewState().resolution;                  					
					const items=result.data;					
					items.forEach(function(item) { 
  					
						const fno =item.properties.G3E_FNO;
						const fid=item.properties.G3E_FID;	
						 console.log("point fno" +fno);						 
						 console.log("point fid" +fid);
						 console.log(item);
					  if (item.geometry.type === 'Point') {
							const feature = new ol.Feature({
							  geometry: new ol.geom.Point(item.geometry.coordinates)
							}); 
							var pointStyle=null;
                            if(fno == 15700 )
							{
								const correctionFactor = 0.70; // tweak this (e.g., 0.83, 0.87) if needed
				             	const fontSize = Math.max(8, Math.min(120, (1.0 / resolution) * correctionFactor));
								
								 pointStyle = new ol.style.Style({
									  text: new ol.style.Text({
									  text: 'P',
									  font: `${fontSize}px FOW`, // Adjusted size
									  fill: new ol.style.Fill({
										color: 'rgba(255, 0, 0, 1)'
									  }),
									  /*
									  backgroundFill: new ol.style.Fill({
										color: 'rgba(0, 0, 0, 0.1)' // Optional soft background
									  }),*/
									  padding: [2, 2, 2, 2],
									  overflow: true,
									  textAlign: 'center',
									  textBaseline: 'middle',
									  rotation: 3 * Math.PI / 2 // keep horizontal
									})
								}); 
							} else if (fno == 12100 ) { 
							
							   const correctionFactor = 0.70; // tweak this (e.g., 0.83, 0.87) if needed
							   const fontSize = Math.max(8, Math.min(120, (1.0 / resolution) * correctionFactor));
							   
							   pointStyle = new ol.style.Style({
									  text: new ol.style.Text({
									  text: 'O',
									  font: `${fontSize}px FOW`, // Adjusted size
									  fill: new ol.style.Fill({
										color: 'rgba(255, 0, 0, 1)'
									  }),
									  /*
									  backgroundFill: new ol.style.Fill({
										color: 'rgba(0, 0, 0, 0.1)' // Optional soft background
									  }),*/
									  padding: [2, 2, 2, 2],
									  overflow: true,
									  textAlign: 'center',
									  textBaseline: 'middle',
									  rotation: 3 * Math.PI / 2 // keep horizontal
									})
								});
							} else if (fno == 12400) { 
							
							   const correctionFactor = 0.70; // tweak this (e.g., 0.83, 0.87) if needed
					           const fontSize = Math.max(8, Math.min(120, (1.0 / resolution) * correctionFactor));
							   
							   pointStyle = new ol.style.Style({
									  text: new ol.style.Text({
									  text: 'B',
									  font: `${fontSize}px FOW_PADBAS`, // Adjusted size
									  fill: new ol.style.Fill({
										color: 'rgba(255, 0, 0, 1)'
									  }),
									  /*
									  backgroundFill: new ol.style.Fill({
										color: 'rgba(0, 0, 0, 0.1)' // Optional soft background
									  }),*/
									  padding: [2, 2, 2, 2],
									  overflow: true,
									  textAlign: 'left',         // Horizontal alignment: left side of the text box
									  textBaseline: 'bottom', 
									  rotation: 3 * Math.PI / 2 ,
									  offsetX: 0,
									  offsetY: 0.0475 // keep horizontal
									})
								});
							
							} else if(fno == 11800) {  
							     console.log("fse point");
							     const correctionFactor = 2*1; // tweak this (e.g., 0.83, 0.87) if needed
					             const fontSize = Math.max(8, Math.min(120, (1.0 / resolution) * correctionFactor));
								 console.log(" fse fon size "+fontSize);
								 pointStyle = new ol.style.Style({
									  text: new ol.style.Text({
									  text: '¤',
									  font: `${fontSize}px Wingdings`, // Adjusted size
									  fill: new ol.style.Fill({
										color: 'rgba(255, 0, 0, 1)'
									  }),
									  /*
									  backgroundFill: new ol.style.Fill({
										color: 'rgba(0, 0, 0, 0.1)' // Optional soft background
									  }),*/
									  padding: [2, 2, 2, 2],
									  overflow: true,
									  textAlign: 'center',         // Horizontal alignment: left side of the text box
									  textBaseline: 'middle', 
									  rotation: 3 * Math.PI / 2 ,
									  offsetX: 0,
									  offsetY: -0.0275// keep horizontal
									})
								});
							} else if(fno == 4200) { 
							    console.log("fbe point");
								const correctionFactor = 2*1.2; // tweak this (e.g., 0.83, 0.87) if needed					             
								const fontSize = Math.max(8, Math.min(120, (1.0 / resolution) * correctionFactor));
								console.log(" fbe fon size "+fontSize);
							
								 pointStyle = new ol.style.Style({
									  text: new ol.style.Text({
									  text: '¤',
									  font: `${fontSize}px Wingdings`, // Adjusted size
									  fill: new ol.style.Fill({
										color: 'red'
									  }),
									  /*
									  backgroundFill: new ol.style.Fill({
										color: 'rgba(0, 0, 0, 0.1)' // Optional soft background
									  }),*/
									  padding: [2, 2, 2, 2],
									  overflow: true,
									  textAlign: 'center',         // Horizontal alignment: left side of the text box
									  textBaseline: 'middle', 
									  rotation: 3 * Math.PI / 2 ,
									  offsetX: 0,
									  offsetY: -0.0275// keep horizontal
									})
								});
							}

							feature.setStyle(pointStyle);
							legendEntry.layer.getSource().addFeature(feature);
			            }
				    });
					
				}
			});
			
			
       }).catch(error => {
			console.error("Error adding layer:", error);
		});
} 
async function addClippedResultsToLegendEntry(clippedResults, userName, sourceName, viewProj, color = 'blue', width = 2) {
    $NWP.map.addSourceEntry({
        type: "source",
        name: userName,
        userName: userName,
        drawingPriority: 20,
        visible: true,
        queryable: false,
        source: {
            type: "localvector",
            name: sourceName,
            projection: viewProj
        }
    }).then(legendEntry => {
        const vectorSource = legendEntry.layer.getSource();

        clippedResults.forEach(item => {
            const { fid, fno, clippedGeometry } = item;

            if (!clippedGeometry) return;

            const feature = new ol.Feature({
                geometry: clippedGeometry,
                fid: fid,
                fno: fno
            });

            // Optional: Apply custom styling
            feature.setStyle(new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: color,
                    width: width
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(0, 0, 255, 0.1)'
                })
            }));

            vectorSource.addFeature(feature);
        });

        console.log(`${clippedResults.length} clipped features added to legend entry.`);
    }).catch(error => {
        console.error("Error adding legend entry:", error);
    });
} 
async function addLeadeLinesToLegendEntry(leadeLineInfos, userName, sourceName, viewProj) {
    $NWP.map.addSourceEntry({
        type: "source",
        name: userName,
        userName: userName,
        drawingPriority: 20,
        visible: true,
        queryable: false,
        source: {
            type: "localvector",
            name: sourceName,
            projection: viewProj
        }
    }).then(legendEntry => {
        const vectorSource = legendEntry.layer.getSource();

        leadeLineInfos.forEach(item => {
           
			const olFeatureLine = new ol.Feature(item.leaderLine);
			const olFeatureCircle = new ol.Feature(item.circle);
			//const olFeatureLabel = new ol.Feature(item.label.geometry);

			// Optional styles
			olFeatureLine.setStyle(new ol.style.Style({
				stroke: new ol.style.Stroke({ color: 'black', width: 1.2 })
			}));

			olFeatureCircle.setStyle(new ol.style.Style({
				stroke: new ol.style.Stroke({ color: 'black', width: 1.2 })
				
			}));
			
			const olFeatureLabel = new ol.Feature({
			  geometry: item.label.geometry
			});
             console.log(olFeatureLabel);
			olFeatureLabel.setStyle(new ol.style.Style({
			  text: new ol.style.Text({
				text: String(item.label.text), // Ensure it's a string
				font: '14px Calibri,sans-serif',
				fill: new ol.style.Fill({ color: '#000' }), // black text
				stroke: new ol.style.Stroke({ color: '#fff', width: 2.2 }), // optional white outline
				textAlign: 'center',
				textBaseline: 'middle',
				overflow: true // this allows text even if it's outside current extent
			  })
			}));

			

			vectorSource.addFeatures([olFeatureLine, olFeatureCircle, olFeatureLabel]);           
        });

        console.log(`${leadeLineInfos.length} leaderline features added to legend entry.`);
    }).catch(error => {
        console.error("Error adding legend entry:", error);
    });
}

async function fetchAndClipFeaturesToExtent(featureInfo, projection) {
   const extentRD = $NWP.map.getViewState().extent;
   const extent4326 = ol.proj.transformExtent(extentRD, 'EPSG:28992', 'EPSG:4326');
   const extentPolygon = turf.bboxPolygon(extent4326);
	
	/* console.log(extentPolygon); */

    const format = new ol.format.GeoJSON();
    const results = [];

    try {
        const response = await parent.$NWP.features.fetchGTechFeatures(featureInfo);
           console.log(featureInfo);
        if (response.success && Array.isArray(response.data)) {
            response.data.forEach(item => {
                
				const fno =item.properties.G3E_FNO;
				const fid=item.properties.G3E_FID;	
				const geometry=item.geometry;
				
				console.log(fno +'-'+fid);
				
                if (!geometry) return;

                // Convert to GeoJSON geometry
                const geomTypeMap = {
					"Point": ol.geom.Point,
					"LineString": ol.geom.LineString,
					"Polygon": ol.geom.Polygon,
					"MultiPolygon": ol.geom.MultiPolygon,
					"MultiLineString": ol.geom.MultiLineString
				};

				const GeometryConstructor = geomTypeMap[geometry.type];
				if (!GeometryConstructor) {
					console.warn("Unsupported geometry type:", geometry.type);
					return;
				}
				const olGeom = new GeometryConstructor(geometry.coordinates);
               const turfGeom = format.writeGeometryObject(olGeom, {
					featureProjection: 'EPSG:28992',
					dataProjection: 'EPSG:4326'
				})
				console.log(turfGeom);

                let clipped = null;

                switch (turfGeom.type) {
                    case "Polygon":
                    case "MultiPolygon":
                        clipped = turf.intersect(turfGeom, extentPolygon);
                        break;

                    case "LineString":
                       const extentLine = turf.polygonToLine(extentPolygon);
						const lineFeature = turf.feature(turfGeom);

						// Split the line at the boundary of the extent
						let splits;
						try {
							splits = turf.lineSplit(lineFeature, extentLine);
						} catch (e) {
							console.log('Line split failed, trying bbox check fallback:', e);
							splits = {
								type: 'FeatureCollection',
								features: []
							};
						}

						// Filter segments that are inside the extent
						const bufferedExtent = turf.buffer(extentPolygon, 0.00001, { units: 'degrees' });

						// Filter segments that lie within the buffered extent
						let segmentsInside = splits.features.filter(seg =>
							turf.booleanWithin(seg, bufferedExtent)
						);

						// If nothing split but the line is inside, keep it
						if (segmentsInside.length === 0 && turf.booleanWithin(lineFeature, bufferedExtent)) {
							segmentsInside = [lineFeature];
						}

						

						if (segmentsInside.length > 0) {
							clipped = {
								type: "FeatureCollection",
								features: segmentsInside
							};
						}	
						console.log(clipped);
                        break;

                    case "Point":
                        if (turf.booleanPointInPolygon(turfGeom, extentPolygon)) {
                            clipped = turfGeom;
                        }
                        break;

                    default:
                        console.log("Unsupported geometry type:", turfGeom.type);
                }

                // If we found clipped geometry
                if (clipped) {
                    // Line clipping returns multiple features
                    if (clipped.type === "FeatureCollection") {
                        clipped.features.forEach(sub => {
							const olGeom = format.readGeometry(sub.geometry, {
								dataProjection: 'EPSG:4326',
								featureProjection: 'EPSG:28992'
							});
                            const length = ol.sphere.getLength(olGeom, { projection: 'EPSG:28992' });
							results.push({
								fid,
								fno,
								clippedGeometry: olGeom,
								length
							});
						});
                    } else {
                        const clippedOLGeom = format.readGeometry(clipped.geometry, {
								dataProjection: 'EPSG:4326',
								featureProjection: 'EPSG:28992'
							});
							
                        const length = ol.sphere.getLength(clippedOLGeom, { projection: 'EPSG:28992' });
                        results.push({ fid, fno, clippedGeometry: clippedOLGeom,length });
                    }
                }
            });
        }
    } catch (error) {
        console.error("Error fetching or processing features:", error);
    }
    
	/* console.log(results); */
    return results;
}
async function findLeaderLineSecondPoint(lineGeometry, scaleFactor) {
  const format = new ol.format.GeoJSON();

  // Convert OL geometry to GeoJSON in EPSG:4326 for Turf.js
  const turfLine = format.writeGeometryObject(lineGeometry, {
    featureProjection: 'EPSG:28992',
    dataProjection: 'EPSG:4326'
  });

  const turfLength = turf.length(turfLine, { units: 'meters' }); // Total length in meters
  const turfMid = turf.along(turfLine, turfLength / 2, { units: 'meters' });
  const midCoord4326 = turfMid.geometry.coordinates;

  // Convert midpoint to EPSG:28992 for geometric calculations
  const midCoord = ol.proj.transform(midCoord4326, 'EPSG:4326', 'EPSG:28992');

  // Calculate base angle from line start to end
  const firstCoord4326 = turfLine.coordinates[0];
  
   console.log(ol.proj.transform(firstCoord4326, 'EPSG:4326', 'EPSG:28992'));
   console.log(ol.proj.transform(midCoord4326, 'EPSG:4326', 'EPSG:28992'));
   console.log(turf.bearing(firstCoord4326, midCoord4326));
   
    const coord1 = ol.proj.transform(firstCoord4326, 'EPSG:4326', 'EPSG:28992');
	const coord2 = ol.proj.transform(midCoord4326, 'EPSG:4326', 'EPSG:28992');

	const dx = coord2[0] - coord1[0];
	const dy = coord2[1] - coord1[1];
	const baseAngle = Math.atan2(dy, dx);
   
 // const baseAngle = turf.bearing(firstCoord4326, midCoord4326) * Math.PI / 180;
  
   console.log(baseAngle);

  const labelOffset = 2 * 1.5 * scaleFactor ;
  const secondOffset = 2 * scaleFactor ;
  const circleOffset = 2 * 2 * scaleFactor ;
	//const EPSILON = 1e-6;
	
	for (let i = 0; i < 36; i++) {
		
		let angle = baseAngle + (Math.PI / 18) * i; // 0.1745329252 * i
		angle = Math.atan2(Math.sin(angle), Math.cos(angle));
		 
		console.log(" adjusted angle - "+angle +" - "+i);
		//console.log(Math.PI / 2);	
		// Normalize angle to stay within (-π/2, π/2)
		if (angle <= -Math.PI / 2 ) { 
		
		  angle += Math.PI;
		  console.log(" angle < -Math.PI / 2 - "+angle);
		}
		if (angle >= Math.PI / 2 ) {
		 angle -= Math.PI;
		  console.log(" angle > Math.PI / 2 - "+angle);
		}

		const midCircleCoord = [
		  midCoord[0] - Math.sin(angle) * labelOffset,
		  midCoord[1] + Math.cos(angle) * labelOffset
		];
		
	   const midCircleCoord4326 = ol.proj.transform(midCircleCoord, 'EPSG:28992', 'EPSG:4326');

		const overlap = await hasBlockedFeature(midCircleCoord);

		if (!overlap) {
		  const secondCoord = [
			midCoord[0] - Math.sin(angle) * secondOffset,
			midCoord[1] + Math.cos(angle) * secondOffset
		  ];

		  const circleCoord = [
			midCoord[0] - Math.sin(angle) * circleOffset,
			midCoord[1] + Math.cos(angle) * circleOffset
		  ];
         console.log(midCircleCoord);
		  return {
			first: midCoord4326,
			second: ol.proj.transform(secondCoord, 'EPSG:28992', 'EPSG:4326'),
			labelCenter: midCircleCoord4326,
			circleCenter: midCircleCoord4326,
			angle
		  };
		}
    }

  return null; // No valid direction found
}

/* // Check if there's any blocking feature at a given EPSG:4326 coordinate
async function hasBlockedFeature(coord28992) {
 // const coord28992 = ol.proj.transform(coord4326, 'EPSG:4326', 'EPSG:28992');
  const mapLayers = parent.$NWP.map.getMapLayers();
  const targetLayer = mapLayers.find(
    layer => layer.userName === "Geobase Engineering" && layer.type === "NetworksVector"
  );
  if (!targetLayer) return false;

  const blockedIds = [ "7200","4000","11800","4200","200","838","866"]; // Add all relevant IDs here

  const features = targetLayer.layer.getSource().getFeaturesAtCoordinate(coord28992);
  return features.some(feature =>
    blockedIds.some(id => feature?.values_?.ID?.includes(id))
  );
} */
async function hasBlockedFeature(coord28992) { 

 const blockedIds = [ "7200","4000","11800","4200","200","838","866","3500"]; // Add all relevant IDs here
 // const coord28992 = ol.proj.transform(coord4326, 'EPSG:4326', 'EPSG:28992');
  const mapLayers = parent.$NWP.map.getMapLayers();
  const targetLayer = mapLayers.find(
    layer => layer.userName === "Geobase Engineering" && layer.type === "NetworksVector"
  );
  if (!targetLayer) return false;

   const source = targetLayer.layer.getSource();

    // 2. Get current extent (EPSG:28992)
    const extentRD = parent.$NWP.map.getViewState().extent;
 
    const features =source.getFeaturesInExtent(extentRD); 
    console.log(features);
   // 4. Convert point to WGS84 for Turf
    const pointWGS = ol.proj.transform(coord28992, "EPSG:28992", "EPSG:4326");

    const buffer = turf.buffer(turf.point(pointWGS), 0.25, {
        units: "meters"
    });
    
	
    const format = new ol.format.GeoJSON();

    const nearby = [];

    // 5. Filter  lines near point
    for (const obj of features) { 
		const idValue = obj.values_.ID;
		if (!idValue || !blockedIds.some(id => idValue.includes(id))) continue;
        console.log(obj);
		
		const geom = obj.values_.geometry;

		
		// Convert OL geometry → GeoJSON(WGS84)
		const geojsonGeom = format.writeGeometryObject(geom, {
			featureProjection: "EPSG:28992",
			dataProjection: "EPSG:4326"
		});

		if (turf.booleanIntersects(buffer, geojsonGeom)) { 
		  return true;
		}
		
	}
	 
    return false; 
}
function getScaleFactor(scale) {
  let factor = 1.0;

  if (scale < 150.0) {
    factor = 0.65;
  } else if (scale < 250.0) {
    factor = 1.0;
  } else if (scale < 500.0) {
    factor = 2.0;
  } else if (scale < 1000.0) {
    factor = 3.0;
  } else if (scale < 2000.0) {
    factor = 5.0;
  } else {
    factor = 7.0;
  }

  return factor;
}

async function createCircleWithLeaderAndLabel(lineFeatures,scaleFactor,cooperSplice) {
	const format = new ol.format.GeoJSON();
	const results = [];
	const processedIndices = new Set();
	
	let labelNumber=0;

	 for (let index = 0; index < lineFeatures.length; index++) { 
	    
		if (processedIndices.has(index)) continue;
		
		const lineFeature = lineFeatures[index];
		
		const olLine = lineFeature.clippedGeometry;
        console.log(lineFeature.fid);
		const result =await findLeaderLineSecondPoint(olLine,scaleFactor); 
		console.log(result);
		
		if (!result) continue; 
		
		labelNumber = labelNumber + 1; 
		
		const featureRefs = [{ fno: lineFeature.fno, fid: lineFeature.fid }];
		processedIndices.add(index);
		
		if(!cooperSplice) {
			// Check for overlapping line features (excluding current one)
			for (let j = index + 1; j < lineFeatures.length; j++) {
				if (processedIndices.has(j)) continue;

				const otherLine = lineFeatures[j].clippedGeometry;
				if (isPointOnLine(result.first, otherLine)) {
					processedIndices.add(j);
					featureRefs.push({ fno: lineFeatures[j].fno, fid: lineFeatures[j].fid });
				}
			}
		}
									
		// 4. Create Turf geometries
		const leaderLine = turf.lineString([result.first, result.second]);
		const circle = turf.circle(result.circleCenter, scaleFactor, {
			steps: 64,
			units: 'meters'
		});
		const labelPoint = turf.point(result.labelCenter, { labelNumber });

		// 5. Convert Turf (EPSG:4326) to OL (EPSG:28992)
		const olLeader = format.readGeometry(leaderLine.geometry, {
			dataProjection: 'EPSG:4326',
			featureProjection: 'EPSG:28992'
		});
		const olCircle = format.readGeometry(circle.geometry, {
			dataProjection: 'EPSG:4326',
			featureProjection: 'EPSG:28992'
		});
		const olLabel = format.readGeometry(labelPoint.geometry, {
			dataProjection: 'EPSG:4326',
			featureProjection: 'EPSG:28992'
		});
	
		results.push({
			leaderLine: olLeader,
			circle: olCircle,
			label: {
				geometry: olLabel,
				text: labelNumber,
				features: featureRefs 
			}
		});
		
	};
      console.log(results);
	return results;
}
function isPointOnLine(point, olLine, tolerance = 0.1) {
	const format = new ol.format.GeoJSON();

	// Convert OL geometry from EPSG:28992 → EPSG:4326
	const turfLine = format.writeGeometryObject(olLine, {
		featureProjection: 'EPSG:28992',
		dataProjection: 'EPSG:4326'
	});

	const pt = turf.point(point); // point must be in EPSG:4326
	const distance = turf.pointToLineDistance(pt, turfLine, { units: 'meters' });
	return distance <= tolerance;
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
function createPDFHeaderContent(pdf, pageNo, data) {
    const {
        AssetID,
        Remark,
        CLLICode,
        CLLIName,
        Town,
        PostCode,
        Housenumber,
        StreetName,
        CaseType,
        Lasmof,
        Dimenssions,
        Dimenssions_house_nbr,
        CableID,
        Manipulation_Number,
        Copper_Splice_Conn,
        DisplayScale,
        Lattitude,
        Longitude,
        Xcoordinate,
        Ycoordinate
    } = data;

    const pageNumber = `${pageNo}`;
    const marginLeft = 5;
    const marginRight = 5;
    const startY = 5;

    const formattedDate = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }).replace(',', '');

    let remarkContent = '';
    if (data.Remark && data.Copper_Splice_Conn) {
        remarkContent = data.Remark + data.Copper_Splice_Conn;
    } else if (data.Remark) {
        remarkContent = data.Remark;
    } else if (data.Copper_Splice_Conn) {
        remarkContent = data.Copper_Splice_Conn;
    }

    // All rows
    const fullTableBody = [
        [
            { content: 'FSE ASSET_ID:', styles: { fontStyle: 'bold', fontSize: 12 } },
            { content: AssetID, styles: { fontSize: 14 } },
            { content: `Print Date:\n ${formattedDate}`, styles: { fontSize: 10 } },
            { content: `Remark: ${remarkContent}`, styles: { fontSize: 10 }, colSpan: 4 }
        ],
        [
            { content: 'CLLI Name', styles: { fontStyle: 'bold', fontSize: 12 } },
            { content: 'CLLI Code', styles: { fontStyle: 'bold', fontSize: 12 } },
            { content: 'Town', styles: { fontStyle: 'bold', fontSize: 12 }, colSpan: 2 },
            { content: 'Postcode', styles: { fontStyle: 'bold', fontSize: 12 } },
            { content: 'Housenumber', styles: { fontStyle: 'bold', fontSize: 12 } },
            { content: 'Streetname', styles: { fontStyle: 'bold', fontSize: 12 } }
        ],
        [
            { content: CLLIName, styles: { fontSize: 10 } },
            { content: CLLICode, styles: { fontSize: 10 } },
            { content: Town, styles: { fontSize: 10 }, colSpan: 2 },
            { content: PostCode, styles: { fontSize: 10 } },
            { content: Housenumber, styles: { halign: 'center', fontSize: 10 } },
            { content: StreetName, styles: { fontSize: 10 } }
        ],
        [
            { content: '', colSpan: 7, styles: { fillColor: [112, 128, 144], cellPadding: 0.5 } }
        ],
        [
            { content: 'Scale', styles: { fontStyle: 'bold', fontSize: 12 } },
            { content: 'Lat', styles: { fontStyle: 'bold', fontSize: 12 } },
            { content: 'Lon', styles: { fontStyle: 'bold', fontSize: 12 } },
            { content: 'RD X', styles: { fontStyle: 'bold', fontSize: 12 } },
            { content: 'RD Y', styles: { fontStyle: 'bold', fontSize: 12 }, colSpan: 2 },
            { content: 'Page', styles: { fontStyle: 'bold', fontSize: 12 } }
        ],
        [
            { content: `1:${DisplayScale}`, styles: { fontSize: 10 } },
            { content: Lattitude, styles: { fontSize: 10 } },
            { content: Longitude, styles: { fontSize: 10 } },
            { content: Xcoordinate, styles: { fontSize: 10 } },
            { content: Ycoordinate, styles: { fontSize: 10 }, colSpan: 2 },
            { content: pageNumber, styles: { fontSize: 10 } }
        ],
        [
            { content: '', colSpan: 7, styles: { fillColor: [112, 128, 144], cellPadding: 0.5 } }
        ],
        [
            { content: 'CaseType', styles: { fontStyle: 'bold', fontSize: 12 } },
            { content: 'Lasmof', styles: { fontStyle: 'bold', fontSize: 12 }, colSpan: 2 },
            { content: 'CableID', styles: { fontStyle: 'bold', fontSize: 12 }, colSpan: 2 },
            { content: 'Manipulation Number', styles: { fontStyle: 'bold', fontSize: 12 }, colSpan: 2 }
        ],
        [
            { content: CaseType, styles: { fontSize: 10 }, colSpan: 1 },
            { content: Lasmof, styles: { fontSize: 10 }, colSpan: 2 },
            { content: CableID, styles: { fontSize: 10 }, colSpan: 2 },
            { content: Manipulation_Number, styles: { fontSize: 10 }, colSpan: 2 }
        ],
        [
            { content: '', colSpan: 7, styles: { fillColor: [112, 128, 144], cellPadding: 0.5 } }
        ],
        [
            { content: 'Dimensions', styles: { fontStyle: 'bold', fontSize: 12 }, colSpan: 2 },
            { content: 'Dimensions from house number', styles: { fontStyle: 'bold', fontSize: 12 }, colSpan: 5 }
        ],
        [
            { content: Dimenssions, styles: { fontSize: 10 }, colSpan: 2 },
            { content: Dimenssions_house_nbr, styles: { fontSize: 10 }, colSpan: 5 }
        ]
    ];

    // Only include full table on first page, otherwise trim after third row
    const tableBody = pageNo == 1 ? fullTableBody : fullTableBody.slice(0, 3);
	console.log(tableBody);

    pdf.autoTable({
        startY: startY,
        margin: { left: marginLeft, right: marginRight },
        body: tableBody,
        theme: 'grid',
        styles: {
            fontSize: 8,
            cellPadding: 0.5,
            overflow: 'linebreak',
            halign: 'left',
            valign: 'middle',
            lineColor: [0, 0, 0],
            lineWidth: 0.4,
            textColor: [0, 0, 0],
        },
        tableWidth: 'auto',
        pageBreak: 'avoid',
        didDrawPage: () => {}
    });
}

/*
function createSpliceConnectPDF(pdf,resultItems,footerData) { 

    if (!Array.isArray(resultItems) || resultItems.length === 0) {
        console.warn("No data to render.");
        return;
    }

   // const rowsPerPage = 20;
    const totalRows = resultItems.length;
   

    // Dynamically extract column headers from the first item, skipping G3E_FID and G3E_FNO
    const excludedFields = ['SPLICE_CONNECTED'];
	const excludedSet = new Set(excludedFields.map(f => f.toUpperCase()));
    const fieldNames = Object.keys(resultItems[0]).filter(key => !excludedSet.has(key.toUpperCase()));
    const columnHeaders = fieldNames.map(name => name.replaceAll('_', ' ').toUpperCase()); 
	
	const columnWidthAdjustmentsJS = {
			 'PLATE': 20,
			 'POSI_TION':18,
			 'PORT':20,
			 'TAG_ID':40,
			 'INNER_DUCT_MODEL':45,
			 'CABLE_NAME':45,
			 'FIBER_SIZE':20,
			 'CABLE_FID' :30,
			 'TUBE_COLOR' :30,
			 'TUBE':62,
			 'FIBER' :25,
			 'STATUS':30,
			 'FIBER_':25,
			 'TUBE_' :62,
			 'TUBE_COLOR_':30,
			 'CABLE_FID_' :30,
			 'FIBER_SIZE_' :20,
			 'CABLE_NAME_' :45,
			 'INNER_DUCT_MODEL_' :40,
			 'TAG_ID_' :40,
			 'PORT_':20,
			 'GROOVE' :30,
			 'MODULE':40
			// 'SPLICE_CONNECTED':20
		}; 
	const width = pdf.internal.pageSize.getWidth();  
    console.log(width);	
	const totalWidthJS = width;
	const baseColumnWidth = totalWidthJS / fieldNames.length;

	const columnStyles = {};
	fieldNames.forEach((key, index) => {
		const adj = columnWidthAdjustmentsJS[key.toUpperCase()] || 0;
		columnStyles[index] = {
			cellWidth: adj*0.3378,
			overflow: 'linebreak'
		};
	});
 // Group and assign alternating colors by unique DUCT_FID
    const plateColorMap = {};
    let colorToggle = true;

    [...new Set(resultItems.map(row => row.plate))].forEach(plate => {
        plateColorMap[plate] = colorToggle ? 'antiquewhite' : 'whitesmoke';
        colorToggle = !colorToggle;
    });
	console.log(plateColorMap);
    for (let i = 0; i < totalRows; i += rowsPerPage) {
        const chunk = resultItems.slice(i, i + rowsPerPage);
		const bodyWithHeaderLast = [
			...chunk.map(row => fieldNames.map(key => row[key] ?? '')),
			columnHeaders // header row at the bottom
		]; 
		
		
      
            pdf.addPage('a4', 'landscape');
			let currentPage = pdf.internal.getNumberOfPages();	
			createPDFHeaderContent(pdf, currentPage, footerData);          
            currentPage++; 
           const startY = pdf.lastAutoTable.finalY + 5;			

        pdf.autoTable({
			head: [columnHeaders],
			body: bodyWithHeaderLast,
			startY: 35,
			margin: { left: 5, right: 5},
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
                halign: 'center',
                valign: 'middle',
                lineWidth: 0.5
				
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
						data.cell.styles.halign = 'center';
						data.cell.styles.valign = 'middle';
					} else {
						// Color logic for regular rows
						const plateIndex = fieldNames.indexOf('plate');
						const plate = rowData[plateIndex];
						const color = plateColorMap[plate];	
						console.log(plate,color);
						
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
}*/

async function createSpliceConnectPDF(pdf, resultItems, footerData) {
  if (!Array.isArray(resultItems) || resultItems.length === 0) {
    console.warn("No data to render.");
    createEmptySpliceConnectTable(pdf, footerData);
    return;
  }

  const excludedFields = ['SPLICE_CONNECTED'];
  const excludedSet = new Set(excludedFields.map(f => f.toUpperCase()));
  const fieldNames = Object.keys(resultItems[0]).filter(key => !excludedSet.has(key.toUpperCase()));
  const columnHeaders = fieldNames.map(name => name.replaceAll('_', ' ').toUpperCase());

  const columnWidthAdjustmentsJS = {
    'PLATE': 26, 
	'POSI_TION': 20, 
	'PORT': 24,
	'TAG_ID': 42,
    'INNER_DUCT_MODEL': 50, 
	'CABLE_NAME': 50, 
	'FIBER_SIZE': 24,
    'CABLE_FID': 32, 
	'TUBE_COLOR': 32,
	'TUBE': 68, 
	'FIBER': 27,
    'STATUS': 32, 
	'FIBER_': 27, 
	'TUBE_': 68, 
	'TUBE_COLOR_': 32,
    'CABLE_FID_': 32,
	'FIBER_SIZE_': 24,
	'CABLE_NAME_': 50,
    'INNER_DUCT_MODEL_': 50, 
	'TAG_ID_': 42, 
	'PORT_': 24,
    'GROOVE': 34, 
	'MODULE': 40
  };

  const columnStyles = {};
  fieldNames.forEach((key, index) => {
    const adj = columnWidthAdjustmentsJS[key.toUpperCase()] || 36;
    columnStyles[index] = {
      cellWidth: adj * 0.3378,
      overflow: 'linebreak'
    };
  });

  const plateColorMap = {};
  let colorToggle = true;
  [...new Set(resultItems.map(row => row.plate))].forEach(plate => {
    plateColorMap[plate] = colorToggle ? 'antiquewhite' : 'whitesmoke';
    colorToggle = !colorToggle;
  });

  const maxEffectiveRowsPerPage = 34;

  const groupedByPlate = {};
  for (const row of resultItems) {
    const plate = row.plate || "UNKNOWN";
    if (!groupedByPlate[plate]) groupedByPlate[plate] = [];
    groupedByPlate[plate].push(row);
  }

  const allPlates = Object.keys(groupedByPlate);

  for (const plate of allPlates) {
    const rows = groupedByPlate[plate];
	//const originalRows = groupedByPlate[plate];
    //const rows = [...originalRows, ...originalRows, ...originalRows];
    let currentRows = [];
    let effectiveRowCount = 0;

    const flushPage = () => {
      if (currentRows.length === 0) return;

      pdf.addPage('a4', 'landscape');
      const currentPage = pdf.internal.getNumberOfPages();
      createPDFHeaderContent(pdf, currentPage, footerData);
      const bodyWithHeaderLast = [
        ...currentRows.map(row => fieldNames.map(key => row[key] ?? '')),
        columnHeaders
      ];

      pdf.autoTable({
        head: [columnHeaders],
        body: bodyWithHeaderLast,
        startY: pdf.lastAutoTable.finalY + 5 || 35,
        margin: { left: 5, right: 5 },
        styles: {
          fontSize: 6,
          cellPadding: 1,
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
          halign: 'center',
          valign: 'middle',
          lineWidth: 0.5
        },
        bodyStyles: {          
          lineWidth: 0.5,
          textColor: [0, 0, 0],
		  fontStyle: 'bold',
		   halign: 'center',
          valign: 'middle'
        },
        columnStyles: columnStyles,
        theme: 'grid',
        didParseCell: function (data) {
          const rowData = data.row.raw;
          const isLastRow = data.row.index === bodyWithHeaderLast.length - 1;
		  const colIndex = data.column.index;
		  const colKey = fieldNames[colIndex]?.toUpperCase();
		 
          if (data.section === 'body') {
            if (isLastRow) {
              data.cell.styles.fillColor = [255, 255, 255];
              data.cell.styles.textColor = [0, 0, 0];
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.halign = 'center';
              data.cell.styles.valign = 'middle';
            } else {
              const actualRow = currentRows[data.row.index];
			  const spliceVal = (actualRow?.splice_Connected ?? '').toUpperCase();
			  if (spliceVal === 'N' && colKey !== 'STATUS') {
				data.cell.styles.fillColor = [250, 235, 215]; // AntiqueWhite for full row (except STATUS, which is already colored)
			  }
            }
          } 
		   if (colKey === 'STATUS') {
             data.cell.styles.fillColor = [250, 235, 215];
           } 
        }
      });

      currentRows = [];
      effectiveRowCount = 0;
    };

    for (const row of rows) {
      const iductA = row['inner_Duct_Model'] || '';
      const iductZ = row['inner_Duct_Model_'] || '';
      const cableA = row['cable_Name'] || '';
      const cableZ = row['cable_Name_'] || '';
      const rowWeight = (iductA || iductZ || cableA || cableZ) ? 1.5 : 1;

      if (effectiveRowCount + rowWeight > maxEffectiveRowsPerPage) {
        flushPage();
      }

      currentRows.push(row);
      effectiveRowCount += rowWeight;
    }

    flushPage();
  }
}
async function AddCableJointSketchesPage(pdf, imageUrl, marginMm = 5) {
   
     pdf.addPage('a4', 'portrait');
    // ➤ Load image as Base64
    const base64Img = await loadImageAsBase64(imageUrl);

    // ➤ Get natural image size
    const img = new Image();
    img.src = base64Img;

    await new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
    });

    const imgW = img.width;
    const imgH = img.height;

    // ➤ PDF page size
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // ➤ Max allowable area inside margins
    const maxWidth = pageWidth - marginMm * 2;
    const maxHeight = pageHeight - marginMm * 2;

    // ➤ Maintain aspect ratio
    let renderW = maxWidth;
    let renderH = (imgH / imgW) * renderW;

    if (renderH > maxHeight) {
        renderH = maxHeight;
        renderW = (imgW / imgH) * renderH;
    }

   /*  // ➤ Center horizontally & vertically
    const x = (pageWidth - renderW) / 2;
    const y = (pageHeight - renderH) / 2; */

    // ➤ Draw on the NEW page
    pdf.addImage(base64Img, "PNG", 5, 5, renderW, renderH);
} 
function loadImageAsBase64(url) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(xhr.response);
        };
        xhr.onerror = () => reject("Failed to load " + url);
        xhr.open("GET", url);
        xhr.responseType = "blob";
        xhr.send();
    });
}
async function createEmptySpliceConnectTable(pdf, footerData) {
    console.warn("No data to render. Creating empty table.");

    const excludedFields = ['SPLICE_CONNECTED'];
    const excludedSet = new Set(excludedFields.map(f => f.toUpperCase()));

    // Same columns as real data
    const knownColumns = [
        'PLATE', 'POSI_TION', 'PORT', 'TAG_ID', 'INNER_DUCT_MODEL',
        'CABLE_NAME', 'FIBER_SIZE', 'CABLE_FID', 'TUBE_COLOR',
        'TUBE', 'FIBER', 'STATUS', 'FIBER_', 'TUBE_', 'TUBE_COLOR_',
        'CABLE_FID_', 'FIBER_SIZE_', 'CABLE_NAME_', 'INNER_DUCT_MODEL_',
        'TAG_ID_', 'PORT_', 'GROOVE', 'MODULE'
    ].filter(key => !excludedSet.has(key.toUpperCase()));

    const columnHeaders = knownColumns.map(name => name.replaceAll('_', ' ').toUpperCase());

    const columnWidthAdjustmentsJS = {
    'PLATE': 26, 
	'POSI_TION': 20, 
	'PORT': 24,
	'TAG_ID': 42,
    'INNER_DUCT_MODEL': 50, 
	'CABLE_NAME': 50, 
	'FIBER_SIZE': 24,
    'CABLE_FID': 32, 
	'TUBE_COLOR': 32,
	'TUBE': 68, 
	'FIBER': 27,
    'STATUS': 32, 
	'FIBER_': 27, 
	'TUBE_': 68, 
	'TUBE_COLOR_': 32,
    'CABLE_FID_': 32,
	'FIBER_SIZE_': 24,
	'CABLE_NAME_': 50,
    'INNER_DUCT_MODEL_': 50, 
	'TAG_ID_': 42, 
	'PORT_': 24,
    'GROOVE': 34, 
	'MODULE': 40
  };

    const columnStyles = {};
    knownColumns.forEach((key, index) => {
        const adj = columnWidthAdjustmentsJS[key.toUpperCase()] || 0;
        columnStyles[index] = {
            cellWidth: adj * 0.3378,
            overflow: 'linebreak'
        };
    });

    pdf.addPage('a4', 'landscape');
    const currentPage = pdf.internal.getNumberOfPages();
    createPDFHeaderContent(pdf, currentPage, footerData);
    const startY = pdf.lastAutoTable.finalY + 5;	
    pdf.autoTable({
        head: [columnHeaders],
        body: [['']],  // one empty row
        startY: autoTable,
        margin: { left: 5, right: 5 },
        styles: {
            fontSize: 5,
            cellPadding: 1,
            lineColor: [0, 0, 0],
            lineWidth: 0.5,
            overflow: 'linebreak',
            valign: 'middle',
            halign: 'left'
        },
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            halign: 'center',
            valign: 'middle'
        },
        columnStyles: columnStyles,
        theme: 'grid'
    });
}
async function createPortConnectionPage(pdf, portConnectionRecords, footerData) {
  if (!Array.isArray(portConnectionRecords) || portConnectionRecords.length === 0) {
    console.warn("No Port Connection data available.");
    return;
  }

  pdf.addPage('a4', 'landscape');
  const currentPage = pdf.internal.getNumberOfPages();
  createPDFHeaderContent(pdf, currentPage, footerData);
   const startY = pdf.lastAutoTable.finalY + 5;	

  const totalColumns = Object.keys(portConnectionRecords[0]).length;
  const tableBody = portConnectionRecords.map(record => {
    return Object.values(record).map(value =>
      value !== undefined && value !== null ? String(value) : ''
    );
  });

  // Define column widths
  const pageWidth = pdf.internal.pageSize.getWidth() - 10; // 10 margin left & right
  const firstColWidth = 20 * 0.75; // approx 30mm = 85pt * 0.75 = ~30pt
  const remainingWidth = pageWidth - firstColWidth;
  const otherColWidth = remainingWidth / (totalColumns - 1);

  const columnStyles = {};
  for (let i = 0; i < totalColumns; i++) {
    columnStyles[i] = {
      cellWidth: i === 0 ? firstColWidth : otherColWidth,
      overflow: 'linebreak'
    };
  }

  pdf.autoTable({
    startY: startY,
    body: tableBody,
    margin: { left: 5, right: 5 },
    styles: {
      fontSize: 5,
      cellPadding: 1.2,
      valign: 'middle',
      halign: 'left',
      lineWidth: 0.5,
      overflow: 'linebreak',
	  lineColor: [0, 0, 0],
    },
    bodyStyles: {
      lineWidth: 0.5,
          textColor: [0, 0, 0],
		  fontStyle: 'bold',
		   halign: 'center',
          valign: 'middle'
    },
    columnStyles: columnStyles,
    theme: 'grid',
    didParseCell: function (data) {
      const rowIndex = data.row.index;
	   const colIndex = data.column.index;
      if (rowIndex === 0 || rowIndex === 1) {
        data.cell.styles.fillColor = [250, 235, 215]; // AntiqueWhite
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.halign = 'center';
      } 
	  if (colIndex === 0) {
      data.cell.styles.fillColor = [250, 235, 215]; // AntiqueWhite
    }
    }
  });
}


function getAllChildLayerVisibilityMap(legendState) {
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
async function syncFSELegendStates(orgLegendState, currLegendState) {
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

function getFilename(assetID) {
    const cleanedAssetID = assetID.replace(/[^_.()a-zA-Z0-9 -]/g, "_");
    const timestamp = formatDate(new Date());
    return `FSE-${cleanedAssetID}-${timestamp}.pdf`;
}
async function loadClippedFeaturesToLegendEntry(clippedResults, map, tst) {
    
    if (!clippedResults.length) {
        console.warn("No clipped features found.");
        return;
    }

    // Create a vector source and layer if tst doesn't already have one
    const vectorSource = new ol.source.Vector();
    const vectorLayer = new ol.layer.Vector({
        source: vectorSource,
        style: new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'red',
                width: 2
            }),
            fill: new ol.style.Fill({
                color: 'rgba(255,0,0,0.2)'
            })
        })
    });

    // Add clipped features to the vector source
    clippedResults.forEach(({ fid, fno, clippedGeometry }) => {
        const feature = new ol.Feature({
            geometry: clippedGeometry,
            fid,
            fno
        });
        vectorSource.addFeature(feature);
    });

    // Add layer to the map
    map.addLayer(vectorLayer);

    // Register with tst (LegendEntry) if it has a method to track layers
    if (tst && typeof tst.addLayer === 'function') {
        tst.addLayer(vectorLayer); // assuming your LegendEntry supports this
    } else {
        // fallback if tst is a container object
        tst.layer = vectorLayer;
    }

    console.log(`Added ${clippedResults.length} features to legend entry.`);
}
async function askUserForDisplayDimessions( ) {
  displayDimenssions = await parent.$NWP.msg.showYesNo(
    "Do you wish to display dimensions in the FSE Report?", 
    "FSE Report"
  );
  console.log("display dimensions: " + displayDimenssions);

  // proceed with logic that depends on the user's response
} 
function getLineCount(text) {
  return text.trim().split('\n').length;
}

function shouldUseSingleColumnLayout(entries, availableHeight, lineHeight = 8) {
  let totalLines = 0;

  for (const [label, text] of entries) {
    const trimmedText = (text || '').replace(/^\s*\n/, '');
    totalLines += getLineCount(`${label}: ${trimmedText}`);
  }

  const maxLinesThatFit = Math.floor(availableHeight / lineHeight);
  return totalLines <= maxLinesThatFit;
}

function renderLabelDictionaryAsTable(pdf, labelDict, startY,availableSpaceMm,footerData) {
  const entries = Object.entries(labelDict);
  const rows = [];
  
  const useSingleColumn = shouldUseSingleColumnLayout(entries, availableSpaceMm);

	if (useSingleColumn) {
	  for (const [label, textRaw] of entries) {
		const text = (textRaw || '').replace(/^\s*\n/, '');
		rows.push([
		  { content: `${label}:`, styles: { font: 'courier', fontSize: 8, fontStyle: 'bold' } },
		  { content: text, styles: { font: 'courier', fontSize: 8, fontStyle: 'normal' } }
		]);
	  }
	} else {
		for (let i = 0; i < entries.length; i += 2) {
		  const [label1, text1Raw] = entries[i];
		  const text1 = (text1Raw || '').replace(/^\s*\n/, '');

		  let label2 = '', text2 = '';
		  if (i + 1 < entries.length) {
			const [nextLabel, nextTextRaw] = entries[i + 1];
			label2 = nextLabel;
			text2 = (nextTextRaw || '').replace(/^\s*\n/, '');
		  }

		  rows.push([
			{ content: `${label1}:`, styles: { font: 'courier', fontSize: 8, fontStyle: 'bold' } },
			{ content: text1, styles: { font: 'courier', fontSize: 8, fontStyle: 'normal' } },
			{ content: label2 ? `${label2}:` : '', styles: { font: 'courier', fontSize: 8, fontStyle: 'bold' } },
			{ content: text2, styles: { font: 'courier', fontSize: 8, fontStyle: 'normal' } },
		  ]);
		}
	}

  pdf.autoTable({
  startY: startY,
  margin: { left: 5, right: 5 ,top: 35},
  body: rows,
  theme: 'grid', // keeps outer border
  styles: {
    fontSize: 8,
    font: 'courier',
    cellPadding: { top: 1, right: 1, bottom: 1, left: 1 },
    overflow: 'linebreak',
    whiteSpace: 'pre',
    textColor: [0, 0, 0],
    lineColor: [255, 255, 255], // invisible borders
  },
  bodyStyles: {
				halign: 'left',
				lineWidth: 0.2,
				textColor: [0, 0, 0]
			},
  columnStyles: {
    0: {
      cellWidth: 'auto',
      lineWidth: { top: 0, right: 0, bottom: 0, left: 0 }, // no inner border
    },
    1: {
      cellWidth: 'auto',
      lineWidth: { top: 0, right: 0, bottom: 0, left: 0 }, // no inner border
    },
	2: {
      cellWidth: 'auto',
      lineWidth: { top: 0, right: 0, bottom: 0, left: 0 }, // no inner border
    },
	3: {
      cellWidth: 'auto',
      lineWidth: { top: 0, right: 0, bottom: 0, left: 0 }, // no inner border
    }
  },
  /*didParseCell: function (data) {
    // Only draw outer border for the full table
    const isTop = data.row.index === 0;
    const isBottom = data.row.index === data.table.body.length - 1;
    const isLeft = data.column.index === 0;
    const isRight = data.column.index === data.table.columns.length - 1;

    data.cell.styles.lineWidth = {
      top: isTop ? 0.2 : 0,
      bottom: isBottom ? 0.2 : 0,
      left: isLeft ? 0.2 : 0,
      right: isRight ? 0.2 : 0,
    };
    data.cell.styles.lineColor = [0, 0, 0]; // black for outer lines
  },*/
    didDrawPage(data) {
      const pageNumber = pdf.internal.getNumberOfPages();
	  createPDFHeaderContent(pdf, pageNumber, footerData);
	  
	  const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const left = 5;
      const right = 5;
      const bottom = 5;

      // Top Y: Use `startY` on first page, fixed (e.g. 10) on others
      const top = (pageNumber === 1) ? startY : 35;

      // Draw full-page border
      pdf.setDrawColor(0);
      pdf.setLineWidth(0.3);
      pdf.rect(left, top, pageWidth - left - right, pageHeight - top - bottom);

      
    }
});

}
function getPathLinesNearPoint(pointCoord, idContains = "3500", distanceMeters = 0.15) {

    // 1. Get the path layer
    const mapLayers = parent.$NWP.map.getMapLayers();
    const index = mapLayers.findIndex(l =>
        l.userName === "Geobase Engineering" &&
        l.type === "NetworksVector"
    );

    if (index === -1) {
        console.warn("Path layer not found.");
        return [];
    }

    const source = mapLayers[index].layer.getSource();

    // 2. Get current extent (EPSG:28992)
    const extentRD = parent.$NWP.map.getViewState().extent;

    // 3. Get path features in extent
    const extentFeatures = source
        .getFeaturesInExtent(extentRD)
        .map(f => f.values_) // convert OL feature → plain object with {geometry, ID, SNO}
        .filter(obj => obj?.ID?.includes(idContains));

    // 4. Convert point to WGS84 for Turf
    const pointWGS = ol.proj.transform(pointCoord, "EPSG:28992", "EPSG:4326");

    const buffer = turf.buffer(turf.point(pointWGS), distanceMeters, {
        units: "meters"
    });

    const format = new ol.format.GeoJSON();

    const nearby = [];

    // 5. Filter path lines near point
    for (const obj of extentFeatures) {

        const geom = obj.geometry;

        if (!(geom instanceof ol.geom.LineString) &&
            !(geom instanceof ol.geom.MultiLineString)) {
            continue;
        }

        // Convert OL geometry → GeoJSON(WGS84)
        const geojsonGeom = format.writeGeometryObject(geom, {
            featureProjection: "EPSG:28992",
            dataProjection: "EPSG:4326"
        });

        if (turf.booleanIntersects(buffer, geojsonGeom)) {
            nearby.push({
                ID: obj.ID,
                SNO: obj.SNO,
                geometry: geom,
                length: ol.sphere.getLength(geom, { projection: "EPSG:28992" })
            });
        }
    } 
	
	 let pathLayers = [];
	 nearby.forEach(feature => {
		let ids = feature.ID.split(',').map(id => id.trim());

		pathLayers.push({
			G3E_FNO: ids[1], 
			G3E_FID: ids[0]
		});
	});

    return pathLayers;
} 
async function fileExists(url) {
    try {
        const response = await fetch(url, { method: "HEAD" });
        return response.ok;   // true if status 200–299
    } catch (e) {
        return false;
    }
}
async function handleFSEReport(args) {
   
   console.log("Generating FSE Report...");

   const feature=args.feature;
	console.log(feature);
  
   const fno= feature.properties.G3E_FNO;
   const fid=feature.properties.G3E_FID;
   
   const resolution=parent.$NWP.map.getViewState().resolution;
   const center=parent.$NWP.map.getViewState().center;
   const legendState=parent.$NWP.map.getLegendState();
   const orgLegendstateDictionary=getAllChildLayerVisibilityMap(legendState);
   
   const zoomScale=$NWP.map.getOlMapObject().getViewport().innerText.split('\n')[0].split(':')[1].trim();
   var viewProj = parent.$NWP.map.getViewState().projection;
   console.log(legendState);
   
   const isDetailWindow = $NWP.map.getLegendState().legendType=== 'geographic'? "N":"Y";
   
 

   await askUserForDisplayDimessions();
 

   parent.$NWP.features.clearHighlight()
	
	
	
	if(!fid) { return;} 
	
const fiberDuctapiUrl = `${baseURL}/FSEReportPortalCustomService/FSECustomization/GetFiberDucts?splicefid=${fid}`;
	const directBuriedCablesUrl=`${baseURL}/FSEReportPortalCustomService/FSECustomization/GetDirectBuriedFiberCables?spliceFID=${fid}&isInDetail=${isDetailWindow}`;
	const allCablesUrl=`${baseURL}/FSEReportPortalCustomService/FSECustomization/GetFSEAllConnectedCables?spliceFID=${fid}`; 
	const spliceConnectionsUrl=`${baseURL}/FSEReportPortalCustomService/FSECustomization/GetFSESpliceConnections?fid=${fid}`; 
	const portConnectionsUrl=`${baseURL}/FSEReportPortalCustomService/FSECustomization/GetPortConnections?fid=${fid}`; 
	
	
	
	const fiberDuctInfo  = await ExecuteAPI(fiberDuctapiUrl);
	const directBuriedCablesInfo=await ExecuteAPI(directBuriedCablesUrl);
	const allCablesInfo=await ExecuteAPI(allCablesUrl);
	const spliceConnectionInfo=await ExecuteAPI(spliceConnectionsUrl);
	const portConnectionInfo=await ExecuteAPI(portConnectionsUrl);
	console.log(spliceConnectionInfo);
	const fbeData=await GetParentFBEInfo(fno,fid,3); 
	console.log(fbeData);
	let pathLayerInfo=await getPathLinesNearPoint	(feature.geometry.coordinates);
	const footerData=await getFSEFooterData(fno,fid,feature.geometry.coordinates,zoomScale,isDetailWindow);
    console.log(footerData);
		
	await parent.$NWP.map.setViewState({center:feature.geometry.coordinates});	
	console.log(fiberDuctInfo);
	
	let fiberDuctFeatures = fiberDuctInfo.map(feature => ({
			G3E_FNO: 4000,
			G3E_FID: feature.fiberDuctFID
		})); 
	// Remove duplicates based on G3E_FID
	fiberDuctFeatures = fiberDuctFeatures.filter((value, index, self) =>
		index === self.findIndex(f => f.G3E_FID === value.G3E_FID)
	);	
	if(fiberDuctFeatures && fiberDuctFeatures.length > 0)  {
		await addLineGeometryLayer(viewProj,fiberDuctFeatures,"FDuct","FDuctSource","brown",4);
	}
	let cableFeatures = directBuriedCablesInfo.map(feature => ({
			G3E_FNO: 7200,
			G3E_FID: feature
		}));
	cableFeatures = cableFeatures.filter((value, index, self) =>
		index === self.findIndex(f => f.G3E_FID === value.G3E_FID)
	);
	if(cableFeatures && cableFeatures.length > 0)  {
		await addLineGeometryLayer(viewProj,cableFeatures,"FCable","FCableSource","black",2);
	}
	pathLayerInfo = pathLayerInfo.filter((value, index, self) =>
		index === self.findIndex(f => f.G3E_FID === value.G3E_FID)
	)
	console.log('Path layers:', JSON.stringify(pathLayerInfo, null, 2));
	if(pathLayerInfo && pathLayerInfo.length > 0)  {
		await addLineGeometryLayer(viewProj,pathLayerInfo,"PATH","PathSource","purple",2);
	}
	if(fbeData )  {

		await addPointGeometryLayer(viewProj,{G3E_FNO: fbeData.fbefno, G3E_FID: fbeData.fbefid},"FBE","fbeSource");
	}						
	await addPointGeometryLayer(viewProj,{G3E_FNO: fno, G3E_FID: fid},"FSE","fSeSource");
	
	
	if(isDetailWindow ==="Y" && footerData.CreatedBy !=="TRILINK MIGRATION") { 
	 
	  const cableConnectedDeviceURL = `${baseURL}/FSEReportPortalCustomService/FSECustomization/GetCableConnectedDevicesRS?spliceFID=${fid}`;
	  const cableConnectedDeviceInfo = await ExecuteAPI(cableConnectedDeviceURL);  
	  console.log(cableConnectedDeviceInfo);
	  let deviceFeatures = cableConnectedDeviceInfo.map(feature => ({
			G3E_FNO: feature.deviceFNO,
			G3E_FID: feature.deviceFID
		})); 
		
		await addPointGeometryLayer(viewProj,deviceFeatures,"DEVICE","DeviceSource");	
	}
	 console.log(' fiber duct '+fiberDuctFeatures);
	const clippedFiberDuctFeatures= await fetchAndClipFeaturesToExtent(fiberDuctFeatures,viewProj);
	const clippedFiberCableFeatures=await fetchAndClipFeaturesToExtent(cableFeatures,viewProj);
	const clippedPathFeatures=await fetchAndClipFeaturesToExtent(pathLayerInfo,viewProj);
	//await addClippedResultsToLegendEntry(clippedFiberDuctFeatures,"clippedDucts","ClippedDuctsSource",viewProj);
	
	clippedFiberDuctFeatures.sort((a, b) => b.length - a.length);
	console.log(clippedFiberDuctFeatures);
	
	clippedFiberCableFeatures.sort((a, b) => b.length - a.length);
	console.log(clippedFiberCableFeatures);
	
	clippedPathFeatures.sort((a, b) => b.length - a.length);
	console.log(clippedPathFeatures);
	
	const scaleFactor = getScaleFactor(zoomScale);
	console.log(scaleFactor);
	  let mergedClippedFeatures;
	  let leaderlines;

	if (footerData.Type?.toUpperCase() === "COPPER") {
		mergedClippedFeatures = [
			...clippedPathFeatures
		];
	    leaderlines =await createCircleWithLeaderAndLabel(mergedClippedFeatures,scaleFactor,true);
		console.log(leaderlines);
	} else {
		mergedClippedFeatures = [
		  ...clippedFiberDuctFeatures,
			...clippedFiberCableFeatures
		];
		leaderlines =await createCircleWithLeaderAndLabel(mergedClippedFeatures,scaleFactor,false);
		console.log(leaderlines);
	}


    
	
	await addLeadeLinesToLegendEntry(leaderlines,"leaderlines","leaderlines",viewProj);
	/*
	// Call the label placement method for each
	clippedFiberDuctFeatures.forEach((item, index) => {
		const labelNumber = index + 1; // Optional sequential number
		createCircleWithLeaderAndLabel(item.clippedGeometry, 1, labelNumber);
	});*/
	 
   const olMap = parent.$NWP.map.getOlMapObject();
   await SetFSEVisibilityForUtilityLegend(isDetailWindow,displayDimenssions); 
   

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
	//const fbeyPos = imgHeight+10;
	
	console.log(imgWidth + '-'+imgHeight); 
	const totalPages=2;
	
	createPDFHeaderContent(pdf, 1, footerData);
	
	const finalY = pdf.lastAutoTable.finalY || 100 + 50; // fallback if finalY isn't available
    const imageY = finalY + 10;

	const mapCanvas = document.createElement('canvas');
	
	mapCanvas.width = width;
	mapCanvas.height = height;
	const mapContext = mapCanvas.getContext('2d');
	mapContext.fillStyle = "white";
	mapContext.fillRect(0, 0, mapCanvas.width, mapCanvas.height);
	
	//var timeout=1000*(dimsTimeout[format]+resolution/100+1+(5000-scale)/5000*3+1)
	var timeout=1000*(2+96/100+1+(5000-0.5)/5000*3+1);       
	 console.log(timeout);
	 
    await drawFSEMapToCanvasAndAddToPDF(mapContext, timeout, pdf, xPos, imageY, imgWidth, imgHeight);
	
    let labels;
     if (footerData.Type?.toUpperCase() === "COPPER") {
	  labels=await GetLabelsDictionary(leaderlines,true);
	  console.log(labels);
	 } else { 
	  labels=await GetLabelsDictionary(leaderlines,false);
	  console.log(labels);
	 }
	
	
    const availableSpaceMm = pdfHeight - (imageY + imgHeight + 10);
	
	const labelStartY = imageY + imgHeight + 10;
       renderLabelDictionaryAsTable(pdf, labels, labelStartY,availableSpaceMm,footerData);
	   
	if(footerData.Type.toUpperCase()=="COPPER" && footerData.ScanLink.trim()) { 
	   
	   const imagePath = ScanLink + "\\" + footerData.ScanLink;
	   console.log(imagePath);
        if (await fileExists(imagePath)) {
			 console.log("File exist");
          await  AddCableJointSketchesPage(pdf, imagePath);
        } else { 
             parent.$NWP.msg.showInfo("Joint sketch image not found at path: "+imagePath);
            console.warn("File does not exist:", imagePath);
        }
	}
	   
	await createSpliceConnectPDF(pdf,spliceConnectionInfo,footerData);
	 
	await  createPortConnectionPage(pdf,portConnectionInfo,footerData);

	const fileName = getFilename(footerData.AssetID);
	
    pdf.save(fileName); 
	
   const currLegendState=parent.$NWP.map.getLegendState();
   const currLegendstateDictionary=getAllChildLayerVisibilityMap(currLegendState); 
   
   await syncFSELegendStates(orgLegendstateDictionary,currLegendstateDictionary);

   parent.$NWP.map.removeLegendEntry("FBE");
   parent.$NWP.map.removeLegendEntry("FSE");
   parent.$NWP.map.removeLegendEntry("FDuct");
  parent.$NWP.map.removeLegendEntry("PATH");
   parent.$NWP.map.removeLegendEntry("FCable");
   parent.$NWP.map.removeLegendEntry("DEVICE");
    parent.$NWP.map.removeLegendEntry("leaderlines");  
   
   await parent.$NWP.map.setViewState({resolution : resolution,center:center});
		
}