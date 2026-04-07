<?php

class GS_Admin {
	private $plugin_name;
	private $version;

	public function __construct( $plugin_name, $version ) {
		$this->plugin_name = $plugin_name;
		$this->version = $version;

        // Register AJAX handlers (must be outside admin_menu)
        add_action( 'wp_ajax_gs_get_fields', array( $this, 'ajax_get_fields' ) );
        add_action( 'wp_ajax_gs_get_blocks', array( $this, 'ajax_get_blocks' ) );
        add_action( 'wp_ajax_gs_save_block', array( $this, 'ajax_save_block' ) );
        add_action( 'wp_ajax_gs_get_cultivations', array( $this, 'ajax_get_cultivations' ) );
        add_action( 'wp_ajax_gs_save_cultivation', array( $this, 'ajax_save_cultivation' ) );
        add_action( 'wp_ajax_gs_get_crops', array( $this, 'ajax_get_crops' ) );
	}

	public function enqueue_styles() {
		wp_enqueue_style( $this->plugin_name, GS_HARVEST_MANAGER_URL . 'admin/css/gs-admin.css', array(), $this->version, 'all' );
	}

	public function enqueue_scripts() {
		wp_enqueue_script( $this->plugin_name, GS_HARVEST_MANAGER_URL . 'admin/js/gs-admin.js', array( 'jquery' ), $this->version, false );
        wp_localize_script( $this->plugin_name, 'gs_admin_vars', array(
            'ajax_url' => admin_url( 'admin-ajax.php' ),
            'nonce'    => wp_create_nonce( 'gs_admin_nonce' ),
        ));
	}

	public function add_plugin_admin_menu() {
		add_menu_page(
			'Harvest Manager',
			'Harvest Manager',
			'manage_options',
			'gs-harvest-manager',
			array( $this, 'display_plugin_admin_page' ),
			'dashicons-layout',
			25
		);

        add_submenu_page(
            'gs-harvest-manager',
            'Veld Structuur',
            'Veld Structuur',
            'manage_options',
            'gs-field-structure',
            array( $this, 'display_field_structure_page' )
        );

        // Meta boxes
        add_action( 'add_meta_boxes', array( $this, 'add_plugin_meta_boxes' ) );
        add_action( 'save_post', array( $this, 'save_plugin_meta' ) );
	}

    public function add_plugin_meta_boxes() {
        // Recipe crops
        add_meta_box(
            'gs_recipe_crops',
            'Gekoppelde Gewassen',
            array( $this, 'render_recipe_crops_meta_box' ),
            'gs_recipe',
            'side'
        );

        // Crop status & location
        add_meta_box(
            'gs_crop_status',
            'Locatie & Status',
            array( $this, 'render_crop_status_meta_box' ),
            'gs_crop',
            'normal',
            'high'
        );
    }

