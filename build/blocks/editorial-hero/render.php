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
        'postId'          => 0,
        'postOverrides'   => [],
        'mediaPosition'   => 'left',
        'prioritizeImage' => false,
    ]
);

$post_id = absint($block_attributes['postId']);

if (0 === $post_id) {
    return;
}

$post_overrides = is_array($block_attributes['postOverrides'])
    ? $block_attributes['postOverrides']
    : [];

$post_data = wtn_blocks_get_editorial_post_data(
    $post_id,
    $post_overrides
);

if (null === $post_data) {
    return;
}

if (wtn_blocks_is_post_used($post_id)) {
    return;
}

$post          = $post_data['post'];
$permalink     = $post_data['permalink'];
$title         = $post_data['title'];
$post_override = $post_data['post_override'];

$media_position = in_array(
    $block_attributes['mediaPosition'],
    ['left', 'right'],
    true
)
    ? $block_attributes['mediaPosition']
    : 'left';

$prioritize_image = true === $block_attributes['prioritizeImage'];

$excerpt = wtn_blocks_get_editorial_post_excerpt(
    $post,
    $post_override
);

$image_data = wtn_blocks_get_editorial_post_image_data(
    $post,
    $post_override,
    $title
);

$image_id  = $image_data['id'];
$image_alt = $image_data['alt'];

$image_size = has_image_size('wtn-featured')
    ? 'wtn-featured'
    : 'large';

$image_html = '';

if ($image_id > 0) {
    $image_attributes = [
        'class'    => 'wtn-blocks-editorial-hero__image',
        'alt'      => $image_alt,
        'loading'  => $prioritize_image ? 'eager' : 'lazy',
        'decoding' => 'async',
        'sizes'    => '(min-width: 1024px) 50vw, 100vw',
    ];

    if ($prioritize_image) {
        $image_attributes['fetchpriority'] = 'high';
    }

    $image_html = wp_get_attachment_image(
        $image_id,
        $image_size,
        false,
        $image_attributes
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
