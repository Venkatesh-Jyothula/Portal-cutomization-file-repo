function showMessages() {
	$NWP.msg.showInfo("Information text.");
	$NWP.msg.showWarning("Warning text.");
	$NWP.msg.showError("Error text.");
}

function showOKCancel() {
	$NWP.msg.showOkCancel("Do you want to continue?").then(function(result) {console.log(result)});
}

function showYesNo() {
	$NWP.msg.showYesNo("Do you like cabbage?").then(function(result) {console.log(result)});
}