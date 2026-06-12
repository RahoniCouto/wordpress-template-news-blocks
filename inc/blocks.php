<?php
/**
 * Block registration.
 *
 * @package WordPress_Template_News_Blocks
 */

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Registers all plugin blocks found in build/blocks.
 */
function wtn_blocks_register_blocks(): void
{
    $blocks_path = trailingslashit(WTN_BLOCKS_PATH) . 'build/blocks';
    $block_files = glob($blocks_path . '/*/block.json');

    if (! is_array($block_files)) {
        return;
    }

    sort($block_files);

    foreach ($block_files as $block_file) {
        if (! is_readable($block_file)) {
            continue;
        }

        register_block_type(dirname($block_file));
    }
}