/*
 * predefined [EPSG:3821] projection
 * Please make sure your desired projection can find on http://epsg.io/
 *
 * Usage :
 *      loadshp({
 *          url: '/shp/test.zip', // path or your upload file
 *          encoding: 'big5', // default utf-8
 *          sourceEPSG: 3826, // default 4326
 *			displayEPSG: 1234,//default 4326
 *			file: file.shp, //the file to read; default=first file in the zip
 *			extent: double[4] //the bounding box (in the display EPSG) of the objects to return;
 *			loaddbf: bool //Indicates if the dbf file must be processed as well
 *      }, function(geojson) {
 *          // geojson returned
 *      });
 *
 * Created by Gipong <sheu781230@gmail.com>
 * Adapted by JF Allard - June 2020:
 * Updated for OL6
 * Sequential process shp ==> dbf; the initial process was not guarantying the total process when called many times.
 * Adapted callbacks (shploader), aloowed the ability to load only the graphics and included a spatial filter
 * Removed global variables that made impossible successive calls
 *
 */

var EPSGUser, url, encoding, EPSG, datasourceEPSG;
var zoneExtent, useExtent, loadDBF;


function loadshp(config, returnData) {
//console.log("in loadshp");

	datasourceEPSG=typeof config.sourceEPSG != 'undefined' ? config.sourceEPSG : "4326";; //"EPSG:28992"; //"EPSG:4258"; //Coordinate system of the data stored in the shape files
    datasourceEPSG="EPSG:"+datasourceEPSG;
	url = config.url;
    encoding = typeof config.encoding != 'utf-8' ? config.encoding : 'utf-8';
    EPSG = typeof config.displayEPSG != 'undefined' ? config.displayEPSG : "4326";
	EPSG="EPSG:"+EPSG;
	if(typeof config.extent!='undefined'){
		zoneExtent=config.extent;
		useExtent=true;
	}
	else{
		useExtent=false;
	}
	if(typeof config.loaddbf!='undefined'){
		loadDBF=config.loaddbf;
	}
	else{
		loadDBF=false;
	}

    EPSGUser = EPSG; //The coordinate system used for the display

    if(typeof url != 'string'){
//console.log("url not a string");
        var reader = new FileReader();
        reader.onload = function(e){
            var URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
            var zip = new JSZip(e.target.result);
            var shpString,dbfstring;
			if(typeof config.file!='undefined'){
				shpString =  config.file;
				dbfString = config.file.split(".shp")[0]+".dbf";
			}
			else{
				shpString =  zip.file(/.shp$/i)[0].name;
				dbfString = zip.file(/.dbf$/i)[0].name;
			}

			var inputData={};
//console.log("before parser:" + shpString);
            SHPParser.load(URL.createObjectURL(new Blob([zip.file(shpString).asArrayBuffer()])), shpLoader, returnData,shpString,zip,inputData);
/*
			if(typeof config.loaddbf!='undefined'){
				if(config.loaddbf==true){
					DBFParser.load(URL.createObjectURL(new Blob([zip.file(dbfString).asArrayBuffer()])), encoding, dbfLoader, returnData,shpString);
				}
			}
*/
        }
        reader.readAsArrayBuffer(url);
    } else {
//console.log("url is a string");
		JSZipUtils.getBinaryContent(url, function(err, data) {
			if(err) throw err;
			var URL = window.URL || window.webkitURL;
			var zip = new JSZip(data);
			var shpString,dbfstring;
			if(typeof config.file!='undefined'){
				shpString =  config.file;
				dbfString = config.file.split(".shp")[0]+".dbf";
			}
			else{
				shpString =  zip.file(/.shp$/i)[0].name;
				dbfString = zip.file(/.dbf$/i)[0].name;
			}
//console.log("before SHP parser:" + shpString);
			var inputData={};
			SHPParser.load(URL.createObjectURL(new Blob([zip.file(shpString).asArrayBuffer()])), shpLoader, returnData,shpString,zip,inputData);

/*
			if(loadDBF){
//console.log("before DBF parser:" + dbfString);
				DBFParser.load(URL.createObjectURL(new Blob([zip.file(dbfString).asArrayBuffer()])), encoding, dbfLoader, returnData,shpString);
			}
*/
		});
	}
    //});
}

function loadEPSG(url, callback) {
    var script = document.createElement('script');
    script.src = url;
    script.onreadystatechange = callback;
    script.onload = callback;
    document.getElementsByTagName('head')[0].appendChild(script);
}

function TransCoord(x, y) {
//console.log("avant: x,y= " + x+ " - " + y);
//console.log("EPSGUser="+EPSGUser+" , sourceEPSG:" + datasourceEPSG);
    if(proj4)
		var p=parent.ol.proj.transform([parseFloat(x), parseFloat(y)],datasourceEPSG,EPSGUser);
		//var p = proj4(EPSGUser, datasourceEPSG , [parseFloat(x), parseFloat(y)]);

    return {x: p[0], y: p[1]};
}

