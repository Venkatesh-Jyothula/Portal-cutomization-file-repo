Update G3E_ATTRIBUTE set g3e_pno = (select g3e_pno from g3e_picklist where g3e_username = 'Enable Address DeployStatus') WHERE G3E_FIELD IN ('DEPLOY_STATUS') AND G3E_CNO in (SELECT DISTINCT G3E_CNO FROM G3E_COMPONENT WHERE G3E_TABLE ='EN_ADDRESS_LB');

Update G3E_ATTRIBUTE set g3e_pno = (select g3e_pno from g3e_picklist where g3e_username = 'Y or N Values') WHERE G3E_FIELD IN ('ARCHIVED') AND G3E_CNO in (SELECT DISTINCT G3E_CNO FROM G3E_COMPONENT WHERE G3E_TABLE ='EN_ADDRESS_LB');


-- Requirement 01
Insert into G3E_FINDQUICK (G3E_FQNO,G3E_USERNAME,G3E_SQL,G3E_AOILI,G3E_ROLE) values (G3E_FINDQUICK_SEQ.NEXTVAL,'Address Display','select G3E_FNO, G3E_FID, FSL as FSL, INITCAP(COMPLETE_ADDRESS) as Address, INITCAP(FULL_RD_NM) as "Road Name",  INITCAP(SUBURB) as "Suburb", DEPLOY_STATUS as "Status" from en_address_lb where deploy_status = ? and archived = ''N''',0,'ADMINISTRATOR');

Insert into G3E_FINDQUICKATTRIBUTE (G3E_FQAROWNO,G3E_FQNO,G3E_ANO,G3E_NULL,G3E_ORDINAL,G3E_REFERENCEORDINAL,G3E_PROMPT) values (G3E_FINDQUICKATTRIBUTE_seq.nextval,(select g3e_fqno from G3E_FINDQUICK where g3e_username = 'Address Display' ),(SELECT G3E_ANO FROM G3E_ATTRIBUTE WHERE G3E_FIELD IN ('DEPLOY_STATUS') AND G3E_CNO in (SELECT DISTINCT G3E_CNO FROM G3E_COMPONENT WHERE G3E_TABLE ='EN_ADDRESS_LB')),0,1,0,'Deploy Status');

Insert into G3E_ANALYSISMAPPING (G3E_AMNO,G3E_ACNO,G3E_ANALYSISKEY,G3E_ATNO,G3E_QUICKSEARCH,G3E_USERNAME) values (G3E_ANALYSISMAPPING_seq.nextval,4,(select g3e_fqno from G3E_FINDQUICK where g3e_username = 'Address Display' ),4,1,'Address Display');

update G3E_FINDQUICK set g3e_Sql = 'select G3E_FNO, G3E_FID, FSL, INITCAP(COMPLETE_ADDRESS) as "Address", INITCAP(FULL_RD_NM) as "Road Name",  INITCAP(SUBURB) as "Suburb", DEPLOY_STATUS as "Status" from en_address_lb where deploy_status = ? and archived = ''N'' order by FSL desc', G3E_APPLICATION = 8 where  g3e_username = 'Address Display';
-- Requirement 03
Insert into G3E_FINDQUICK (G3E_FQNO,G3E_USERNAME,G3E_SQL,G3E_AOILI,G3E_ROLE,G3E_APPLICATION) values (G3E_FINDQUICK_SEQ.NEXTVAL,'Address to Network Entry','select a.G3E_FNO, a.G3E_FID, a.FSL, INITCAP(a.COMPLETE_ADDRESS) as "Address", INITCAP(a.FULL_RD_NM) as "Roadname", INITCAP(a.SUBURB) as "Suburb", a.DEPLOY_STATUS as "Status" from EN_ADDRESS_LB a left outer join GC_FBRANCH_FSLS_N f on a.fsl = f.fsl where a.deploy_status = ? and f.fsl is null ORDER BY A.FSL DESC',0,'ADMINISTRATOR',8);

