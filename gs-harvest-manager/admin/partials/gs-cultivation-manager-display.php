<div class="wrap">
    <h1>Teeltbeheer</h1>
    <p>Beheer hier welke gewassen wanneer oogstklaar zijn.</p>

    <div class="card" style="max-width: 600px; padding: 20px;">
        <h2>Teelt Toevoegen/Bewerken</h2>
        <form id="gs-cultivation-form">
            <input type="hidden" id="cult-id">
            <p>
                <label>Gewas:</label><br>
                <select id="cult-crop-id" required style="width: 100%;">
                    <option value="">-- Kies een gewas --</option>
                </select>
            </p>
            <p>
                <label>Oogstbaar vanaf:</label><br>
                <input type="date" id="cult-harvest-date" required style="width: 100%;">
            </p>
            <p>
                <button type="submit" class="button button-primary">Opslaan</button>
                <button type="button" id="gs-reset-cult-form" class="button">Reset</button>
            </p>
        </form>
    </div>

    <hr>

    <h2>Huidige Teelten</h2>
    <table class="wp-list-table widefat fixed striped">
        <thead>
            <tr>
                <th>Gewas</th>
                <th>Oogstbaar Vanaf</th>
                <th>Acties</th>
            </tr>
        </thead>
        <tbody id="gs-cultivations-table-body">
            <tr><td colspan="3">Laden...</td></tr>
        </tbody>
    </table>
</div>

<script>
(function($) {
    'use strict';
    $(function() {
        const cropSelect = $('#cult-crop-id');
        const tableBody = $('#gs-cultivations-table-body');
        const form = $('#gs-cultivation-form');

        // Load crops
        $.get(gs_admin_vars.ajax_url, { action: 'gs_get_crops', _ajax_nonce: gs_admin_vars.nonce }, function(res) {
            // Need to add gs_get_crops to GS_Admin if not there
        });

        // Simplified: use existing ajax_get_fields logic for crops but need a dedicated one
        fetchCrops();
        fetchCultivations();

        function fetchCrops() {
            $.get(gs_admin_vars.ajax_url, { action: 'gs_get_crops', _ajax_nonce: gs_admin_vars.nonce }, function(res) {
                if (res.success) {
                    res.data.forEach(crop => {
                        cropSelect.append(`<option value="${crop.id}">${crop.name}</option>`);
                    });
                }
            });
        }

        function fetchCultivations() {
            $.get(gs_admin_vars.ajax_url, { action: 'gs_get_cultivations', _ajax_nonce: gs_admin_vars.nonce }, function(res) {
                if (res.success) {
                    tableBody.empty();
                    if (res.data.length === 0) {
                        tableBody.append('<tr><td colspan="3">Geen teelten gevonden.</td></tr>');
                        return;
                    }
                    res.data.forEach(cult => {
                        const row = $(`<tr>
                            <td>${cult.crop_name}</td>
                            <td>${cult.harvest_date}</td>
                            <td><button class="button edit-cult" data-id="${cult.id}" data-crop="${cult.crop_id}" data-date="${cult.harvest_date}">Bewerken</button></td>
                        </tr>`);
                        tableBody.append(row);
                    });
                }
            });
        }

        $(document).on('click', '.edit-cult', function() {
            $('#cult-id').val($(this).data('id'));
            $('#cult-crop-id').val($(this).data('crop'));
            $('#cult-harvest-date').val($(this).data('date'));
        });

        $('#gs-reset-cult-form').on('click', function() {
            form[0].reset();
            $('#cult-id').val('');
        });

        form.on('submit', function(e) {
            e.preventDefault();
            const data = {
                action: 'gs_save_cultivation',
                _ajax_nonce: gs_admin_vars.nonce,
                id: $('#cult-id').val(),
                crop_id: $('#cult-crop-id').val(),
                harvest_date: $('#cult-harvest-date').val()
            };
            $.post(gs_admin_vars.ajax_url, data, function(res) {
                if (res.success) {
                    form[0].reset();
                    $('#cult-id').val('');
                    fetchCultivations();
                }
            });
        });
    });
})(jQuery);
</script>
