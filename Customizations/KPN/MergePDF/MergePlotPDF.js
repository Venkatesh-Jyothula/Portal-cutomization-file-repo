const API_BASE_URL = `https://swdclr0615.kpn.org/MergePDFCustomizationService/MergePDFCustomization/GetPDFUrls/`

function getPageFromUrl(url) {
	if (!url) return Number.MAX_SAFE_INTEGER;

	const m = url.match(/\((\d+)_\d+\)/i);
	if (m) return Number(m[1]);

	const fallback = url.match(/page(?:=|_|-)(\d+)/i);
	if (fallback) return Number(fallback[1]);

	return Number.MAX_SAFE_INTEGER;
}

function normalizeItems(apiData) {
	if (!Array.isArray(apiData)) {
		return [];
	}

	return apiData
		.filter((url) => typeof url === 'string' && url.trim().length > 0)
		.map((url, index) => ({
			id: String(index + 1),
			url,
			pageNo: getPageFromUrl(url),
		}))
		.filter(Boolean)
		.sort((a, b) => {
			if (a.pageNo !== b.pageNo) return a.pageNo - b.pageNo;
			return a.id.localeCompare(b.id);
		});
}

function pickOverviewAndPlots(items) {
	let overviewItem = null;
	const plots = [];

	for (const item of items) {
		if (!overviewItem && /overviewplot/i.test(item.url)) {
			overviewItem = item;
			continue;
		}
		plots.push(item);
	}

	if (!overviewItem) {
		throw new Error('Overview plot URL not found in API response.');
	}

	return { overviewUrl: overviewItem.url, plots };
}

async function fetchJson(apiUrl) {
	const res = await fetch(apiUrl, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
});
	if (!res.ok) {
		throw new Error(`API request failed (${res.status}): ${apiUrl}`);
	}
	const data = await res.json();
	if (!data || !Array.isArray(data.pdfUrls)) {
		throw new Error('Unexpected API response format: missing pdfUrls array.');
	}
	return data.pdfUrls;
}

async function fetchPdfArrayBuffer(url) {
	// Encode special characters (spaces, parentheses) that appear in the PDF filenames
	const encodedUrl = url.replace(/ /g, '%20').replace(/\(/g, '%28').replace(/\)/g, '%29');
	const res = await fetch(encodedUrl, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
});
	if (!res.ok) {
		throw new Error(`PDF download failed (${res.status}): ${url}`);
	}
	// Return raw ArrayBuffer; mergePdfBuffers wraps it with the parent frame's Uint8Array
	// so pdf-lib's cross-frame instanceof check passes correctly.
	return res.arrayBuffer();
}

function downloadBlob(blob, fileName) {
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = fileName;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}

function getOutputFileName() {
	const now = new Date();
	const yyyy = now.getFullYear();
	const mm = String(now.getMonth() + 1).padStart(2, '0');
	const dd = String(now.getDate()).padStart(2, '0');
	const hh = String(now.getHours()).padStart(2, '0');
	const mi = String(now.getMinutes()).padStart(2, '0');
	const ss = String(now.getSeconds()).padStart(2, '0');
	return `MergedPlot_${yyyy}${mm}${dd}_${hh}${mi}${ss}.pdf`;
}

async function mergePdfBuffers(urls) {
    const { PDFDocument, PDFName, PDFDict } = window.parent.PDFLib;
    // Use the parent frame's Uint8Array so pdf-lib's instanceof check passes
    // when PDFLib is loaded in the parent frame and this script runs in an iframe.
    const Uint8ArrayCtor = (window.parent || window).Uint8Array;
    const mergedPdf = await PDFDocument.create();

    for (const url of urls) {
        const srcBytes = await fetchPdfArrayBuffer(url);
        const srcPdf = await PDFDocument.load(new Uint8ArrayCtor(srcBytes));

        const pageIndices = srcPdf.getPageIndices(); // [0,1,2...]
        const copiedPages = await mergedPdf.copyPages(srcPdf, pageIndices);

        for (const page of copiedPages) {
            mergedPdf.addPage(page);
        }
    }

    // pdf-lib copies OCG objects that are referenced from within pages
    // (via /OC entries or /Resources/Properties), but it never rebuilds
    // the catalog /OCProperties entry that PDF viewers require to enumerate
    // and toggle layers.  Without it, viewers flatten all content and the
    // layers panel is empty.
    //
    // Fix: scan every indirect object in the merged context, collect the
    // ones with /Type /OCG (already copied, just not registered), and
    // write a valid /OCProperties entry into the merged catalog.
    const context = mergedPdf.context;
    const ocgRefs = [];

    for (const [ref, obj] of context.enumerateIndirectObjects()) {
        if (obj instanceof PDFDict) {
            const typeVal = obj.get(PDFName.of('Type'));
            if (typeVal && typeVal.toString() === '/OCG') {
                ocgRefs.push(ref);
            }
        }
    }

    if (ocgRefs.length > 0) {
        // /BaseState ON  → all layers visible by default (matches source behaviour).
        // /ON lists every OCG explicitly so viewers that ignore BaseState still
        // show all layers.  /Order provides the flat layer list in the UI panel.
        mergedPdf.catalog.set(
            PDFName.of('OCProperties'),
            context.obj({
                OCGs: ocgRefs,
                D: context.obj({
                    BaseState: PDFName.of('ON'),
                    ON: ocgRefs,
                    Order: ocgRefs,
                }),
            })
        );
    }

    return mergedPdf.save();
}

async function generateMergedPlotPdf(requestId) {
    if (!requestId) {
        throw new Error('requestId is required to fetch PDF URLs.');
    }

    if (!window.parent.PDFLib || !window.parent.PDFLib.PDFDocument) {
        throw new Error('pdf-lib is not loaded. Include pdf-lib.min.js before mergePlotPDF.js');
    }

    const apiUrl = API_BASE_URL + encodeURIComponent(requestId);
    const apiData = await fetchJson(apiUrl);
    const items = normalizeItems(apiData);

    if (!items.length) {
        throw new Error('No valid PDF entries found in API response.');
    }

    const { overviewUrl, plots } = pickOverviewAndPlots(items);
    const orderedUrls = plots.map((p) => p.url).concat(overviewUrl);

    const mergedBytes = await mergePdfBuffers(orderedUrls);
    const blob = new Blob([mergedBytes], { type: 'application/pdf' });
    downloadBlob(blob, getOutputFileName());
}

window.generateMergedPlotPdf = generateMergedPlotPdf;