Insert into G3E_FINDQUICKATTRIBUTE (G3E_FQAROWNO,G3E_FQNO,G3E_ANO,G3E_NULL,G3E_ORDINAL,G3E_REFERENCEORDINAL,G3E_PROMPT) values (G3E_FINDQUICKATTRIBUTE_seq.nextval,(select g3e_fqno from G3E_FINDQUICK where g3e_username = 'Address to Network Entry' ),(SELECT G3E_ANO FROM G3E_ATTRIBUTE WHERE G3E_FIELD IN ('DEPLOY_STATUS') AND G3E_CNO in (SELECT DISTINCT G3E_CNO FROM G3E_COMPONENT WHERE G3E_TABLE ='EN_ADDRESS_LB')),0,1,0,'Deploy Status');

Insert into G3E_ANALYSISMAPPING (G3E_AMNO,G3E_ACNO,G3E_ANALYSISKEY,G3E_ATNO,G3E_QUICKSEARCH,G3E_USERNAME) values (G3E_ANALYSISMAPPING_seq.nextval,4,(select g3e_fqno from G3E_FINDQUICK where g3e_username = 'Address to Network Entry' ),4,1,'Address to Network Entry');

--
Update g3e_Findquick set g3e_role = 'ADMINISTRATOR' where g3e_username in ('Address to Network Entry','Address Display');

--
http://VENBGT104PDC1.INGRNET.COM/NetWorksSolutionService/ENPROD/analytical
http://VENBGT104PDC1.INGRNET.COM/NwFeatureTransactionService/transaction
{
  "transactions": [
    {
      "type": "UpdateFeature",
      "fref": 1,
      "G3E_FNO": 112,
      "G3E_FID": 381678188
    },
    {
      "type": "UpdateComponent",
      "fref": 1,
      "G3E_CNO": 11203,
      "G3E_CID": 1,
      "attributes": {
        "DEPLOY_STATUS": 3
      }
    }
  ]
}

http://VENBGT104PDC1.INGRNET.COM/NetWorksSolutionService/enprod/


http://VENBGT104PDC1.INGRNET.COM/NetWorksSolutionService/enprod/analytical  --  "Url": "http://venbgt104pdc1.ingrnet.com/NwAnalyticalService1905"

http://venbgt104pdc1.ingrnet.com/NwAnalyticalService1905/search/quicksearches  -- "UserName": "Address Display"
http://{HostName}/{AnalyticalServiceName}/search/searches[?application={application} | apiVersion={apiVersion}]

http://VENBGT104PDC1.INGRNET.COM/NwFeatureTransactionService/transaction
{
  "transactions": [
    {
      "type": "UpdateFeature",
      "fref": 1,
      "G3E_FNO": 112,
      "G3E_FID": 381678188
    },
    {
      "type": "UpdateComponent",
      "fref": 1,
      "G3E_CNO": 11203,
      "G3E_CID": 1,
      "attributes": {
        "DEPLOY_STATUS": 3
      }
    }
  ]
}
















http://VENBGT104PDC1.INGRNET.COM/NetWorksSolutionService/ENPROD/job
http://venbgt104pdc1.ingrnet.com/NwJobService1905/jobs?owner=ENPROD&description=APACCOMMAND&Status=Open
http://venbgt104pdc1.ingrnet.com/NwPortal1905/default/services/gtdwsrw




-- Working 