    public function render_crop_status_meta_box( $post ) {
        global $wpdb;
        $field_id = get_post_meta( $post->ID, '_gs_crop_field_id', true );
        $block_id = get_post_meta( $post->ID, '_gs_crop_block_id', true );
        $is_harvestable = get_post_meta( $post->ID, '_gs_crop_is_harvestable', true );

        $fields = get_posts( array( 'post_type' => 'gs_field', 'numberposts' => -1 ) );
        
        echo '<p><label>Veld:</label><br><select name="gs_crop_field_id" id="gs_crop_field_id" class="widefat"><option value="">-- Kies Veld --</option>';
        foreach ( $fields as $field ) {
            $selected = ($field->ID == $field_id) ? 'selected' : '';
            echo '<option value="' . $field->ID . '" ' . $selected . '>' . esc_html( $field->post_title ) . '</option>';
        }
        echo '</select></p>';

        echo '<p><label>Blok:</label><br><select name="gs_crop_block_id" id="gs_crop_block_id" class="widefat"><option value="">-- Kies Blok --</option>';
        if ( $field_id ) {
            $table = $wpdb->prefix . 'gs_blocks';
            $blocks = $wpdb->get_results( $wpdb->prepare( "SELECT * FROM $table WHERE field_id = %d", $field_id ) );
            foreach ( $blocks as $block ) {
                $selected = ($block->id == $block_id) ? 'selected' : '';
                echo '<option value="' . $block->id . '" ' . $selected . '>' . esc_html( $block->name ) . ' (R:' . $block->row_index . ' C:' . $block->col_index . ')</option>';
            }
        }
        echo '</select></p>';

        echo '<p><label><input type="checkbox" name="gs_crop_is_harvestable" value="1" ' . checked( $is_harvestable, 1, false ) . '> <strong>Oogstklaar</strong> (🌿 vink aan als dit gewas nu geplukt mag worden)</label></p>';

        ?>
        <script>
        jQuery(document).ready(function($) {
            $('#gs_crop_field_id').change(function() {
                var fieldId = $(this).val();
                if (!fieldId) return;
                $.get(ajaxurl, { action: 'gs_get_blocks', field_id: fieldId, _ajax_nonce: '<?php echo wp_create_nonce("gs_admin_nonce"); ?>' }, function(res) {
                    if (res.success) {
                        var select = $('#gs_crop_block_id');
                        select.empty().append('<option value="">-- Kies Blok --</option>');
                        res.data.forEach(function(b) {
                            select.append('<option value="' + b.id + '">' + b.name + ' (R:' + b.row + ' C:' + b.col + ')</option>');
                        });
                    }
                });
            });
        });
        </script>
        <?php
    }

    public function render_recipe_crops_meta_box( $post ) {
        $selected_crops = get_post_meta( $post->ID, '_gs_recipe_crops', true );
        if ( ! is_array( $selected_crops ) ) $selected_crops = array();
        
        $crops = get_posts( array( 'post_type' => 'gs_crop', 'numberposts' => -1 ) );
        
        echo '<div style="max-height: 200px; overflow-y: auto;">';
        foreach ( $crops as $crop ) {
            $checked = in_array( $crop->ID, $selected_crops ) ? 'checked' : '';
            echo '<label><input type="checkbox" name="gs_recipe_crops[]" value="' . $crop->ID . '" ' . $checked . '> ' . esc_html( $crop->post_title ) . '</label><br>';
        }
        echo '</div>';
    }

    public function save_plugin_meta( $post_id ) {
        if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) return;

        // Save recipe crops
        if ( isset( $_POST['gs_recipe_crops'] ) ) {
            update_post_meta( $post_id, '_gs_recipe_crops', array_map( 'intval', $_POST['gs_recipe_crops'] ) );
        } else if ( isset($_POST['post_type']) && $_POST['post_type'] == 'gs_recipe' ) {
            delete_post_meta( $post_id, '_gs_recipe_crops' );
        }

