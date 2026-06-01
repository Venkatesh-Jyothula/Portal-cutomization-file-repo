const baseURL1 = 'https://swdclr0615.kpn.org'
//const baseURL1 = window.location.origin;
function reserveNames() {
	 let numMerkbandNames = document.getElementById('numMerkbandNames').value;
	if (!numMerkbandNames || isNaN(numMerkbandNames)) {
		parent.$NWP.msg.showInfo('Please enter a numeric value');
		return;
	}
	numMerkbandNames = parseInt(numMerkbandNames);
	if (numMerkbandNames <= 0 || numMerkbandNames > 10) {
		numMerkbandNames>10 ?  
			parent.$NWP.msg.showInfo("Can not generate more than 10 merkband names at  a time."):
			parent.$NWP.msg.showInfo("Number of merkband names to be reserved cannot be negative or zero.");
		return;
						
	}
	getMerkbandNumbers(numMerkbandNames);
}
async function getMerkbandNumbers(noOfMerkbandNumbers) {
  try {
	const ReserveMerkbandAPIUrl = `${baseURL1}/ReserveMerkbandPortalCustomService/MerkbandCustomization/reserve/${noOfMerkbandNumbers}`;
	const response = await fetch(ReserveMerkbandAPIUrl, {
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
	console.log("Merkband Numbers:", data.merkbandNumbers);
	populateReservedList(data.merkbandNumbers);
	
  } catch (error) {
	parent.$NWP.msg.showError("Error fetching Merkband numbers:" + error.message);
  }
  
}
function populateReservedList(merkbandNumbers) {
	const reservedList = document.getElementById('reservedList');
	reservedList.innerHTML = ''; // Clear existing entries

	merkbandNumbers.forEach(number => {
		const option = document.createElement('option');
		option.value = number;
		option.textContent = number;
		reservedList.appendChild(option);
	});
     if(window.parent && window.parent.$NWP && window.parent.$NWP.msg)
	    window.parent.$NWP.msg.showInfo(`${merkbandNumbers.length} Merkband numbers reserved.`);
}
async function deleteReservedMerkbandNames() {
	const reservedList = Array.from(document.getElementById('reservedList').options)
	.map(option => parseInt(option.value));

	if (reservedList.length === 0) {
		parent.$NWP.msg.showInfo("Please select Merkband numbers to delete.");
		return;
	}
	
	try {
		const DeleteMErkbandAPIUrl = `${baseURL1}/ReserveMerkbandPortalCustomService/MerkbandCustomization/DeleteReservedMerkbandNames`;
		const response = await fetch(DeleteMErkbandAPIUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(reservedList)
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		console.log(response);
		const message = await response.text();
		await parent.$NWP.msg.showInfo(message);

		closeWindow();

	} catch (error) {
		parent.$NWP.msg.showError("Error deleting Merkband numbers: " + error.message);
	}
}

function agreeAction() {
   ;
	closeWindow();
}
function disagreeAction() {
	
	deleteReservedMerkbandNames();
}
function closeWindow() {
   
	closeWindow();
}
function closeWindow() {
	if (window.parent.currentNewWindow) {
		window.parent.currentNewWindow.destroy();
	}
}