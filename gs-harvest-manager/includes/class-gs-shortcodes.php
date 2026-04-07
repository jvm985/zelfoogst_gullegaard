<?php

class GS_Shortcodes {
	private $plugin_name;
	private $version;

	public function __construct( $plugin_name, $version ) {
		$this->plugin_name = $plugin_name;
		$this->version = $version;
	}

	public function render_harvest_map( $atts ) {
		wp_enqueue_style( $this->plugin_name . '-public', GS_HARVEST_MANAGER_URL . 'public/css/gs-public.css', array(), $this->version, 'all' );
		wp_enqueue_script( $this->plugin_name . '-public', GS_HARVEST_MANAGER_URL . 'public/js/gs-public.js', array( 'jquery' ), $this->version, false );
        
        wp_localize_script( $this->plugin_name . '-public', 'gs_vars', array(
            'api_url' => get_rest_url( null, 'gs-harvest/v1' ),
            'nonce'   => wp_create_nonce( 'wp_rest' ),
        ));

		ob_start();
		?>
		<div id="gs-harvest-map-root" class="gs-harvest-map">
            <div class="gs-loading">Oogstkaart laden...</div>
        </div>
		<?php
		return ob_get_clean();
	}

	public function render_recipes( $atts ) {
		wp_enqueue_style( $this->plugin_name . '-public', GS_HARVEST_MANAGER_URL . 'public/css/gs-public.css', array(), $this->version, 'all' );
		wp_enqueue_script( $this->plugin_name . '-recipes', GS_HARVEST_MANAGER_URL . 'public/js/gs-recipes.js', array( 'jquery' ), $this->version, false );
        
        wp_localize_script( $this->plugin_name . '-recipes', 'gs_vars', array(
            'api_url' => get_rest_url( null, 'gs-harvest/v1' ),
            'nonce'   => wp_create_nonce( 'wp_rest' ),
        ));

		ob_start();
		?>
		<div id="gs-recipes-root" class="gs-recipes">
            <div class="gs-loading">Recepten laden...</div>
        </div>
		<?php
		return ob_get_clean();
	}
}