-- Getting job service
http://VENBGT104PDC1.INGRNET.COM/NetWorksSolutionService/ENPROD/job
[
    {
        "Name": "NwWms1905",
        "Type": "WMS",
        "Description": "",
        "Configuration": "GTFOWPROD",
        "Url": "http://venbgt104pdc1.ingrnet.com/NwWms1905",
        "AnalyticalServiceUrl": "http://venbgt104pdc1.ingrnet.com/NwAnalyticalService1905",
        "GtdwsUrl": "http://venbgt104pdc1.ingrnet.com/NwGtdws1905"
    },
    {
        "Name": "NwVectorService1905",
        "Type": "VectorService",
        "Description": "",
        "Configuration": "GTFOWPROD",
        "Url": "http://venbgt104pdc1.ingrnet.com/NwVectorService1905",
        "AnalyticalServiceUrl": "http://venbgt104pdc1.ingrnet.com/NwAnalyticalService1905",
        "GtdwsUrl": "http://venbgt104pdc1.ingrnet.com/NwGtdws1905"
    },
    {
        "Name": "NwGtdws1905",
        "Type": "GTDWS",
        "Description": "",
        "Configuration": "GTFOWPROD",
        "Url": "http://venbgt104pdc1.ingrnet.com/NwGtdws1905",
        "AnalyticalServiceUrl": "http://venbgt104pdc1.ingrnet.com/NwAnalyticalService1905",
        "GtdwsUrl": "http://venbgt104pdc1.ingrnet.com/NwGtdws1905"
    },
    {
        "Name": "NwAnalyticalService1905",
        "Type": "AnalyticalService",
        "Description": "",
        "Configuration": "GTFOWPROD",
        "Url": "http://venbgt104pdc1.ingrnet.com/NwAnalyticalService1905",
        "AnalyticalServiceUrl": "http://venbgt104pdc1.ingrnet.com/NwAnalyticalService1905",
        "GtdwsUrl": "http://venbgt104pdc1.ingrnet.com/NwGtdws1905"
    },
    {
        "Name": "NwJobService1905",
        "Type": "JobService",
        "Description": "",
        "Configuration": "GTFOWPROD",
        "Url": "http://venbgt104pdc1.ingrnet.com/NwJobService1905",
        "AnalyticalServiceUrl": "http://venbgt104pdc1.ingrnet.com/NwAnalyticalService1905",
        "GtdwsUrl": "http://venbgt104pdc1.ingrnet.com/NwGtdws1905"
    },
    {
        "Name": "NwFeatureTransactionService",
        "Type": "FeatureTransactionService",
        "Description": "",
        "Configuration": "GTFOWPROD",
        "Url": "http://venbgt104pdc1.ingrnet.com/NwFeatureTransactionService",
        "AnalyticalServiceUrl": "http://venbgt104pdc1.ingrnet.com/NwAnalyticalService1905",
        "GtdwsUrl": "http://venbgt104pdc1.ingrnet.com/NwGtdws1905"
    },
    {
        "Name": "NwFeatureDataService",
        "Type": "FeatureDataService",
        "Description": "",
        "Configuration": "GTFOWPROD",
        "Url": "http://venbgt104pdc1.ingrnet.com/NwFeatureDataService",
        "AnalyticalServiceUrl": "http://venbgt104pdc1.ingrnet.com/NwAnalyticalService1905",
        "GtdwsUrl": "http://venbgt104pdc1.ingrnet.com/NwGtdws1905"
    }
]
-- Getting jobs by owner 
http://venbgt104pdc1.ingrnet.com/NwJobService1905/jobs?owner=ENPROD
-- Getting job information 
http://venbgt104pdc1.ingrnet.com/NwJobService1905/jobs?id=144374
[
    {
        "Identifier": "144374",
        "Description": "",
        "Owner": "ENPROD",
        "Status": "Open",
        "Properties": []
    }
]
-- Environment
http://venbgt104pdc1.ingrnet.com/NwJobService1905/jobs?id=144374&jobDialogType=G3E_JOBENVIRONMENT


