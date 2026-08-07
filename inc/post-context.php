<?php

/**
 * Editorial post usage context.
 *
 * @package WordPress_Template_News_Blocks
 */

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Resets the editorial post context for the current render pass.
 */
function wtn_blocks_reset_post_context(): void
{
    $GLOBALS['wtn_blocks_post_context'] = [
        'used_post_ids' => [],
    ];
}

/**
 * Ensures the editorial post context exists.
 */
function wtn_blocks_ensure_post_context(): void
{
    if (
        ! isset($GLOBALS['wtn_blocks_post_context'])
        || ! is_array($GLOBALS['wtn_blocks_post_context'])
    ) {
        wtn_blocks_reset_post_context();
    }
}

/**
 * Resets context before WordPress renders block content on the frontend.
 *
 * WordPress runs do_blocks() on the_content before normal paragraph filters,
 * so this reset must happen earlier than block rendering.
 *
 * @param string $content Post content.
 * @return string
 */
function wtn_blocks_reset_post_context_before_content(string $content): string
{
    if (! is_admin()) {
        wtn_blocks_reset_post_context();
    }

    return $content;
}
add_filter('the_content', 'wtn_blocks_reset_post_context_before_content', 8);

/**
 * Returns the IDs of posts already consumed by editorial blocks
 * during the current render pass.
 *
 * @return int[]
 */
function wtn_blocks_get_used_post_ids(): array
{
    wtn_blocks_ensure_post_context();

    return $GLOBALS['wtn_blocks_post_context']['used_post_ids'];
}

/**
 * Checks whether a post has already been consumed by an editorial block.
 *
 * @param int $post_id Post ID.
 * @return bool
 */
function wtn_blocks_is_post_used(int $post_id): bool
{
    $post_id = absint($post_id);

    if (0 === $post_id) {
        return false;
    }

    return in_array($post_id, wtn_blocks_get_used_post_ids(), true);
}

/**
 * Registers a post as consumed by an editorial block.
 *
 * @param int $post_id Post ID.
 */
function wtn_blocks_register_used_post_id(int $post_id): void
{
    $post_id = absint($post_id);

    if (0 === $post_id) {
        return;
    }

    wtn_blocks_ensure_post_context();

    if (wtn_blocks_is_post_used($post_id)) {
        return;
    }

    $GLOBALS['wtn_blocks_post_context']['used_post_ids'][] = $post_id;
}

/**
 * Registers multiple posts as consumed by editorial blocks.
 *
 * @param int[] $post_ids Post IDs.
 */
function wtn_blocks_register_used_post_ids(array $post_ids): void
{
    foreach ($post_ids as $post_id) {
        wtn_blocks_register_used_post_id(absint($post_id));
    }
}
