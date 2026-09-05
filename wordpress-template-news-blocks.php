<?php

/**
 * Plugin Name: WordPress Template News Blocks
 * Description: Blocos Gutenberg editoriais para o tema WordPress Template News.
 * Version: 1.0.0
 * Requires at least: 6.7
 * Requires PHP: 8.1
 * Author: Rahoni Couto
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: wordpress-template-news-blocks
 *
 * @package WordPress_Template_News_Blocks
 */

if (! defined('ABSPATH')) {
    exit;
}

define('WTN_BLOCKS_PATH', plugin_dir_path(__FILE__));
define('WTN_BLOCKS_URL', plugin_dir_url(__FILE__));

require_once WTN_BLOCKS_PATH . 'inc/setup.php';
require_once WTN_BLOCKS_PATH . 'inc/ad-slot-formats.php';
require_once WTN_BLOCKS_PATH . 'inc/settings.php';
require_once WTN_BLOCKS_PATH . 'inc/media.php';
require_once WTN_BLOCKS_PATH . 'inc/authors/author-profile.php';
require_once WTN_BLOCKS_PATH . 'inc/admin/author-profile-fields.php';
require_once WTN_BLOCKS_PATH . 'inc/content/reading-time.php';
require_once WTN_BLOCKS_PATH . 'inc/heading-context.php';
require_once WTN_BLOCKS_PATH . 'inc/post-context.php';
require_once WTN_BLOCKS_PATH . 'inc/post-selection.php';
require_once WTN_BLOCKS_PATH . 'inc/editorial-post-overrides.php';
require_once WTN_BLOCKS_PATH . 'inc/editorial-post-data.php';
require_once WTN_BLOCKS_PATH . 'inc/rest/editorial-post-selection.php';
require_once WTN_BLOCKS_PATH . 'inc/blocks.php';

add_action('plugins_loaded', 'wtn_blocks_setup');
add_action('after_setup_theme', 'wtn_blocks_register_image_sizes');
add_action('admin_init', 'wtn_blocks_register_settings');
add_action('admin_menu', 'wtn_blocks_register_settings_page');
add_action('show_user_profile', 'wtn_blocks_render_author_profile_fields');
add_action('edit_user_profile', 'wtn_blocks_render_author_profile_fields');
add_action('personal_options_update', 'wtn_blocks_save_author_profile_fields');
add_action('edit_user_profile_update', 'wtn_blocks_save_author_profile_fields');
add_action('admin_enqueue_scripts', 'wtn_blocks_enqueue_author_profile_admin_assets');
add_filter('block_editor_settings_all', 'wtn_blocks_add_block_editor_settings');

add_action('init', 'wtn_blocks_register_author_profile_meta');
add_action('init', 'wtn_blocks_register_reading_time_meta');
add_action('init', 'wtn_blocks_register_blocks');

add_action(
    'rest_api_init',
    'wtn_blocks_register_editorial_post_selection_routes'
);

add_action(
    'wp_after_insert_post',
    'wtn_blocks_update_reading_time_meta',
    10,
    2
);
