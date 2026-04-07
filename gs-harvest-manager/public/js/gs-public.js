(function($) {
    'use strict';

    $(function() {
        const root = $('#gs-harvest-map-root');
        if (!root.length) return;

        fetchFields();

        function fetchFields() {
            $.get(gs_vars.api_url + '/fields', function(fields) {
                renderFields(fields);
            });
        }

        function renderFields(fields) {
            root.empty();
            if (fields.length === 0) {
                root.append('<p>Geen velden gevonden.</p>');
                return;
            }

            fields.forEach(field => {
                const fieldSection = $('<div class="gs-field-section"></div>');
                fieldSection.append(`<h2 class="gs-field-title">${field.name}</h2>`);
                const grid = $('<div class="gs-field-grid"></div>');
                fieldSection.append(grid);
                root.append(fieldSection);

                $.get(gs_vars.api_url + '/fields/' + field.id + '/blocks', function(blocks) {
                    renderGrid(grid, blocks);
                });
            });
        }

        function renderGrid(container, blocks) {
            if (blocks.length === 0) {
                container.append('<p>Geen blokken in dit veld.</p>');
                return;
            }

            const maxRow = Math.max(...blocks.map(b => parseInt(b.row)), 0);
            const maxCol = Math.max(...blocks.map(b => parseInt(b.col)), 0);

            container.css({
                'display': 'grid',
                'grid-template-columns': `repeat(${maxCol + 1}, 1fr)`,
                'gap': '15px'
            });

            const now = new Date();

            for (let r = 0; r <= maxRow; r++) {
                for (let c = 0; c <= maxCol; c++) {
                    const block = blocks.find(b => parseInt(b.row) === r && parseInt(b.col) === c);
                    const cell = $('<div class="gs-block-card"></div>');
                    
                    if (block) {
                        cell.append(`<div class="gs-block-name">${block.name}</div>`);
                        
                        const cropsList = $('<div class="gs-crops-list"></div>');
                        let harvestableCount = 0;

                        if (block.crops && block.crops.length > 0) {
                            block.crops.forEach(crop => {
                                if (crop.isHarvestable) harvestableCount++;
                                
                                const cropItem = $(`<div class="gs-crop-item status-${crop.isHarvestable ? 'oogstklaar' : 'groeiend'}">
                                    <span class="gs-dot"></span> ${crop.name}
                                </div>`);
                                cropsList.append(cropItem);
                            });
                        }

                        if (harvestableCount > 0) {
                            cell.addClass('has-harvest');
                            cell.append('<div class="gs-harvest-badge">🌿 Oogstklaar</div>');
                        }

                        cell.append(cropsList);
                    } else {
                        cell.addClass('empty-cell');
                    }
                    container.append(cell);
                }
            }
        }
    });

})(jQuery);
