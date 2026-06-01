/**
 * FeatureRelationships.js
 * Portal Customization – Fetch and display all relationships of a selected feature.
 *
 * Setup:
 *   1. Deploy this file alongside CommonMethods.js (loaded first via workspace config).
 *   2. Add an action button named "ShowRelationships" to the desired feature class in the
 *      Portal admin / workspace configuration.
 *   3. Deploy FeatureRelationships.html to the portal web server under
 *      /PortalCustomizations/FeatureRelationships.html
 */

// ── Configuration ────────────────────────────────────────────────────────────

/** Relationship-type numbers (G3E_RNO) to query. Adjust per data model. */
const RELATIONSHIP_RNOS = null; // null = all relationships; or e.g. '1,2,3'

/** Window dimensions for the relationships panel */
const PANEL_WIDTH  = 820;
const PANEL_HEIGHT = 560;

/** Path to the HTML panel served from the portal web root */
const PANEL_PATH = '/PortalCustomizations/FeatureRelationships.html';

// ── State ────────────────────────────────────────────────────────────────────

let relationshipsWindow = null;

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Fetch all relationships for a given feature from the FeatureDataService.
 * Returns the parsed JSON body, or null on failure.
 *
 * @param {string} featureDataServiceURL
 * @param {number} fno  Feature-class number (G3E_FNO)
 * @param {number} fid  Feature ID (G3E_FID)
 * @param {string|null} rno  Comma-separated relationship numbers, or null for all
 */
async function fetchFeatureRelationships(featureDataServiceURL, fno, fid, rno) {
    let url = `${featureDataServiceURL}/relationships/${fno}/${fid}`;
    if (rno) {
        url += `?rno=${encodeURIComponent(rno)}`;
    }
    console.log('[FeatureRelationships] Fetching relationships:', url);
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Relationships API error ${response.status}: ${response.statusText}`);
    }
    return response.json();
}

/**
 * Fetch basic attribute data for a single feature.
 *
 * @param {string} featureDataServiceURL
 * @param {number} fno
 * @param {number} fid
 */
async function fetchFeatureData(featureDataServiceURL, fno, fid) {
    const url = `${featureDataServiceURL}/feature/${fno}/${fid}`;
    const response = await fetch(url);
    if (!response.ok) {
        console.warn(`[FeatureRelationships] Could not fetch feature data for FNO=${fno} FID=${fid}`);
        return null;
    }
    return response.json();
}

/**
 * Open (or refresh) the floating relationships panel.
 *
 * @param {object} payload  Data object serialised into the URL as a query parameter
 */
function openRelationshipsPanel(payload) {
    if (relationshipsWindow) {
        try { relationshipsWindow.destroy(); } catch (_) {}
    }

    const encoded = encodeURIComponent(JSON.stringify(payload));
    const url = `${PANEL_PATH}?data=${encoded}`;

    relationshipsWindow = parent.$NWP.createWindow({
        title : `Relationships – ${payload.featureName || `FNO:${payload.fno} FID:${payload.fid}`}`,
        width : PANEL_WIDTH,
        height: PANEL_HEIGHT,
        url   : url
    });

    relationshipsWindow.show();
}

// ── Main event handler ───────────────────────────────────────────────────────

/**
 * Fired when an action button is pressed on a feature form.
 * Reacts to the button named "ShowRelationships".
 */
async function featureactionbuttonpress(args) {
    if (args.name !== 'ShowRelationships') return;

    console.log('[FeatureRelationships] featureactionbuttonpress', args);

    const feature = args.feature;
    const fno     = feature.properties.G3E_FNO;
    const fid     = feature.properties.G3E_FID;

    // Derive a human-readable feature name from properties if available
    const featureName =
        feature.properties.ASSET_ID ||
        feature.properties.DESCRIPTION ||
        feature.properties.NAME ||
        `FNO:${fno} / FID:${fid}`;

    parent.$NWP.setLoading(true);

    try {
        // ── 1. Resolve FeatureDataService URL ────────────────────────────────
        const featureDataServiceURL = await getServiceUrl('FeatureDataService');
        if (!featureDataServiceURL) {
            throw new Error('FeatureDataService URL could not be resolved.');
        }

        // ── 2. Fetch relationships ────────────────────────────────────────────
        const relData = await fetchFeatureRelationships(
            featureDataServiceURL, fno, fid, RELATIONSHIP_RNOS
        );

        const relationships = (relData && relData.relationships) ? relData.relationships : [];
        console.log(`[FeatureRelationships] Found ${relationships.length} relationship(s).`);

        // ── 3. Enrich each related feature with its display name / type ───────
        const enriched = await Promise.all(
            relationships.map(async (rel) => {
                let label = '';
                let featureTypeName = '';
                try {
                    const fd = await fetchFeatureData(featureDataServiceURL, rel.fno, rel.fid);
                    if (fd && fd.components) {
                        // Try the most common attribute tables for a useful label
                        const netElem = fd.components.GC_NETELEM?.[0];
                        label = netElem?.ASSET_ID || netElem?.DESCRIPTION || '';
                        featureTypeName = fd.featureTypeName || fd.featureClass || '';
                    }
                } catch (e) {
                    console.warn('[FeatureRelationships] Enrichment failed for', rel, e);
                }
                return {
                    fno            : rel.fno,
                    fid            : rel.fid,
                    rno            : rel.rno,
                    relationName   : rel.relationshipName || rel.relationName || '',
                    featureTypeName: featureTypeName,
                    label          : label
                };
            })
        );

        // ── 4. Open the panel ─────────────────────────────────────────────────
        openRelationshipsPanel({
            fno,
            fid,
            featureName,
            relationships: enriched
        });

    } catch (err) {
        console.error('[FeatureRelationships] Error:', err);
        parent.$NWP.showMessage({
            type   : 'error',
            message: `Could not fetch relationships: ${err.message}`
        });
    } finally {
        parent.$NWP.setLoading(false);
    }
}

// ── Register ─────────────────────────────────────────────────────────────────
parent.$NWP.on('featureactionbuttonpress', featureactionbuttonpress, null);
console.log('[FeatureRelationships] Customization loaded.');
