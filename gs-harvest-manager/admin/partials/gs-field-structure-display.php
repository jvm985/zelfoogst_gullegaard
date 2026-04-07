<div class="wrap">
    <h1>Veld Structuur Beheer</h1>
    <p>Beheer hier de velden en de indeling van blokken (rijen en kolommen).</p>

    <div id="gs-field-selector-container">
        <label for="gs-field-select">Selecteer Veld:</label>
        <select id="gs-field-select">
            <option value="">-- Kies een veld --</option>
        </select>
        <button id="gs-add-block-btn" class="button button-primary" style="display:none;">Blok Toevoegen</button>
    </div>

    <hr>

    <div id="gs-field-grid-container" style="margin-top: 20px;">
        <div id="gs-field-grid" style="display: grid; gap: 10px;">
            <!-- Grid will be rendered here by JS -->
        </div>
    </div>

    <!-- Modal for adding/editing block -->
    <div id="gs-block-modal" style="display:none; position:fixed; z-index:1000; left:0; top:0; width:100%; height:100%; background:rgba(0,0,0,0.5);">
        <div style="background:#fff; margin:10% auto; padding:20px; width:400px; border-radius:8px;">
            <h2 id="gs-modal-title">Blok Bewerken</h2>
            <form id="gs-block-form">
                <input type="hidden" id="block-id">
                <p>
                    <label>Naam:</label><br>
                    <input type="text" id="block-name" required class="regular-text">
                </p>
                <p>
                    <label>Rij:</label><br>
                    <input type="number" id="block-row" min="0" value="0">
                </p>
                <p>
                    <label>Kolom:</label><br>
                    <input type="number" id="block-col" min="0" value="0">
                </p>
                <p>
                    <button type="submit" class="button button-primary">Opslaan</button>
                    <button type="button" id="gs-close-modal" class="button">Annuleren</button>
                </p>
            </form>
        </div>
    </div>
</div>
