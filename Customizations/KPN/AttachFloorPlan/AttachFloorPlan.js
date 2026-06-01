async function AttachFloorPlan(){
    debugger;
    if ($NWP.map.getLegendState().legendType === 'detail'){
		const detailId = $NWP.map.getLegendState().detailId;
        if (detailId > 0){
            //get templateid
            const templateIDUrl = `${baseURL}/AttachFloorPlanPortalCustomService/api/GetTemplateID/${detailId}`;
            const templateIDResponse = await fetch(templateIDUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!templateIDResponse.ok) {
                throw new Error(`HTTP error! status: ${templateIDResponse.status}`);
            }

            const templateID = await templateIDResponse.json();    
            console.log(templateID);
            
            if (templateID > 0){
                
                const templateDetailsUrl = `${baseURL}/AttachFloorPlanPortalCustomService/api/GetTemplateDetails/${templateID}`;
                const templateDetailsResponse = await fetch(templateDetailsUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                const templateDetails = await templateDetailsResponse.json();    
                //get template name
                const templateName = templateDetails[0].TEMPLATE_NAME;
                const imageHeight = templateDetails[0].IMAGE_HEIGHT;
                const imageWidth = templateDetails[0].IMAGE_WIDTH;
                const scale = templateDetails[0].SCALE_TO_FIT;
                const xDistance = templateDetails[0].XDISTANCE;

                const imageCoordsUrl = `${baseURL}/AttachFloorPlanPortalCustomService/api/GetImageCoords`;
                const queryParams = {
                    detailID: detailId,
                    distance: xDistance,
                    imageWidth: imageWidth,
                    imageHeight:imageHeight,
                    scale:scale
                };
                const queryString = new URLSearchParams(queryParams).toString();
                const fullUrl = `${imageCoordsUrl}?${queryString}`;

                const imageCoordsResponse = await fetch(fullUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                const imageCoords = await imageCoordsResponse.json();  
                
                const templatePath = 'https://swdclr0615.kpn.org/SIma_Templates/FloorPlans';
                const imageURL = `${templatePath}/${templateName}`;
                const imageLayer = new ol.layer.Image({
                    source: new ol.source.ImageStatic({
                        url: imageURL,
                        imageExtent: imageCoords , // calculated from world file
                        projection: 'EPSG:28992' // or your custom projection
                    }),
					zIndex:-1
                });

                $NWP.map.getOlMapObject().addLayer(imageLayer);

                $NWP.map.getOlMapObject().getView().fit(imageCoords, {
                    size: $NWP.map.getOlMapObject().getSize(),
                    padding: [50, 50, 50, 50], // Optional padding
                    duration: 1000 // Optional animation
                });


            } 
            
        }
    }
    else{
        $NWP.msg.showInfo("Please select detail window to attach floorplan");
    }
}