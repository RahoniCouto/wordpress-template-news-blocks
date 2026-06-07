<?php
/**
 * Plugin setup.
 *
 * @package WordPress_Template_News_Blocks
 */

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Bootstraps the plugin.
 */
function wtn_blocks_setup(): void
{
    load_plugin_textdomain(
        'wordpress-template-news-blocks',
        false,
        dirname(plugin_basename(WTN_BLOCKS_PATH . 'wordpress-template-news-blocks.php')) . '/languages'
    );
}