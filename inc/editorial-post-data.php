<?php

/**
 * Editorial post data helpers.
 *
 * @package WordPress_Template_News_Blocks
 */

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Returns the canonical base data for an editorial post.
 *
 * The helper resolves only data shared by the editorial post blocks.
 * Block-specific data such as categories, reading time, headings and markup
 * remain the responsibility of each block.
 *
 * @param int          $post_id        Post ID.
 * @param array<mixed> $post_overrides Editorial overrides indexed by post ID.
 * @return array<string, mixed>|null
 */
function wtn_blocks_get_editorial_post_data(
    int $post_id,
    array $post_overrides = []
): ?array {
    $post_id = absint($post_id);

    if (0 === $post_id) {
        return null;
    }

    $post = get_post($post_id);

    if (
        ! $post instanceof WP_Post
        || 'post' !== $post->post_type
        || 'publish' !== get_post_status($post)
    ) {
        return null;
    }

    $permalink = get_permalink($post);

    if (
        ! is_string($permalink)
        || '' === $permalink
    ) {
        return null;
    }

    $post_override = wtn_blocks_get_editorial_post_override(
        $post_overrides,
        $post_id
    );

    $title = trim(
        wp_strip_all_tags(
            (string) $post_override['titleOverride']
        )
    );

    if ('' === $title) {
        $title = trim(
            wp_strip_all_tags(
                get_the_title($post)
            )
        );
    }

    if ('' === $title) {
        $title = __(
            'Matéria sem título',
            'wordpress-template-news-blocks'
        );
    }

    return [
        'id'            => $post_id,
        'post'          => $post,
        'permalink'     => $permalink,
        'title'         => $title,
        'post_override' => $post_override,
    ];
}

/**
 * Returns the effective editorial excerpt for a post.
 *
 * @param WP_Post      $post          Post object.
 * @param array<mixed> $post_override Editorial override for the post.
 * @return string
 */
function wtn_blocks_get_editorial_post_excerpt(
    WP_Post $post,
    array $post_override
): string {
    $excerpt = trim(
        wp_strip_all_tags(
            (string) ($post_override['excerptOverride'] ?? '')
        )
    );

    if ('' !== $excerpt) {
        return $excerpt;
    }

    return trim(
        wp_strip_all_tags(
            get_the_excerpt($post)
        )
    );
}

/**
 * Returns the effective editorial image ID and alt text for a post.
 *
 * Image overrides have priority over the post featured image. If the selected
 * attachment has no alt text, the effective editorial title is used as the
 * contextual fallback.
 *
 * @param WP_Post      $post          Post object.
 * @param array<mixed> $post_override Editorial override for the post.
 * @param string       $title         Effective editorial title.
 * @return array{id: int, alt: string}
 */
function wtn_blocks_get_editorial_post_image_data(
    WP_Post $post,
    array $post_override,
    string $title
): array {
    $image_id = absint(
        $post_override['imageOverrideId'] ?? 0
    );

    if (0 === $image_id) {
        $image_id = (int) get_post_thumbnail_id($post);
    }

    if (0 === $image_id) {
        return [
            'id'  => 0,
            'alt' => '',
        ];
    }

    $image_alt = trim(
        wp_strip_all_tags(
            (string) get_post_meta(
                $image_id,
                '_wp_attachment_image_alt',
                true
            )
        )
    );

    if ('' === $image_alt) {
        $image_alt = $title;
    }

    return [
        'id'  => $image_id,
        'alt' => $image_alt,
    ];
}
