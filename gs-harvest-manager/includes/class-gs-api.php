<?php

class GS_API {
	public function register_routes() {
		$version = '1';
		$namespace = 'gs-harvest/v' . $version;

		register_rest_route( $namespace, '/fields', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'get_fields' ),
			'permission_callback' => '__return_true',
		));

        register_rest_route( $namespace, '/fields/(?P<id>\d+)/blocks', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'get_field_blocks' ),
			'permission_callback' => '__return_true',
		));

        register_rest_route( $namespace, '/blocks', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'save_block' ),
			'permission_callback' => array( $this, 'check_admin_permission' ),
		));

        register_rest_route( $namespace, '/cultivations', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'get_cultivations' ),
			'permission_callback' => '__return_true',
		));

        register_rest_route( $namespace, '/recipes', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'get_recipes' ),
			'permission_callback' => '__return_true',
		));

        register_rest_route( $namespace, '/crops', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'get_crops' ),
			'permission_callback' => '__return_true',
		));
	}

    public function check_admin_permission() {
        return current_user_can( 'manage_options' );
    }

    public function get_cultivations() {
        // Return harvestable crops for the recipe filter
        $crops = get_posts( array(
            'post_type' => 'gs_crop',
            'meta_query' => array(
                array( 'key' => '_gs_crop_is_harvestable', 'value' => 1 )
            ),
            'numberposts' => -1
        ) );
        
        $data = array();
        foreach ( $crops as $crop ) {
            $data[] = array(
                'id' => (int)$crop->ID,
                'crop' => array(
                    'id' => (int)$crop->ID,
                    'name' => $crop->post_title,
                ),
                'isHarvestable' => true
            );
        }
        return rest_ensure_response( $data );
    }

    public function get_recipes() {
        $response = wp_remote_get( 'https://csa.irishof.cloud/api/recipes/ranked', array(
            'sslverify' => false, // Sometimes local dev or specific hosts have issues with SSL certs
            'timeout'   => 15,
        ) );
        
        if ( is_wp_error( $response ) ) {
            error_log( 'GS Harvest API Error: ' . $response->get_error_message() );
            return rest_ensure_response( array() );
        }

        $code = wp_remote_retrieve_response_code( $response );
        if ( $code !== 200 ) {
            error_log( 'GS Harvest API HTTP Error: ' . $code );
            return rest_ensure_response( array() );
        }

        $body = wp_remote_retrieve_body( $response );
        $data = json_decode( $body, true );

        if ( ! isset( $data['recipes'] ) || ! is_array( $data['recipes'] ) ) {
            return rest_ensure_response( array() );
        }

        $formatted_recipes = array();
        foreach ( $data['recipes'] as $recipe ) {
            $crop_names = array();
            if ( isset( $recipe['harvestableCrops'] ) && is_array( $recipe['harvestableCrops'] ) ) {
                foreach ( $recipe['harvestableCrops'] as $crop ) {
                    $crop_names[] = strtolower( $crop['name'] );
                }
            }

            $formatted_recipes[] = array(
                'id'         => $recipe['id'],
                'title'      => $recipe['title'],
                'excerpt'    => isset($recipe['content']) ? wp_trim_words( $recipe['content'], 20 ) : '',
                'link'       => '#',
                'crops'      => isset($recipe['harvestableCrops']) ? array_map( function($c) { return $c['id']; }, $recipe['harvestableCrops'] ) : array(),
                'crop_names' => $crop_names,
                'content'    => $recipe['content'] ?? '',
                'author'     => $recipe['author']['name'] ?? 'Anoniem',
            );
        }

        return rest_ensure_response( $formatted_recipes );
    }

	public function get_fields() {
		$fields = get_posts( array( 'post_type' => 'gs_field', 'numberposts' => -1 ) );
		$data = array();
		foreach ( $fields as $field ) {
			$data[] = array(
				'id'   => $field->ID,
				'name' => $field->post_title,
			);
		}
		return rest_ensure_response( $data );
	}

    public function get_field_blocks( $request ) {
        global $wpdb;
        $field_id = $request['id'];
        $table = $wpdb->prefix . 'gs_blocks';
        $blocks = $wpdb->get_results( $wpdb->prepare( "SELECT * FROM $table WHERE field_id = %d", $field_id ) );
        
        $data = array();
        foreach ( $blocks as $block ) {
            $crops = get_posts( array(
                'post_type' => 'gs_crop',
                'meta_query' => array(
                    array( 'key' => '_gs_crop_block_id', 'value' => $block->id )
                ),
                'numberposts' => -1
            ) );

            $crops_data = array();
            foreach ( $crops as $crop ) {
                $crops_data[] = array(
                    'id' => $crop->ID,
                    'name' => $crop->post_title,
                    'isHarvestable' => (int)get_post_meta( $crop->ID, '_gs_crop_is_harvestable', true ) === 1
                );
            }

            $data[] = array(
                'id' => $block->id,
                'name' => $block->name,
                'row' => $block->row_index,
                'col' => $block->col_index,
                'crops' => $crops_data,
            );
        }
        return rest_ensure_response( $data );
    }

    public function save_block( $request ) {
        global $wpdb;
        $params = $request->get_json_params();
        $table = $wpdb->prefix . 'gs_blocks';
        
        if ( isset( $params['id'] ) ) {
            $wpdb->update( $table, array(
                'name' => $params['name'],
                'row_index' => $params['row'],
                'col_index' => $params['col'],
            ), array( 'id' => $params['id'] ) );
            return rest_ensure_response( array( 'success' => true, 'id' => $params['id'] ) );
        } else {
            $wpdb->insert( $table, array(
                'field_id' => $params['field_id'],
                'name' => $params['name'],
                'row_index' => $params['row'],
                'col_index' => $params['col'],
            ) );
            return rest_ensure_response( array( 'success' => true, 'id' => $wpdb->insert_id ) );
        }
    }

    public function get_crops() {
        $crops = get_posts( array( 'post_type' => 'gs_crop', 'numberposts' => -1 ) );
        $data = array();
        foreach ( $crops as $crop ) {
            $data[] = array(
                'id' => $crop->ID,
                'name' => $crop->post_title,
            );
        }
        return rest_ensure_response( $data );
    }
}
