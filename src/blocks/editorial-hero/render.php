<?php

/**
 * Editorial Hero block render.
 *
 * @package WordPress_Template_News_Blocks
 */

if (! defined('ABSPATH')) {
    exit;
}

$block_attributes = wp_parse_args(
    $attributes ?? [],
    [
        'postId'        => 0,
        'postOverrides' => [],
        'mediaPosition' => 'left',
    ]
);

$post_id = absint($block_attributes['postId']);

if (0 === $post_id) {
    return;
}

$post = get_post($post_id);

if (
    ! $post instanceof WP_Post
    || 'post' !== $post->post_type
    || 'publish' !== get_post_status($post)
) {
    return;
}

if (wtn_blocks_is_post_used($post_id)) {
    return;
}

$permalink = get_permalink($post);

if (
    ! is_string($permalink)
    || '' === $permalink
) {
    return;
}

$media_position = in_array(
    $block_attributes['mediaPosition'],
    ['left', 'right'],
    true
)
    ? $block_attributes['mediaPosition']
    : 'left';

$post_overrides = is_array($block_attributes['postOverrides'])
    ? $block_attributes['postOverrides']
    : [];

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

$excerpt = trim(
    wp_strip_all_tags(
        (string) $post_override['excerptOverride']
    )
);

if ('' === $excerpt) {
    $excerpt = trim(
        wp_strip_all_tags(
            get_the_excerpt($post)
        )
    );
}

$image_id = absint($post_override['imageOverrideId']);

if (0 === $image_id) {
    $image_id = (int) get_post_thumbnail_id($post);
}

$image_size = has_image_size('wtn-featured')
    ? 'wtn-featured'
    : 'large';

$image_html = '';

if ($image_id > 0) {
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

    $image_html = wp_get_attachment_image(
        $image_id,
        $image_size,
        false,
        [
            'class'         => 'wtn-blocks-editorial-hero__image',
            'alt'           => $image_alt,
            'loading'       => 'eager',
            'decoding'      => 'async',
            'fetchpriority' => 'high',
            'sizes'         => '(min-width: 1024px) 50vw, 100vw',
        ]
    );
}

$categories = get_the_category($post_id);

$primary_category = ! empty($categories)
    && $categories[0] instanceof WP_Term
    ? $categories[0]
    : null;

$primary_category_url = '';

if ($primary_category instanceof WP_Term) {
    $resolved_category_url = get_term_link($primary_category);

    if (! is_wp_error($resolved_category_url)) {
        $primary_category_url = $resolved_category_url;
    }
}

wtn_blocks_register_used_post_id($post_id);

$heading_tag = wtn_blocks_get_next_editorial_heading_tag();
$heading_tag = wtn_blocks_sanitize_heading_tag($heading_tag);
$heading_tag = tag_escape($heading_tag);

$media_label = sprintf(
    /* translators: %s: Post title. */
    __('Abrir matéria: %s', 'wordpress-template-news-blocks'),
    $title
);

$wrapper_classes = [
    'wtn-blocks-editorial-hero',
    'wtn-blocks-editorial-hero--media-' . $media_position,
];

if ('' === $image_html) {
    $wrapper_classes[] = 'wtn-blocks-editorial-hero--no-media';
}

$wrapper_attributes = get_block_wrapper_attributes(
    [
        'class' => implode(' ', $wrapper_classes),
    ]
);
?>

<section <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
            ?>>
    <div class="wtn-blocks-editorial-hero__inner">
        <?php if ('' !== $image_html) : ?>
            <a
                class="wtn-blocks-editorial-hero__media"
                href="<?php echo esc_url($permalink); ?>"
                aria-label="<?php echo esc_attr($media_label); ?>">
                <?php echo $image_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
                ?>
            </a>
        <?php endif; ?>

        <div class="wtn-blocks-editorial-hero__content">
            <p class="wtn-blocks-editorial-hero__eyebrow">
                <?php
                esc_html_e(
                    'Destaque',
                    'wordpress-template-news-blocks'
                );
                ?>
            </p>

            <<?php echo esc_html($heading_tag); ?> class="wtn-blocks-editorial-hero__title">
                <a href="<?php echo esc_url($permalink); ?>">
                    <?php echo esc_html($title); ?>
                </a>
            </<?php echo esc_html($heading_tag); ?>>

            <?php if ('' !== $excerpt) : ?>
                <p class="wtn-blocks-editorial-hero__excerpt">
                    <?php echo esc_html($excerpt); ?>
                </p>
            <?php endif; ?>

            <div class="wtn-blocks-editorial-hero__meta">
                <?php if ($primary_category instanceof WP_Term) : ?>
                    <?php if ('' !== $primary_category_url) : ?>
                        <a
                            class="wtn-blocks-editorial-hero__meta-item"
                            href="<?php echo esc_url($primary_category_url); ?>">
                            <?php echo esc_html($primary_category->name); ?>
                        </a>
                    <?php else : ?>
                        <span class="wtn-blocks-editorial-hero__meta-item">
                            <?php echo esc_html($primary_category->name); ?>
                        </span>
                    <?php endif; ?>
                <?php endif; ?>

                <time
                    class="wtn-blocks-editorial-hero__meta-item"
                    datetime="<?php echo esc_attr(get_the_date(DATE_W3C, $post)); ?>">
                    <?php echo esc_html(get_the_date('', $post)); ?>
                </time>
            </div>
        </div>
    </div>
</section>
