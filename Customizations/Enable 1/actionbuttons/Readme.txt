Multiple Windows Synchronisation for NetWorks Portal
Refresh Job

Purpose

CaptureEvent.js is started at the launch of NetWorks Portal.  It implements 2 events:
- FeatureSelected: storing the feature FNO and FID in a cookie when a feature is selected
- ActionButton : 
  1) it'll center the map on the feature defined by the cookie
  2) it reload the current job
  3) discard edits in the job
  4) Fit on job edits

Installation

1) Copy the file captureevents.js and tag.svg under c:\inetput\wwwroot\multiplewindows
2) adapt the portal XML file with the content of to_add_to_workspace.xml
	a) the first part must be inserted in the "Toolbar" section (under detailssearch, for example):

		<JObject>
                <JProperty name="xtype">
                  <JValue>actionbutton</JValue>
                </JProperty>
                <JProperty name="icon">
                  <JValue>../actionbuttons/tag.svg</JValue>
                </JProperty>
				<JProperty name="tooltip">
                  <JValue>Show Selected</JValue>
                </JProperty>
                <JProperty name="actionName">
                  <JValue>hiliteSelected</JValue>
                </JProperty>
              </JObject>
			  <JObject>
                <JProperty name="xtype">
                  <JValue>actionbutton</JValue>
                </JProperty>
                <JProperty name="icon">
                  <JValue>../actionbuttons/refresh.svg</JValue>
                </JProperty>
				<JProperty name="tooltip">
                  <JValue>Refresh Job</JValue>
                </JProperty>
                <JProperty name="actionName">
                  <JValue>refreshJob</JValue>
                </JProperty>
              </JObject>
		  <JObject>
                <JProperty name="xtype">
                  <JValue>actionbutton</JValue>
                </JProperty>
                <JProperty name="icon">
                  <JValue>../actionbuttons/fitjob.svg</JValue>
                </JProperty>
				<JProperty name="tooltip">
                  <JValue>Fit Job Edit</JValue>
                </JProperty>
                <JProperty name="actionName">
                  <JValue>fitJob</JValue>
                </JProperty>
              </JObject>
		  <JObject>
                <JProperty name="xtype">
                  <JValue>actionbutton</JValue>
                </JProperty>
                <JProperty name="icon">
                  <JValue>../actionbuttons/discard.svg</JValue>
                </JProperty>
				<JProperty name="tooltip">
                  <JValue>Discard Job</JValue>
                </JProperty>
                <JProperty name="actionName">
                  <JValue>discardJob</JValue>
                </JProperty>
              </JObject>

	b) insert the script section under the databasealias tag:

    <DatabaseAlias>GINIUS</DatabaseAlias>
	<Section type="scripts">
            <Script name="1">
                <Url>..\actionbuttons\CaptureEvents.js</Url>
            </Script>
        </Section>

Usage

Start NetWorks Portal.  If the new buttons are not visible in the toolbar, just purge your history.
1) Multiple Windows: Ensure you have at least 2 windows open.  Select an object in the first window.  Go to the second window and push on the new button: the view is centered on the selected object (it must be part of the legend)
2) Refresh Job: make a feature edition impacting the graphical display (color change, etc.).  Push the refresh button to see the changes directl on the screen.
3) Discard Job: will discard all the edits in the current job.  The screen is refreshed after 1 minute.
