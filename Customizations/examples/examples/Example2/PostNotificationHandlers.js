function TestNotifications(options) {
};
TestNotifications.prototype.registerHandlers = function() {
  var me = this;
  $NWP.on('actionbuttonpress', me.actionHandler, me);
  $NWP.on('mapactionbuttonpress', me.mapActionHandler, me);
  $NWP.on('drawactionbuttonpress', me.drawActionHandler, me);
  $NWP.on('featureactionbuttonpress', me.featureActionHandler, me);
  $NWP.on('featureselected', me.featureSelectedHandler, me);
  $NWP.on('featureselectclear', me.featureSelectClearHandler, me);
  $NWP.on('mapviewupdated', me.mapViewUpdatedHandler, me);
  $NWP.on('maplegendchanged', me.mapLegendChangedHandler, me);
  $NWP.on('maplegendupdated', me.mapLegendUpdatedHandler, me);
  $NWP.on('gtechfeatureload', me.gtechFeatureLoadHandler, me);
  $NWP.on('sidebarpanelupdated', me.sidebarPanelUpdated, me);
};
TestNotifications.prototype.unregisterHandlers = function() {
  var me = this;
  $NWP.un('actionbuttonpress', me.actionHandler, me);
  $NWP.un('mapactionbuttonpress', me.mapActionHandler, me);
  $NWP.un('drawactionbuttonpress', me.drawActionHandler, me);
  $NWP.un('featureactionbuttonpress', me.featureActionHandler, me);
  $NWP.un('featureselected', me.featureSelectedHandler, me);
  $NWP.un('featureselectclear', me.featureSelectClearHandler, me);
  $NWP.un('mapviewupdated', me.mapViewUpdatedHandler, me);
  $NWP.un('maplegendchanged', me.mapLegendChangedHandler, me);
  $NWP.un('maplegendupdated', me.mapLegendUpdatedHandler, me);
  $NWP.un('gtechfeatureload', me.gtechFeatureLoadHandler, me);
  $NWP.un('sidebarpanelupdated', me.sidebarPanelUpdated, me);
};
TestNotifications.prototype.actionHandler = function(args) {
  console.log('actionbuttonpress');
  console.log(args);
};
TestNotifications.prototype.mapActionHandler = function(args) {
  console.log('mapactionbuttonpress');
  console.log(args);
}
TestNotifications.prototype.drawActionHandler = function(args) {
  console.log('drawactionbuttonpress');
  console.log(args);
}
TestNotifications.prototype.featureActionHandler = function(args) {
  console.log('featureactionbuttonpress');
  console.log(args);
}
TestNotifications.prototype.featureSelectedHandler = function(args) {
  console.log('featureselected');
  console.log(args);
}
TestNotifications.prototype.featureSelectClearHandler = function(args) {
  console.log('featureselectclear');
  console.log(args);
}
TestNotifications.prototype.mapViewUpdatedHandler = function(args) {
  console.log('mapviewupdated ' + this.scopeValue);
  console.log(args);
}
TestNotifications.prototype.mapLegendChangedHandler = function(args) {
  console.log('maplegendchanged');
  console.log(args);
}
TestNotifications.prototype.mapLegendUpdatedHandler = function(args) {
  console.log('maplegendupdated');
  console.log(args);
}
TestNotifications.prototype.gtechFeatureLoadHandler = function(args) {
  console.log('gtechfeatureload');
  console.log(args);
}
TestNotifications.prototype.sidebarPanelUpdated = function(args) {
  console.log('sidebarpanelupdated');
  console.log(args);
}
var test = new TestNotifications();
test.registerHandlers();
console.log('Loaded TestNotifications.js');
