(function($) {
    'use strict';

    $(function() {
        const root = $('#gs-recipes-root');
        if (!root.length) return;

        let recipes = [];
        let harvestableCrops = [];

        init();

        async function init() {
            root.html('<div class="gs-loading">Recepten en gewassen laden...</div>');

            try {
                // Fetch harvestable crops from cultivations API
                const harvestableData = await $.get(gs_vars.api_url + '/cultivations');
                harvestableCrops = harvestableData.map(c => c.id.toString());
                const harvestableNames = harvestableData.map(c => c.crop.name.toLowerCase());

                // Fetch recipes
                const res = await $.get(gs_vars.api_url + '/recipes');
                recipes = res;

                renderFilters(harvestableCrops, harvestableNames);
                renderRecipes(recipes);
            } catch (err) {
                console.error('GS Harvest Error:', err);
                root.html('<p>Fout bij laden van data.</p>');
            }
        }

        function renderFilters(harvestIds, harvestNames) {
            $('.gs-filters').remove(); // Prevent duplicates
            const filterHtml = `
                <div class="gs-filters">
                    <button id="gs-filter-all" class="gs-btn active">Alle Recepten</button>
                    <button id="gs-filter-harvestable" class="gs-btn">Nu Oogstbaar 🌿</button>
                </div>
            `;
            root.before(filterHtml);

            $('#gs-filter-all').on('click', function() {
                $('.gs-btn').removeClass('active');
                $(this).addClass('active');
                renderRecipes(recipes);
            });

            $('#gs-filter-harvestable').on('click', function() {
                $('.gs-btn').removeClass('active');
                $(this).addClass('active');
                const filtered = recipes.filter(r => {
                    // Try to match by name as a fallback for external APIs
                    const hasMatchByName = r.crop_names && r.crop_names.some(name => harvestNames.includes(name.toLowerCase()));
                    const hasMatchById = r.crops && r.crops.some(id => harvestIds.includes(id.toString()));
                    
                    return hasMatchByName || hasMatchById;
                });
                renderRecipes(filtered);
            });
        }


        function renderRecipes(items) {
            root.empty();
            if (items.length === 0) {
                root.append('<p class="gs-empty">Geen recepten gevonden.</p>');
                return;
            }

            const grid = $('<div class="gs-recipes-grid"></div>');
            items.forEach(recipe => {
                const isHarvestable = recipe.crops && recipe.crops.some(cropId => harvestableCrops.includes(parseInt(cropId)));
                
                const card = $(`
                    <div class="gs-recipe-card ${isHarvestable ? 'is-harvestable' : ''}" data-id="${recipe.id}">
                        <h3 class="gs-recipe-title">${recipe.title}</h3>
                        <div class="gs-recipe-content">${recipe.excerpt}</div>
                        ${isHarvestable ? '<div class="gs-harvest-badge">Nu Oogstbaar</div>' : ''}
                        <button class="gs-recipe-btn">Bekijk Recept</button>
                    </div>
                `);
                card.on('click', () => showRecipeModal(recipe));
                grid.append(card);
            });
            root.append(grid);
        }

        function showRecipeModal(recipe) {
            const modal = $(`
                <div class="gs-modal-overlay">
                    <div class="gs-modal-content">
                        <button class="gs-modal-close">&times;</button>
                        <h2 class="gs-modal-title">${recipe.title}</h2>
                        <div class="gs-modal-author">Door: ${recipe.author}</div>
                        <div class="gs-modal-body">${recipe.content.replace(/\n/g, '<br>')}</div>
                    </div>
                </div>
            `);
            modal.find('.gs-modal-close').on('click', () => modal.remove());
            modal.on('click', (e) => { if (e.target === modal[0]) modal.remove(); });
            $('body').append(modal);
        }
    });

})(jQuery);