--
http://VENBGT104PDC1.INGRNET.COM/NWJobService1905/JOB/
[
    {
        "Identifier": "144374",
        "Description": "",
        "Owner": "ENPROD",
        "Status": "Open",
        "Properties": [
            {
                "FieldName": "WORK_ORDER_ID",
                "UserName": "Work Order ID",
                "Value": "144374",
                "DataType": 10,
                "IsReadonly": true,
                "Ano": 7312,
                "IsPicklist": false
            },
            {
                "FieldName": "JOB_TYPE",
                "UserName": "Job Type",
                "Value": "S",
                "DataType": 10,
                "IsReadonly": true,
                "Ano": 7310,
                "IsPicklist": false
            },
            {
                "FieldName": "JOB_STATE",
                "UserName": "Job State",
                "Value": "PRP",
                "DataType": 10,
                "IsReadonly": true,
                "Ano": 7311,
                "IsPicklist": false
            },
            {
                "FieldName": "G3E_CREATION",
                "UserName": "Date of Job Creation",
                "Value": "6/4/2024 3:59:29 PM",
                "DataType": 8,
                "IsReadonly": true,
                "Ano": 7305,
                "IsPicklist": false
            },
            {
                "FieldName": "G3E_POSTED",
                "UserName": "GComms Last Post Date",
                "Value": "",
                "DataType": 8,
                "IsReadonly": true,
                "Ano": 7306,
                "IsPicklist": false
            },
            {
                "FieldName": "G3E_CLOSED",
                "UserName": "Date of Job Closed",
                "Value": "",
                "DataType": 8,
                "IsReadonly": true,
                "Ano": 7307,
                "IsPicklist": false
            },
            {
                "FieldName": "COMPANY_OWNERSHIP",
                "UserName": "Company Ownership",
                "Value": "COMPANY",
                "DataType": 10,
                "IsReadonly": true,
                "Ano": 7317,
                "IsPicklist": false
            }
        ]
    }
]
http://in-gtechdevvm17.INGRNET.COM/NwFeatureTransactionService/transaction?jobs=BHK017
{
  "transactions": [
    {
      "type": "UpdateFeature",
      "fref": 1,
      "G3E_FNO": 2200,
      "G3E_FID": 57936
    },
    {
      "type": "UpdateComponent",
      "fref": 1,
      "G3E_CNO": 2201,
      "G3E_CID": 1,
      "attributes": {
        "MEASURED_LENGTH": 2
      }
    }
  ]
}

http://in-gtechdevvm05.INGRNET.COM/NWJobService/job/bk001/post
http://in-gtechdevvm05.INGRNET.COM/NWJobService/job/Maesch/validate

-- Requirement 3
$NWP.features.getSelectionSet()
$NWP.sidebar.getPanels()
$NWP.map.drawGeometry($NWP.map.geometryType.POINT).then(function(result)
{console.log(result)});
Get Features By Filter
$NWP.map.getViewState()-- resolution
$NWP.map.drawGeometry($NWP.map.geometryType.POINT).then(function(result) {
    if (result && result.type === 'Point' && Array.isArray(result.coordinates)) {
        const [x, y] = result.coordinates;
        const radius = 10; // 10 meter radius

        const minX = x - radius;
        const maxX = x + radius;
        const minY = y - radius;
        const maxY = y + radius;

        const boundingBox = {
            minX: minX,
            minY: minY,
            maxX: maxX,
            maxY: maxY
        };

        console.log('Bounding Box:', boundingBox);
    } else {
        console.log('Invalid result:', result);
    }
});

-- bbox
http://venbgt104pdc1.ingrnet.com/NwVectorService1905/data
{"lsno":1,"bbox":[1564604.2160094033,5177799.451368885,1564610.9732594031,5177808.239568885],"resolution":0.007549999999999992,"entries":[{"l":422201,"s":1},{"l":422001,"s":1}],"filters":null}
{"lsno":1,"bbox":[1564636.13,5177806.403,1564656.13,5177826.403],"resolution":0.007549999999999992,"entries":[{"l":422201,"s":1},{"l":422001,"s":1}],"filters":null}


{"lsno":1,"bbox":boundingBox,"resolution":resolution,"entries":[{"l":vLeno,"s":1}],"filters":null}

					parent.$NWP.msg.showInfo("Leno:"+vLeno);
					parent.$NWP.msg.showInfo("DataURL:"+DataURL);
					parent.$NWP.msg.showInfo("boundingBox:"+boundingBox);
					parent.$NWP.msg.showInfo("resolution:"+resolution);
					

{"lsno":1,"bbox":[1307880.2798301615,5579398.478188068,1307900.2798301615,5579418.478188068],"resolution":152.87,"entries":[{"l":"422001","s":1}],"filters":null}