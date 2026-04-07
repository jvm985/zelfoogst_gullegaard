(function($) {
    'use strict';

    $(function() {
        const fieldSelect = $('#gs-field-select');
        const gridContainer = $('#gs-field-grid');
        const addBlockBtn = $('#gs-add-block-btn');
        const modal = $('#gs-block-modal');
        const closeModal = $('#gs-close-modal');
        const blockForm = $('#gs-block-form');

        // Fetch fields on load
        fetchFields();

        function fetchFields() {
            $.get(gs_admin_vars.ajax_url, { action: 'gs_get_fields', _ajax_nonce: gs_admin_vars.nonce }, function(res) {
                if (res.success) {
                    res.data.forEach(field => {
                        fieldSelect.append(`<option value="${field.id}">${field.name}</option>`);
                    });
                }
            });
        }

        fieldSelect.on('change', function() {
            const fieldId = $(this).val();
            if (fieldId) {
                fetchBlocks(fieldId);
                addBlockBtn.show();
            } else {
                gridContainer.empty();
                addBlockBtn.hide();
            }
        });

        function fetchBlocks(fieldId) {
            $.get(gs_admin_vars.ajax_url, { action: 'gs_get_blocks', field_id: fieldId, _ajax_nonce: gs_admin_vars.nonce }, function(res) {
                if (res.success) {
                    renderGrid(res.data);
                }
            });
        }

        function renderGrid(blocks) {
            gridContainer.empty();
            if (blocks.length === 0) {
                gridContainer.append('<p>Geen blokken gevonden in dit veld.</p>');
                return;
            }

            const maxRow = Math.max(...blocks.map(b => parseInt(b.row)), 0);
            const maxCol = Math.max(...blocks.map(b => parseInt(b.col)), 0);

            gridContainer.css({
                'grid-template-columns': `repeat(${maxCol + 1}, 1fr)`,
                'grid-template-rows': `repeat(${maxRow + 1}, 100px)`
            });

            for (let r = 0; r <= maxRow; r++) {
                for (let c = 0; c <= maxCol; c++) {
                    const block = blocks.find(b => parseInt(b.row) === r && parseInt(b.col) === c);
                    const cell = $('<div class="gs-grid-cell"></div>');
                    cell.css({
                        'border': '1px dashed #ccc',
                        'padding': '10px',
                        'background': block ? '#e5f3e5' : '#f9f9f9',
                        'display': 'flex',
                        'flex-direction': 'column',
                        'justify-content': 'center',
                        'align-items': 'center',
                        'cursor': 'pointer'
                    });

                    if (block) {
                        cell.html(`<strong>${block.name}</strong><br><small>R:${block.row} C:${block.col}</small>`);
                        cell.on('click', () => openModal(block));
                    } else {
                        cell.html('<span style="color:#ccc">+</span>');
                        cell.on('click', () => openModal({ row: r, col: c }));
                    }
                    gridContainer.append(cell);
                }
            }
        }

        function openModal(block = {}) {
            $('#gs-modal-title').text(block.id ? 'Blok Bewerken' : 'Nieuw Blok');
            $('#block-id').val(block.id || '');
            $('#block-name').val(block.name || '');
            $('#block-row').val(block.row || 0);
            $('#block-col').val(block.col || 0);
            modal.show();
        }

        closeModal.on('click', () => modal.hide());

        blockForm.on('submit', function(e) {
            e.preventDefault();
            const data = {
                action: 'gs_save_block',
                _ajax_nonce: gs_admin_vars.nonce,
                id: $('#block-id').val(),
                field_id: fieldSelect.val(),
                name: $('#block-name').val(),
                row: $('#block-row').val(),
                col: $('#block-col').val()
            };

            $.post(gs_admin_vars.ajax_url, data, function(res) {
                if (res.success) {
                    modal.hide();
                    fetchBlocks(fieldSelect.val());
                } else {
                    alert('Fout bij opslaan: ' + res.data);
                }
            });
        });

        addBlockBtn.on('click', () => openModal());
    });
})(jQuery);
