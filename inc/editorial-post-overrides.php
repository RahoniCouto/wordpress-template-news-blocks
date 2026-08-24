<?php

/**
 * Editorial post override helpers.
 *
 * @package WordPress_Template_News_Blocks
 */

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Normalizes an editorial post override.
 *
 * @param mixed $post_override Raw post override.
 * @return array<string, mixed>
 */
function wtn_blocks_normalize_editorial_post_override($post_override): array
{
    if (! is_array($post_override)) {
        $post_override = [];
    }

    return [
        'titleOverride'   => isset($post_override['titleOverride'])
            && is_string($post_override['titleOverride'])
            ? $post_override['titleOverride']
            : '',
        'excerptOverride' => isset($post_override['excerptOverride'])
            && is_string($post_override['excerptOverride'])
            ? $post_override['excerptOverride']
            : '',
        'imageOverrideId' => isset($post_override['imageOverrideId'])
            ? absint($post_override['imageOverrideId'])
            : 0,
    ];
}

/**
 * Returns the editorial overrides associated with a post.
 *
 * @param array<mixed> $post_overrides Overrides indexed by post ID.
 * @param int          $post_id        Post ID.
 * @return array<string, mixed>
 */
function wtn_blocks_get_editorial_post_override(
    array $post_overrides,
    int $post_id
): array {
    $post_id = absint($post_id);

    if (0 === $post_id || ! array_key_exists($post_id, $post_overrides)) {
        return wtn_blocks_normalize_editorial_post_override([]);
    }

    return wtn_blocks_normalize_editorial_post_override(
        $post_overrides[$post_id]
    );
}