        // Save crop status & location
        if ( isset( $_POST['gs_crop_field_id'] ) ) {
            update_post_meta( $post_id, '_gs_crop_field_id', intval( $_POST['gs_crop_field_id'] ) );
        }
        if ( isset( $_POST['gs_crop_block_id'] ) ) {
            update_post_meta( $post_id, '_gs_crop_block_id', intval( $_POST['gs_crop_block_id'] ) );
        }
        if ( isset( $_POST['post_type'] ) && $_POST['post_type'] == 'gs_crop' ) {
            update_post_meta( $post_id, '_gs_crop_is_harvestable', isset( $_POST['gs_crop_is_harvestable'] ) ? 1 : 0 );
        }
    }

    public function ajax_get_fields() {
        check_ajax_referer( 'gs_admin_nonce' );
        $fields = get_posts( array( 'post_type' => 'gs_field', 'numberposts' => -1 ) );
        $data = array();
        foreach ( $fields as $field ) {
            $data[] = array( 'id' => $field->ID, 'name' => $field->post_title );
        }
        wp_send_json_success( $data );
    }

    public function ajax_get_crops() {
        check_ajax_referer( 'gs_admin_nonce' );
        $crops = get_posts( array( 'post_type' => 'gs_crop', 'numberposts' => -1 ) );
        $data = array();
        foreach ( $crops as $crop ) {
            $data[] = array( 'id' => $crop->ID, 'name' => $crop->post_title );
        }
        wp_send_json_success( $data );
    }

    public function ajax_get_blocks() {
        global $wpdb;
        check_ajax_referer( 'gs_admin_nonce' );
        $field_id = intval( $_GET['field_id'] );
        $table = $wpdb->prefix . 'gs_blocks';
        $blocks = $wpdb->get_results( $wpdb->prepare( "SELECT * FROM $table WHERE field_id = %d", $field_id ) );
        
        $data = array();
        foreach ( $blocks as $block ) {
            $data[] = array(
                'id' => $block->id,
                'name' => $block->name,
                'row' => $block->row_index,
                'col' => $block->col_index,
            );
        }
        wp_send_json_success( $data );
    }

    public function ajax_save_block() {
        global $wpdb;
        check_ajax_referer( 'gs_admin_nonce' );
        $table = $wpdb->prefix . 'gs_blocks';
        
        $id = isset( $_POST['id'] ) ? intval( $_POST['id'] ) : 0;
        $field_id = intval( $_POST['field_id'] );
        $name = sanitize_text_field( $_POST['name'] );
        $row = intval( $_POST['row'] );
        $col = intval( $_POST['col'] );

        if ( $id ) {
            $wpdb->update( $table, array(
                'name' => $name,
                'row_index' => $row,
                'col_index' => $col,
            ), array( 'id' => $id ) );
        } else {
            $wpdb->insert( $table, array(
                'field_id' => $field_id,
                'name' => $name,
                'row_index' => $row,
                'col_index' => $col,
            ) );
        }
        wp_send_json_success();
    }

	public function display_plugin_admin_page() {
		require_once GS_HARVEST_MANAGER_PATH . 'admin/partials/gs-admin-display.php';
	}

    public function display_field_structure_page() {
		require_once GS_HARVEST_MANAGER_PATH . 'admin/partials/gs-field-structure-display.php';
	}

    public function display_cultivation_manager_page() {
        require_once GS_HARVEST_MANAGER_PATH . 'admin/partials/gs-cultivation-manager-display.php';
    }

    public function ajax_get_cultivations() {
        global $wpdb;
        check_ajax_referer( 'gs_admin_nonce' );
        $table = $wpdb->prefix . 'gs_cultivations';
        $cults = $wpdb->get_results( "SELECT * FROM $table ORDER BY harvest_date DESC" );
        
        $data = array();
        foreach ( $cults as $cult ) {
            $crop = get_post( $cult->crop_id );
            $data[] = array(
                'id' => $cult->id,
                'crop_id' => $cult->crop_id,
                'crop_name' => $crop ? $crop->post_title : 'Onbekend',
                'harvest_date' => $cult->harvest_date,
            );
        }
        wp_send_json_success( $data );
    }

    public function ajax_save_cultivation() {
        global $wpdb;
        check_ajax_referer( 'gs_admin_nonce' );
        $table = $wpdb->prefix . 'gs_cultivations';
        
        $id = isset( $_POST['id'] ) ? intval( $_POST['id'] ) : 0;
        $crop_id = intval( $_POST['crop_id'] );
        $harvest_date = sanitize_text_field( $_POST['harvest_date'] );

        if ( $id ) {
            $wpdb->update( $table, array(
                'crop_id' => $crop_id,
                'harvest_date' => $harvest_date,
            ), array( 'id' => $id ) );
        } else {
            $wpdb->insert( $table, array(
                'crop_id' => $crop_id,
                'harvest_date' => $harvest_date,
                'year' => date('Y'),
                'bed_id' => 0,
            ) );
        }
        wp_send_json_success();
    }
}
