<?php

class GS_CPTs {
	public function register_cpts() {
		$this->register_crop_cpt();
		$this->register_field_cpt();
		$this->register_recipe_cpt();
	}

	private function register_crop_cpt() {
		$labels = array(
			'name'               => 'Gewassen',
			'singular_name'      => 'Gewas',
			'add_new'            => 'Nieuw Gewas',
			'add_new_item'       => 'Voeg nieuw gewas toe',
			'edit_item'          => 'Bewerk Gewas',
			'new_item'           => 'Nieuw Gewas',
			'all_items'          => 'Alle Gewassen',
			'view_item'          => 'Bekijk Gewas',
			'search_items'       => 'Zoek Gewassen',
			'not_found'          => 'Geen gewassen gevonden',
			'not_found_in_trash' => 'Geen gewassen gevonden in de prullenbak',
			'menu_name'          => 'Gewassen'
		);

		$args = array(
			'labels'             => $labels,
			'public'             => false, // Niet als publieke pagina's
			'show_ui'            => true,
			'show_in_menu'       => true,
			'has_archive'        => false,
			'supports'           => array( 'title' ), // Alleen titel nodig voor de naam
			'menu_icon'          => 'dashicons-leaf',
			'show_in_rest'       => true,
		);

		register_post_type( 'gs_crop', $args );
	}

	private function register_field_cpt() {
		$labels = array(
			'name'               => 'Velden',
			'singular_name'      => 'Veld',
			'add_new'            => 'Nieuw Veld',
			'add_new_item'       => 'Voeg nieuw veld toe',
			'edit_item'          => 'Bewerk Veld',
			'new_item'           => 'Nieuw Veld',
			'all_items'          => 'Alle Velden',
			'view_item'          => 'Bekijk Veld',
			'search_items'       => 'Zoek Velden',
			'not_found'          => 'Geen velden gevonden',
			'not_found_in_trash' => 'Geen velden gevonden in de prullenbak',
			'menu_name'          => 'Velden'
		);

		$args = array(
			'labels'             => $labels,
			'public'             => true,
			'has_archive'        => false,
			'supports'           => array( 'title' ),
			'menu_icon'          => 'dashicons-location',
			'show_in_rest'       => true,
		);

		register_post_type( 'gs_field', $args );
	}

	private function register_recipe_cpt() {
		$labels = array(
			'name'               => 'Recepten',
			'singular_name'      => 'Recept',
			'add_new'            => 'Nieuw Recept',
			'add_new_item'       => 'Voeg nieuw recept toe',
			'edit_item'          => 'Bewerk Recept',
			'new_item'           => 'Nieuw Recept',
			'all_items'          => 'Alle Recepten',
			'view_item'          => 'Bekijk Recept',
			'search_items'       => 'Zoek Recepten',
			'not_found'          => 'Geen recepten gevonden',
			'not_found_in_trash' => 'Geen recepten gevonden in de prullenbak',
			'menu_name'          => 'Recepten'
		);

		$args = array(
			'labels'             => $labels,
			'public'             => true,
			'has_archive'        => true,
			'supports'           => array( 'title', 'editor', 'thumbnail', 'author' ),
			'menu_icon'          => 'dashicons-food',
			'show_in_rest'       => true,
		);

		register_post_type( 'gs_recipe', $args );
	}
}