function shpLoader(data, returnData,fileName,zip,inputData) {
//console.log("ds shapeloader");
    inputData['shp'] = data;
	if(loadDBF){
		var dbfString = fileName.split(".shp")[0]+".dbf";
//console.log("before DBF parser:" + dbfString);
		DBFParser.load(URL.createObjectURL(new Blob([zip.file(dbfString).asArrayBuffer()])), encoding, dbfLoader, returnData,fileName,inputData);
	}
	else{
		if(inputData['shp']){
//console.log("return from shp2");
			if(returnData) returnData(  toGeojson(inputData),fileName  );
		}
	}
}

function dbfLoader(data, returnData,fileName,inputData) {
    inputData['dbf'] = data;

    if(inputData['shp'] && inputData['dbf']){
//console.log("return from dbf");
        if(returnData) returnData(  toGeojson(inputData),fileName  );
	}
}

function toGeojson(geojsonData) {
    var geojson = {},
    features = [],
    feature, geometry, points;

    var shpRecords = geojsonData.shp.records;
	var dbfRecords;
	if(loadDBF){
		dbfRecords = geojsonData.dbf.records;
	}

    geojson.type = "FeatureCollection";
	geojson.crs={
				'type': 'name',
				'properties': {
					'name': EPSGUser
				}
			};
    min = TransCoord(geojsonData.shp.minX, geojsonData.shp.minY);
    max = TransCoord(geojsonData.shp.maxX, geojsonData.shp.maxY);
    geojson.bbox = [
        min.x,
        min.y,
        max.x,
        max.y
    ];
	

    geojson.features = features;

//console.log("nb records="+shpRecords.length);

    for (var i = 0; i < shpRecords.length; i++) {
//console.log(shpRecords[i].shape);
//console.log("maxX="+shpRecords[i].shape.content.maxX);
		if(useExtent){
			min = TransCoord(shpRecords[i].shape.content.minX, shpRecords[i].shape.content.minY);
			max = TransCoord(shpRecords[i].shape.content.maxX, shpRecords[i].shape.content.maxY);
//console.log("min, max");
//console.log(min);
//console.log(max);
//console.log("zone:")
//console.log(zoneExtent);
			if(max.x<zoneExtent[0] || max.y<zoneExtent[1] ||
				min.x>zoneExtent[2] || min.y>zoneExtent[3]){
//console.log("outside zone");
				continue;
			}
		}
        feature = {};
        feature.type = 'Feature';
        geometry = feature.geometry = {};
		if(loadDBF){
			feature.properties = dbfRecords[i];
		}
		else{
			feature.properties = null;
		}

        // point : 1,1 , polyline : 3,13 , polygon : 5,15, multipoint : 8,18
        switch(shpRecords[i].shape.type) {
            case 1:
			case 11:
			case 21:
                geometry.type = "Point";
                var reprj = TransCoord(shpRecords[i].shape.content.x, shpRecords[i].shape.content.y);
                geometry.coordinates = [
                    reprj.x, reprj.y
                ];
                break;
            case 3:
            case 8:
			case 13:
			case 18:
			case 23:
			case 28:
				geometry.type="MultiPoint";
                if(shpRecords[i].shape.type == 3 || shpRecords[i].shape.type == 13 || shpRecords[i].shape.type == 23)
				{
					geometry.type="LineString";
				}
				
                geometry.coordinates = [];
                for (var j = 0; j < shpRecords[i].shape.content.points.length; j+=2) {
                    var reprj = TransCoord(shpRecords[i].shape.content.points[j], shpRecords[i].shape.content.points[j+1]);
                    geometry.coordinates.push([reprj.x, reprj.y]);
                };
                break;
            case 5:
			case 15:
			case 25:
                geometry.type = "Polygon";
                geometry.coordinates = [];

                for (var pts = 0; pts < shpRecords[i].shape.content.parts.length; pts++) {
                    var partsIndex = shpRecords[i].shape.content.parts[pts],
                        part = [],
                        dataset;

                    for (var j = partsIndex*2; j < (shpRecords[i].shape.content.parts[pts+1]*2 || shpRecords[i].shape.content.points.length); j+=2) {
                        var point = shpRecords[i].shape.content.points;
                        var reprj = TransCoord(point[j], point[j+1]);
                        part.push([reprj.x, reprj.y]);
                    };
                    geometry.coordinates.push(part);

                };
                break;
            default:
        }
        if("coordinates" in feature.geometry) features.push(feature);
    };
//	console.log("End of geojson creation " + geojson);
    return geojson;
}
