async function handleHighlightContainer(args) {
   
   console.log(args);
    const fid = args.G3E_FID;
    const fno = args.G3E_FNO;
    const legendState = $NWP.map.getLegendState().legendType;
    const rno = '3,6';
	//const featureDataService = 'https://swdclr0586.kpnnl.local/KPNNwFeatureDataService';

    try {
		if(fno==5000) { return;}
		
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
			 /*let detailApiUrl = `${featureDataService}/relationships/${fno}/${fid}`;
			const detailrno = 5;
			detailApiUrl += `?rno=${encodeURIComponent(detailrno)}`;
			const responsedetailfeatureData = await fetch(detailApiUrl);
			const DetailRelationsTabdata = await responsedetailfeatureData.json();
			console.log(DetailRelationsTabdata);

			if (DetailRelationsTabdata && DetailRelationsTabdata.relationships && DetailRelationsTabdata.relationships.length > 0) { 
				for (const relation of DetailRelationsTabdata.relationships) {
					const detailparentfno = relation.fno;
					const detailparentfid = relation.fid;
					 highlightfeatures.push({ fid: detailparentfid, fno: detailparentfno });
				}
			} */
			 
			let detailApiUrl = `${featureDataService}/details/${fno}/${fid}`;
			console.log(detailApiUrl);
			const responsedetailfeatureData = await fetch(detailApiUrl);
			console.log(responsedetailfeatureData);
			const DetailRelationsTabdata = await responsedetailfeatureData.json();
			console.log(DetailRelationsTabdata);

			if (DetailRelationsTabdata && DetailRelationsTabdata.partof && DetailRelationsTabdata.partof.length > 0) { 
				for (const relation of DetailRelationsTabdata.partof) {
					const detailparentfno = relation.ownerfno;
					const detailparentfid = relation.ownerfid;
					 highlightfeatures.push({ fid: detailparentfid, fno: detailparentfno });
				}
			}
		}
    } catch (error) {
        console.error(`Error fetching feature data for FNO: ${fno}, FID: ${fid}, RNO: ${rno}`, error);
    }
}
